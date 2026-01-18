"use client";

import { useEffect, useState } from "react";
import {
  Card,
  Form,
  InputNumber,
  Button,
  message,
  Modal,
  Table,
  Popconfirm,
  Input,
  Select,
  Spin,
} from "antd";
import { DollarSign, Edit, Trash2 } from "lucide-react";
import {
  getVehicleTypes,
  createVehicleType,
  updateVehicleType,
  deleteVehicleType,
} from "../../services/adminService";

// Implements FR-19
export default function AdminTariffPage() {
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingVehicleType, setEditingVehicleType] = useState(null);
  const [vehicleTypeModalVisible, setVehicleTypeModalVisible] = useState(false);
  const [vehicleTypeForm] = Form.useForm();

  // Price calculator
  const [calcVehicleTypeId, setCalcVehicleTypeId] = useState(null);
  const [calcDistance, setCalcDistance] = useState(10);
  const [calcPrice, setCalcPrice] = useState(0);

  useEffect(() => {
    fetchVehicleTypes();
  }, []);

  const fetchVehicleTypes = async () => {
    try {
      setLoading(true);
      const response = await getVehicleTypes();

      if (response.success) {
        setVehicleTypes(response.data);
        // Set first vehicle type as default for calculator
        if (response.data.length > 0 && !calcVehicleTypeId) {
          setCalcVehicleTypeId(response.data[0].id);
        }
      } else {
        message.error(response.message || 'Lỗi khi tải thông tin gói cước');
      }
    } catch (error) {
      console.error('Error fetching vehicle types:', error);
      message.error(error.response?.data?.error || 'Không thể tải thông tin gói cước');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitVehicleType = async (values) => {
    try {
      let response;

      if (editingVehicleType) {
        // Update existing vehicle type
        response = await updateVehicleType(editingVehicleType.id, values);
      } else {
        // Create new vehicle type
        response = await createVehicleType(values);
      }

      if (response.success) {
        message.success(
          editingVehicleType ? "Cập nhật thành công" : "Thêm mới thành công"
        );
        setVehicleTypeModalVisible(false);
        setEditingVehicleType(null);
        vehicleTypeForm.resetFields();
        fetchVehicleTypes();
      } else {
        message.error(response.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Error saving vehicle type:', error);
      message.error(error.response?.data?.error || error.message || 'Có lỗi xảy ra');
    }
  };

  const handleEditVehicleType = (vehicleType) => {
    setEditingVehicleType(vehicleType);
    vehicleTypeForm.setFieldsValue({
      name: vehicleType.name,
      basePrice: vehicleType.basePrice,
      pricePerKm: vehicleType.pricePerKm,
      description: vehicleType.description,
      isActive: vehicleType.isActive,
    });
    setVehicleTypeModalVisible(true);
  };

  const handleDeleteVehicleType = async (id) => {
    try {
      const response = await deleteVehicleType(id);

      if (response.success) {
        message.success("Xóa thành công");
        fetchVehicleTypes();
      } else {
        message.error(response.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Error deleting vehicle type:', error);
      message.error(error.response?.data?.error || error.message || 'Có lỗi xảy ra');
    }
  };

  // Calculate price based on vehicle type and distance
  useEffect(() => {
    const vehicleType = vehicleTypes.find((vt) => vt.id === calcVehicleTypeId);
    if (vehicleType && calcDistance > 0) {
      const price = vehicleType.basePrice + calcDistance * vehicleType.pricePerKm;
      setCalcPrice(price);
    } else {
      setCalcPrice(0);
    }
  }, [calcVehicleTypeId, calcDistance, vehicleTypes]);

  const columns = [
    {
      title: "Tên loại xe",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Giá cơ bản (đ)",
      dataIndex: "basePrice",
      key: "basePrice",
      render: (value) => value?.toLocaleString() || 0,
    },
    {
      title: "Giá/km (đ)",
      dataIndex: "pricePerKm",
      key: "pricePerKm",
      render: (value) => value?.toLocaleString() || 0,
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
    },
    {
      title: "Trạng thái",
      dataIndex: "isActive",
      key: "isActive",
      render: (isActive) => (
        <span className={isActive ? "text-green-600" : "text-red-600"}>
          {isActive ? "✓ Hoạt động" : "✗ Không hoạt động"}
        </span>
      ),
    },
    {
      title: "Số tài xế",
      dataIndex: "totalDrivers",
      key: "totalDrivers",
    },
    {
      title: "Hành động",
      key: "actions",
      render: (_, record) => (
        <div className="flex gap-2">
          <Button
            size="small"
            icon={<Edit className="w-4 h-4" />}
            onClick={() => handleEditVehicleType(record)}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Xóa loại xe này?"
            description="Hành động này không thể hoàn tác"
            onConfirm={() => handleDeleteVehicleType(record.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button
              size="small"
              danger
              icon={<Trash2 className="w-4 h-4" />}
            >
              Xóa
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold text-foreground mb-6">
        Quản lý gói cước
      </h2>

      {/* Vehicle Types Table */}
      <Card className="mb-6">
        <div className="mb-4 flex justify-between items-center">
          <h3 className="font-semibold text-foreground">
            Giá cước theo loại xe
          </h3>
          <Button
            type="primary"
            onClick={() => {
              setEditingVehicleType(null);
              vehicleTypeForm.resetFields();
              setVehicleTypeModalVisible(true);
            }}
          >
            Thêm loại xe
          </Button>
        </div>

        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={vehicleTypes}
            rowKey="id"
            pagination={false}
          />
        </Spin>
      </Card>

      {/* Vehicle Type Modal */}
      <Modal
        title={editingVehicleType ? "Chỉnh sửa loại xe" : "Thêm loại xe mới"}
        open={vehicleTypeModalVisible}
        onOk={() => vehicleTypeForm.submit()}
        onCancel={() => {
          setVehicleTypeModalVisible(false);
          setEditingVehicleType(null);
          vehicleTypeForm.resetFields();
        }}
        okText={editingVehicleType ? "Cập nhật" : "Tạo mới"}
        cancelText="Hủy"
      >
        <Form
          form={vehicleTypeForm}
          layout="vertical"
          onFinish={handleSubmitVehicleType}
        >
          <Form.Item
            name="name"
            label="Tên loại xe"
            rules={[{ required: true, message: "Vui lòng nhập tên loại xe" }]}
          >
            <Input placeholder="VD: Ô tô 4 chỗ" />
          </Form.Item>

          <Form.Item
            name="basePrice"
            label="Giá cơ bản (đồng)"
            rules={[{ required: true, message: "Vui lòng nhập giá cơ bản" }]}
          >
            <InputNumber
              min={0}
              step={1000}
              className="w-full"
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
            />
          </Form.Item>

          <Form.Item
            name="pricePerKm"
            label="Giá mỗi km (đồng/km)"
            rules={[{ required: true, message: "Vui lòng nhập giá mỗi km" }]}
          >
            <InputNumber
              min={0}
              step={500}
              className="w-full"
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
            />
          </Form.Item>

          <Form.Item
            name="description"
            label="Mô tả"
          >
            <Input.TextArea rows={3} placeholder="Mô tả về loại xe..." />
          </Form.Item>

          {editingVehicleType && (
            <Form.Item
              name="isActive"
              label="Trạng thái"
              valuePropName="checked"
            >
              <Select>
                <Select.Option value={true}>Hoạt động</Select.Option>
                <Select.Option value={false}>Không hoạt động</Select.Option>
              </Select>
            </Form.Item>
          )}
        </Form>
      </Modal>

      {/* Price Calculator */}
      <Card>
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Máy tính giá cước</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Nhập loại xe và khoảng cách để tính giá tiền
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Loại xe
            </label>
            <Select
              value={calcVehicleTypeId}
              onChange={setCalcVehicleTypeId}
              className="w-full"
              size="large"
              options={vehicleTypes
                .filter(vt => vt.isActive)
                .map((vt) => ({
                  label: vt.name,
                  value: vt.id,
                }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Khoảng cách (km)
            </label>
            <InputNumber
              min={0}
              step={0.5}
              value={calcDistance}
              onChange={(val) => setCalcDistance(val || 0)}
              className="w-full"
              size="large"
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
            />
          </div>

          <div className="p-4 bg-primary/10 rounded-lg border border-primary">
            <p className="text-sm text-muted-foreground mb-2">Giá dự kiến</p>
            <p className="text-3xl font-bold text-primary">
              {calcPrice.toLocaleString()}đ
            </p>
            {vehicleTypes.find((vt) => vt.id === calcVehicleTypeId) && (
              <p className="text-xs text-muted-foreground mt-2">
                ={" "}
                {vehicleTypes
                  .find((vt) => vt.id === calcVehicleTypeId)
                  ?.basePrice?.toLocaleString()}
                đ (cơ bản) + {calcDistance}km ×{" "}
                {vehicleTypes
                  .find((vt) => vt.id === calcVehicleTypeId)
                  ?.pricePerKm?.toLocaleString()}
                đ/km
              </p>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}