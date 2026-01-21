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
  Pagination,
  Avatar,
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
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
} from "../../services/adminService";

const { Option } = Select;

// Implements FR-16, FR-17
export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form] = Form.useForm();

  // Filters
  const [searchText, setSearchText] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    fetchUsers();
  }, [currentPage, pageSize, searchText, roleFilter, statusFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await getUsers({
        Page: currentPage,
        PageSize: pageSize,
        Search: searchText || undefined,
        Role: roleFilter || undefined,
        IsActive: statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined,
      });

      if (response.success) {
        setUsers(response.data.items);
        setTotalItems(response.data.totalItems);
      } else {
        message.error(response.message || 'Lỗi khi tải danh sách người dùng');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      message.error(error.response?.data?.error || 'Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  // FR-16: Create/Update user
  const handleSubmit = async (values) => {
    try {
      let response;
      if (editingUser) {
        // Update existing user
        response = await updateUser(editingUser.id, {
          fullName: values.fullName,
          phoneNumber: values.phoneNumber,
          isActive: values.isActive ?? editingUser.isActive,
        });
      } else {
        // Create new user
        response = await createUser({
          email: values.email,
          password: values.password,
          fullName: values.fullName,
          phoneNumber: values.phoneNumber,
          role: values.role,
        });
      }

      if (response.success) {
        message.success(editingUser ? 'Cập nhật thành công' : 'Tạo tài khoản thành công');
        setModalVisible(false);
        form.resetFields();
        setEditingUser(null);
        fetchUsers();
      } else {
        message.error(response.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Error saving user:', error);
      message.error(error.response?.data?.error || error.message || 'Có lỗi xảy ra');
    }
  };

  // FR-16: Delete user
  const handleDelete = async (id) => {
    try {
      const response = await deleteUser(id);

      if (response.success) {
        message.success('Xóa tài khoản thành công');
        fetchUsers();
      } else {
        message.error(response.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      message.error(error.response?.data?.error || 'Có lỗi xảy ra');
    }
  };

  // FR-17: Toggle user active status
  const handleToggleStatus = async (user) => {
    try {
      const response = await toggleUserStatus(user.id, !user.isActive);

      if (response.success) {
        message.success(user.isActive ? 'Đã khóa tài khoản' : 'Đã mở khóa tài khoản');
        fetchUsers();
      } else {
        message.error(response.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Error toggling user status:', error);
      message.error(error.response?.data?.error || 'Có lỗi xảy ra');
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    form.setFieldsValue({
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      isActive: user.isActive,
    });
    setModalVisible(true);
  };

  const handleAdd = () => {
    setEditingUser(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchUsers();
  };

  const columns = [
    {
      title: "Họ tên",
      dataIndex: "fullName",
      key: "fullName",
      render: (text, record) => (
        <div className="flex items-center gap-2">
          <Avatar src={`${import.meta.env.VITE_API_URL}${record.avatar}`}>
            {record.fullName?.charAt(0) || "U"}
          </Avatar>
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
      dataIndex: "phoneNumber",
      key: "phoneNumber",
    },
    {
      title: "Vai trò",
      dataIndex: "role",
      key: "role",
      render: (role, record) => (
        <div className="flex items-center gap-2">
          <Tag color={role === "Driver" ? "blue" : "green"}>
            {role === "Driver" ? "Tài xế" : "Khách hàng"}
          </Tag>
          {role === "Driver" && record.stats && record.stats.averageRating > 0 && (
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span className="text-xs font-semibold text-yellow-600">
                {record.stats.averageRating.toFixed(1)}/5
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
      title: "Online",
      dataIndex: "isOnline",
      key: "isOnline",
      render: (isOnline) => (
        <Tag color={isOnline ? "blue" : "default"}>
          {isOnline ? "Online" : "Offline"}
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
            onPressEnter={handleSearch}
            className="flex-1"
            size="large"
          />
          <Select
            value={roleFilter}
            onChange={setRoleFilter}
            style={{ width: 150 }}
            size="large"
            placeholder="Vai trò"
          >
            <Option value="">Tất cả</Option>
            <Option value="User">Khách hàng</Option>
            <Option value="Driver">Tài xế</Option>
          </Select>
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 150 }}
            size="large"
            placeholder="Trạng thái"
          >
            <Option value="">Tất cả</Option>
            <Option value="active">Hoạt động</Option>
            <Option value="inactive">Đã khóa</Option>
          </Select>
          <Button type="primary" onClick={handleSearch}>
            Tìm kiếm
          </Button>
        </div>
      </Card>

      <Table
        columns={columns}
        dataSource={users}
        rowKey="id"
        loading={loading}
        pagination={false}
      />

      <div className="mt-4 flex justify-end">
        <Pagination
          current={currentPage}
          pageSize={pageSize}
          total={totalItems}
          onChange={(page, size) => {
            setCurrentPage(page);
            setPageSize(size);
          }}
          showSizeChanger
          showTotal={(total) => `Tổng ${total} người dùng`}
        />
      </div>

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

          {!editingUser && (
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
          )}

          <Form.Item
            name="phoneNumber"
            label="Số điện thoại"
            rules={[{ required: true, message: "Vui lòng nhập số điện thoại" }]}
          >
            <Input />
          </Form.Item>

          {!editingUser && (
            <>
              <Form.Item
                name="role"
                label="Vai trò"
                rules={[{ required: true, message: "Vui lòng chọn vai trò" }]}
              >
                <Select>
                  <Option value="User">Khách hàng</Option>
                  <Option value="Driver">Tài xế</Option>
                </Select>
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

          {editingUser && (
            <Form.Item
              name="isActive"
              label="Trạng thái"
              valuePropName="checked"
            >
              <Select>
                <Option value={true}>Hoạt động</Option>
                <Option value={false}>Đã khóa</Option>
              </Select>
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
}