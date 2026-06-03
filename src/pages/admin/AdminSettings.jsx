import React, { useEffect, useState } from "react";
import {
  CheckCircle2,
  Copy,
  Link2,
  MessageSquareMore,
  RefreshCw,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import { Checkbox } from "../../components/ui/checkbox";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  getPayOSSettings,
  getReviewSettings,
  getShippingSettings,
  updateReviewSettings,
  updateShippingSettings,
} from "../../services/adminApi";
import { DEFAULT_SHIPPING_FEES } from "../../lib/shipping";

const tabs = [
  { id: "payos", label: "Thanh toán PayOS" },
  { id: "shipping", label: "Phí ship" },
  { id: "reviews", label: "Bài đánh giá" },
];

const DEFAULT_REVIEW_SETTINGS = {
  reviewApprovalEnabled: true,
};

export function AdminSettings() {
  const [activeTab, setActiveTab] = useState("payos");
  const [paymentSettings, setPaymentSettings] = useState(null);
  const [isPaymentLoading, setIsPaymentLoading] = useState(true);

  const [isShippingLoading, setIsShippingLoading] = useState(true);
  const [isSavingShipping, setIsSavingShipping] = useState(false);
  const [shippingForm, setShippingForm] = useState(() => ({
    northFee: DEFAULT_SHIPPING_FEES.north,
    centralFee: DEFAULT_SHIPPING_FEES.central,
    southFee: DEFAULT_SHIPPING_FEES.south,
    freeShippingThreshold: DEFAULT_SHIPPING_FEES.freeShippingThreshold,
  }));

  const [isReviewLoading, setIsReviewLoading] = useState(true);
  const [isSavingReview, setIsSavingReview] = useState(false);
  const [reviewForm, setReviewForm] = useState(DEFAULT_REVIEW_SETTINGS);

  const loadPaymentSettings = async () => {
    setIsPaymentLoading(true);
    try {
      const data = await getPayOSSettings();
      setPaymentSettings(data);
    } catch (error) {
      toast.error("Không thể tải cài đặt thanh toán", {
        description: error.message,
      });
    } finally {
      setIsPaymentLoading(false);
    }
  };

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

  const loadReviewSettings = async () => {
    setIsReviewLoading(true);
    try {
      const data = await getReviewSettings();
      setReviewForm(data);
    } catch (error) {
      toast.error("Không thể tải cài đặt bài đánh giá", {
        description: error.message,
      });
    } finally {
      setIsReviewLoading(false);
    }
  };

  useEffect(() => {
    loadPaymentSettings();
    loadShippingSettings();
    loadReviewSettings();
  }, []);

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
    setIsSavingShipping(true);
    try {
      const saved = await updateShippingSettings(shippingForm);
      setShippingForm(saved);
      toast.success("Đã lưu cài đặt phí ship");
    } catch (error) {
      toast.error("Không thể lưu cài đặt phí ship", {
        description: error.message,
      });
    } finally {
      setIsSavingShipping(false);
    }
  };

  const handleResetShipping = async () => {
    const defaults = {
      northFee: DEFAULT_SHIPPING_FEES.north,
      centralFee: DEFAULT_SHIPPING_FEES.central,
      southFee: DEFAULT_SHIPPING_FEES.south,
      freeShippingThreshold: DEFAULT_SHIPPING_FEES.freeShippingThreshold,
    };

    setIsSavingShipping(true);
    try {
      const saved = await updateShippingSettings(defaults);
      setShippingForm(saved);
      toast.success("Đã khôi phục phí ship mặc định");
    } catch (error) {
      toast.error("Không thể khôi phục phí ship", {
        description: error.message,
      });
    } finally {
      setIsSavingShipping(false);
    }
  };

  const handleSaveReviewSettings = async () => {
    setIsSavingReview(true);
    try {
      const saved = await updateReviewSettings(reviewForm);
      setReviewForm(saved);
      toast.success("Đã lưu cài đặt bài đánh giá");
    } catch (error) {
      toast.error("Không thể lưu cài đặt bài đánh giá", {
        description: error.message,
      });
    } finally {
      setIsSavingReview(false);
    }
  };

  return (
    <main className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cài đặt</h1>
          <p className="mt-1 text-gray-600">
            Cấu hình thanh toán, vận chuyển và quy trình duyệt đánh giá.
          </p>
        </div>
        {activeTab === "payos" ? (
          <Button variant="outline" onClick={loadPaymentSettings} disabled={isPaymentLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isPaymentLoading ? "animate-spin" : ""}`} />
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
          settings={paymentSettings}
          isLoading={isPaymentLoading}
          copyValue={copyValue}
        />
      ) : null}

      {activeTab === "shipping" ? (
        <ShippingSettings
          shippingForm={shippingForm}
          isLoading={isShippingLoading}
          isSaving={isSavingShipping}
          onChange={handleShippingChange}
          onSave={handleSaveShipping}
          onReset={handleResetShipping}
        />
      ) : null}

      {activeTab === "reviews" ? (
        <ReviewSettingsPanel
          reviewForm={reviewForm}
          isLoading={isReviewLoading}
          isSaving={isSavingReview}
          onChange={setReviewForm}
          onSave={handleSaveReviewSettings}
        />
      ) : null}
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
                label="Chế độ thử nghiệm"
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

function ShippingSettings({ shippingForm, isLoading, isSaving, onChange, onSave, onReset }) {
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
        <Button variant="outline" onClick={onReset} disabled={isSaving}>
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
        Cấu hình này được lưu ở backend và được dùng lại khi backend tạo đơn, nên frontend
        không thể tự sửa phí ship bằng DevTools.
      </div>

      <div className="mt-6 flex justify-end">
        <Button
          onClick={onSave}
          disabled={isLoading || isSaving}
          className="bg-purple-600 text-white hover:bg-purple-700"
        >
          {isSaving ? "Đang lưu..." : isLoading ? "Đang tải..." : "Lưu phí ship"}
        </Button>
      </div>
    </section>
  );
}

function ReviewSettingsPanel({ reviewForm, isLoading, isSaving, onChange, onSave }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900">
            <MessageSquareMore className="h-5 w-5 text-purple-600" />
            Cài đặt bài đánh giá
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Bật hoặc tắt bước duyệt trước khi bài đánh giá hiển thị công khai cho khách xem.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
          Đang tải cài đặt bài đánh giá...
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
            <div className="flex items-start gap-4">
              <Checkbox
                id="review-approval-enabled"
                checked={reviewForm.reviewApprovalEnabled}
                onCheckedChange={(checked) =>
                  onChange({
                    reviewApprovalEnabled: checked === true,
                  })
                }
                className="mt-1 h-5 w-5"
              />
              <div className="space-y-2">
                <Label
                  htmlFor="review-approval-enabled"
                  className="text-base font-semibold text-gray-900"
                >
                  Yêu cầu quản trị viên duyệt bài đánh giá
                </Label>
                <p className="text-sm leading-6 text-gray-600">
                  Khi bật, bài đánh giá mới sẽ vào trạng thái chờ duyệt. Khi tắt, bài đánh giá
                  hợp lệ sẽ tự hiển thị ngay sau khi khách gửi.
                </p>
              </div>
            </div>
          </div>

          <div
            className={`mt-5 rounded-xl border p-4 text-sm ${
              reviewForm.reviewApprovalEnabled
                ? "border-amber-200 bg-amber-50 text-amber-800"
                : "border-green-200 bg-green-50 text-green-800"
            }`}
          >
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="font-semibold">
                  {reviewForm.reviewApprovalEnabled
                    ? "Trạng thái hiện tại: cần duyệt"
                    : "Trạng thái hiện tại: tự động hiển thị"}
                </p>
                <p className="mt-1">
                  {reviewForm.reviewApprovalEnabled
                    ? "Phù hợp khi mình muốn kiểm soát nội dung trước khi hiển thị trên sản phẩm."
                    : "Phù hợp khi mình muốn giảm thao tác vận hành và cho phép khách thấy đánh giá ngay."}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button
              onClick={onSave}
              disabled={isSaving}
              className="bg-purple-600 text-white hover:bg-purple-700"
            >
              {isSaving ? "Đang lưu..." : "Lưu cài đặt đánh giá"}
            </Button>
          </div>
        </>
      )}
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
      <p className={`mt-1 font-semibold ${ok ? "text-green-700" : "text-amber-700"}`}>{value}</p>
    </div>
  );
}
