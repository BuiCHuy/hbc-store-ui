import React, { useEffect, useMemo, useState } from "react";
import { Download, Mail, Phone, Plus, Search, Shield, User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
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
import { AddUserModal } from "../../components/admin/AddUserModal";
import { createUser, deleteUser, getUsers, updateUserStatus } from "../../services/adminApi";

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export function AdminUsers() {
  const PAGE_SIZE = 10;
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let isMounted = true;
    async function loadUsers() {
      setIsLoading(true);
      try {
        const data = await getUsers();
        if (isMounted) setUsers(data);
      } catch (error) {
        toast.error("Không thể tải danh sách người dùng", {
          description: error.message,
        });
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadUsers();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredUsers = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    return users.filter((user) => {
      const matchSearch =
        !keyword ||
        (user.full_name || "").toLowerCase().includes(keyword) ||
        (user.email || "").toLowerCase().includes(keyword) ||
        (user.phone_number || "").toLowerCase().includes(keyword);
      const matchRole = roleFilter === "all" || user.role === roleFilter;
      return matchSearch && matchRole;
    }).sort((a, b) => {
      const aTime = new Date(a.created_at || a.createdAt || 0).getTime();
      const bTime = new Date(b.created_at || b.createdAt || 0).getTime();
      if (aTime && bTime && aTime !== bTime) return bTime - aTime;
      return Number(b.id || 0) - Number(a.id || 0);
    });
  }, [users, searchTerm, roleFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const pagedUsers = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredUsers.slice(start, start + PAGE_SIZE);
  }, [filteredUsers, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const stats = useMemo(() => {
    const admins = users.filter((user) => user.role === "ADMIN").length;
    const customers = users.filter((user) => user.role === "CUSTOMER").length;
    const banned = users.filter((user) => user.status === "BANNED").length;
    return { total: users.length, admins, customers, banned };
  }, [users]);

  const handleAddUser = async (userData) => {
    try {
      const savedUser = await createUser(userData);
      setUsers((currentUsers) => [savedUser, ...currentUsers]);
      toast.success("Thêm người dùng thành công");
    } catch (error) {
      toast.error("Không thể thêm người dùng", { description: error.message });
    }
  };

  const handleDeleteUser = async (id) => {
    try {
      await deleteUser(id);
      setUsers((currentUsers) =>
        currentUsers.map((user) =>
          user.id === id ? { ...user, status: "BANNED" } : user
        )
      );
      toast.success("Đã khóa người dùng");
    } catch (error) {
      toast.error("Không thể khóa người dùng", { description: error.message });
    }
  };

  const handleUnlockUser = async (user) => {
    try {
      const updated = await updateUserStatus(user, "ACTIVE");
      setUsers((currentUsers) =>
        currentUsers.map((item) => (item.id === user.id ? updated : item))
      );
      toast.success("Đã mở khóa người dùng");
    } catch (error) {
      toast.error("Không thể mở khóa người dùng", { description: error.message });
    }
  };

  return (
    <main className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Người dùng</h1>
          <p className="mt-1 text-gray-600">Quản lý tài khoản và phân quyền</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="h-11 px-6">
            <Download className="mr-2 h-5 w-5" />
            Xuất dữ liệu
          </Button>
          <Button
            onClick={() => setIsAddUserModalOpen(true)}
            className="h-11 bg-gradient-to-r from-purple-600 to-blue-600 px-6 text-white"
          >
            <Plus className="mr-2 h-5 w-5" />
            Thêm người dùng
          </Button>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
        <StatCard title="Tổng người dùng" value={stats.total} icon={User} />
        <StatCard title="Quản trị viên" value={stats.admins} icon={Shield} valueClass="text-purple-600" />
        <StatCard title="Khách hàng" value={stats.customers} icon={User} valueClass="text-blue-600" />
        <StatCard title="Đã khóa" value={stats.banned} icon={Shield} valueClass="text-red-600" />
      </div>

      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <Input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên, email, số điện thoại..."
              className="h-11 bg-gray-50 pl-11"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Vai trò" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả vai trò</SelectItem>
              <SelectItem value="ADMIN">Quản trị viên</SelectItem>
              <SelectItem value="CUSTOMER">Khách hàng</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/80">
                <TableHead>ID</TableHead>
                <TableHead>Họ và tên</TableHead>
                <TableHead>Liên hệ</TableHead>
                <TableHead>Địa chỉ</TableHead>
                <TableHead>Vai trò</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center">Đang tải người dùng...</TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center">Không có người dùng khớp điều kiện.</TableCell>
                </TableRow>
              ) : (
                pagedUsers.map((user) => (
                  <TableRow key={user.id} className="hover:bg-purple-50/50">
                    <TableCell className="font-medium text-purple-600">#{user.id}</TableCell>
                    <TableCell>
                      <div className="font-bold text-gray-900">{user.full_name}</div>
                      {user.status === "BANNED" && (
                        <div className="text-xs font-bold text-red-600">Đã khóa</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-sm">
                          <Mail className="h-3.5 w-3.5 text-gray-400" />
                          {user.email}
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <Phone className="h-3.5 w-3.5 text-gray-400" />
                          {user.phone_number || "Chưa cập nhật"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-sm text-gray-600">{user.address || "Chưa cập nhật"}</TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell className="text-sm text-gray-600">{formatDate(user.created_at)}</TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        {user.status === "BANNED" ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-green-700 hover:bg-green-50 hover:text-green-800"
                            onClick={() => handleUnlockUser(user)}
                          >
                            Mở khóa
                          </Button>
                        ) : (
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteUser(user.id)}>
                            Khóa
                          </Button>
                        )}
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
          Trang {currentPage}/{totalPages} - {filteredUsers.length} người dùng
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

      <AddUserModal
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
        onSave={handleAddUser}
      />
    </main>
  );
}

function StatCard({ title, value, icon: Icon, valueClass = "text-gray-900" }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-purple-100 to-blue-100">
          <Icon className="h-6 w-6 text-purple-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className={`text-3xl font-black ${valueClass}`}>{value}</p>
        </div>
      </div>
    </div>
  );
}
