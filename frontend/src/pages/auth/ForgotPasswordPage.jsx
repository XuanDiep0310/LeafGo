"use client";

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Form, Input, Button, Card, Alert, App } from "antd";
import { Leaf, Mail, Lock, CheckCircle } from "lucide-react";
import {
  sendResetPasswordOTP,
  resetPasswordWithOTP,
  clearError,
} from "../../store/slices/authSlice";

export default function ForgotPasswordPage() {
  const { message } = App.useApp();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loading, error } = useSelector((state) => state.auth);

  const [emailSent, setEmailSent] = useState(false);
  const [email, setEmail] = useState("");
  const [form] = Form.useForm();

  // Check if we have a reset token in URL (user clicked email link)
  const resetToken = searchParams.get("token");
  const isResetMode = !!resetToken;

  useEffect(() => {
    if (error) {
      message.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch, message]);

  // Step 1: Send reset password link to email
  const handleSendResetLink = async (values) => {
    try {
      setEmail(values.email);
      await dispatch(sendResetPasswordOTP(values.email)).unwrap();
      message.success("Liên kết đặt lại mật khẩu đã được gửi đến email của bạn!");
      setEmailSent(true);
    } catch (err) {
      console.error("Send reset link error:", err);
    }
  };

  // Step 2: Reset password with token from email
  const handleResetPassword = async (values) => {
    try {
      await dispatch(
        resetPasswordWithOTP({
          email: email || "", // May not need email if token is sufficient
          token: resetToken || values.token,
          newPassword: values.newPassword,
        })
      ).unwrap();

      message.success("Đặt lại mật khẩu thành công!");

      // Redirect to login after 1 second
      setTimeout(() => {
        navigate("/login");
      }, 1000);
    } catch (err) {
      console.error("Reset password error:", err);
    }
  };

  // If user clicked link from email with token
  if (isResetMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-primary/5 p-4">
        <Card className="w-full max-w-md shadow-lg">
          <div className="text-center mb-8">
            {/* <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary flex items-center justify-center">
              <Leaf className="w-10 h-10 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Leaf Go</h1> */}
            <Lock className="w-16 h-16 mx-auto mb-4 text-primary" />
            <h2 className="text-xl font-semibold mb-2">Đặt lại mật khẩu</h2>
            <p className="text-muted-foreground">
              Nhập mật khẩu mới của bạn
            </p>
          </div>

          <Form
            form={form}
            layout="vertical"
            onFinish={handleResetPassword}
            size="large"
          >
            <Form.Item
              label="Mật khẩu mới"
              name="newPassword"
              rules={[
                { required: true, message: "Vui lòng nhập mật khẩu mới" },
                { min: 6, message: "Mật khẩu phải có ít nhất 6 ký tự" },
              ]}
            >
              <Input.Password placeholder="Nhập mật khẩu mới" />
            </Form.Item>

            <Form.Item
              label="Xác nhận mật khẩu"
              name="confirmPassword"
              dependencies={["newPassword"]}
              rules={[
                { required: true, message: "Vui lòng xác nhận mật khẩu" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("newPassword") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(
                      new Error("Mật khẩu xác nhận không khớp!")
                    );
                  },
                }),
              ]}
            >
              <Input.Password placeholder="Xác nhận mật khẩu mới" />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                className="w-full"
              >
                Đặt lại mật khẩu
              </Button>
            </Form.Item>
          </Form>

          <div className="text-center">
            <Link to="/login" className="text-primary hover:underline text-sm">
              Quay lại đăng nhập
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  // Default: Email input to request reset link
  if (!emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-primary/5 p-4">
        <Card className="w-full max-w-md shadow-lg">
          <div className="text-center mb-8">
            {/* <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary flex items-center justify-center">
              <Leaf className="w-10 h-10 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Leaf Go</h1> */}
            <Mail className="w-16 h-16 mx-auto mb-4 text-primary" />
            <h2 className="text-xl font-semibold mb-2">Quên mật khẩu?</h2>
            <p className="text-muted-foreground">
              Nhập email của bạn để nhận liên kết đặt lại mật khẩu
            </p>
          </div>

          <Form
            form={form}
            layout="vertical"
            onFinish={handleSendResetLink}
            size="large"
          >
            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, message: "Vui lòng nhập email" },
                { type: "email", message: "Email không hợp lệ" },
              ]}
            >
              <Input
                prefix={<Mail className="w-4 h-4 text-muted-foreground" />}
                placeholder="email@example.com"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                className="w-full"
              >
                Gửi liên kết đặt lại mật khẩu
              </Button>
            </Form.Item>

            <div className="text-center">
              <Link to="/login" className="text-primary hover:underline text-sm">
                Quay lại đăng nhập
              </Link>
            </div>
          </Form>
        </Card>
      </div>
    );
  }

  // Success: Email sent
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-primary/5 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <div className="text-center py-8">
          {/* <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary flex items-center justify-center">
            <Leaf className="w-10 h-10 text-primary-foreground" />
          </div> */}
          <CheckCircle className="w-20 h-20 mx-auto mb-4 text-green-500" />
          <h2 className="text-2xl font-semibold mb-2 text-green-600">
            Kiểm tra email của bạn!
          </h2>
          <p className="text-muted-foreground mb-6">
            Chúng tôi đã gửi liên kết đặt lại mật khẩu đến
            <br />
            <strong>{email}</strong>
          </p>

          <Alert
            message="Lưu ý"
            description="Vui lòng kiểm tra cả hộp thư spam nếu bạn không thấy email trong hộp thư đến."
            type="info"
            className="mb-6 text-left"
          />

          <div className="space-y-3">
            <Button
              type="default"
              onClick={() => setEmailSent(false)}
              className="w-full"
            >
              Gửi lại email
            </Button>
            <Button
              type="link"
              onClick={() => navigate("/login")}
              className="w-full"
            >
              Quay lại đăng nhập
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}