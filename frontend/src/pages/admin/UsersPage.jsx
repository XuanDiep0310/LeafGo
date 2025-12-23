"use client";

import { useEffect, useState } from "react";
import {
  Table,
  Tag,
  Button,
  Modal,
  Form,
  Input,
  Select,
  message,
  Popconfirm,
  Card,
} from "antd";
import {
  UserPlus,
  Edit,
  Trash2,
  Lock,
  Unlock,
  Search,
  Star,
} from "lucide-react";
import { mockApi } from "../../services/mockData";

const { Option } = Select;

// Implements FR-16, FR-17
export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [users, searchText, roleFilter, statusFilter]);

  const fetchUsers = async () => {
    try {
      const allUsers = await mockApi.getAllUsers();
      setUsers(allUsers.filter((u) => u.role !== "admin"));
    } catch (error) {
      message.error("Lỗi khi tải danh sách người dùng");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...users];

    // Search by name, email, or phone
    if (searchText) {
      filtered = filtered.filter(
        (user) =>
          user.fullName?.toLowerCase().includes(searchText.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchText.toLowerCase()) ||
          user.phone?.includes(searchText)
      );
    }

    // Filter by role
    if (roleFilter !== "all") {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((user) => {
        if (statusFilter === "active") return user.isActive;
        if (statusFilter === "inactive") return !user.isActive;
        return true;
      });
    }

    setFilteredUsers(filtered);
  };

  // FR-16: Create/Update user
  const handleSubmit = async (values) => {
    try {
      if (editingUser) {
        await mockApi.updateUser(editingUser.id, values);
        message.success("Cập nhật thành công");
      } else {
        await mockApi.createUser(values);
        message.success("Tạo tài khoản thành công");
      }
      setModalVisible(false);
      form.resetFields();
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      message.error("Có lỗi xảy ra");
    }
  };

  // FR-16: Delete user
  const handleDelete = async (id) => {
    try {
      await mockApi.deleteUser(id);
      message.success("Xóa tài khoản thành công");
      fetchUsers();
    } catch (error) {
      message.error("Có lỗi xảy ra");
    }
  };

  // FR-17: Toggle user active status
  const handleToggleStatus = async (user) => {
    try {
      await mockApi.toggleUserStatus(user.id);
      message.success(
        user.isActive ? "Đã khóa tài khoản" : "Đã mở khóa tài khoản"
      );
      fetchUsers();
    } catch (error) {
      message.error("Có lỗi xảy ra");
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    form.setFieldsValue(user);
    setModalVisible(true);
  };

  const handleAdd = () => {
    setEditingUser(null);
    form.resetFields();
    setModalVisible(true);
  };

  const columns = [
    {
      title: "Họ tên",
      dataIndex: "fullName",
      key: "fullName",
      render: (text, record) => (
        <div className="flex items-center gap-2">
          <img
            src={record.avatar || "/placeholder.svg"}
            alt={text}
            className="w-8 h-8 rounded-full"
          />
          <span>{text}</span>
        </div>
      ),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Số điện thoại",
      dataIndex: "phone",
      key: "phone",
    },
    {
      title: "Vai trò",
      dataIndex: "role",
      key: "role",
      render: (role, record) => (
        <div className="flex items-center gap-2">
          <Tag color={role === "driver" ? "blue" : "green"}>
            {role === "driver" ? "Tài xế" : "Khách hàng"}
          </Tag>
          {role === "driver" && record.rating && (
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span className="text-xs font-semibold text-yellow-600">
                {record.rating.toFixed(1)}/5
              </span>
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "isActive",
      key: "isActive",
      render: (isActive) => (
        <Tag color={isActive ? "success" : "error"}>
          {isActive ? "Hoạt động" : "Đã khóa"}
        </Tag>
      ),
    },
    {
      title: "Hành động",
      key: "actions",
      render: (_, record) => (
        <div className="flex gap-2">
          <Button
            size="small"
            icon={<Edit className="w-4 h-4" />}
            onClick={() => handleEdit(record)}
          >
            Sửa
          </Button>
          <Button
            size="small"
            icon={
              record.isActive ? (
                <Lock className="w-4 h-4" />
              ) : (
                <Unlock className="w-4 h-4" />
              )
            }
            onClick={() => handleToggleStatus(record)}
          >
            {record.isActive ? "Khóa" : "Mở"}
          </Button>
          <Popconfirm
            title="Bạn có chắc muốn xóa?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button size="small" danger icon={<Trash2 className="w-4 h-4" />}>
              Xóa
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-foreground">
          Quản lý người dùng
        </h2>
        <Button
          type="primary"
          icon={<UserPlus className="w-4 h-4" />}
          onClick={handleAdd}
        >
          Thêm người dùng
        </Button>
      </div>

      <Card className="mb-4">
        <div className="flex gap-4 items-center">
          <Input
            placeholder="Tìm kiếm theo tên, email, SĐT..."
            prefix={<Search className="w-4 h-4 text-muted-foreground" />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="flex-1"
            size="large"
          />
          <Select
            value={roleFilter}
            onChange={setRoleFilter}
            style={{ width: 150 }}
            size="large"
          >
            <Option value="all">Tất cả vai trò</Option>
            <Option value="user">Khách hàng</Option>
            <Option value="driver">Tài xế</Option>
          </Select>
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 150 }}
            size="large"
          >
            <Option value="all">Tất cả trạng thái</Option>
            <Option value="active">Hoạt động</Option>
            <Option value="inactive">Đã khóa</Option>
          </Select>
        </div>
      </Card>

      <Table
        columns={columns}
        dataSource={filteredUsers}
        rowKey="id"
        loading={loading}
      />

      {/* Create/Edit Modal */}
      <Modal
        title={editingUser ? "Chỉnh sửa người dùng" : "Thêm người dùng mới"}
        open={modalVisible}
        onOk={() => form.submit()}
        onCancel={() => {
          setModalVisible(false);
          setEditingUser(null);
          form.resetFields();
        }}
        okText={editingUser ? "Cập nhật" : "Tạo mới"}
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="fullName"
            label="Họ tên"
            rules={[{ required: true, message: "Vui lòng nhập họ tên" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Vui lòng nhập email" },
              { type: "email", message: "Email không hợp lệ" },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="phone"
            label="Số điện thoại"
            rules={[{ required: true, message: "Vui lòng nhập số điện thoại" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="role"
            label="Vai trò"
            rules={[{ required: true, message: "Vui lòng chọn vai trò" }]}
          >
            <Select>
              <Option value="user">Khách hàng</Option>
              <Option value="driver">Tài xế</Option>
            </Select>
          </Form.Item>
          {!editingUser && (
            <>
              <Form.Item
                name="username"
                label="Tên đăng nhập"
                rules={[
                  { required: true, message: "Vui lòng nhập tên đăng nhập" },
                ]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="password"
                label="Mật khẩu"
                rules={[{ required: true, message: "Vui lòng nhập mật khẩu" }]}
              >
                <Input.Password />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>
    </div>
  );
}
