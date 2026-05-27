import React, { useEffect, useState } from "react";
import { Copy, Link2, RefreshCw, Settings2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import { getPayOSSettings } from "../../services/adminApi";

export function AdminSettings() {
  const [settings, setSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const data = await getPayOSSettings();
      setSettings(data);
    } catch (error) {
      toast.error("Không thể tải cài đặt thanh toán", {
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const copyValue = async (value, label) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`Đã sao chép ${label}`);
    } catch {
      toast.error("Không thể sao chép");
    }
  };

  return (
    <main className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cài đặt</h1>
          <p className="mt-1 text-gray-600">Cấu hình thanh toán và webhook PayOS</p>
        </div>
        <Button variant="outline" onClick={loadSettings} disabled={isLoading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Làm mới
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900">
            <Link2 className="h-5 w-5 text-purple-600" />
            Webhook PayOS
          </h2>
          {isLoading ? (
            <p className="text-sm text-gray-500">Đang tải cài đặt...</p>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-semibold uppercase text-gray-500">Webhook URL</p>
                <p className="mt-1 break-all text-sm font-medium text-gray-900">
                  {settings?.webhookUrl || "Chưa cấu hình"}
                </p>
                {settings?.webhookUrl ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => copyValue(settings.webhookUrl, "Webhook URL")}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Sao chép URL
                  </Button>
                ) : null}
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <StatusItem label="Bật PayOS" value={settings?.enabled ? "Có" : "Không"} ok={Boolean(settings?.enabled)} />
                <StatusItem label="Mock mode" value={settings?.mockMode ? "Đang bật" : "Đã tắt"} ok={!settings?.mockMode} />
                <StatusItem label="Có API Key" value={settings?.hasApiKey ? "Có" : "Không"} ok={Boolean(settings?.hasApiKey)} />
                <StatusItem label="Có Checksum Key" value={settings?.hasChecksumKey ? "Có" : "Không"} ok={Boolean(settings?.hasChecksumKey)} />
              </div>
            </div>
          )}
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900">
            <ShieldCheck className="h-5 w-5 text-green-600" />
            Hướng dẫn cấu hình
          </h2>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-gray-700">
            <li>Vào trang quản trị PayOS và thêm Webhook URL ở bên trái.</li>
            <li>Đảm bảo backend public được URL đó (dùng ngrok khi chạy local).</li>
            <li>Điền đúng `payment.payos.api-key`, `merchant-id`, `checksum-key` trong backend.</li>
            <li>Đặt `payment.payos.mock-mode=false` rồi khởi động lại backend.</li>
            <li>Khi webhook báo thanh toán thành công, đơn sẽ tự chuyển sang đã thanh toán.</li>
          </ol>

          <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4 text-xs text-blue-700">
            Mã Merchant hiện tại: <span className="font-semibold">{settings?.merchantId || "Chưa cấu hình"}</span>
          </div>
        </section>
      </div>
    </main>
  );
}

function StatusItem({ label, value, ok }) {
  return (
    <div className={`rounded-lg border p-3 ${ok ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50"}`}>
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`mt-1 font-semibold ${ok ? "text-green-700" : "text-amber-700"}`}>{value}</p>
    </div>
  );
}

