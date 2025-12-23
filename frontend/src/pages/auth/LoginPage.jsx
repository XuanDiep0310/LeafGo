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
    if (isAuthenticated && user) {
      // Redirect based on role
      if (user.role === "user") navigate("/user/booking");
      else if (user.role === "driver") navigate("/driver/workplace");
      else if (user.role === "admin") navigate("/admin/dashboard");
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    if (error) {
      message.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  // FR-01: Handle login
  const handleLogin = async (values) => {
    await dispatch(login(values));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-primary/5 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary flex items-center justify-center">
            <Leaf className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Leaf Go</h1>
          <p className="text-muted-foreground">
            Đăng nhập vào tài khoản của bạn
          </p>
        </div>

        <Form layout="vertical" onFinish={handleLogin} size="large">
          <Form.Item
            label="Số điện thoại"
            name="phone"
            rules={[{ required: true, message: "Vui lòng nhập số điện thoại" }]}
          >
            <Input placeholder="0123456789" />
          </Form.Item>

          <Form.Item
            label="Mật khẩu"
            name="password"
            rules={[{ required: true, message: "Vui lòng nhập mật khẩu" }]}
          >
            <Input.Password placeholder="Nhập mật khẩu" />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className="w-full"
            >
              Đăng nhập
            </Button>
          </Form.Item>
        </Form>

        <div className="text-center space-y-2 text-sm">
          <Link
            to="/forgot-password"
            className="text-primary hover:underline block"
          >
            Quên mật khẩu?
          </Link>
          <div className="text-muted-foreground">
            Chưa có tài khoản?{" "}
            <Link to="/register" className="text-primary hover:underline">
              Đăng ký ngay
            </Link>
          </div>
        </div>

        <div className="mt-6 p-4 bg-accent rounded-lg text-sm text-muted-foreground">
          <p className="font-semibold mb-2">Tài khoản demo:</p>
          <p>• Khách hàng: 0123456789 / 123456</p>
          <p>• Tài xế: 0987654321 / 123456</p>
          <p>• Admin: 0909090909 / admin123</p>
        </div>
      </Card>
    </div>
  );
}
