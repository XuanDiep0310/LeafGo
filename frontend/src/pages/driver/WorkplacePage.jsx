"use client";

import { useState, useEffect, useRef } from "react";
import { Card, Switch, message, Modal, Tag, List, Button, Spin } from "antd";
import {
  Power,
  Bell,
  MapPin,
  Navigation,
  DollarSign,
  Phone,
  User,
  Clock,
  AlertCircle,
  Car,
} from "lucide-react";
import {
  toggleDriverOnline,
  updateDriverLocation,
  getPendingRides,
  acceptRide,
  getCurrentRide,
  updateRideStatus,
  getDriverVehicle,
} from "../../services/driverService";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import VehicleConfigModal from "../../components/VehicleConfigModal";

// Status mapping for API
const RIDE_STATUS = {
  PENDING: "Pending",
  ACCEPTED: "Accepted",
  ARRIVING: "Arriving",
  ARRIVED: "Arrived",
  IN_PROGRESS: "InProgress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const STATUS_LABELS = {
  [RIDE_STATUS.PENDING]: "Chờ nhận",
  [RIDE_STATUS.ACCEPTED]: "Đã nhận",
  [RIDE_STATUS.ARRIVING]: "Đang đến",
  [RIDE_STATUS.ARRIVED]: "Đã đến điểm đón",
  [RIDE_STATUS.IN_PROGRESS]: "Đang di chuyển",
  [RIDE_STATUS.COMPLETED]: "Hoàn thành",
  [RIDE_STATUS.CANCELLED]: "Đã hủy",
};

