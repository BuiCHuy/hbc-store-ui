import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, ChevronRight, Mail, Phone, MapPin, Save, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { getMyOrders } from "../services/adminApi";
import {
  buildShippingAddress,
  isDistrictEnabledProvince,
  parseShippingAddress,
  VIETNAM_PROVINCES,
} from "../lib/shipping";
import { loadDistrictOptions, loadWardOptions } from "../lib/vietnamAddress";

function buildProfileForm(user) {
  const parsedAddress = parseShippingAddress(user?.address || "");
  return {
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phoneNumber || "",
    province: parsedAddress.province,
    district: parsedAddress.district,
    ward: parsedAddress.ward,
    detailAddress: parsedAddress.detailAddress,
  };
}

export function Profile() {
  const { isLoggedIn, isAuthReady, user, updateUserProfile } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [orderCount, setOrderCount] = useState(0);
  const [districtOptions, setDistrictOptions] = useState([]);
  const [wardOptions, setWardOptions] = useState([]);
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressError, setAddressError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    province: "",
    district: "",
    ward: "",
    detailAddress: "",
  });

  const shouldShowDistrict = isDistrictEnabledProvince(formData.province);

  useEffect(() => {
    if (!isAuthReady) {
      return;
    }

    if (!isLoggedIn) {
      navigate("/login");
      return;
    }
    if (user) {
      setFormData(buildProfileForm(user));
    }
  }, [isAuthReady, isLoggedIn, navigate, user]);

  useEffect(() => {
    if (!isLoggedIn) return;
    let mounted = true;
    const loadOrderCount = async () => {
      try {
        const orders = await getMyOrders();
        if (mounted) {
          setOrderCount(Array.isArray(orders) ? orders.length : 0);
        }
      } catch {
        if (mounted) setOrderCount(0);
      }
    };
    loadOrderCount();
    return () => {
      mounted = false;
    };
  }, [isLoggedIn]);

  useEffect(() => {
    if (!formData.province) {
      setDistrictOptions([]);
      setWardOptions([]);
      return;
    }

    let mounted = true;
    setAddressLoading(true);
    setAddressError("");

    const loadAddressOptions = async () => {
      try {
        const [districts, wards] = await Promise.all([
          loadDistrictOptions(formData.province),
          loadWardOptions(formData.province, formData.district),
        ]);
        if (!mounted) return;
        setDistrictOptions(districts);
        setWardOptions(wards);
      } catch (error) {
        if (!mounted) return;
        setDistrictOptions([]);
        setWardOptions([]);
        setAddressError(error.message || "Không tải được dữ liệu địa chỉ.");
      } finally {
        if (mounted) setAddressLoading(false);
      }
    };

    loadAddressOptions();

    return () => {
      mounted = false;
    };
  }, [formData.province, formData.district]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "province") {
        next.district = "";
        next.ward = "";
      }
      if (name === "district") {
        next.ward = "";
      }
      return next;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!user) return;

    const address = buildShippingAddress(
      formData.detailAddress,
      formData.ward,
      shouldShowDistrict ? formData.district : "",
      formData.province
    );

    const ok = await updateUserProfile({
      name: formData.name,
      phoneNumber: formData.phone,
      address,
    });

    if (ok) {
      toast.success("Cập nhật thành công", {
        description: "Thông tin cá nhân đã được lưu.",
      });
      setIsEditing(false);
      return;
    }

    toast.error("Cập nhật thất bại", {
      description: "Không thể lưu thông tin. Vui lòng thử lại.",
    });
  };

  const handleCancel = () => {
    if (user) {
      setFormData(buildProfileForm(user));
    }
    setIsEditing(false);
  };

  if (!isAuthReady || !isLoggedIn || !user) return null;

  const displayAddress = buildShippingAddress(
    formData.detailAddress,
    formData.ward,
    shouldShowDistrict ? formData.district : "",
    formData.province
  );

  return (
    <div className="bg-gray-50 pb-12">
      <main className="user-container py-8">
        <div className="mb-6 flex items-center gap-2 text-sm text-gray-600">
          <Link to="/" className="hover:text-purple-600">
            Trang chủ
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="font-medium text-gray-900">Hồ sơ cá nhân</span>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <div className="mb-6 flex flex-col items-center">
                <div className="flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-blue-600">
                  <User className="h-16 w-16 text-white" />
                </div>
                <h2 className="mt-4 text-xl font-bold text-gray-900">{formData.name}</h2>
                <p className="text-sm text-gray-600">{formData.email}</p>
                <span className="mt-2 inline-block rounded-full bg-blue-100 px-3 py-1 text-xs text-blue-700">
                  {user.role === "admin" ? "Quản trị viên" : "Khách hàng"}
                </span>
              </div>

              <div className="space-y-3 border-t pt-6 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Ngày tham gia</span>
                  <span className="font-medium text-gray-900">
                    {user.createdAt
                      ? new Date(user.createdAt).toLocaleDateString("vi-VN")
                      : "Chưa có"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Tổng đơn hàng</span>
                  <span className="font-medium text-purple-600">{orderCount} đơn</span>
                </div>
              </div>

              <div className="mt-6 border-t pt-6">
                <Link to="/orders">
                  <Button variant="outline" className="w-full justify-start">
                    Đơn hàng của tôi
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="rounded-xl border border-gray-200 bg-white">
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Hồ sơ cá nhân</h1>
                  <p className="mt-1 text-sm text-gray-600">
                    Quản lý thông tin để bảo mật tài khoản
                  </p>
                </div>
                {!isEditing ? (
                  <Button onClick={() => setIsEditing(true)}>Chỉnh sửa</Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleCancel}>
                      <X className="mr-2 h-4 w-4" />
                      Hủy
                    </Button>
                    <Button onClick={handleSubmit}>
                      <Save className="mr-2 h-4 w-4" />
                      Lưu
                    </Button>
                  </div>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-8 p-6">
                <section>
                  <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                    <User className="h-5 w-5 text-purple-600" />
                    Thông tin cá nhân
                  </h3>
                  <Field
                    label="Họ và tên"
                    id="name"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={!isEditing}
                    required
                  />
                </section>

                <section className="border-t pt-6">
                  <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                    <Mail className="h-5 w-5 text-purple-600" />
                    Thông tin liên hệ
                  </h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Field
                      label="Email"
                      id="email"
                      value={formData.email}
                      disabled
                      icon={Mail}
                      type="email"
                    />
                    <Field
                      label="Số điện thoại"
                      id="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      disabled={!isEditing}
                      icon={Phone}
                      required
                    />
                  </div>
                </section>

                <section className="border-t pt-6">
                  <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                    <MapPin className="h-5 w-5 text-purple-600" />
                    Địa chỉ
                  </h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <SelectField
                      label="Tỉnh/Thành phố"
                      id="province"
                      value={formData.province}
                      onChange={handleChange}
                      disabled={!isEditing}
                      required
                      options={VIETNAM_PROVINCES}
                      placeholder="Chọn tỉnh/thành phố"
                    />

                    {shouldShowDistrict ? (
                      <SelectField
                        label="Quận/Huyện"
                        id="district"
                        value={formData.district}
                        onChange={handleChange}
                        disabled={!isEditing || addressLoading}
                        required
                        options={districtOptions}
                        placeholder={addressLoading ? "Đang tải quận/huyện..." : "Chọn quận/huyện"}
                      />
                    ) : null}

                    <SelectField
                      label="Phường/Xã"
                      id="ward"
                      value={formData.ward}
                      onChange={handleChange}
                      disabled={
                        !isEditing ||
                        !formData.province ||
                        addressLoading ||
                        (shouldShowDistrict && !formData.district)
                      }
                      required
                      options={wardOptions}
                      placeholder={addressLoading ? "Đang tải phường/xã..." : "Chọn phường/xã"}
                    />

                    <div className="md:col-span-2">
                      <Field
                        label="Địa chỉ cụ thể"
                        id="detailAddress"
                        value={formData.detailAddress}
                        onChange={handleChange}
                        disabled={!isEditing}
                        required
                      />
                    </div>
                  </div>
                  {addressError && <p className="mt-3 text-sm text-red-500">{addressError}</p>}
                  <p className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600">
                    Địa chỉ lưu: {displayAddress || "Chưa cập nhật"}
                  </p>
                </section>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function Field({ label, id, value, onChange, disabled, icon: Icon, type = "text", required }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <div className="relative">
        {Icon && <Icon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />}
        <Input
          id={id}
          name={id}
          type={type}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          className={`${Icon ? "pl-10" : ""} ${disabled ? "bg-gray-50 text-gray-500" : ""}`}
        />
      </div>
    </div>
  );
}

function SelectField({ label, id, value, onChange, disabled, required, options, placeholder }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <select
        id={id}
        name={id}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        className={`h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm outline-none focus:border-purple-500 focus:ring-[3px] focus:ring-purple-500/20 ${
          disabled ? "bg-gray-50 text-gray-500" : ""
        }`}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}
