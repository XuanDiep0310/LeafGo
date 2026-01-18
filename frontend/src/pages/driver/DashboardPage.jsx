import { useState, useEffect } from "react";
import { Modal, Form, Input, Select, Button, message, Spin, Empty, Alert } from "antd";
import { Car, AlertCircle, RefreshCw } from "lucide-react";
import { getDriverVehicle, updateDriverVehicle, getVehicleTypes } from "../../services/driverService";

const { Option } = Select;

export default function VehicleConfigModal({ open, onClose, onSuccess }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [existingVehicle, setExistingVehicle] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open]);

  const fetchData = async () => {
    setFetching(true);
    setError(null);

    try {
      console.log("🔍 Fetching vehicle types...");

      const [typesRes, vehicleRes] = await Promise.allSettled([
        getVehicleTypes(),
        getDriverVehicle(),
      ]);

      // Debug: Log raw responses
      console.log("📦 Vehicle Types Response:", typesRes);
      console.log("📦 Current Vehicle Response:", vehicleRes);

      // Handle vehicle types
      if (typesRes.status === "fulfilled") {
        const typesData = typesRes.value;
        console.log("✅ Vehicle Types Data:", typesData);

        // Check multiple response formats
        let types = [];

        if (typesData?.success && typesData?.data) {
          // Format: { success: true, data: [...] }
          types = typesData.data;
          console.log("Format 1: success + data");
        } else if (Array.isArray(typesData?.data)) {
          // Format: { data: [...] }
          types = typesData.data;
          console.log("Format 2: direct data array");
        } else if (Array.isArray(typesData)) {
          // Format: [...]
          types = typesData;
          console.log("Format 3: direct array");
        } else {
          console.error("❌ Unknown format:", typesData);
          setError("Định dạng dữ liệu không hợp lệ");
        }

        // Filter active types
        const activeTypes = types.filter(vt => vt.isActive !== false);
        console.log(`✅ Active Vehicle Types (${activeTypes.length}):`, activeTypes);

        setVehicleTypes(activeTypes);

        if (activeTypes.length === 0) {
          setError("Không có loại xe nào. Vui lòng liên hệ Admin để thêm loại xe.");
          message.warning("Không có loại xe khả dụng");
        }
      } else {
        console.error("❌ Failed to fetch vehicle types:", typesRes.reason);
        setError(typesRes.reason?.message || "Không thể tải danh sách loại xe");
        message.error("Không thể tải danh sách loại xe");
      }

      // Handle existing vehicle
      if (vehicleRes.status === "fulfilled") {
        const vehicleData = vehicleRes.value;
        console.log("✅ Current Vehicle Data:", vehicleData);

        if (vehicleData?.success && vehicleData?.data) {
          const vehicle = vehicleData.data;
          setExistingVehicle(vehicle);

          form.setFieldsValue({
            vehicleTypeId: vehicle.vehicleType?.id,
            licensePlate: vehicle.licensePlate,
            vehicleBrand: vehicle.vehicleBrand,
            vehicleModel: vehicle.vehicleModel,
            vehicleColor: vehicle.vehicleColor,
          });

          setSelectedType(vehicle.vehicleType);
        } else {
          console.log("ℹ️ No vehicle registered yet");
        }
      } else {
        console.error("⚠️ Failed to fetch vehicle:", vehicleRes.reason);
      }
    } catch (error) {
      console.error("❌ Error fetching data:", error);
      setError(error.message || "Không thể tải dữ liệu");
      message.error("Không thể tải dữ liệu");
    } finally {
      setFetching(false);
    }
  };

  const handleTypeChange = (typeId) => {
    const type = vehicleTypes.find(vt => vt.id === typeId);
    console.log("Selected vehicle type:", type);
    setSelectedType(type);
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    console.log("📤 Submitting vehicle data:", values);

    try {
      const response = await updateDriverVehicle(values);
      console.log("✅ Update response:", response);

      if (response.success) {
        message.success(
          existingVehicle ? "Cập nhật xe thành công!" : "Đăng ký xe thành công!"
        );
        onSuccess?.(response.data);
        onClose();
      } else {
        message.error(response.message || "Có lỗi xảy ra");
      }
    } catch (error) {
      console.error("❌ Update vehicle error:", error);
      const errorMsg = error.response?.data?.error || "Không thể cập nhật thông tin xe";
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (!loading) {
      form.resetFields();
      setSelectedType(null);
      setError(null);
      onClose();
    }
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <Car className="w-5 h-5 text-primary" />
          <span>Thông tin phương tiện</span>
        </div>
      }
      open={open}
      onCancel={handleCancel}
      footer={null}
      width={600}
      maskClosable={false}
      destroyOnClose
    >
      <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
        <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-yellow-800">
          Vui lòng cập nhật đầy đủ thông tin xe trước khi bắt đầu nhận chuyến.
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert
          message="Lỗi"
          description={error}
          type="error"
          showIcon
          closable
          onClose={() => setError(null)}
          className="mb-4"
          action={
            <Button size="small" onClick={fetchData}>
              Thử lại
            </Button>
          }
        />
      )}

      {fetching ? (
        <div className="py-8 text-center">
          <Spin tip="Đang tải thông tin..." />
        </div>
      ) : (
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          {/* Vehicle Type Selection */}
          <Form.Item
            name="vehicleTypeId"
            label={<span className="font-semibold">Loại xe</span>}
            rules={[{ required: true, message: "Vui lòng chọn loại xe" }]}
          >
            <Select
              placeholder="Chọn loại xe"
              size="large"
              onChange={handleTypeChange}
              notFoundContent={
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <div className="text-center py-4">
                      <p className="text-gray-600 mb-2">Không có loại xe</p>
                      <p className="text-xs text-gray-500 mb-3">
                        Vui lòng liên hệ Admin để thêm loại xe
                      </p>
                      <Button
                        size="small"
                        icon={<RefreshCw className="w-4 h-4" />}
                        onClick={fetchData}
                      >
                        Thử lại
                      </Button>
                    </div>
                  }
                />
              }
            >
              {vehicleTypes.map((type) => (
                <Option key={type.id} value={type.id}>
                  {type.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          {/* Show pricing when type selected */}
          {selectedType && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-semibold text-blue-900 mb-2">
                Bảng giá: {selectedType.name}
              </p>
              <div className="text-sm text-blue-800">
                <span>Giá khởi điểm: </span>
                <span className="font-bold">{selectedType.basePrice?.toLocaleString()}đ</span>
                <span className="mx-2">•</span>
                <span>Giá/km: </span>
                <span className="font-bold">{selectedType.pricePerKm?.toLocaleString()}đ</span>
              </div>
            </div>
          )}

          {/* Debug Info - Remove after fixing */}
          {!fetching && vehicleTypes.length === 0 && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm font-semibold text-red-800 mb-2">
                🐛 Debug Info
              </p>
              <div className="text-xs text-red-700 space-y-1">
                <p>• Kiểm tra Console để xem log chi tiết</p>
                <p>• API endpoint: <code className="bg-red-100 px-1 rounded">/api/VehicleTypes</code></p>
                <p>• Service function: <code className="bg-red-100 px-1 rounded">getVehicleTypes()</code></p>
                <p>• Đảm bảo Admin đã tạo ít nhất 1 loại xe</p>
              </div>
            </div>
          )}

          {/* License Plate */}
          <Form.Item
            name="licensePlate"
            label={<span className="font-semibold">Biển số xe</span>}
            rules={[
              { required: true, message: "Vui lòng nhập biển số xe" },
              {
                pattern: /^[0-9]{2}[A-Z]{1,2}-[0-9]{4,5}$/,
                message: "Biển số không hợp lệ (VD: 29A-12345)",
              },
            ]}
          >
            <Input
              placeholder="VD: 29A-12345"
              size="large"
              maxLength={10}
              onChange={(e) => {
                form.setFieldValue('licensePlate', e.target.value.toUpperCase());
              }}
            />
          </Form.Item>

          {/* Brand and Model */}
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="vehicleBrand"
              label={<span className="font-semibold">Hãng xe</span>}
              rules={[{ required: true, message: "Vui lòng nhập hãng xe" }]}
            >
              <Input placeholder="VD: Honda, Toyota" size="large" />
            </Form.Item>

            <Form.Item
              name="vehicleModel"
              label={<span className="font-semibold">Dòng xe</span>}
              rules={[{ required: true, message: "Vui lòng nhập dòng xe" }]}
            >
              <Input placeholder="VD: Wave, Vios" size="large" />
            </Form.Item>
          </div>

          {/* Vehicle Color */}
          <Form.Item
            name="vehicleColor"
            label={<span className="font-semibold">Màu xe</span>}
            rules={[{ required: true, message: "Vui lòng chọn màu xe" }]}
          >
            <Select placeholder="Chọn màu xe" size="large">
              <Option value="Trắng">Trắng</Option>
              <Option value="Đen">Đen</Option>
              <Option value="Xám">Xám</Option>
              <Option value="Bạc">Bạc</Option>
              <Option value="Đỏ">Đỏ</Option>
              <Option value="Xanh dương">Xanh dương</Option>
              <Option value="Xanh lá">Xanh lá</Option>
              <Option value="Vàng">Vàng</Option>
              <Option value="Nâu">Nâu</Option>
              <Option value="Cam">Cam</Option>
            </Select>
          </Form.Item>

          {/* Current Info */}
          {existingVehicle && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-xs font-semibold text-green-900 mb-2">
                ✓ Thông tin hiện tại
              </p>
              <div className="text-sm text-green-800 space-y-1">
                <p>• {existingVehicle.vehicleType?.name}</p>
                <p>• {existingVehicle.licensePlate} - {existingVehicle.vehicleBrand} {existingVehicle.vehicleModel}</p>
                <p>• Màu: {existingVehicle.vehicleColor}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <Form.Item className="mb-0">
            <div className="flex gap-2 justify-end">
              <Button onClick={handleCancel} disabled={loading} size="large">
                Hủy
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                size="large"
                disabled={vehicleTypes.length === 0}
              >
                {existingVehicle ? "Cập nhật" : "Lưu"}
              </Button>
            </div>
          </Form.Item>
        </Form>
      )}
    </Modal>
  );
}