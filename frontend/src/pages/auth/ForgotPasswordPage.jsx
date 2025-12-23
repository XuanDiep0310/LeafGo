"use client"

import { useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { Link } from "react-router-dom"
import { Form, Input, Button, Card, Steps, message } from "antd"
import { Leaf, ArrowLeft } from "lucide-react"
import { sendResetPasswordOTP, resetPasswordWithOTP } from "../../store/slices/authSlice"

const { Step } = Steps

// Implements FR-02
export default function ForgotPasswordPage() {
  const dispatch = useDispatch()
  const { loading } = useSelector((state) => state.auth)
  const [currentStep, setCurrentStep] = useState(0)
  const [email, setEmail] = useState("")
  const [mockOtp, setMockOtp] = useState("")

  // FR-02: Step 1 - Send OTP
  const handleSendOTP = async (values) => {
    try {
      const result = await dispatch(sendResetPasswordOTP(values.email)).unwrap()
      setEmail(values.email)
      setMockOtp(result.mockOtp)
      message.success("Mã OTP đã được gửi đến email của bạn")
      setCurrentStep(1)
    } catch (error) {
      message.error(error)
    }
  }

  // FR-02: Step 2 - Reset password with OTP
  const handleResetPassword = async (values) => {
    try {
      await dispatch(
        resetPasswordWithOTP({
          email,
          otp: values.otp,
          newPassword: values.password,
        }),
      ).unwrap()
      message.success("Đặt lại mật khẩu thành công!")
      setCurrentStep(2)
    } catch (error) {
      message.error(error)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-primary/5 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại đăng nhập
        </Link>

        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary flex items-center justify-center">
            <Leaf className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Quên mật khẩu</h1>
          <p className="text-sm text-muted-foreground">Đặt lại mật khẩu của bạn</p>
        </div>

        <Steps current={currentStep} className="mb-8">
          <Step title="Nhập email" />
          <Step title="Xác thực OTP" />
          <Step title="Hoàn thành" />
        </Steps>

        {currentStep === 0 && (
          <Form layout="vertical" onFinish={handleSendOTP} size="large">
            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, message: "Vui lòng nhập email" },
                { type: "email", message: "Email không hợp lệ" },
              ]}
            >
              <Input placeholder="example@email.com" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} className="w-full">
                Gửi mã OTP
              </Button>
            </Form.Item>
          </Form>
        )}

        {currentStep === 1 && (
          <div>
            {mockOtp && (
              <div className="mb-4 p-3 bg-primary/10 rounded-lg text-center">
                <p className="text-sm text-muted-foreground">Mã OTP của bạn (Demo):</p>
                <p className="text-2xl font-bold text-primary">{mockOtp}</p>
              </div>
            )}
            <Form layout="vertical" onFinish={handleResetPassword} size="large">
              <Form.Item label="Mã OTP" name="otp" rules={[{ required: true, message: "Vui lòng nhập mã OTP" }]}>
                <Input placeholder="Nhập mã OTP" maxLength={6} />
              </Form.Item>
              <Form.Item
                label="Mật khẩu mới"
                name="password"
                rules={[
                  { required: true, message: "Vui lòng nhập mật khẩu mới" },
                  { min: 6, message: "Mật khẩu phải có ít nhất 6 ký tự" },
                ]}
              >
                <Input.Password placeholder="••••••" />
              </Form.Item>
              <Form.Item
                label="Xác nhận mật khẩu"
                name="confirmPassword"
                dependencies={["password"]}
                rules={[
                  { required: true, message: "Vui lòng xác nhận mật khẩu" },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue("password") === value) {
                        return Promise.resolve()
                      }
                      return Promise.reject(new Error("Mật khẩu không khớp"))
                    },
                  }),
                ]}
              >
                <Input.Password placeholder="••••••" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading} className="w-full">
                  Đặt lại mật khẩu
                </Button>
              </Form.Item>
            </Form>
          </div>
        )}

        {currentStep === 2 && (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Đặt lại mật khẩu thành công!</h3>
            <p className="text-sm text-muted-foreground mb-6">Bạn có thể đăng nhập với mật khẩu mới</p>
            <Link to="/login">
              <Button type="primary" size="large">
                Đăng nhập ngay
              </Button>
            </Link>
          </div>
        )}
      </Card>
    </div>
  )
}
