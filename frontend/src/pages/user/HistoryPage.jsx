"use client";

import { useEffect, useState } from "react";
import { Card, Empty, Modal, Input, message, Tag, Button, Pagination, Select, DatePicker, Spin } from "antd";
import {
  Calendar,
  MapPin,
  Navigation,
  DollarSign,
  Star,
  User,
  Phone,
  Car,
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { getRideHistory } from "../../services/userService";

const { TextArea } = Input;
const { RangePicker } = DatePicker;

export default function HistoryPage() {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filters
  const [statusFilter, setStatusFilter] = useState("");
  const [dateRange, setDateRange] = useState(null);

  // Rating modal
  const [ratingModal, setRatingModal] = useState(false);
  const [selectedRide, setSelectedRide] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  useEffect(() => {
    fetchRideHistory();
  }, [currentPage, pageSize, statusFilter, dateRange]);

  const fetchRideHistory = async () => {
    setLoading(true);
    try {
      const params = {
        Page: currentPage,
        PageSize: pageSize,
      };

      if (statusFilter) {
        params.Status = statusFilter;
      }

      if (dateRange && dateRange[0] && dateRange[1]) {
        params.FromDate = dateRange[0].toISOString();
        params.ToDate = dateRange[1].toISOString();
      }

      const response = await getRideHistory(params);

      if (response.success) {
        setRides(response.data.items);
        setTotalItems(response.data.totalItems);
      } else {
        message.error(response.message || "Không thể tải lịch sử chuyến đi");
      }
    } catch (error) {
      console.error("Error fetching ride history:", error);
      message.error(error.response?.data?.error || "Không thể tải lịch sử chuyến đi");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRating = (ride) => {
    setSelectedRide(ride);
    setRating(ride.rating?.rating || 0);
    setComment(ride.rating?.comment || "");
    setRatingModal(true);
  };

  const handleSubmitRating = async () => {
    if (rating === 0) {
      message.warning("Vui lòng chọn số sao đánh giá");
      return;
    }

    try {
      // TODO: Call rating API
      // await rateRide(selectedRide.id, { rating, comment });

      message.success("Đánh giá thành công!");
      setRatingModal(false);
      fetchRideHistory(); // Refresh list
    } catch (error) {
      console.error("Error submitting rating:", error);
      message.error("Đánh giá thất bại");
    }
  };

  const handleReset = () => {
    setStatusFilter("");
    setDateRange(null);
    setCurrentPage(1);
  };

  const getStatusColor = (status) => {
    const colors = {
      Completed: "green",
      Cancelled: "red",
      InProgress: "blue",
      Pending: "orange",
    };
    return colors[status] || "default";
  };

  const getStatusText = (status) => {
    const texts = {
      Completed: "Hoàn thành",
      Cancelled: "Đã hủy",
      InProgress: "Đang đi",
      Pending: "Chờ xử lý",
    };
    return texts[status] || status;
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-foreground mb-6">
        Lịch sử chuyến đi
      </h2>

      {/* Filters */}
      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Trạng thái</label>
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              className="w-full"
              placeholder="Tất cả"
            >
              <Select.Option value="">Tất cả</Select.Option>
              <Select.Option value="Completed">Hoàn thành</Select.Option>
              <Select.Option value="Cancelled">Đã hủy</Select.Option>
              <Select.Option value="InProgress">Đang đi</Select.Option>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Khoảng thời gian</label>
            <RangePicker
              value={dateRange}
              onChange={setDateRange}
              format="DD/MM/YYYY"
              className="w-full"
            />
          </div>

          <div className="flex items-end">
            <Button onClick={handleReset} className="w-full">
              Reset
            </Button>
          </div>
        </div>
      </Card>

      {/* Rides List */}
      <Spin spinning={loading}>
        {rides.length === 0 ? (
          <Card>
            <Empty description="Bạn chưa có chuyến đi nào" />
          </Card>
        ) : (
          <div className="space-y-4">
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
                  </div>
                  <Tag color={getStatusColor(ride.status)}>
                    {getStatusText(ride.status)}
                  </Tag>
                </div>

                {/* Driver Info */}
                {ride.driver && (
                  <div className="mb-4 p-3 bg-accent rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        Tài xế: {ride.driver.fullName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {ride.driver.phoneNumber}
                      </span>
                    </div>
                    {ride.driver.vehicle && (
                      <div className="flex items-center gap-2">
                        <Car className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {ride.driver.vehicle.vehicleBrand} {ride.driver.vehicle.vehicleModel} - {ride.driver.vehicle.vehicleColor} - {ride.driver.vehicle.licensePlate}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Route */}
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

                {/* Price and Actions */}
                <div className="flex justify-between items-center pt-4 border-t border-border">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4 text-primary" />
                      <span className="font-semibold text-foreground">
                        {ride.finalPrice?.toLocaleString()}đ
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {ride.distance?.toFixed(1)} km
                    </span>
                  </div>

                  {ride.status === "Completed" && (
                    <div className="flex items-center gap-2">
                      {ride.rating ? (
                        <div className="flex items-center gap-1">
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
                      ) : (
                        <Button
                          size="small"
                          onClick={() => handleOpenRating(ride)}
                        >
                          <Star className="w-4 h-4 mr-1" />
                          Đánh giá
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                {/* Comment */}
                {ride.rating?.comment && (
                  <div className="mt-4 p-3 bg-secondary/50 rounded-lg border-l-2 border-primary">
                    <p className="text-xs font-semibold text-muted-foreground mb-1">
                      Nhận xét của bạn:
                    </p>
                    <p className="text-sm text-foreground italic">
                      "{ride.rating.comment}"
                    </p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </Spin>

      {/* Pagination */}
      {!loading && totalItems > 0 && (
        <div className="mt-6 flex justify-end">
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
      )}

      {/* Rating Modal */}
      <Modal
        title="Đánh giá tài xế"
        open={ratingModal}
        onOk={handleSubmitRating}
        onCancel={() => setRatingModal(false)}
        okText="Gửi đánh giá"
        cancelText="Hủy"
      >
        <div className="py-4">
          <div className="mb-4 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Bạn đánh giá tài xế như thế nào?
            </p>
            <div className="flex justify-center gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  onClick={() => setRating(value)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-10 h-10 ${value <= rating
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-300"
                      }`}
                  />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Nhận xét
            </label>
            <TextArea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Chia sẻ trải nghiệm về tài xế..."
              rows={4}
              maxLength={200}
              showCount
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}