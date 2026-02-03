"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { Form, Input, Button, Card, message } from "antd";
import { Leaf } from "lucide-react";
import { login, clearError } from "../../store/slices/authSlice";

// Implements FR-01
export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated, user } = useSelector(
    (state) => state.auth
  );

  useEffect(() => {
    // Chỉ redirect nếu đã authenticated và user có role
    // Sử dụng case-insensitive comparison để đảm bảo hoạt động với cả "Admin" và "admin"
    if (isAuthenticated && user && user.role) {
      const role = user.role.toLowerCase();
      console.log("Redirecting user with role:", user.role);
      if (role === "user") navigate("/user/booking", { replace: true });
      else if (role === "driver") navigate("/driver/workplace", { replace: true });
      else if (role === "Admin") navigate("/admin/dashboard", { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    if (error) {
      message.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const onFinish = (values) => {
    console.log("Login submit:", values);
    dispatch(login(values));
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card style={{ width: 400 }}>
        <div className="flex justify-center mb-6">
          <Leaf className="w-8 h-8 text-green-500" />
        </div>
        <h1 className="text-center text-2xl font-bold mb-6">LeafGo</h1>

        <Form
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
        >
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Vui lòng nhập email" },
              { type: "email", message: "Email không hợp lệ" },
            ]}
          >
            <Input placeholder="your@email.com" />
          </Form.Item>

          <Form.Item
            name="password"
            label="Mật khẩu"
            rules={[{ required: true, message: "Vui lòng nhập mật khẩu" }]}
          >
            <Input.Password placeholder="••••••••" />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
            >
              Đăng nhập
            </Button>
          </Form.Item>
        </Form>

        <div className="text-center">
          <Link to="/register">Chưa có tài khoản? Đăng ký</Link>
        </div>
      </Card>
    </div>
  );
}
