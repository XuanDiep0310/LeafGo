"use client";

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Card,
  Form,
  Input,
  Button,
  Tabs,
  message,
  Modal,
  Select,
  Upload,
} from "antd";
import { User, Lock, Save, Upload as UploadIcon, Car } from "lucide-react";
import { updateProfile, changePassword } from "../../store/slices/authSlice";
import { mockApi } from "../../services/mockData";

const { TabPane } = Tabs;

// Implements FR-54, FR-04, FR-02
export default function ProfilePage() {
  const dispatch = useDispatch();
  const { user, loading } = useSelector((state) => state.auth);
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [avatar, setAvatar] = useState(user?.avatar || "/placeholder.svg");

  // FR-54, FR-04: Update profile
  const handleUpdateProfile = async (values) => {
    try {
      await dispatch(
        updateProfile({
          userId: user.id,
          profileData: values,
        })
      ).unwrap();
      message.success("Cập nhật thông tin thành công");
    } catch (error) {
      message.error(error);
    }
  };

  // FR-02: Change password
  const handleChangePassword = async (values) => {
    try {
      await dispatch(
        changePassword({
          userId: user.id,
          oldPassword: values.oldPassword,
          newPassword: values.newPassword,
        })
      ).unwrap();
      message.success("Đổi mật khẩu thành công");
      setPasswordModalVisible(false);
      passwordForm.resetFields();
    } catch (error) {
      message.error(error);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-foreground mb-6">
        Thông tin cá nhân
      </h2>

      <Card>
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border">
          <div className="relative">
            <img
              src={avatar}
              alt={user?.fullName}
              className="w-20 h-20 rounded-full object-cover"
            />
            <Upload
              maxCount={1}
              beforeUpload={(file) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                  setAvatar(e.target?.result || "/placeholder.svg");
                };
                reader.readAsDataURL(file);
                return false;
              }}
              showUploadList={false}
            >
              <button className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-2 hover:bg-primary/90 transition-colors">
                <UploadIcon className="w-4 h-4" />
              </button>
            </Upload>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-foreground">
              {user?.fullName}
            </h3>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {user?.role === "user" && "Khách hàng"}
              {user?.role === "driver" && "Tài xế"}
              {user?.role === "admin" && "Quản trị viên"}
            </p>
          </div>
        </div>

        <Tabs defaultActiveKey="info">
          <TabPane
            tab={
              <span className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Thông tin
              </span>
            }
            key="info"
          >
            <Form
              form={profileForm}
              layout="vertical"
              onFinish={handleUpdateProfile}
              initialValues={user}
              size="large"
            >
              <Form.Item
                label="Họ và tên"
                name="fullName"
                rules={[{ required: true, message: "Vui lòng nhập họ tên" }]}
              >
                <Input />
              </Form.Item>

              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { required: true, message: "Vui lòng nhập email" },
                  { type: "email", message: "Email không hợp lệ" },
                ]}
              >
                <Input />
              </Form.Item>

              <Form.Item
                label="Số điện thoại"
                name="phone"
                rules={[
                  { required: true, message: "Vui lòng nhập số điện thoại" },
                ]}
              >
                <Input />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  icon={<Save className="w-4 h-4" />}
                >
                  Lưu thay đổi
                </Button>
              </Form.Item>
            </Form>
          </TabPane>

          {user?.role === "driver" && user?.vehicleInfo && (
            <TabPane
              tab={
                <span className="flex items-center gap-2">
                  <Car className="w-4 h-4" />
                  Thông tin xe
                </span>
              }
              key="vehicle"
            >
              <Form
                form={profileForm}
                layout="vertical"
                onFinish={handleUpdateProfile}
                initialValues={user}
                size="large"
              >
                <Form.Item
                  label="Biển số xe"
                  name={["vehicleInfo", "licensePlate"]}
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  label="Loại xe"
                  name={["vehicleInfo", "vehicleType"]}
                >
                  <Select
                    placeholder="Chọn loại xe"
                    options={vehicleTypes.map((vt) => ({
                      label: vt.name,
                      value: vt.id,
                    }))}
                  />
                </Form.Item>
                <Form.Item label="Hãng xe" name={["vehicleInfo", "brand"]}>
                  <Input />
                </Form.Item>
                <Form.Item label="Màu xe" name={["vehicleInfo", "color"]}>
                  <Input />
                </Form.Item>

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    icon={<Save className="w-4 h-4" />}
                  >
                    Lưu thay đổi
                  </Button>
                </Form.Item>
              </Form>
            </TabPane>
          )}

          <TabPane
            tab={
              <span className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Bảo mật
              </span>
            }
            key="security"
          >
            <div className="py-4">
              <h4 className="font-semibold text-foreground mb-2">Mật khẩu</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Đổi mật khẩu để bảo vệ tài khoản của bạn
              </p>
              <Button
                type="primary"
                onClick={() => setPasswordModalVisible(true)}
                icon={<Lock className="w-4 h-4" />}
              >
                Đổi mật khẩu
              </Button>
            </div>
          </TabPane>
        </Tabs>
      </Card>

      {/* FR-02: Change Password Modal */}
      <Modal
        title="Đổi mật khẩu"
        open={passwordModalVisible}
        onCancel={() => {
          setPasswordModalVisible(false);
          passwordForm.resetFields();
        }}
        footer={null}
      >
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handleChangePassword}
          size="large"
        >
          <Form.Item
            label="Mật khẩu hiện tại"
            name="oldPassword"
            rules={[
              { required: true, message: "Vui lòng nhập mật khẩu hiện tại" },
            ]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item
            label="Mật khẩu mới"
            name="newPassword"
            rules={[
              { required: true, message: "Vui lòng nhập mật khẩu mới" },
              { min: 6, message: "Mật khẩu phải có ít nhất 6 ký tự" },
            ]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item
            label="Xác nhận mật khẩu mới"
            name="confirmPassword"
            dependencies={["newPassword"]}
            rules={[
              { required: true, message: "Vui lòng xác nhận mật khẩu mới" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("newPassword") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("Mật khẩu không khớp"));
                },
              }),
            ]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item>
            <div className="flex gap-2">
              <Button onClick={() => setPasswordModalVisible(false)}>
                Hủy
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                Đổi mật khẩu
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
