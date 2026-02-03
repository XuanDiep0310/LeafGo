"use client";

import { useEffect, useState } from "react";
import { Input, Select, DatePicker, Card, Button, Empty, Spin, Pagination } from "antd";
import { Search, Star, Clock } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { getRides } from "../../services/adminService";

const { Option } = Select;
const { RangePicker } = DatePicker;

// Implements FR-18
export default function AdminTripsPage() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState("");
  const [dateRange, setDateRange] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    fetchTrips();
  }, [currentPage, pageSize, statusFilter, dateRange]);

  const fetchTrips = async () => {
    try {
      setLoading(true);

      const params = {
        Page: currentPage,
        PageSize: pageSize,
        Status: statusFilter || undefined,
      };

      if (dateRange && dateRange[0] && dateRange[1]) {
        params.FromDate = dateRange[0].toISOString();
        params.ToDate = dateRange[1].toISOString();
      }

      const response = await getRides(params);

      if (response.success) {
        setTrips(response.data.items);
        setTotalItems(response.data.totalItems);
      } else {
        console.error('Error fetching trips:', response.message);
      }
    } catch (error) {
      console.error("Error fetching trips:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchTrips();
  };

  const handleReset = () => {
    setStatusFilter("");
    setDateRange(null);
    setCurrentPage(1);
  };

  const getStatusColor = (status) => {
    const colors = {
      Completed: "bg-green-100 border-green-300 text-green-700",
      Cancelled: "bg-red-100 border-red-300 text-red-700",
      InProgress: "bg-blue-100 border-blue-300 text-blue-700",
      Pending: "bg-orange-100 border-orange-300 text-orange-700",
      Requested: "bg-yellow-100 border-yellow-300 text-yellow-700",
    };
    return colors[status] || "bg-gray-100 border-gray-300 text-gray-700";
  };

  const getStatusText = (status) => {
    const texts = {
      Completed: "✅ Hoàn thành",
      Cancelled: "❌ Đã hủy",
      InProgress: "🚗 Đang đi",
      Pending: "⏳ Chờ xử lý",
      Requested: "🔍 Đang tìm",
    };
    return texts[status] || status;
  };

  const TripCard = ({ trip }) => (
    <div className="border border-gray-200 rounded-lg p-4 mb-3 hover:shadow-md transition-shadow bg-white">
      {/* Header: Time and Status */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-gray-400 shrink-0" />
          <div>
            <div className="text-sm text-gray-500">
              {format(new Date(trip.requestedAt), "dd/MM/yyyy HH:mm", {
                locale: vi,
              })}
            </div>
          </div>
        </div>
        <div
          className={`px-3 py-1 rounded-full border text-xs font-semibold ${getStatusColor(
            trip.status
          )}`}
        >
          {getStatusText(trip.status)}
        </div>
      </div>

      {/* Route Info */}
      <div className="mb-3 bg-gray-50 p-3 rounded">
        <div className="text-sm mb-2">
          <span className="font-semibold">Từ:</span>{" "}
          {trip.pickupAddress || "N/A"}
        </div>
        <div className="text-sm">
          <span className="font-semibold">Đến:</span>{" "}
          {trip.destinationAddress || "N/A"}
        </div>
      </div>

      {/* Trip Details: 2 columns */}
      <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
        <div>
          <div className="text-gray-500 text-xs">Khoảng cách</div>
          <div className="font-semibold">{trip.distance?.toFixed(2)} km</div>
        </div>
        <div>
          <div className="text-gray-500 text-xs">Giá</div>
          <div className="font-bold text-blue-600">
            {trip.finalPrice ? trip.finalPrice.toLocaleString() : trip.estimatedPrice?.toLocaleString()}đ
          </div>
        </div>
      </div>

      {/* Customer and Driver Info: 2 columns */}
      <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
        <div className="border-r pr-3">
          <div className="text-gray-500 text-xs mb-1">Khách hàng</div>
          <div className="font-medium">{trip.user?.fullName || "N/A"}</div>
          <div className="text-xs text-gray-600">{trip.user?.phoneNumber || "-"}</div>
        </div>
        <div className="pl-3">
          <div className="text-gray-500 text-xs mb-1">Tài xế</div>
          <div className="font-medium">{trip.driver?.fullName || "Chưa có"}</div>
          <div className="text-xs text-gray-600">{trip.driver?.phoneNumber || "-"}</div>
          {trip.driver?.licensePlate && (
            <div className="text-xs text-blue-600 font-semibold">{trip.driver.licensePlate}</div>
          )}
        </div>
      </div>

      {/* Rating and Comment */}
      {trip.rating && (
        <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-200 text-sm">
          <div>
            <div className="text-gray-500 text-xs mb-1">Đánh giá</div>
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${i < trip.rating.rating
                    ? "text-yellow-400 fill-yellow-400"
                    : "text-gray-300"
                    }`}
                />
              ))}
            </div>
          </div>
          <div>
            <div className="text-gray-500 text-xs mb-1">Nhận xét</div>
            <div className="text-sm italic text-gray-600">
              {trip.rating.comment || "-"}
            </div>
          </div>
        </div>
      )}

      {/* Cancellation Info */}
      {trip.status === "Cancelled" && trip.cancellationReason && (
        <div className="pt-3 border-t border-gray-200 text-sm">
          <div className="text-gray-500 text-xs mb-1">Lý do hủy</div>
          <div className="text-sm text-red-600">{trip.cancellationReason}</div>
          {trip.cancelledBy && (
            <div className="text-xs text-gray-500 mt-1">Bởi: {trip.cancelledBy}</div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-1">
          Lịch sử chuyến đi
        </h2>
        <p className="text-muted-foreground text-sm">
          Tổng:{" "}
          <span className="font-semibold text-foreground">
            {totalItems}
          </span>{" "}
          chuyến
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6 border-l-4 border-l-blue-500">
        <div className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="md:col-span-1">
              <label className="block text-xs font-semibold text-gray-600 mb-2">
                Trạng thái
              </label>
              <Select
                value={statusFilter}
                onChange={setStatusFilter}
                className="w-full"
                placeholder="Tất cả"
              >
                <Option value="">Tất cả</Option>
                <Option value="Completed">Hoàn thành</Option>
                <Option value="InProgress">Đang đi</Option>
                <Option value="Cancelled">Đã hủy</Option>
                <Option value="Pending">Chờ xử lý</Option>
                <Option value="Requested">Đang tìm</Option>
              </Select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-2">
                Khoảng thời gian
              </label>
              <RangePicker
                value={dateRange}
                onChange={setDateRange}
                format="DD/MM/YYYY"
                size="middle"
                className="w-full"
                style={{ width: "100%" }}
              />
            </div>
            <div className="flex items-end gap-2">
              <Button type="primary" onClick={handleSearch} className="flex-1">
                Tìm kiếm
              </Button>
              <Button onClick={handleReset} className="flex-1">
                Reset
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Trips List */}
      <Spin spinning={loading} tip="Đang tải...">
        {trips.length > 0 ? (
          <>
            <div>
              {trips.map((trip) => (
                <TripCard key={trip.id} trip={trip} />
              ))}
            </div>

            <div className="mt-4 flex justify-end">
              <Pagination
                current={currentPage}
                pageSize={pageSize}
                total={totalItems}
                onChange={(page, size) => {
                  setCurrentPage(page);
                  setPageSize(size);
                }}
                showSizeChanger
                showTotal={(total) => `Tổng ${total} chuyến`}
              />
            </div>
          </>
        ) : (
          <Empty description="Không có chuyến đi nào" />
        )}
      </Spin>
    </div>
  );
}