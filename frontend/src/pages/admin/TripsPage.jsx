"use client";

import { useEffect, useState } from "react";
import { Input, Select, DatePicker, Card, Button, Empty, Spin } from "antd";
import { Search, Star, Clock } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { mockApi } from "../../services/mockData";

const { Option } = Select;
const { RangePicker } = DatePicker;

// Implements FR-18
export default function AdminTripsPage() {
  const [trips, setTrips] = useState([]);
  const [filteredTrips, setFilteredTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState(null);
  const [driverFilter, setDriverFilter] = useState("");

  useEffect(() => {
    fetchTrips();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [trips, searchText, statusFilter, dateRange, driverFilter]);

  const fetchTrips = async () => {
    try {
      const allTrips = await mockApi.getAllTrips();

      // Enrich trips with customer and driver info
      const enrichedTrips = await Promise.all(
        allTrips.map(async (trip) => {
          const customer = trip.userId
            ? await mockApi.getUserById(trip.userId)
            : null;
          const driver = trip.driverId
            ? await mockApi.getUserById(trip.driverId)
            : null;
          return {
            ...trip,
            customerName: customer?.fullName || "Unknown",
            customerPhone: customer?.phone || "-",
            driverName: driver?.fullName || "-",
            driverPhone: driver?.phone || "-",
            driverVehicle: driver?.vehicle || "-",
            driverRating: driver?.rating || 0,
          };
        })
      );

      setTrips(enrichedTrips);
    } catch (error) {
      console.error("Error fetching trips:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...trips];

    // Search by location
    if (searchText) {
      filtered = filtered.filter(
        (trip) =>
          trip.pickupLocation?.address
            ?.toLowerCase()
            .includes(searchText.toLowerCase()) ||
          trip.dropoffLocation?.address
            ?.toLowerCase()
            .includes(searchText.toLowerCase())
      );
    }

    // Filter by driver name
    if (driverFilter) {
      filtered = filtered.filter((trip) =>
        trip.driverName?.toLowerCase().includes(driverFilter.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((trip) => trip.status === statusFilter);
    }

    // Filter by date range
    if (dateRange && dateRange[0] && dateRange[1]) {
      filtered = filtered.filter((trip) => {
        const tripDate = new Date(trip.createdAt);
        return (
          tripDate >= dateRange[0].toDate() && tripDate <= dateRange[1].toDate()
        );
      });
    }

    setFilteredTrips(filtered);
  };

  const getStatusColor = (status) => {
    const colors = {
      completed: "bg-green-100 border-green-300 text-green-700",
      cancelled: "bg-red-100 border-red-300 text-red-700",
      in_progress: "bg-blue-100 border-blue-300 text-blue-700",
      finding: "bg-orange-100 border-orange-300 text-orange-700",
    };
    return colors[status] || "bg-gray-100 border-gray-300 text-gray-700";
  };

  const getStatusText = (status) => {
    const texts = {
      completed: "✅ Hoàn thành",
      cancelled: "❌ Đã hủy",
      in_progress: "🚗 Đang đi",
      finding: "🔍 Đang tìm",
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
              {format(new Date(trip.createdAt), "dd/MM/yyyy HH:mm", {
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
          {trip.pickupLocation?.address || "N/A"}
        </div>
        <div className="text-sm">
          <span className="font-semibold">Đến:</span>{" "}
          {trip.dropoffLocation?.address || "N/A"}
        </div>
      </div>

      {/* Trip Details: 2 columns */}
      <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
        <div>
          <div className="text-gray-500 text-xs">Khoảng cách</div>
          <div className="font-semibold">{trip.distance} km</div>
        </div>
        <div>
          <div className="text-gray-500 text-xs">Giá</div>
          <div className="font-bold text-blue-600">
            {trip.price?.toLocaleString()}đ
          </div>
        </div>
      </div>

      {/* Customer and Driver Info: 2 columns */}
      <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
        <div className="border-r pr-3">
          <div className="text-gray-500 text-xs mb-1">Khách hàng</div>
          <div className="font-medium">{trip.customerName}</div>
          <div className="text-xs text-gray-600">{trip.customerPhone}</div>
        </div>
        <div className="pl-3">
          <div className="text-gray-500 text-xs mb-1">Tài xế</div>
          <div className="font-medium">{trip.driverName}</div>
          <div className="text-xs text-gray-600">{trip.driverPhone}</div>
        </div>
      </div>

      {/* Rating and Comment */}
      <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-200 text-sm">
        <div>
          <div className="text-gray-500 text-xs mb-1">Đánh giá</div>
          {trip.rating ? (
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < trip.rating
                      ? "text-yellow-400 fill-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
          ) : (
            <div className="font-semibold text-gray-500">Chưa đánh giá</div>
          )}
        </div>
        <div>
          <div className="text-gray-500 text-xs mb-1">Nhận xét</div>
          <div className="text-sm italic text-gray-600">
            {trip.comment || "-"}
          </div>
        </div>
      </div>
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
            {filteredTrips.length}
          </span>{" "}
          chuyến
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6 border-l-4 border-l-blue-500">
        <div className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="md:col-span-1">
              <label className="block text-xs font-semibold text-gray-600 mb-2">
                Tìm kiếm
              </label>
              <Input
                placeholder="Địa điểm..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                size="middle"
              />
            </div>
            <div className="md:col-span-1">
              <label className="block text-xs font-semibold text-gray-600 mb-2">
                Tài xế
              </label>
              <Input
                placeholder="Tên tài xế..."
                value={driverFilter}
                onChange={(e) => setDriverFilter(e.target.value)}
                size="middle"
              />
            </div>
            <div className="md:col-span-1">
              <label className="block text-xs font-semibold text-gray-600 mb-2">
                Trạng thái
              </label>
              <Select
                value={statusFilter}
                onChange={setStatusFilter}
                className="w-full"
              >
                <Option value="all">Tất cả</Option>
                <Option value="completed">Hoàn thành</Option>
                <Option value="in_progress">Đang đi</Option>
                <Option value="cancelled">Đã hủy</Option>
                <Option value="finding">Đang tìm</Option>
              </Select>
            </div>
            <div className="md:col-span-1">
              <label className="block text-xs font-semibold text-gray-600 mb-2">
                Ngày
              </label>
              <RangePicker
                onChange={setDateRange}
                format="DD/MM/YYYY"
                size="middle"
                className="w-full"
                style={{ width: "100%" }}
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={() => {
                  setSearchText("");
                  setDriverFilter("");
                  setStatusFilter("all");
                  setDateRange(null);
                }}
                className="w-full"
              >
                Reset
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Trips List */}
      <Spin spinning={loading} tip="Đang tải...">
        {filteredTrips.length > 0 ? (
          <div>
            {filteredTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        ) : (
          <Empty description="Không có chuyến đi nào" />
        )}
      </Spin>
    </div>
  );
}
