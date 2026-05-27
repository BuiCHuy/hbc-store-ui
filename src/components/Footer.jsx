import React from "react";
import { Mail, Phone, MapPin } from "lucide-react";

const footerLinks = {
  company: [
    { name: "Về chúng tôi", href: "#" },
    { name: "Tuyển dụng", href: "#" },
    { name: "Tin tức", href: "#" },
    { name: "Liên hệ", href: "#" },
  ],
  support: [
    { name: "Câu hỏi thường gặp", href: "#" },
    { name: "Chính sách bảo hành", href: "#" },
    { name: "Hướng dẫn mua hàng", href: "#" },
    { name: "Phương thức thanh toán", href: "#" },
  ],
  policy: [
    { name: "Chính sách đổi trả", href: "#" },
    { name: "Chính sách bảo mật", href: "#" },
    { name: "Điều khoản sử dụng", href: "#" },
    { name: "Giải quyết khiếu nại", href: "#" },
  ],
};

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-gray-300">
      <div className="user-container py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2">
            <h3 className="text-2xl font-bold text-white mb-4">
              <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                HBC Store
              </span>
            </h3>
            <p className="text-sm text-gray-400 mb-6 max-w-sm">
              Cửa hàng chuyên cung cấp mô hình Gundam và đồ chơi cao cấp từ các
              thương hiệu hàng đầu thế giới. Hàng chính hãng 100%, giá tốt nhất
              thị trường.
            </p>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-purple-400" />
                </div>
                <span>178 Cổ Nhuế 2, Đông Ngạc, Hà Nội</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <Phone className="w-4 h-4 text-purple-400" />
                </div>
                <span>0328584803</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <Mail className="w-4 h-4 text-purple-400" />
                </div>
                <span>support@hbcstore.vn</span>
              </div>
            </div>
          </div>

          {[
            ["Công ty", footerLinks.company],
            ["Hỗ trợ", footerLinks.support],
            ["Chính sách", footerLinks.policy],
          ].map(([title, links]) => (
            <div key={title}>
              <h4 className="text-white font-semibold mb-4">{title}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="text-sm hover:text-purple-400 transition-colors"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-400">
              © {currentYear} HBC Store. All rights reserved.
            </p>
            <p className="text-sm text-gray-400">Theo dõi chúng tôi</p>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-400">Phương thức thanh toán:</p>
            <div className="flex items-center gap-3">
              {["COD","Chuyển khoản ngân hàng"].map((method) => (
                <div
                  key={method}
                  className="px-4 py-2 bg-slate-800 rounded-lg text-xs font-semibold"
                >
                  {method}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
