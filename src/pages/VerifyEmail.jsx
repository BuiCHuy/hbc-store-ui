import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { apiGet } from "../lib/api";

export function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [state, setState] = useState("loading");
  const [message, setMessage] = useState("Dang xac thuc email...");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setState("error");
      setMessage("Thieu token xac thuc.");
      return;
    }

    (async () => {
      try {
        const data = await apiGet(`/auth/verify-email?token=${encodeURIComponent(token)}`, {
          skipAuth: true,
        });
        setState("success");
        setMessage(data?.message || "Xac thuc email thanh cong.");
      } catch (error) {
        setState("error");
        setMessage(error?.message || "Xac thuc that bai.");
      }
    })();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md rounded-lg border bg-white p-8 text-center shadow-sm">
        {state === "loading" ? (
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-blue-600" />
        ) : null}
        {state === "success" ? (
          <CheckCircle2 className="mx-auto h-10 w-10 text-green-600" />
        ) : null}
        {state === "error" ? (
          <XCircle className="mx-auto h-10 w-10 text-red-600" />
        ) : null}

        <h1 className="mt-4 text-xl font-semibold text-gray-900">Xac thuc tai khoan</h1>
        <p className="mt-2 text-sm text-gray-600">{message}</p>

        <Link
          to="/login"
          className="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700"
        >
          Ve trang dang nhap
        </Link>
      </div>
    </div>
  );
}
