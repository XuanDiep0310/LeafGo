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
} from "antd";
import { DollarSign, Edit, Trash2 } from "lucide-react";
import { mockApi } from "../../services/mockData";

// Implements FR-19
export default function AdminTariffPage() {
  const [tariff, setTariff] = useState(null);
  const [loading, setLoading] = useState(false);
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [editingVehicleType, setEditingVehicleType] = useState(null);
  const [vehicleTypeModalVisible, setVehicleTypeModalVisible] = useState(false);
  const [vehicleTypeForm] = Form.useForm();

  // Price calculator
  const [calcVehicleTypeId, setCalcVehicleTypeId] = useState("bike");
  const [calcDistance, setCalcDistance] = useState(10);
  const [calcPrice, setCalcPrice] = useState(0);

  useEffect(() => {
    fetchTariff();
  }, []);

  const fetchTariff = async () => {
    try {
      const currentTariff = await mockApi.getTariff();
      setTariff(currentTariff);
      setVehicleTypes(currentTariff.vehicleTypes || []);
    } catch (error) {
      message.error("Lỗi khi tải thông tin gói cước");
    }
  };

  const handleSubmitVehicleType = async (values) => {
    try {
      let updatedTypes = [...vehicleTypes];

      if (editingVehicleType) {
        const index = updatedTypes.findIndex(
          (vt) => vt.id === editingVehicleType.id
        );
        updatedTypes[index] = { ...editingVehicleType, ...values };
      } else {
        updatedTypes.push({
          id: `type_${Date.now()}`,
          ...values,
        });
      }

      await mockApi.updateTariff({ vehicleTypes: updatedTypes });
      setVehicleTypes(updatedTypes);
      message.success(
        editingVehicleType ? "Cập nhật thành công" : "Thêm mới thành công"
      );
      setVehicleTypeModalVisible(false);
      setEditingVehicleType(null);
      vehicleTypeForm.resetFields();
    } catch (error) {
      message.error("Có lỗi xảy ra");
    }
  };

  const handleEditVehicleType = (vehicleType) => {
    setEditingVehicleType(vehicleType);
    vehicleTypeForm.setFieldsValue(vehicleType);
    setVehicleTypeModalVisible(true);
  };

  const handleDeleteVehicleType = async (id) => {
    try {
      const updated = vehicleTypes.filter((vt) => vt.id !== id);
      await mockApi.updateTariff({ vehicleTypes: updated });
      setVehicleTypes(updated);
      message.success("Xóa thành công");
    } catch (error) {
      message.error("Có lỗi xảy ra");
    }
  };

  // Calculate price based on vehicle type and distance
  useEffect(() => {
    const vehicleType = vehicleTypes.find((vt) => vt.id === calcVehicleTypeId);
    if (vehicleType && calcDistance > 0) {
      const price =
        vehicleType.baseFare + calcDistance * vehicleType.pricePerKm;
      setCalcPrice(Math.max(price, vehicleType.minFare));
    }
  }, [calcVehicleTypeId, calcDistance, vehicleTypes]);

  return (
    <div className="p-6 max-w-4xl mx-auto">
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

        <Table
          columns={[
            {
              title: "Tên loại xe",
              dataIndex: "name",
              key: "name",
            },
            {
              title: "Giá mở cửa (đ)",
              dataIndex: "baseFare",
              key: "baseFare",
              render: (value) => value.toLocaleString(),
            },
            {
              title: "Giá/km (đ)",
              dataIndex: "pricePerKm",
              key: "pricePerKm",
              render: (value) => value.toLocaleString(),
            },
            {
              title: "Giá tối thiểu (đ)",
              dataIndex: "minFare",
              key: "minFare",
              render: (value) => value.toLocaleString(),
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
                    onConfirm={() => handleDeleteVehicleType(record.id)}
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
          ]}
          dataSource={vehicleTypes}
          rowKey="id"
          pagination={false}
        />
      </Card>

      {/* Vehicle Type Modal */}
      <Modal
        title={editingVehicleType ? "Chỉnh sửa loại xe" : "Thêm loại xe mới"}
        open={vehicleTypeModalVisible}
        onOk={() => vehicleTypeForm.submit()}
        onCancel={() => {
          setVehicleTypeModalVisible(false);
          setEditingVehicleType(null);
        }}
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
            name="baseFare"
            label="Giá mở cửa (đồng)"
            rules={[{ required: true, message: "Vui lòng nhập giá mở cửa" }]}
          >
            <InputNumber
              min={0}
              step={1000}
              className="w-full"
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
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
            />
          </Form.Item>

          <Form.Item
            name="minFare"
            label="Giá tối thiểu (đồng)"
            rules={[{ required: true, message: "Vui lòng nhập giá tối thiểu" }]}
          >
            <InputNumber
              min={0}
              step={1000}
              className="w-full"
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
            />
          </Form.Item>
        </Form>
      </Modal>

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
              options={vehicleTypes.map((vt) => ({
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
                  ?.baseFare.toLocaleString()}
                đ (mở cửa) + {calcDistance}km ×{" "}
                {vehicleTypes
                  .find((vt) => vt.id === calcVehicleTypeId)
                  ?.pricePerKm.toLocaleString()}
                đ/km
              </p>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
