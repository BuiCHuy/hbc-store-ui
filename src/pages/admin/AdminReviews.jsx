import React, { useEffect, useMemo, useState } from "react";
import { Search, Star } from "lucide-react";
import { toast } from "sonner";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Button } from "../../components/ui/button";
import { getAdminReviews, replyReview, updateReviewStatus } from "../../services/adminApi";

const statusLabel = {
  PENDING: "Chờ duyệt",
  APPROVED: "Hiển thị",
  REJECTED: "Từ chối",
};

export function AdminReviews() {
  const PAGE_SIZE = 10;
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [replyDraft, setReplyDraft] = useState({});
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setIsLoading(true);
      try {
        const data = await getAdminReviews();
        if (mounted) {
          setReviews(data);
          const initialDraft = {};
          data.forEach((item) => {
            if (item.admin_reply) initialDraft[item.id] = item.admin_reply;
          });
          setReplyDraft(initialDraft);
        }
      } catch (error) {
        toast.error("Không thể tải đánh giá", { description: error.message });
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const stats = useMemo(() => {
    const total = reviews.length;
    const visible = reviews.filter((r) => r.status === "APPROVED").length;
    const hidden = reviews.filter((r) => r.status === "REJECTED").length;
    return { total, visible, hidden };
  }, [reviews]);

  const filteredReviews = useMemo(() => {
    const key = searchTerm.trim().toLowerCase();
    return reviews.filter((r) => {
      const matchSearch =
        !key ||
        (r.product_name || "").toLowerCase().includes(key) ||
        (r.author_name || "").toLowerCase().includes(key) ||
        (r.content || "").toLowerCase().includes(key);
      const matchStatus = statusFilter === "all" || r.status === statusFilter;
      return matchSearch && matchStatus;
    }).sort((a, b) => {
      const aTime = new Date(a.created_at || a.createdAt || 0).getTime();
      const bTime = new Date(b.created_at || b.createdAt || 0).getTime();
      if (aTime && bTime && aTime !== bTime) return bTime - aTime;
      return Number(b.id || 0) - Number(a.id || 0);
    });
  }, [reviews, searchTerm, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredReviews.length / PAGE_SIZE));
  const pagedReviews = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredReviews.slice(start, start + PAGE_SIZE);
  }, [filteredReviews, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const handleChangeStatus = async (id, nextStatus) => {
    try {
      const updated = await updateReviewStatus(id, nextStatus);
      setReviews((prev) => prev.map((r) => (r.id === id ? updated : r)));
      toast.success("Cập nhật trạng thái đánh giá thành công");
    } catch (error) {
      toast.error("Không thể cập nhật trạng thái", { description: error.message });
    }
  };

  const handleReply = async (reviewId) => {
    const reply = (replyDraft[reviewId] || "").trim();
    if (!reply) {
      toast.error("Vui lòng nhập phản hồi");
      return;
    }
    try {
      const updated = await replyReview(reviewId, reply);
      setReviews((prev) => prev.map((r) => (r.id === reviewId ? updated : r)));
      toast.success("Đã phản hồi đánh giá");
    } catch (error) {
      toast.error("Không thể phản hồi", { description: error.message });
    }
  };

  return (
    <main className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Đánh giá</h1>
        <p className="mt-1 text-gray-600">Quản lý đánh giá sản phẩm của khách hàng</p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        <Stat title="Tổng đánh giá" value={stats.total} />
        <Stat title="Đang hiển thị" value={stats.visible} />
        <Stat title="Đã ẩn" value={stats.hidden} />
      </div>

      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo sản phẩm, người đánh giá, nội dung..."
              className="h-11 bg-gray-50 pl-11"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="APPROVED">Hiển thị</SelectItem>
              <SelectItem value="REJECTED">Đã ẩn</SelectItem>
              <SelectItem value="PENDING">Chờ duyệt</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/80">
                <TableHead>Sản phẩm</TableHead>
                <TableHead>Người đánh giá</TableHead>
                <TableHead>Số sao</TableHead>
                <TableHead>Nội dung</TableHead>
                <TableHead>Phản hồi admin</TableHead>
                <TableHead>Ngày</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center">
                    Đang tải đánh giá...
                  </TableCell>
                </TableRow>
              ) : filteredReviews.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center">
                    Không có đánh giá khớp điều kiện.
                  </TableCell>
                </TableRow>
              ) : (
                pagedReviews.map((review) => (
                  <TableRow key={review.id} className="hover:bg-purple-50/50">
                    <TableCell className="font-medium text-gray-900">{review.product_name || `#${review.product_id}`}</TableCell>
                    <TableCell>{review.author_name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span>{review.rating}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-sm text-sm text-gray-700">{review.content}</TableCell>
                    <TableCell className="min-w-[280px]">
                      <div className="space-y-2">
                        <Textarea
                          value={replyDraft[review.id] ?? review.admin_reply ?? ""}
                          onChange={(e) =>
                            setReplyDraft((prev) => ({ ...prev, [review.id]: e.target.value }))
                          }
                          placeholder="Nhập phản hồi cho khách hàng..."
                          className="min-h-[76px] text-sm"
                        />
                        <Button size="sm" variant="outline" onClick={() => handleReply(review.id)}>
                          Gửi phản hồi
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {review.created_at ? new Date(review.created_at).toLocaleDateString("vi-VN") : ""}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                          review.status === "APPROVED"
                            ? "border-green-200 bg-green-50 text-green-700"
                            : review.status === "REJECTED"
                            ? "border-red-200 bg-red-50 text-red-700"
                            : "border-yellow-200 bg-yellow-50 text-yellow-700"
                        }`}
                      >
                        {statusLabel[review.status] || review.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleChangeStatus(review.id, "APPROVED")}
                          disabled={review.status === "APPROVED"}
                        >
                          Duyệt
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleChangeStatus(review.id, "REJECTED")}
                          disabled={review.status === "REJECTED"}
                          className="border-red-200 text-red-600 hover:bg-red-50"
                        >
                          Từ chối
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-6 py-4">
        <span className="text-sm font-medium text-gray-600">
          Trang {currentPage}/{totalPages} - {filteredReviews.length} đánh giá
        </span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>
            Trước
          </Button>
          <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}>
            Sau
          </Button>
        </div>
      </div>
    </main>
  );
}

function Stat({ title, value }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="text-2xl font-black text-gray-900">{value}</p>
    </div>
  );
}
