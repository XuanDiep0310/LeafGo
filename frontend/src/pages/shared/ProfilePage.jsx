"use client";

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Card,
  Form,
  Input,
  Button,
  Tabs,
  Modal,
  Select,
  Upload,
  App,
  Spin,
} from "antd";
import { User, Lock, Save, Upload as UploadIcon, Car } from "lucide-react";
import {
  updateProfile,
  changePassword,
  setUser,
} from "../../store/slices/authSlice";
import {
  getUserProfile,
  updateUserProfile,
  uploadAvatar,
} from "../../services/userService";
import {
  getVehicleTypes,
  getDriverVehicle,
  updateDriverVehicle,
} from "../../services/driverService";
import { changePassword as apiChangePassword } from "../../services/apiClient";

function ProfilePageContent() {
  const dispatch = useDispatch();
  const { user, loading } = useSelector((state) => state.auth);
  const { message } = App.useApp();
  const [profileForm] = Form.useForm();
  const [vehicleForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [avatar, setAvatar] = useState(user?.avatar || "/placeholder.svg");
  const [uploading, setUploading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingVehicle, setLoadingVehicle] = useState(false);
  const [vehicleData, setVehicleData] = useState(null);

  useEffect(() => {
    loadUserProfile();
    if (user?.role === "driver") {
      loadVehicleTypes();
      loadVehicleData();
    }
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoadingProfile(true);
      const profile = await getUserProfile();
      const userData = profile?.data || profile;
      profileForm.setFieldsValue({
        fullName: userData.fullName,
        email: userData.email,
        phoneNumber: userData.phoneNumber,
      });
      if (userData.avatar) {
        // Convert relative path to full URL
        let avatarUrl = userData.avatar;
        if (avatarUrl.startsWith("/")) {
          avatarUrl = `${import.meta.env.VITE_API_URL}${avatarUrl}`;
        }
        setAvatar(avatarUrl);
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoadingProfile(false);
    }
  };

  const loadVehicleTypes = async () => {
    try {
      const response = await getVehicleTypes();
      const types = response?.data || response || [];
      setVehicleTypes(types);
    } catch (error) {
      console.error("Error loading vehicle types:", error);
    }
  };

  const loadVehicleData = async () => {
    try {
      setLoadingVehicle(true);
      const response = await getDriverVehicle();
      const vehicle = response?.data || response;
      if (vehicle) {
        setVehicleData(vehicle);
        vehicleForm.setFieldsValue({
          vehicleTypeId: vehicle.vehicleTypeId,
          licensePlate: vehicle.licensePlate,
          vehicleBrand: vehicle.vehicleBrand,
          vehicleModel: vehicle.vehicleModel,
          vehicleColor: vehicle.vehicleColor,
        });
      }
    } catch (error) {
      console.error("Error loading vehicle data:", error);
    } finally {
      setLoadingVehicle(false);
    }
  };

  const handleUpdateProfile = async (values) => {
    try {
      setLoadingProfile(true);
      const response = await updateUserProfile({
        fullName: values.fullName,
        phoneNumber: values.phoneNumber,
      });

      // Update Redux store
      await dispatch(
        updateProfile({
          userId: user.id,
          profileData: values,
        }),
      ).unwrap();

      message.success("Cập nhật thông tin thành công");
    } catch (error) {
      message.error(error.message || "Không thể cập nhật thông tin");
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleUpdateVehicle = async (values) => {
    try {
      setLoadingVehicle(true);
      await updateDriverVehicle({
        vehicleTypeId: values.vehicleTypeId,
        licensePlate: values.licensePlate,
        vehicleBrand: values.vehicleBrand,
        vehicleModel: values.vehicleModel,
        vehicleColor: values.vehicleColor,
      });
      message.success("Cập nhật thông tin xe thành công");
      loadVehicleData();
    } catch (error) {
      message.error(error.message || "Không thể cập nhật thông tin xe");
    } finally {
      setLoadingVehicle(false);
    }
  };

  const handleChangePassword = async (values) => {
    try {
      await apiChangePassword({
        currentPassword: values.oldPassword,
        newPassword: values.newPassword,
      });

      message.success("Đổi mật khẩu thành công");
      setPasswordModalVisible(false);
      passwordForm.resetFields();
    } catch (error) {
      message.error(
        error.response?.data?.error || error.message || "Đổi mật khẩu thất bại",
      );
    }
  };

  const handleAvatarUpload = async (file) => {
    try {
      setUploading(true);
      const response = await uploadAvatar(file);
      // Extract avatarUrl from nested response structure
      let avatarUrl = response?.data?.avatarUrl || response?.avatarUrl;

      if (avatarUrl) {
        // Convert relative path to full URL
        if (avatarUrl.startsWith("/")) {
          avatarUrl = `${import.meta.env.VITE_API_URL}${avatarUrl}`;
        }
        setAvatar(avatarUrl);

        // Update Redux store with full user object
        const updatedUser = { ...user, avatar: avatarUrl };
        dispatch(setUser(updatedUser));

        message.success("Cập nhật ảnh đại diện thành công");
      }
    } catch (error) {
      message.error("Không thể tải ảnh lên");
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
    }
    return false; // Prevent default upload
  };

  const tabItems = [
    {
      label: (
        <span className="flex items-center gap-2">
          <User className="w-4 h-4" />
          Thông tin
        </span>
      ),
      key: "info",
      children: loadingProfile ? (
        <div className="flex justify-center py-8">
          <Spin />
        </div>
      ) : (
        <Form
          form={profileForm}
          layout="vertical"
          onFinish={handleUpdateProfile}
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
            <Input disabled />
          </Form.Item>

          <Form.Item
            label="Số điện thoại"
            name="phoneNumber"
            rules={[{ required: true, message: "Vui lòng nhập số điện thoại" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loadingProfile}
              icon={<Save className="w-4 h-4" />}
            >
              Lưu thay đổi
            </Button>
          </Form.Item>
        </Form>
      ),
    },
    ...(user?.role === "driver"
      ? [
          {
            label: (
              <span className="flex items-center gap-2">
                <Car className="w-4 h-4" />
                Thông tin xe
              </span>
            ),
            key: "vehicle",
            children: loadingVehicle ? (
              <div className="flex justify-center py-8">
                <Spin />
              </div>
            ) : (
              <Form
                form={vehicleForm}
                layout="vertical"
                onFinish={handleUpdateVehicle}
                size="large"
              >
                <Form.Item
                  label="Loại xe"
                  name="vehicleTypeId"
                  rules={[{ required: true, message: "Vui lòng chọn loại xe" }]}
                >
                  <Select
                    placeholder="Chọn loại xe"
                    options={vehicleTypes.map((vt) => ({
                      label: vt.name,
                      value: vt.id,
                    }))}
                  />
                </Form.Item>

                <Form.Item
                  label="Biển số xe"
                  name="licensePlate"
                  rules={[
                    { required: true, message: "Vui lòng nhập biển số xe" },
                  ]}
                >
                  <Input placeholder="VD: 29A-12345" />
                </Form.Item>

                <Form.Item
                  label="Hãng xe"
                  name="vehicleBrand"
                  rules={[{ required: true, message: "Vui lòng nhập hãng xe" }]}
                >
                  <Input placeholder="VD: Honda, Yamaha" />
                </Form.Item>

                <Form.Item
                  label="Mẫu xe"
                  name="vehicleModel"
                  rules={[{ required: true, message: "Vui lòng nhập mẫu xe" }]}
                >
                  <Input placeholder="VD: Wave, Exciter" />
                </Form.Item>

                <Form.Item
                  label="Màu xe"
                  name="vehicleColor"
                  rules={[{ required: true, message: "Vui lòng nhập màu xe" }]}
                >
                  <Input placeholder="VD: Đỏ, Xanh" />
                </Form.Item>

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loadingVehicle}
                    icon={<Save className="w-4 h-4" />}
                  >
                    Lưu thay đổi
                  </Button>
                </Form.Item>
              </Form>
            ),
          },
        ]
      : []),
    {
      label: (
        <span className="flex items-center gap-2">
          <Lock className="w-4 h-4" />
          Bảo mật
        </span>
      ),
      key: "security",
      children: (
        <div className="py-4">
          <h4 className="font-semibold mb-2">Mật khẩu</h4>
          <p className="text-sm text-gray-500 mb-4">
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
      ),
    },
  ];

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Thông tin cá nhân</h2>

      <Card>
        <div className="flex items-center gap-4 mb-6 pb-6 border-b">
          <div className="relative">
            <Spin spinning={uploading}>
              <img
                src={avatar}
                alt={user?.fullName}
                className="w-20 h-20 rounded-full object-cover"
              />
            </Spin>
            <Upload
              maxCount={1}
              beforeUpload={handleAvatarUpload}
              showUploadList={false}
              accept="image/*"
            >
              <button className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-2 hover:bg-blue-700 transition-colors">
                <UploadIcon className="w-4 h-4" />
              </button>
            </Upload>
          </div>
          <div>
            <h3 className="text-xl font-semibold">{user?.fullName}</h3>
            <p className="text-sm text-gray-500">{user?.email}</p>
            <p className="text-xs text-gray-400 mt-1">
              {user?.role === "user" && "Khách hàng"}
              {user?.role === "driver" && "Tài xế"}
              {user?.role === "admin" && "Quản trị viên"}
            </p>
          </div>
        </div>

        <Tabs defaultActiveKey="info" items={tabItems} />
      </Card>

      {/* Change Password Modal */}
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

export default function ProfilePage() {
  return (
    <App>
      <ProfilePageContent />
    </App>
  );
}
