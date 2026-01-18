"use client";

import { useEffect, useState } from "react";
import { Card, Empty, Tag, Pagination, Select, DatePicker, Button, Spin, message } from "antd";
import {
  Calendar,
  MapPin,
  Navigation,
  DollarSign,
  Star,
  User,
  Phone,
  Filter,
  RefreshCw,
} from "lucide-react";
import { getRideHistory } from "../../services/driverService";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

const { RangePicker } = DatePicker;
const { Option } = Select;

// Status color mapping
const STATUS_COLORS = {
  Completed: "green",
  Cancelled: "red",
  InProgress: "blue",
  Pending: "orange",
};

const STATUS_LABELS = {
  Completed: "Hoàn thành",
  Cancelled: "Đã hủy",
  InProgress: "Đang thực hiện",
  Pending: "Chờ xử lý",
};

// Driver history page
export default function DriverHistoryPage() {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
  });

  // Filters
  const [filters, setFilters] = useState({
    status: undefined,
    dateRange: null,
  });

  useEffect(() => {
    fetchHistory();
  }, [pagination.page, pagination.pageSize, filters]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const params = {
        Page: pagination.page,
        PageSize: pagination.pageSize,
      };

      // Add status filter
      if (filters.status) {
        params.Status = filters.status;
      }

      // Add date range filter
      if (filters.dateRange && filters.dateRange.length === 2) {
        params.FromDate = filters.dateRange[0].toISOString();
        params.ToDate = filters.dateRange[1].toISOString();
      }

      const response = await getRideHistory(params);

      if (response.success) {
        setRides(response.data.items || []);
        setPagination(prev => ({
          ...prev,
          totalItems: response.data.totalItems || 0,
          totalPages: response.data.totalPages || 0,
        }));
      }
    } catch (error) {
      console.error("Error fetching history:", error);
      message.error("Không thể tải lịch sử chuyến xe");
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page, pageSize) => {
    setPagination(prev => ({ ...prev, page, pageSize }));
  };

  const handleStatusChange = (value) => {
    setFilters(prev => ({ ...prev, status: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const handleDateRangeChange = (dates) => {
    setFilters(prev => ({ ...prev, dateRange: dates }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const handleResetFilters = () => {
    setFilters({
      status: undefined,
      dateRange: null,
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  if (loading && rides.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <Spin size="large" tip="Đang tải lịch sử..." />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-foreground">
          Lịch sử chuyến xe
        </h2>
        <Button
          icon={<RefreshCw className="w-4 h-4" />}
          onClick={fetchHistory}
          loading={loading}
        >
          Làm mới
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Lọc:</span>
          </div>

          <Select
            placeholder="Trạng thái"
            style={{ width: 150 }}
            value={filters.status}
            onChange={handleStatusChange}
            allowClear
          >
            <Option value="Completed">Hoàn thành</Option>
            <Option value="Cancelled">Đã hủy</Option>
            <Option value="InProgress">Đang thực hiện</Option>
            <Option value="Pending">Chờ xử lý</Option>
          </Select>

          <RangePicker
            placeholder={["Từ ngày", "Đến ngày"]}
            value={filters.dateRange}
            onChange={handleDateRangeChange}
            format="DD/MM/YYYY"
            locale={vi}
          />

          {(filters.status || filters.dateRange) && (
            <Button onClick={handleResetFilters} type="link">
              Xóa bộ lọc
            </Button>
          )}
        </div>
      </Card>

      {/* Results summary */}
      <div className="mb-4 text-sm text-muted-foreground">
        Tổng số: <span className="font-semibold">{pagination.totalItems}</span> chuyến xe
      </div>

      {/* Rides list */}
      {rides.length === 0 ? (
        <Card>
          <Empty description="Chưa có chuyến đi nào" />
        </Card>
      ) : (
        <>
          <div className="space-y-4 mb-6">
            {rides.map((ride) => (
              <Card key={ride.id} className="hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(ride.requestedAt), "dd/MM/yyyy HH:mm", {
                        locale: vi,
                      })}
                    </span>
                    {ride.completedAt && (
                      <span className="text-xs text-muted-foreground">
                        → {format(new Date(ride.completedAt), "HH:mm", { locale: vi })}
                      </span>
                    )}
                  </div>
                  <Tag color={STATUS_COLORS[ride.status] || "default"}>
                    {STATUS_LABELS[ride.status] || ride.status}
                  </Tag>
                </div>

                {/* Customer info */}
                {ride.user && (
                  <div className="mb-4 p-3 bg-accent rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">
                        Khách hàng: {ride.user.fullName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {ride.user.phoneNumber}
                      </span>
                    </div>
                  </div>
                )}

                {/* Locations */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Điểm đón</p>
                      <p className="text-sm text-foreground font-medium">
                        {ride.pickupAddress}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Navigation className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Điểm đến</p>
                      <p className="text-sm text-foreground font-medium">
                        {ride.destinationAddress}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Price and rating */}
                <div className="flex justify-between items-center pt-4 border-t border-border">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4 text-primary" />
                      <span className="font-semibold text-primary">
                        {(ride.finalPrice || 0).toLocaleString()}đ
                      </span>
                    </div>
                    {ride.distance > 0 && (
                      <span className="text-sm text-muted-foreground">
                        {ride.distance.toFixed(1)} km
                      </span>
                    )}
                  </div>
                  {ride.rating && (
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${i < ride.rating.rating
                                ? "text-yellow-400 fill-yellow-400"
                                : "text-gray-300"
                              }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {ride.rating.rating}/5
                      </span>
                    </div>
                  )}
                </div>

                {/* Customer comment */}
                {ride.rating?.comment && (
                  <div className="mt-4 p-3 bg-secondary/50 rounded-lg border-l-2 border-primary">
                    <p className="text-xs font-semibold text-muted-foreground mb-1">
                      Nhận xét từ khách:
                    </p>
                    <p className="text-sm text-foreground italic">
                      "{ride.rating.comment}"
                    </p>
                  </div>
                )}
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center">
              <Pagination
                current={pagination.page}
                pageSize={pagination.pageSize}
                total={pagination.totalItems}
                onChange={handlePageChange}
                showSizeChanger
                showTotal={(total) => `Tổng số ${total} chuyến`}
                pageSizeOptions={[10, 20, 50]}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}