// Implements FR-12, FR-13, FR-14
export default function WorkplacePage() {
  const [isOnline, setIsOnline] = useState(false);
  const [currentRide, setCurrentRide] = useState(null);
  const [pendingRides, setPendingRides] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [showRideModal, setShowRideModal] = useState(false);
  const [selectedRide, setSelectedRide] = useState(null);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [hasVehicle, setHasVehicle] = useState(false);
  const [loading, setLoading] = useState({
    toggle: false,
    accept: false,
    status: false,
  });

  // Refs for intervals
  const locationIntervalRef = useRef(null);
  const ridesIntervalRef = useRef(null);

  // Get current location on mount
  useEffect(() => {
    getCurrentLocation();
    checkVehicleConfig();
    return () => {
      // Cleanup intervals on unmount
      if (locationIntervalRef.current) clearInterval(locationIntervalRef.current);
      if (ridesIntervalRef.current) clearInterval(ridesIntervalRef.current);
    };
  }, []);

  // Setup polling when online
  useEffect(() => {
    if (isOnline) {
      // Fetch current ride immediately
      fetchCurrentRide();

      // Poll for pending rides every 10 seconds if no current ride
      ridesIntervalRef.current = setInterval(() => {
        if (!currentRide) {
          fetchPendingRides();
        }
      }, 10000);

      // Update location every 30 seconds
      locationIntervalRef.current = setInterval(() => {
        updateLocation();
      }, 30000);

      // Initial fetch
      if (!currentRide) {
        fetchPendingRides();
      }
    } else {
      // Clear intervals when offline
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
        locationIntervalRef.current = null;
      }
      if (ridesIntervalRef.current) {
        clearInterval(ridesIntervalRef.current);
        ridesIntervalRef.current = null;
      }
      setPendingRides([]);
    }

    return () => {
      if (locationIntervalRef.current) clearInterval(locationIntervalRef.current);
      if (ridesIntervalRef.current) clearInterval(ridesIntervalRef.current);
    };
  }, [isOnline, currentRide]);

  // Get current GPS location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Location error:", error);
          message.warning("Không thể lấy vị trí. Vui lòng bật GPS.");
        },
        { enableHighAccuracy: true }
      );
    }
  };

  // Check if vehicle is configured
  const checkVehicleConfig = async () => {
    try {
      const response = await getDriverVehicle();
      if (response.success && response.data) {
        setHasVehicle(true);
      } else {
        setHasVehicle(false);
      }
    } catch (error) {
      setHasVehicle(false);
    }
  };

  // Update location on server
  const updateLocation = async () => {
    if (!currentLocation) {
      getCurrentLocation();
      return;
    }

    try {
      await updateDriverLocation(
        currentLocation.latitude,
        currentLocation.longitude
      );
    } catch (error) {
      console.error("Error updating location:", error);
    }
  };

  // FR-12: Toggle online/offline status
  const handleToggleOnline = async (checked) => {
    // Check if vehicle is configured before going online
    if (checked && !hasVehicle) {
      message.warning("Vui lòng cập nhật thông tin xe trước khi nhận chuyến");
      setShowVehicleModal(true);
      return;
    }

    setLoading((prev) => ({ ...prev, toggle: true }));

    try {
      const response = await toggleDriverOnline(checked);

      if (response.success) {
        setIsOnline(response.data.isOnline);
        message.success(
          response.data.message ||
          (checked
            ? "Bạn đã online, sẵn sàng nhận chuyến!"
            : "Bạn đã offline")
        );

        // Update location immediately when going online
        if (checked && currentLocation) {
          await updateDriverLocation(
            currentLocation.latitude,
            currentLocation.longitude
          );
        }
      }
    } catch (error) {
      console.error("Toggle online error:", error);
      message.error(
        error.response?.data?.error || "Không thể thay đổi trạng thái"
      );
    } finally {
      setLoading((prev) => ({ ...prev, toggle: false }));
    }
  };

  // Fetch current active ride
  const fetchCurrentRide = async () => {
    try {
      const response = await getCurrentRide();
      if (response.success && response.data) {
        setCurrentRide(response.data);
      } else {
        setCurrentRide(null);
      }
    } catch (error) {
      // No current ride or error - that's okay
      setCurrentRide(null);
    }
  };

  // FR-13: Fetch pending rides near driver
  const fetchPendingRides = async () => {
    if (!currentLocation) return;

    try {
      const response = await getPendingRides(
        currentLocation.latitude,
        currentLocation.longitude,
        5 // 5km radius
      );

      if (response.success && response.data) {
        const rides = response.data;
        setPendingRides(rides);

        // Show notification if there are new rides
        if (rides.length > 0 && pendingRides.length === 0) {
          message.info({
            content: `Có ${rides.length} yêu cầu đặt xe mới`,
            icon: <Bell className="w-4 h-4" />,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching pending rides:", error);
    }
  };

  // View ride details
  const handleViewRide = (ride) => {
    setSelectedRide(ride);
    setShowRideModal(true);
  };

  // FR-13: Accept a ride
  const handleAcceptRide = async () => {
    if (!selectedRide) return;

    setLoading((prev) => ({ ...prev, accept: true }));

    try {
      const response = await acceptRide(selectedRide.id, selectedRide.version);

      if (response.success) {
        setCurrentRide(response.data);
        setPendingRides([]);
        setShowRideModal(false);
        setSelectedRide(null);
        message.success("Đã nhận chuyến thành công!");
      }
    } catch (error) {
      console.error("Accept ride error:", error);
      const errorMsg = error.response?.data?.error;

      if (error.response?.status === 409) {
        message.error("Chuyến xe đã được tài xế khác nhận!");
        // Refresh pending rides
        fetchPendingRides();
      } else if (error.response?.status === 404) {
        message.error("Chuyến xe không còn tồn tại!");
        fetchPendingRides();
      } else {
        message.error(errorMsg || "Không thể nhận chuyến");
      }
    } finally {
      setLoading((prev) => ({ ...prev, accept: false }));
    }
  };

  // Reject ride
  const handleRejectRide = () => {
    setShowRideModal(false);
    setSelectedRide(null);
    message.info("Đã từ chối chuyến");
  };

  // FR-14: Update ride status
  const handleUpdateStatus = async (newStatus) => {
    if (!currentRide) return;

    setLoading((prev) => ({ ...prev, status: true }));

    try {
      let finalPrice = undefined;

      // If completing, use the estimated price as final price
      if (newStatus === RIDE_STATUS.COMPLETED) {
        finalPrice = currentRide.estimatedPrice;
      }

      const response = await updateRideStatus(
        currentRide.id,
        newStatus,
        finalPrice
      );

      if (response.success) {
        const statusMessages = {
          [RIDE_STATUS.ARRIVING]: "Đang đến điểm đón",
          [RIDE_STATUS.ARRIVED]: "Đã đến điểm đón",
          [RIDE_STATUS.IN_PROGRESS]: "Đã bắt đầu chuyến đi",
          [RIDE_STATUS.COMPLETED]: "Hoàn thành chuyến đi",
        };

        message.success(statusMessages[newStatus] || "Đã cập nhật trạng thái");

        // If completed, clear current ride and check for new rides
        if (newStatus === RIDE_STATUS.COMPLETED) {
          setTimeout(() => {
            setCurrentRide(null);
            if (isOnline) {
              fetchPendingRides();
            }
          }, 1500);
        } else {
          // Update current ride status locally
          setCurrentRide((prev) => ({ ...prev, status: newStatus }));
        }
      }
    } catch (error) {
      console.error("Update status error:", error);
      message.error(
        error.response?.data?.error || "Không thể cập nhật trạng thái"
      );
    } finally {
      setLoading((prev) => ({ ...prev, status: false }));
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
            loading={loading.toggle}
            size="large"
          />
        </div>

        {/* Vehicle warning */}
        {!hasVehicle && (
          <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-start gap-2">
              <Car className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-orange-800 mb-2">
                  Vui lòng cấu hình thông tin xe để bắt đầu nhận chuyến
                </p>
                <Button
                  size="small"
                  onClick={() => setShowVehicleModal(true)}
                  icon={<Car className="w-4 h-4" />}
                >
                  Cập nhật thông tin xe
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Location warning */}
        {isOnline && !currentLocation && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-yellow-800">
              Không thể lấy vị trí. Vui lòng bật GPS để nhận chuyến.
            </p>
          </div>
        )}
      </Card>

      {/* Pending Rides List */}
      {!currentRide && isOnline && pendingRides.length > 0 && (
        <Card className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">
              Yêu cầu đặt xe ({pendingRides.length})
            </h3>
            <Button
              size="small"
              onClick={fetchPendingRides}
              icon={<Bell className="w-4 h-4" />}
            >
              Làm mới
            </Button>
          </div>
          <List
            dataSource={pendingRides}
            renderItem={(ride) => (
              <List.Item
                className="hover:bg-accent/50 cursor-pointer rounded-lg p-4 transition-colors"
                onClick={() => handleViewRide(ride)}
              >
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium text-foreground">
                        {ride.user?.fullName || "Khách hàng"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {ride.distanceFromDriver && (
                        <span className="text-xs text-muted-foreground">
                          {ride.distanceFromDriver.toFixed(1)} km từ bạn
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(ride.requestedAt), "HH:mm", {
                          locale: vi,
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 mb-1">
                    <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">
                      {ride.pickupAddress}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Navigation className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">
                      {ride.destinationAddress}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-sm text-muted-foreground">
                      {ride.distance?.toFixed(1)} km
                    </span>
                    <span className="text-lg font-bold text-primary">
                      {ride.estimatedPrice?.toLocaleString()}đ
                    </span>
                  </div>
                </div>
              </List.Item>
            )}
          />
        </Card>
      )}

      {/* Current Ride Info */}
      {currentRide ? (
        <Card className="mb-6">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-foreground">
                Chuyến đi hiện tại
              </h3>
              <Tag color="blue">{STATUS_LABELS[currentRide.status]}</Tag>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            {currentRide.user && (
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-foreground">
                  {currentRide.user.fullName}
                </span>
                <span className="text-muted-foreground">•</span>
                <Phone className="w-4 h-4 text-muted-foreground" />
                <a
                  href={`tel:${currentRide.user.phoneNumber}`}
                  className="text-primary hover:underline"
                >
                  {currentRide.user.phoneNumber}
                </a>
              </div>
            )}
            <div className="flex items-start gap-2">
              <MapPin className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Điểm đón</p>
                <p className="text-sm text-foreground font-medium">
                  {currentRide.pickupAddress}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Navigation className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Điểm đến</p>
                <p className="text-sm text-foreground font-medium">
                  {currentRide.destinationAddress}
                </p>
              </div>
            </div>
            {currentRide.notes && (
              <div className="p-3 bg-accent rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Ghi chú:</p>
                <p className="text-sm text-foreground">{currentRide.notes}</p>
              </div>
            )}
            <div className="flex items-center gap-4 pt-2">
              <div className="flex items-center gap-1">
                <DollarSign className="w-4 h-4 text-primary" />
                <span className="font-semibold text-foreground">
                  {currentRide.estimatedPrice?.toLocaleString()}đ
                </span>
              </div>
              <span className="text-sm text-muted-foreground">
                {currentRide.distance?.toFixed(1)} km
              </span>
              {currentRide.estimatedDuration && (
                <span className="text-sm text-muted-foreground">
                  ~{Math.round(currentRide.estimatedDuration)} phút
                </span>
              )}
            </div>
          </div>

          {/* FR-14: Trip progress buttons */}
          <div className="flex gap-2">
            {currentRide.status === RIDE_STATUS.ACCEPTED && (
              <Button
                onClick={() => handleUpdateStatus(RIDE_STATUS.ARRIVING)}
                loading={loading.status}
                className="flex-1"
                type="primary"
              >
                Đang đến điểm đón
              </Button>
            )}
            {currentRide.status === RIDE_STATUS.ARRIVING && (
              <Button
                onClick={() => handleUpdateStatus(RIDE_STATUS.ARRIVED)}
                loading={loading.status}
                className="flex-1"
                type="primary"
              >
                Đã đến điểm đón
              </Button>
            )}
            {currentRide.status === RIDE_STATUS.ARRIVED && (
              <Button
                onClick={() => handleUpdateStatus(RIDE_STATUS.IN_PROGRESS)}
                loading={loading.status}
                className="flex-1"
                type="primary"
              >
                Bắt đầu chuyến đi
              </Button>
            )}
            {currentRide.status === RIDE_STATUS.IN_PROGRESS && (
              <Button
                onClick={() => handleUpdateStatus(RIDE_STATUS.COMPLETED)}
                loading={loading.status}
                className="flex-1"
                type="primary"
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
                ? pendingRides.length > 0
                  ? "Chọn chuyến để nhận"
                  : "Đang chờ chuyến mới"
                : "Bạn đang offline"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {isOnline
                ? pendingRides.length > 0
                  ? "Nhấn vào chuyến để xem chi tiết và nhận"
                  : "Hệ thống sẽ tự động thông báo khi có chuyến mới"
                : "Bật trạng thái online để nhận chuyến"}
            </p>
          </div>
        </Card>
      )}

      {/* FR-13: Ride Details Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            <span>Chi tiết yêu cầu</span>
          </div>
        }
        open={showRideModal}
        onCancel={() => !loading.accept && handleRejectRide()}
        footer={[
          <Button
            key="reject"
            onClick={handleRejectRide}
            disabled={loading.accept}
          >
            Từ chối
          </Button>,
          <Button
            key="accept"
            type="primary"
            onClick={handleAcceptRide}
            loading={loading.accept}
          >
            Nhận chuyến
          </Button>,
        ]}
      >
        {selectedRide && (
          <div className="py-4">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium text-foreground">
                {selectedRide.user?.fullName || "Khách hàng"}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {selectedRide.user?.phoneNumber || "N/A"}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Yêu cầu lúc:{" "}
                {format(new Date(selectedRide.requestedAt), "HH:mm:ss", {
                  locale: vi,
                })}
              </span>
            </div>
            <div className="space-y-3 mb-4 mt-4">
              <div className="flex items-start gap-2">
                <MapPin className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Điểm đón</p>
                  <p className="text-sm text-foreground font-medium">
                    {selectedRide.pickupAddress}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Navigation className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Điểm đến</p>
                  <p className="text-sm text-foreground font-medium">
                    {selectedRide.destinationAddress}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-accent rounded-lg">
              <div>
                <p className="text-xs text-muted-foreground">Khoảng cách</p>
                <p className="text-sm font-semibold text-foreground">
                  {selectedRide.distance?.toFixed(1)} km
                </p>
                {selectedRide.distanceFromDriver && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedRide.distanceFromDriver.toFixed(1)} km từ bạn
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Thu nhập</p>
                <p className="text-xl font-bold text-primary">
                  {selectedRide.estimatedPrice?.toLocaleString()}đ
                </p>
                {selectedRide.estimatedDuration && (
                  <p className="text-xs text-muted-foreground mt-1">
                    ~{Math.round(selectedRide.estimatedDuration)} phút
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Vehicle Configuration Modal */}
      <VehicleConfigModal
        open={showVehicleModal}
        onClose={() => setShowVehicleModal(false)}
        onSuccess={() => {
          setHasVehicle(true);
          message.success("Bạn có thể bật trạng thái online để nhận chuyến!");
        }}
      />
    </div>
  );
}