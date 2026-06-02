import React, { useEffect, useState } from "react";
import { Copy, Link2, RefreshCw, ShieldCheck, Truck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { getPayOSSettings, getShippingSettings, updateShippingSettings } from "../../services/adminApi";
import {
  DEFAULT_SHIPPING_FEES,
} from "../../lib/shipping";

const tabs = [
  { id: "payos", label: "Thanh toán PayOS" },
  { id: "shipping", label: "Phí ship" },
];

export function AdminSettings() {
  const [activeTab, setActiveTab] = useState("payos");
  const [settings, setSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isShippingLoading, setIsShippingLoading] = useState(true);
  const [shippingForm, setShippingForm] = useState(() => ({
    northFee: DEFAULT_SHIPPING_FEES.north,
    centralFee: DEFAULT_SHIPPING_FEES.central,
    southFee: DEFAULT_SHIPPING_FEES.south,
    freeShippingThreshold: DEFAULT_SHIPPING_FEES.freeShippingThreshold,
  }));

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
    loadShippingSettings();
  }, []);

  const loadShippingSettings = async () => {
    setIsShippingLoading(true);
    try {
      const data = await getShippingSettings();
      setShippingForm(data);
    } catch (error) {
      toast.error("Không thể tải cài đặt phí ship", {
        description: error.message,
      });
    } finally {
      setIsShippingLoading(false);
    }
  };

  const copyValue = async (value, label) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`Đã sao chép ${label}`);
    } catch {
      toast.error("Không thể sao chép");
    }
  };

  const handleShippingChange = (field, value) => {
    setShippingForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveShipping = async () => {
    try {
      const saved = await updateShippingSettings(shippingForm);
      setShippingForm(saved);
      toast.success("Đã lưu cài đặt phí ship");
    } catch (error) {
      toast.error("Không thể lưu cài đặt phí ship", {
        description: error.message,
      });
    }
  };

  const handleResetShipping = async () => {
    const defaults = {
      northFee: DEFAULT_SHIPPING_FEES.north,
      centralFee: DEFAULT_SHIPPING_FEES.central,
      southFee: DEFAULT_SHIPPING_FEES.south,
      freeShippingThreshold: DEFAULT_SHIPPING_FEES.freeShippingThreshold,
    };
    try {
      const saved = await updateShippingSettings(defaults);
      setShippingForm(saved);
      toast.success("Đã khôi phục phí ship mặc định");
    } catch (error) {
      toast.error("Không thể khôi phục phí ship", {
        description: error.message,
      });
    }
  };

  return (
    <main className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cài đặt</h1>
          <p className="mt-1 text-gray-600">
            Cấu hình thanh toán, webhook và phí vận chuyển
          </p>
        </div>
        {activeTab === "payos" ? (
          <Button variant="outline" onClick={loadSettings} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Làm mới
          </Button>
        ) : null}
      </div>

      <div className="mb-6 flex flex-wrap gap-2 rounded-xl border border-gray-200 bg-white p-2 shadow-sm">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              activeTab === tab.id
                ? "bg-purple-600 text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "payos" ? (
        <PayOSSettings
          settings={settings}
          isLoading={isLoading}
          copyValue={copyValue}
        />
      ) : (
        <ShippingSettings
          shippingForm={shippingForm}
          isLoading={isShippingLoading}
          onChange={handleShippingChange}
          onSave={handleSaveShipping}
          onReset={handleResetShipping}
        />
      )}
    </main>
  );
}

function PayOSSettings({ settings, isLoading, copyValue }) {
  return (
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
              <StatusItem
                label="Bật PayOS"
                value={settings?.enabled ? "Có" : "Không"}
                ok={Boolean(settings?.enabled)}
              />
              <StatusItem
                label="Mock mode"
                value={settings?.mockMode ? "Đang bật" : "Đã tắt"}
                ok={!settings?.mockMode}
              />
              <StatusItem
                label="Có API Key"
                value={settings?.hasApiKey ? "Có" : "Không"}
                ok={Boolean(settings?.hasApiKey)}
              />
              <StatusItem
                label="Có Checksum Key"
                value={settings?.hasChecksumKey ? "Có" : "Không"}
                ok={Boolean(settings?.hasChecksumKey)}
              />
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
          <li>Đảm bảo backend public được URL đó, dùng ngrok khi chạy local.</li>
          <li>Điền đúng API key, client id hoặc merchant id, và checksum key trong backend.</li>
          <li>Đặt `payment.payos.mock-mode=false` rồi khởi động lại backend.</li>
          <li>Khi webhook báo thanh toán thành công, đơn sẽ tự chuyển sang đã thanh toán.</li>
        </ol>

        <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4 text-xs text-blue-700">
          Mã Merchant hiện tại:{" "}
          <span className="font-semibold">{settings?.merchantId || "Chưa cấu hình"}</span>
        </div>
      </section>
    </div>
  );
}

function ShippingSettings({ shippingForm, isLoading, onChange, onSave, onReset }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900">
            <Truck className="h-5 w-5 text-purple-600" />
            Cài đặt phí ship
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Phí ship được tính theo miền của tỉnh/thành phố khách chọn khi đặt hàng.
          </p>
        </div>
        <Button variant="outline" onClick={onReset}>
          Khôi phục mặc định
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MoneyField
          label="Miền Bắc"
          value={shippingForm.northFee}
          onChange={(value) => onChange("northFee", value)}
        />
        <MoneyField
          label="Miền Trung"
          value={shippingForm.centralFee}
          onChange={(value) => onChange("centralFee", value)}
        />
        <MoneyField
          label="Miền Nam"
          value={shippingForm.southFee}
          onChange={(value) => onChange("southFee", value)}
        />
        <MoneyField
          label="Freeship từ"
          value={shippingForm.freeShippingThreshold}
          onChange={(value) => onChange("freeShippingThreshold", value)}
        />
      </div>

      <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        Cấu hình này được lưu ở backend và được dùng lại khi backend tạo đơn, nên frontend không
        thể tự sửa phí ship bằng DevTools.
      </div>

      <div className="mt-6 flex justify-end">
        <Button
          onClick={onSave}
          disabled={isLoading}
          className="bg-purple-600 text-white hover:bg-purple-700"
        >
          {isLoading ? "Đang tải..." : "Lưu phí ship"}
        </Button>
      </div>
    </section>
  );
}

function MoneyField({ label, value, onChange }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="relative">
        <Input
          type="number"
          min="0"
          step="1000"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 pr-10"
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
          đ
        </span>
      </div>
    </div>
  );
}

function StatusItem({ label, value, ok }) {
  return (
    <div
      className={`rounded-lg border p-3 ${
        ok ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50"
      }`}
    >
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`mt-1 font-semibold ${ok ? "text-green-700" : "text-amber-700"}`}>
        {value}
      </p>
    </div>
  );
}
