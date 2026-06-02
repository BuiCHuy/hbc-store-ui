import React from "react";
import { Headphones, RotateCcw, Shield, Truck } from "lucide-react";

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
    <section className="border-b border-slate-200 bg-white py-3">
      <div className="user-container">
        <div className="grid grid-cols-2 gap-2 md:gap-3 lg:grid-cols-4">
          {badges.map((badge, index) => {
            const Icon = badge.icon;
            return (
              <div key={index} className="flex items-start gap-2 rounded-lg p-2.5 transition-colors hover:bg-slate-50">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-purple-100 to-indigo-100">
                  <Icon className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold leading-tight text-slate-900 md:text-sm">{badge.title}</h3>
                  <p className="mt-0.5 text-[11px] text-slate-600 md:text-xs">{badge.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
