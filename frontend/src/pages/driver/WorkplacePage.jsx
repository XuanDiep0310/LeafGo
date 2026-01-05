"use client";

import { useState } from "react";
import { useSelector } from "react-redux";
import { Card, Switch, message, Modal, Tag, List, Button } from "antd";
import {
  Power,
  Bell,
  MapPin,
  Navigation,
  DollarSign,
  Phone,
  User,
  Clock,
} from "lucide-react";
import { mockApi } from "../../services/mockData";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

// Implements FR-12, FR-13, FR-14
export default function WorkplacePage() {
  const { user } = useSelector((state) => state.auth);
  const [isOnline, setIsOnline] = useState(false);
  const [currentTrip, setCurrentTrip] = useState(null);
  const [pendingTrips, setPendingTrips] = useState([]);
  const [showIncomingModal, setShowIncomingModal] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);

  const handleToggleOnline = async (checked) => {
    try {
      await mockApi.updateDriverStatus(user.id, checked ? "online" : "offline");
      setIsOnline(checked);
      message.success(
        checked ? "Bạn đã online, sẵn sàng nhận chuyến!" : "Bạn đã offline"
      );

      if (checked) {
        setTimeout(() => {
          simulateIncomingTrip();
        }, 5000);
      }
    } catch (error) {
      message.error("Có lỗi xảy ra");
    }
  };

  const simulateIncomingTrip = () => {
    const mockTrips = [
      {
        id: `trip_${Date.now()}_1`,
        createdAt: new Date().toISOString(), // Add timestamp
        pickupLocation: {
          address: "Số 1 Đại Cồ Việt, Hai Bà Trưng, Hà Nội",
          lat: 21.0069,
          lng: 105.8433,
        },
        dropoffLocation: {
          address: "Số 54 Triều Khúc, Thanh Xuân, Hà Nội",
          lat: 20.9948,
          lng: 105.8096,
        },
        distance: 8.5,
        price: 42500,
        customerName: "Nguyễn Văn A",
        customerPhone: "0123456789",
      },
      {
        id: `trip_${Date.now()}_2`,
        createdAt: new Date().toISOString(), // Add timestamp
        pickupLocation: {
          address: "Hồ Hoàn Kiếm, Hà Nội",
          lat: 21.0285,
          lng: 105.8542,
        },
        dropoffLocation: {
          address: "Sân bay Nội Bài, Hà Nội",
          lat: 21.2187,
          lng: 105.8067,
        },
        distance: 25.3,
        price: 135000,
        customerName: "Trần Thị B",
        customerPhone: "0987654321",
      },
    ];
    setPendingTrips(mockTrips);
    message.info(`Có ${mockTrips.length} yêu cầu đặt xe mới`);
  };

  const handleAcceptTrip = (trip) => {
    setCurrentTrip({ ...trip, status: "accepted" });
    setPendingTrips(pendingTrips.filter((t) => t.id !== trip.id));
    setShowIncomingModal(false);
    setSelectedTrip(null);
    message.success("Đã nhận chuyến!");
  };

  const handleViewTrip = (trip) => {
    setSelectedTrip(trip);
    setShowIncomingModal(true);
  };

  const handleRejectTrip = () => {
    if (selectedTrip) {
      setPendingTrips(pendingTrips.filter((t) => t.id !== selectedTrip.id));
      message.info("Đã từ chối chuyến");
    }
    setShowIncomingModal(false);
    setSelectedTrip(null);
  };

  const handleUpdateStatus = (status) => {
    setCurrentTrip({ ...currentTrip, status });
    const statusMessages = {
      arriving: "Đang đến điểm đón",
      arrived: "Đã đến điểm đón",
      in_progress: "Đang di chuyển",
      completed: "Hoàn thành chuyến đi",
    };
    message.success(statusMessages[status]);

    if (status === "completed") {
      setTimeout(() => {
        setCurrentTrip(null);
        if (isOnline) {
          setTimeout(() => {
            simulateIncomingTrip();
          }, 5000);
        }
      }, 2000);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* FR-12: Online/Offline Toggle */}
      <Card className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center ${isOnline ? "bg-primary/10" : "bg-muted"
                }`}
            >
              <Power
                className={`w-6 h-6 ${isOnline ? "text-primary" : "text-muted-foreground"
                  }`}
              />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Trạng thái</h3>
              <p className="text-sm text-muted-foreground">
                {isOnline ? "Đang online" : "Offline"}
              </p>
            </div>
          </div>
          <Switch
            checked={isOnline}
            onChange={handleToggleOnline}
            size="large"
          />
        </div>
      </Card>

      {!currentTrip && isOnline && pendingTrips.length > 0 && (
        <Card className="mb-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Yêu cầu đặt xe ({pendingTrips.length})
          </h3>
          <List
            dataSource={pendingTrips}
            renderItem={(trip) => (
              <List.Item
                className="hover:bg-accent/50 cursor-pointer rounded-lg p-4 transition-colors"
                onClick={() => handleViewTrip(trip)}
              >
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium text-foreground">
                        {trip.customerName}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(trip.createdAt), "HH:mm", {
                        locale: vi,
                      })}
                    </span>
                  </div>
                  <div className="flex items-start gap-2 mb-1">
                    <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">
                      {trip.pickupLocation.address}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Navigation className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">
                      {trip.dropoffLocation.address}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-sm text-muted-foreground">
                      {trip.distance} km
                    </span>
                    <span className="text-lg font-bold text-primary">
                      {trip.price.toLocaleString()}đ
                    </span>
                  </div>
                </div>
              </List.Item>
            )}
          />
        </Card>
      )}

      {/* Current Trip Info */}
      {currentTrip ? (
        <Card className="mb-6">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-foreground">
                Chuyến đi hiện tại
              </h3>
              <Tag color="blue">{getStatusText(currentTrip.status)}</Tag>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-foreground">
                {currentTrip.customerName}
              </span>
              <span className="text-muted-foreground">•</span>
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span className="text-foreground">
                {currentTrip.customerPhone}
              </span>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Điểm đón</p>
                <p className="text-sm text-foreground font-medium">
                  {currentTrip.pickupLocation.address}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Navigation className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Điểm đến</p>
                <p className="text-sm text-foreground font-medium">
                  {currentTrip.dropoffLocation.address}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 pt-2">
              <div className="flex items-center gap-1">
                <DollarSign className="w-4 h-4 text-primary" />
                <span className="font-semibold text-foreground">
                  {currentTrip.price.toLocaleString()}đ
                </span>
              </div>
              <span className="text-sm text-muted-foreground">
                {currentTrip.distance} km
              </span>
            </div>
          </div>

          {/* FR-14: Trip progress buttons */}
          <div className="flex gap-2">
            {currentTrip.status === "accepted" && (
              <Button
                onClick={() => handleUpdateStatus("arriving")}
                className="flex-1"
              >
                Đang đến
              </Button>
            )}
            {currentTrip.status === "arriving" && (
              <Button
                onClick={() => handleUpdateStatus("arrived")}
                className="flex-1"
              >
                Đã đến điểm đón
              </Button>
            )}
            {currentTrip.status === "arrived" && (
              <Button
                onClick={() => handleUpdateStatus("in_progress")}
                className="flex-1"
              >
                Bắt đầu chuyến đi
              </Button>
            )}
            {currentTrip.status === "in_progress" && (
              <Button
                onClick={() => handleUpdateStatus("completed")}
                className="flex-1"
              >
                Hoàn thành
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <Card>
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
              <Bell className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">
              {isOnline
                ? pendingTrips.length > 0
                  ? "Chọn chuyến để nhận"
                  : "Đang chờ chuyến mới"
                : "Bạn đang offline"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {isOnline
                ? pendingTrips.length > 0
                  ? "Nhấn vào chuyến để xem chi tiết và nhận"
                  : "Hệ thống sẽ tự động thông báo khi có chuyến mới"
                : "Bật trạng thái online để nhận chuyến"}
            </p>
          </div>
        </Card>
      )}

      {/* FR-13: Trip Details Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            <span>Chi tiết yêu cầu</span>
          </div>
        }
        open={showIncomingModal}
        closable={false}
        footer={[
          <Button key="reject" variant="outline" onClick={handleRejectTrip}>
            Từ chối
          </Button>,
          <Button key="accept" onClick={() => handleAcceptTrip(selectedTrip)}>
            Nhận chuyến
          </Button>,
        ]}
      >
        {selectedTrip && (
          <div className="py-4">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium text-foreground">
                {selectedTrip.customerName}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {selectedTrip.customerPhone}
              </span>
            </div>
            {selectedTrip.createdAt && (
              <div className="flex items-center gap-2 mt-1">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {format(new Date(selectedTrip.createdAt), "HH:mm:ss", {
                    locale: vi,
                  })}
                </span>
              </div>
            )}
            <div className="space-y-3 mb-4 mt-4">
              <div className="flex items-start gap-2">
                <MapPin className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Điểm đón</p>
                  <p className="text-sm text-foreground font-medium">
                    {selectedTrip.pickupLocation.address}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Navigation className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Điểm đến</p>
                  <p className="text-sm text-foreground font-medium">
                    {selectedTrip.dropoffLocation.address}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-accent rounded-lg">
              <div>
                <p className="text-xs text-muted-foreground">Khoảng cách</p>
                <p className="text-sm font-semibold text-foreground">
                  {selectedTrip.distance} km
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Thu nhập</p>
                <p className="text-xl font-bold text-primary">
                  {selectedTrip.price.toLocaleString()}đ
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function getStatusText(status) {
  const texts = {
    accepted: "Đã nhận",
    arriving: "Đang đến",
    arrived: "Đã đến",
    in_progress: "Đang đi",
    completed: "Hoàn thành",
  };
  return texts[status] || status;
}
