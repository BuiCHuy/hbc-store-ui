import { MessageCircle, X, Send } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { apiPost, toAbsoluteApiUrl } from "../lib/api";

function welcomeMessages() {
  return [
    {
      role: "assistant",
      text: "Xin chào, mình là trợ lý mua sắm. Bạn có thể hỏi tìm sản phẩm hoặc hỏi hướng dẫn sử dụng website.",
      products: [],
    },
  ];
}

const QUICK_GUIDES = [
  "Hướng dẫn đặt hàng",
  "Hướng dẫn áp mã giảm giá",
  "Hướng dẫn theo dõi đơn hàng",
  "Hướng dẫn yêu cầu hoàn tiền",
];

export function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(welcomeMessages);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const sessionId = useMemo(() => `session-${Date.now()}`, []);

  const sendMessage = async (rawText) => {
    const text = (rawText ?? input).trim();
    if (!text || isSending) return;

    setMessages((prev) => [...prev, { role: "user", text, products: [] }]);
    setInput("");
    setIsSending(true);
    try {
      const data = await apiPost("/chat", { message: text, sessionId }, { skipAuth: true });
      const products = Array.isArray(data?.suggestedProducts) ? data.suggestedProducts : [];
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: data?.answer || "Mình đã nhận yêu cầu, bạn thử mô tả cụ thể hơn nhé.",
          products,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Hiện tại chatbot đang lỗi kết nối. Bạn thử lại sau vài giây nhé.",
          products: [],
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-blue-600 text-white shadow-2xl shadow-purple-500/50 transition-transform hover:scale-110"
        aria-label="Trợ lý AI"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {isOpen ? (
        <div className="fixed bottom-24 right-6 z-50 flex h-[560px] w-[390px] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
          <div className="flex items-center gap-3 bg-gradient-to-r from-purple-600 to-blue-600 p-4 text-white">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
              <MessageCircle className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Trợ lý mua sắm AI</h3>
              <p className="text-xs text-white/80">Online</p>
            </div>
          </div>

          <div className="border-b bg-white px-3 py-2">
            <div className="flex flex-wrap gap-2">
              {QUICK_GUIDES.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => sendMessage(item)}
                  className="rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700 hover:bg-purple-100"
                  disabled={isSending}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto bg-gray-50 p-4">
            {messages.map((msg, idx) => (
              <div key={`${msg.role}-${idx}`} className={`flex ${msg.role === "user" ? "justify-end" : "gap-2"}`}>
                {msg.role === "assistant" ? (
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-blue-500 text-xs text-white">
                    AI
                  </div>
                ) : null}

                <div
                  className={`max-w-[84%] rounded-2xl p-3 text-sm shadow-sm whitespace-pre-line ${
                    msg.role === "user"
                      ? "rounded-tr-sm bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                      : "rounded-tl-sm bg-white text-gray-800"
                  }`}
                >
                  <p>{msg.text}</p>

                  {msg.role === "assistant" && msg.products?.length > 0 ? (
                    <div className="mt-3 space-y-2">
                      {msg.products.map((p) => (
                        <Link
                          to={`/product/${p.id}`}
                          key={p.id}
                          className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-2 hover:bg-gray-100"
                        >
                          <img
                            src={toAbsoluteApiUrl(p.image || "")}
                            alt={p.name}
                            className="h-10 w-10 rounded-md border border-gray-200 object-cover"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-semibold text-gray-900">{p.name}</p>
                            <p className="truncate text-[11px] text-gray-500">
                              {p.brand} • {p.category}
                            </p>
                          </div>
                          <p className="text-[11px] font-bold text-purple-600">
                            {Number(p.price || 0).toLocaleString("vi-VN")} đ
                          </p>
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t bg-white p-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") sendMessage();
                }}
                placeholder="Nhập câu hỏi của bạn..."
                className="flex-1 rounded-full border border-gray-200 px-4 py-2 text-sm focus:border-purple-300 focus:outline-none"
              />
              <Button
                size="icon"
                onClick={() => sendMessage()}
                disabled={isSending || !input.trim()}
                className="h-10 w-10 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
