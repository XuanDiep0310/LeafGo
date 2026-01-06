"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { Form, Input, Button, Card, App } from "antd"; // ✅ Thêm App
import { Leaf } from "lucide-react";
import { login, clearError } from "../../store/slices/authSlice";

// Implements FR-01: User Login
export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { message } = App.useApp(); // ✅ Dùng hook này thay vì import message
  const { loading, error, isAuthenticated, user } = useSelector(
    (state) => state.auth
  );

  // Display error messages
  useEffect(() => {
    if (error) {
      message.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch, message]);

  // Redirect after successful login
  useEffect(() => {
    if (isAuthenticated && user) {
      // ✅ Sửa logic: toLowerCase() rồi mới so sánh
      const role = user.role.toLowerCase();

      if (role === "user") navigate("/user/booking");
      else if (role === "driver") navigate("/driver/workplace");
      else if (role === "admin") navigate("/admin/dashboard");
    }
  }, [isAuthenticated, user, navigate]);

  // Handle login
  const handleLogin = async (values) => {
    try {
      await dispatch(login({
        phoneOrEmail: values.phoneOrEmail,
        password: values.password
      })).unwrap();

      message.success("Đăng nhập thành công!");
    } catch (err) {
      // Error already handled by useEffect above
      console.error("Login error:", err);
    }
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
            label="Email hoặc Số điện thoại"
            name="phoneOrEmail"
            rules={[
              { required: true, message: "Vui lòng nhập email hoặc số điện thoại" }
            ]}
          >
            <Input placeholder="email@example.com hoặc 0123456789" />
          </Form.Item>

          <Form.Item
            label="Mật khẩu"
            name="password"
            rules={[
              { required: true, message: "Vui lòng nhập mật khẩu" },
              { min: 6, message: "Mật khẩu phải có ít nhất 6 ký tự" }
            ]}
          >
            <Input.Password placeholder="Nhập mật khẩu" />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className="w-full"
              disabled={loading}
            >
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
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
          <p>• Admin: admin@leafgo.com / Admin@123</p>
          <p>• Tài xế: driver@leafgo.com / Test@123456</p>
          <p>• Khách hàng: user@leafgo.com / Test@123456</p>
        </div>
      </Card>
    </div>
  );
}