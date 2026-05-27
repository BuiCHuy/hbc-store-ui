import React from "react";
import { Shield, Truck, RotateCcw, Headphones } from "lucide-react";

const badges = [
  {
    icon: Shield,
    title: "Hàng chính hãng 100%",
    description: "Cam kết nguồn gốc rõ ràng",
  },
  {
    icon: Truck,
    title: "Giao hàng toàn quốc",
    description: "Miễn phí đơn từ 500k",
  },
  {
    icon: RotateCcw,
    title: "Đổi trả trong 7 ngày",
    description: "Hoàn tiền 100% nếu lỗi",
  },
  {
    icon: Headphones,
    title: "Hỗ trợ 24/7",
    description: "Tư vấn nhiệt tình",
  },
];

export function TrustBadges() {
  return (
    <section className="py-3 bg-white border-b border-gray-100">
      <div className="user-container">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3">
          {badges.map((badge, index) => {
            const Icon = badge.icon;
            return (
              <div
                key={index}
                className="flex items-start gap-2 p-2.5 rounded-md hover:bg-gray-50 transition-colors"
              >
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-purple-100 to-blue-100 rounded-md flex items-center justify-center">
                  <Icon className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-xs md:text-sm font-semibold text-gray-900 leading-tight">
                    {badge.title}
                  </h3>
                  <p className="text-[11px] md:text-xs text-gray-600 mt-0.5">
                    {badge.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
