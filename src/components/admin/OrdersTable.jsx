import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { getAdminOrders } from "../../services/adminApi";

const statusLabels = {
  PENDING: "Đang xử lý",
  CONFIRMED: "Đã xác nhận",
  SHIPPING: "Đang giao",
  DELIVERED: "Đã giao",
  CANCELLED: "Đã hủy",
};

const statusStyles = {
  PENDING: "bg-yellow-100 text-yellow-700 border-yellow-200",
  CONFIRMED: "bg-indigo-100 text-indigo-700 border-indigo-200",
  SHIPPING: "bg-blue-100 text-blue-700 border-blue-200",
  DELIVERED: "bg-green-100 text-green-700 border-green-200",
  CANCELLED: "bg-red-100 text-red-700 border-red-200",
};

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${statusStyles[status]}`}
    >
      {statusLabels[status]}
    </span>
  );
}

export function OrdersTable() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadOrders() {
      setIsLoading(true);
      try {
        const data = await getAdminOrders();
        if (isMounted) setOrders(data.slice(0, 5));
      } catch (error) {
        console.error("Lỗi tải đơn hàng tổng quan:", error);
        if (isMounted) setOrders([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadOrders();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900">Đơn hàng gần đây</h2>
        <p className="mt-1 text-sm text-gray-500">Các giao dịch mua hàng mới nhất</p>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/80">
              <TableHead className="font-semibold text-gray-700">Mã đơn hàng</TableHead>
              <TableHead className="font-semibold text-gray-700">Tên khách hàng</TableHead>
              <TableHead className="font-semibold text-gray-700">Ngày</TableHead>
              <TableHead className="font-semibold text-gray-700">Tổng tiền</TableHead>
              <TableHead className="font-semibold text-gray-700">Trạng thái</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-sm text-gray-500">
                  Đang tải đơn hàng...
                </TableCell>
              </TableRow>
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-sm text-gray-500">
                  Chưa có đơn hàng trong cơ sở dữ liệu.
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id} className="transition-colors hover:bg-purple-50/50">
                  <TableCell className="font-medium text-purple-600">{order.code}</TableCell>
                  <TableCell className="font-medium text-gray-900">
                    {order.customer_name}
                  </TableCell>
                  <TableCell className="text-gray-500">
                    {new Date(order.order_date).toLocaleDateString("vi-VN")}
                  </TableCell>
                  <TableCell className="font-bold text-gray-900">
                    {order.total_amount.toLocaleString("vi-VN")} đ
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={order.status} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <div className="border-t border-gray-200 bg-gray-50 p-4 text-center">
        <Link
          to="/admin/orders"
          className="text-sm font-bold text-purple-600 transition-all hover:text-purple-800 hover:underline"
        >
          Xem tất cả đơn hàng
        </Link>
      </div>
    </div>
  );
}
