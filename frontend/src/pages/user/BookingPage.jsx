"use client";

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import { AutoComplete, Card, Modal, Select, Button, message, Avatar, Rate } from "antd";
import { MapPin, Navigation, ArrowLeftRight, Crosshair } from "lucide-react";
import {
  searchLocations,
  getRoute,
  getCurrentLocation,
  reverseGeocode,
} from "../../services/locationService";
import {
  getVehicleTypes,
  calculateTripPrice,
  createRide,
  getRideById,
  getActiveRide,
  cancelRide,
  submitRating,
} from "../../services/bookingService";
import {
  startSignalRConnection,
  stopSignalRConnection,
  joinRideGroup,
  leaveRideGroup,
  onRideAccepted,
  onRideStatusChanged,
  onDriverLocationUpdated,
  onRideCompleted,
  onRideCancelled,
  offRideAccepted,
  offRideStatusChanged,
  offDriverLocationUpdated,
  offRideCompleted,
  offRideCancelled,
} from "../../services/signalRService";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, 13);
    }
  }, [center, map]);
  return null;
}

export default function BookingPage() {
  const { user } = useSelector((state) => state.auth);

  const [pickupLocation, setPickupLocation] = useState(null);
  const [dropoffLocation, setDropoffLocation] = useState(null);
  const [pickupSearch, setPickupSearch] = useState("");
  const [dropoffSearch, setDropoffSearch] = useState("");
  const [pickupOptions, setPickupOptions] = useState([]);
  const [dropoffOptions, setDropoffOptions] = useState([]);
  const [mapCenter, setMapCenter] = useState([21.0285, 105.8542]);

  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [selectedVehicleTypeId, setSelectedVehicleTypeId] = useState(null);

  const [route, setRoute] = useState(null);
  const [priceData, setPriceData] = useState(null);
  const [routeConfirmed, setRouteConfirmed] = useState(false);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [loadingBooking, setLoadingBooking] = useState(false);

  const [currentRide, setCurrentRide] = useState(null);
  const [showTripModal, setShowTripModal] = useState(false);
  const [driverLocation, setDriverLocation] = useState(null);

  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState("");
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  // Track current ride ID for cleanup
  const [currentRideId, setCurrentRideId] = useState(null);

  // Initialize SignalR connection on mount
  useEffect(() => {
    const initSignalR = async () => {
      try {
        const conn = await startSignalRConnection(localStorage.getItem("accessToken"));
        if (!conn) {
          console.warn("[BookingPage] SignalR not available, using polling fallback");
          return;
        }
        console.log("[BookingPage] SignalR initialized");

        // Setup event listeners
        onRideAccepted((data) => {
          console.log("[BookingPage] Ride accepted:", data);
          setCurrentRideId(data.rideId);
          setCurrentRide((prev) => ({
            ...prev,
            driver: data.driver,
            status: "Accepted",
          }));
          // Join ride group to get real-time updates
          joinRideGroup(data.rideId).catch(console.error);
        });

        onRideStatusChanged((data) => {
          console.log("[BookingPage] Ride status changed:", data);
          setCurrentRide((prev) => ({
            ...prev,
            status: data.status,
          }));
        });

        onDriverLocationUpdated((data) => {
          console.log("[BookingPage] Driver location updated:", data);
          setDriverLocation({
            lat: data.latitude,
            lng: data.longitude,
          });
        });

        onRideCompleted((data) => {
          console.log("[BookingPage] Ride completed:", data);
          setCurrentRide((prev) => ({
            ...prev,
            status: "Completed",
          }));
          leaveRideGroup(data.rideId).catch(console.error);
        });

        onRideCancelled((data) => {
          console.log("[BookingPage] Ride cancelled:", data);
          setCurrentRide((prev) => ({
            ...prev,
            status: "Cancelled",
          }));
          leaveRideGroup(data.rideId).catch(console.error);
        });

        // After SignalR is ready, check for active ride
        await checkActiveRide();
      } catch (error) {
        console.error("[BookingPage] Failed to initialize SignalR:", error);
        console.warn("[BookingPage] Continuing without SignalR connection");
      }
    };

    initSignalR();

    // Cleanup on unmount
    return () => {
      offRideAccepted();
      offRideStatusChanged();
      offDriverLocationUpdated();
      offRideCompleted();
      offRideCancelled();
    };
  }, []);

  // Load vehicle types on mount
  useEffect(() => {
    loadVehicleTypes();
  }, []);

  const loadVehicleTypes = async () => {
    try {
      const types = await getVehicleTypes();
      setVehicleTypes(types);
      if (types.length > 0 && !selectedVehicleTypeId) {
        setSelectedVehicleTypeId(types[0].id);
      }
    } catch (error) {
      message.error('Không thể tải danh sách loại xe');
    }
  };

  const checkActiveRide = async () => {
    try {
      const activeRide = await getActiveRide();
      if (activeRide) {
        setCurrentRide(activeRide);
        setShowTripModal(true);
        // Join ride group to listen for real-time updates
        if (activeRide.id) {
          await joinRideGroup(activeRide.id);
        }
      }
    } catch (error) {
      console.error('Error checking active ride:', error);
    }
  };

  const handlePickupSearch = async (value) => {
    setPickupSearch(value);
    if (value.length >= 3) {
      const results = await searchLocations(value);
      setPickupOptions(
        results.map((loc, index) => ({
          value: loc.fullAddress,
          label: loc.fullAddress,
          data: loc,
          key: `pickup-${index}-${loc.lat}-${loc.lng}`,
        }))
      );
    }
  };

  const handleDropoffSearch = async (value) => {
    setDropoffSearch(value);
    if (value.length >= 3) {
      const results = await searchLocations(value);
      setDropoffOptions(
        results.map((loc, index) => ({
          value: loc.fullAddress,
          label: loc.fullAddress,
          data: loc,
          key: `dropoff-${index}-${loc.lat}-${loc.lng}`,
        }))
      );
    }
  };

  const handlePickupSelect = (value, option) => {
    const location = option.data;
    if (location) {
      setPickupLocation(location);
      setMapCenter([location.lat, location.lng]);
      setPickupSearch(value);
    }
  };

  const handleDropoffSelect = (value, option) => {
    const location = option.data;
    if (location) {
      setDropoffLocation(location);
      setDropoffSearch(value);
    }
  };

  const handleGetCurrentLocation = async (type) => {
    setLoadingLocation(true);
    try {
      const coords = await getCurrentLocation();
      const location = await reverseGeocode(coords.lat, coords.lng);

      if (location) {
        if (type === "pickup") {
          setPickupLocation(location);
          setPickupSearch(location.fullAddress);
          setMapCenter([location.lat, location.lng]);
        } else {
          setDropoffLocation(location);
          setDropoffSearch(location.fullAddress);
        }
      } else {
        message.error("Không tìm thấy địa chỉ cho vị trí này");
      }
    } catch (error) {
      message.error("Không thể lấy vị trí hiện tại");
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleSwapLocations = () => {
    const tempLocation = pickupLocation;
    const tempSearch = pickupSearch;

    setPickupLocation(dropoffLocation);
    setDropoffLocation(tempLocation);
    setPickupSearch(dropoffSearch);
    setDropoffSearch(tempSearch);

    if (dropoffLocation) {
      setMapCenter([dropoffLocation.lat, dropoffLocation.lng]);
    }
  };

  const fetchRoute = async () => {
    if (!pickupLocation || !dropoffLocation || !selectedVehicleTypeId) {
      message.warning('Vui lòng chọn điểm đón, điểm đến và loại xe');
      return;
    }

    setLoadingRoute(true);
    try {
      // Get route from location service
      const routeData = await getRoute(pickupLocation, dropoffLocation);

      if (!routeData || !routeData.coordinates || routeData.distance <= 0) {
        message.error('Không thể tính toán tuyến đường');
        return;
      }

      // Calculate price using API
      const priceResult = await calculateTripPrice(
        pickupLocation.lat,
        pickupLocation.lng,
        dropoffLocation.lat,
        dropoffLocation.lng,
        selectedVehicleTypeId
      );

      setRoute(routeData);
      setPriceData(priceResult);
      setRouteConfirmed(true);

      message.success('Đã xác nhận tuyến đường');
    } catch (error) {
      message.error('Không thể tính toán giá: ' + error.message);
      setRouteConfirmed(false);
    } finally {
      setLoadingRoute(false);
    }
  };

  const handleBooking = async () => {
    if (!routeConfirmed || !priceData) {
      message.warning('Vui lòng xác nhận tuyến đường trước');
      return;
    }

    setLoadingBooking(true);
    try {
      const rideData = {
        vehicleTypeId: selectedVehicleTypeId,
        pickupAddress: pickupLocation.fullAddress,
        pickupLatitude: pickupLocation.lat,
        pickupLongitude: pickupLocation.lng,
        destinationAddress: dropoffLocation.fullAddress,
        destinationLatitude: dropoffLocation.lat,
        destinationLongitude: dropoffLocation.lng,
        distance: priceData.distance,
        estimatedDuration: priceData.estimatedDuration,
        estimatedPrice: priceData.estimatedPrice,
        notes: ''
      };

      const result = await createRide(rideData);
      setCurrentRide(result);
      setCurrentRideId(result.id);
      setShowTripModal(true);
      message.success('Đã tạo chuyến đi thành công');

      // Join ride group to receive real-time updates
      if (result.id) {
        await joinRideGroup(result.id);
      }

      // Reset form
      setRouteConfirmed(false);
      setPriceData(null);
      setRoute(null);
    } catch (error) {
      message.error('Không thể tạo chuyến đi: ' + error.message);
    } finally {
      setLoadingBooking(false);
    }
  };

  const handleCancelRide = async () => {
    if (!currentRide?.id) return;

    // Only allow cancelling if ride is in Pending status
    if (currentRide.status !== 'Pending') {
      message.warning('Chỉ có thể hủy chuyến khi đang tìm tài xế');
      return;
    }

    try {
      await cancelRide(currentRide.id, 'Người dùng hủy chuyến');
      message.success('Đã hủy chuyến đi');
      if (currentRideId) {
        await leaveRideGroup(currentRideId);
      }
      setShowTripModal(false);
      setCurrentRide(null);
      setCurrentRideId(null);
      setDriverLocation(null);
    } catch (error) {
      // If ride is already cancelled, just close the modal
      if (error.response?.data?.error?.includes('already cancelled')) {
        message.info('Chuyến đã bị hủy');
        if (currentRideId) {
          await leaveRideGroup(currentRideId).catch(console.error);
        }
        setShowTripModal(false);
        setCurrentRide(null);
        setCurrentRideId(null);
        setDriverLocation(null);
      } else {
        message.error('Không thể hủy chuyến: ' + error.message);
      }
    }
  };

  const handleSubmitRating = async () => {
    if (rating === 0) {
      message.warning('Vui lòng chọn đánh giá');
      return;
    }

    try {
      await submitRating(currentRide.id, rating, ratingComment);
      setRatingSubmitted(true);
      message.success('Cảm ơn bạn đã đánh giá!');

      setTimeout(() => {
        if (currentRideId) {
          leaveRideGroup(currentRideId).catch(console.error);
        }
        setShowTripModal(false);
        setCurrentRide(null);
        setCurrentRideId(null);
        setDriverLocation(null);
        setRating(0);
        setRatingComment('');
        setRatingSubmitted(false);
      }, 1500);
    } catch (error) {
      message.error('Không thể gửi đánh giá: ' + error.message);
    }
  };

  const getStatusText = () => {
    if (!currentRide) return '';

    const statusMap = {
      'Pending': 'Đang tìm tài xế...',
      'Accepted': 'Đã tìm thấy tài xế',
      'DriverArriving': 'Tài xế đang đến',
      'DriverArrived': 'Tài xế đã đến',
      'InProgress': 'Đang di chuyển',
      'Completed': 'Hoàn thành',
      'Cancelled': 'Đã hủy'
    };

    return statusMap[currentRide.status] || currentRide.status;
  };

  return (
    <div className="h-full flex">
      {/* Left Panel */}
      <div className="w-96 p-6 bg-white border-r overflow-auto">
        <h2 className="text-2xl font-bold mb-6">Đặt chuyến xe</h2>

        {/* Vehicle Type */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Loại phương tiện</label>
          <Select
            value={selectedVehicleTypeId}
            onChange={setSelectedVehicleTypeId}
            disabled={routeConfirmed}
            className="w-full"
            size="large"
          >
            {vehicleTypes.map((vt) => (
              <Select.Option key={vt.id} value={vt.id}>
                {vt.name} - {vt.availableDrivers} xe khả dụng
              </Select.Option>
            ))}
          </Select>
        </div>

        {/* Pickup Location */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            <MapPin className="w-4 h-4 inline mr-1" />
            Điểm đón
          </label>
          <div className="flex gap-2">
            <AutoComplete
              value={pickupSearch}
              onChange={handlePickupSearch}
              onSelect={handlePickupSelect}
              options={pickupOptions}
              placeholder="Nhập địa chỉ điểm đón"
              className="flex-1"
              size="large"
              disabled={routeConfirmed}
            />
            <Button
              size="large"
              onClick={() => handleGetCurrentLocation("pickup")}
              disabled={loadingLocation || routeConfirmed}
            >
              <Crosshair className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center -my-2 mb-2">
          <Button
            onClick={handleSwapLocations}
            disabled={!pickupLocation || !dropoffLocation || routeConfirmed}
          >
            <ArrowLeftRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Dropoff Location */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            <Navigation className="w-4 h-4 inline mr-1" />
            Điểm đến
          </label>
          <div className="flex gap-2">
            <AutoComplete
              value={dropoffSearch}
              onChange={handleDropoffSearch}
              onSelect={handleDropoffSelect}
              options={dropoffOptions}
              placeholder="Nhập địa chỉ điểm đến"
              className="flex-1"
              size="large"
              disabled={routeConfirmed}
            />
            <Button
              size="large"
              onClick={() => handleGetCurrentLocation("dropoff")}
              disabled={loadingLocation || routeConfirmed}
            >
              <Crosshair className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Confirm Route Button */}
        <div className="flex gap-2 mb-6">
          <Button
            type={routeConfirmed ? "default" : "primary"}
            onClick={fetchRoute}
            disabled={!pickupLocation || !dropoffLocation || loadingRoute || routeConfirmed}
            className="flex-1"
            size="large"
          >
            {loadingRoute ? "Đang tính..." : routeConfirmed ? "✓ Đã xác nhận" : "Xác nhận"}
          </Button>
          {routeConfirmed && (
            <Button
              onClick={() => {
                setRouteConfirmed(false);
                setRoute(null);
                setPriceData(null);
              }}
              size="large"
            >
              Hủy
            </Button>
          )}
        </div>

        {/* Price Display */}
        {routeConfirmed && priceData && (
          <Card className="mb-6">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Khoảng cách</span>
                <span className="font-semibold">{priceData.distance.toFixed(1)} km</span>
              </div>
              <div className="flex justify-between">
                <span>Thời gian</span>
                <span className="font-semibold">{priceData.estimatedDuration} phút</span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span>Giá dự kiến</span>
                <span className="text-2xl font-bold text-primary">
                  {priceData.estimatedPrice.toLocaleString()}đ
                </span>
              </div>
            </div>
          </Card>
        )}

        {/* Book Button */}
        <Button
          type="primary"
          onClick={handleBooking}
          disabled={!routeConfirmed || loadingBooking}
          className="w-full"
          size="large"
        >
          {loadingBooking ? "Đang xử lý..." : "Đặt xe ngay"}
        </Button>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <MapContainer center={mapCenter} zoom={13} className="h-full w-full">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapUpdater center={mapCenter} />
          {pickupLocation && (
            <Marker position={[pickupLocation.lat, pickupLocation.lng]}>
              <Popup>{pickupLocation.fullAddress}</Popup>
            </Marker>
          )}
          {dropoffLocation && (
            <Marker position={[dropoffLocation.lat, dropoffLocation.lng]}>
              <Popup>{dropoffLocation.fullAddress}</Popup>
            </Marker>
          )}
          {driverLocation && (
            <Marker position={[driverLocation.lat, driverLocation.lng]}>
              <Popup>Tài xế đang ở đây</Popup>
            </Marker>
          )}
          {route?.coordinates && (
            <Polyline positions={route.coordinates} color="#10b981" weight={4} />
          )}
        </MapContainer>
      </div>

      {/* Trip Status Modal */}
      <Modal
        title="Trạng thái chuyến đi"
        open={showTripModal}
        footer={null}
        closable={currentRide?.status === 'Completed' || currentRide?.status === 'Cancelled'}
        onCancel={() => {
          if (currentRide?.status === 'Completed' || currentRide?.status === 'Cancelled') {
            setShowTripModal(false);
            setCurrentRide(null);
          }
        }}
        width={400}
      >
        {currentRide?.status === 'Completed' && !ratingSubmitted ? (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-center">Đánh giá chuyến đi</h3>

            {currentRide.driver && (
              <Card>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Tài xế:</span>
                    <span className="font-semibold">{currentRide.driver.fullName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Đánh giá:</span>
                    <span>⭐ {currentRide.driver.averageRating}</span>
                  </div>
                </div>
              </Card>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">Chất lượng dịch vụ</label>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="text-4xl"
                  >
                    {star <= rating ? "⭐" : "☆"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Nhận xét</label>
              <textarea
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
                placeholder="Chia sẻ trải nghiệm..."
                className="w-full p-2 border rounded"
                rows="2"
              />
            </div>

            <Button
              type="primary"
              onClick={handleSubmitRating}
              disabled={rating === 0}
              className="w-full"
            >
              Xác nhận đánh giá
            </Button>
          </div>
        ) : (
          <div className="py-4">
            <div className="text-center mb-4">
              <Navigation className="w-16 h-16 mx-auto text-primary animate-pulse" />
            </div>
            <h3 className="text-lg font-semibold text-center mb-4">
              {getStatusText()}
            </h3>

            {currentRide?.driver && (
              <Card className="mb-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Avatar
                      size={48}
                      src={
                        currentRide.driver.avatar
                          ? `http://localhost:8080${currentRide.driver.avatar}`
                          : undefined
                      }
                    >
                      {currentRide.driver.fullName?.charAt(0) || "T"}
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-semibold">
                        {currentRide.driver.fullName || currentRide.driver.name || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {currentRide.driver.phoneNumber || currentRide.driver.phone || 'N/A'}
                      </div>
                    </div>
                    <div className="text-right">
                      <Rate
                        allowHalf
                        disabled
                        value={currentRide.driver.averageRating || 0}
                        style={{ fontSize: 14 }}
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        {(currentRide.driver.totalRides || 0).toLocaleString()} chuyến
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Biển số</span>
                      <span className="font-semibold text-blue-600">
                        {currentRide.driver.vehicle?.licensePlate ||
                         currentRide.driver.driverVehicle?.licensePlate ||
                         currentRide.vehicle?.licensePlate ||
                         currentRide.licensePlate ||
                         "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Hãng xe</span>
                      <span className="font-medium">
                        {currentRide.driver.vehicle?.vehicleBrand || currentRide.driver.vehicle?.brand || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Dòng xe</span>
                      <span className="font-medium">
                        {currentRide.driver.vehicle?.vehicleModel || currentRide.driver.vehicle?.model || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Màu xe</span>
                      <span className="font-medium">
                        {currentRide.driver.vehicle?.vehicleColor || currentRide.driver.vehicle?.color || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {currentRide?.status === 'Pending' && (
              <Button
                onClick={handleCancelRide}
                className="w-full mt-4"
                danger
              >
                Hủy chuyến
              </Button>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}