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
import { AutoComplete, Card, Modal, Select, Button } from "antd";
import { MapPin, Navigation, ArrowLeftRight, Crosshair } from "lucide-react";
import {
  setPickupLocation,
  setDropoffLocation,
  createBooking,
  updateTripStatus,
  rateTrip,
  clearCurrentTrip,
} from "../../store/slices/bookingSlice";
import {
  searchLocations,
  getRoute,
  getCurrentLocation,
  reverseGeocode,
} from "../../services/locationService";
import { calculateTripPrice, mockApi } from "../../services/mockData";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
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

// Implements FR-05, FR-06, FR-07, FR-08, FR-09
export default function BookingPage() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { pickupLocation, dropoffLocation, currentTrip, loading } = useSelector(
    (state) => state.booking
  );

  const [pickupSearch, setPickupSearch] = useState("");
  const [dropoffSearch, setDropoffSearch] = useState("");
  const [pickupOptions, setPickupOptions] = useState([]);
  const [dropoffOptions, setDropoffOptions] = useState([]);
  const [mapCenter, setMapCenter] = useState([21.0285, 105.8542]); // Hanoi center
  const [showTripModal, setShowTripModal] = useState(false);
  const [tripStatus, setTripStatus] = useState("");
  const [vehicleTypeId, setVehicleTypeId] = useState("bike");
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [noDriverFound, setNoDriverFound] = useState(false);

  const [route, setRoute] = useState(null);
  const [estimatedPrice, setEstimatedPrice] = useState(0);
  const [distance, setDistance] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [driverInfo, setDriverInfo] = useState(null);
  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState("");
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [routeConfirmed, setRouteConfirmed] = useState(false);
  const [loadingRoute, setLoadingRoute] = useState(false);

  useEffect(() => {
    // Fetch vehicle types
    mockApi.getVehicleTypes().then(setVehicleTypes);
  }, []);
  useEffect(() => {
    if (!pickupLocation || !dropoffLocation) {
      setRoute(null);
      setEstimatedPrice(0);
      setDistance(0);
      setDuration(0);
      setRouteConfirmed(false);
    }
  }, [pickupLocation, dropoffLocation]);

  const fetchRoute = async () => {
    if (!pickupLocation || !dropoffLocation) {
      console.error("Missing pickup or dropoff location");
      return;
    }

    setLoadingRoute(true);
    try {
      console.log("[BookingPage] Fetching route...");
      const routeData = await getRoute(pickupLocation, dropoffLocation);

      console.log("[BookingPage] Route data received:", routeData);

      if (
        routeData &&
        routeData.coordinates &&
        routeData.coordinates.length > 0 &&
        routeData.distance > 0
      ) {
        setRoute(routeData);
        setDistance(routeData.distance);
        setDuration(routeData.duration);
        const price = calculateTripPrice(routeData.distance);
        setEstimatedPrice(price);
        setRouteConfirmed(true);
        console.log("[BookingPage] Route confirmed:", {
          distance: routeData.distance,
          duration: routeData.duration,
          price,
          coordinatesCount: routeData.coordinates.length,
        });
      } else {
        console.error("[BookingPage] Invalid route data:", routeData);
        setRouteConfirmed(false);
      }
    } catch (error) {
      console.error("[BookingPage] Error fetching route:", error);
      setRouteConfirmed(false);
    } finally {
      setLoadingRoute(false);
    }
  };

  // Recalculate price when vehicle type changes
  useEffect(() => {
    if (distance > 0) {
      const newPrice = calculateTripPrice(distance, vehicleTypeId);
      setEstimatedPrice(newPrice);
    }
  }, [vehicleTypeId]);

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

  // FR-05: Handle location selection
  const handlePickupSelect = (value, option) => {
    const location = option.data;
    if (location) {
      dispatch(setPickupLocation(location));
      setMapCenter([location.lat, location.lng]);
      setPickupSearch(value);
    }
  };

  const handleDropoffSelect = (value, option) => {
    const location = option.data;
    if (location) {
      dispatch(setDropoffLocation(location));
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
          dispatch(setPickupLocation(location));
          setPickupSearch(location.fullAddress);
          setMapCenter([location.lat, location.lng]);
          if (coords.fallback) {
            console.warn(
              "[BookingPage] Using fallback location - geolocation may not be available"
            );
          }
        } else {
          dispatch(setDropoffLocation(location));
          setDropoffSearch(location.fullAddress);
        }
      } else {
        alert(
          "Không tìm thấy thông tin địa chỉ cho vị trí này. Vui lòng nhập địa chỉ thủ công."
        );
      }
    } catch (error) {
      console.error("[BookingPage] Error getting location:", error);
      alert(
        "Không thể lấy vị trí hiện tại. Vui lòng nhập địa chỉ thủ công hoặc kiểm tra quyền truy cập vị trí."
      );
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleSwapLocations = () => {
    const tempLocation = pickupLocation;
    const tempSearch = pickupSearch;

    dispatch(setPickupLocation(dropoffLocation));
    dispatch(setDropoffLocation(tempLocation));
    setPickupSearch(dropoffSearch);
    setDropoffSearch(tempSearch);

    if (dropoffLocation) {
      setMapCenter([dropoffLocation.lat, dropoffLocation.lng]);
    }
  };
  const handleSubmitRating = async () => {
    if (rating === 0) {
      return;
    }

    try {
      await dispatch(
        rateTrip({
          tripId: currentTrip?.id,
          rating,
          comment: ratingComment,
        })
      ).unwrap();

      setRatingSubmitted(true);
      setTimeout(() => {
        setShowTripModal(false);
        dispatch(clearCurrentTrip());
        setRating(0);
        setRatingComment("");
        setRatingSubmitted(false);
        setTripStatus("");
        setDriverInfo(null);
      }, 600);
    } catch (error) {
      console.error("Error submitting rating:", error);
    }
  };
  // FR-07: Create booking
  const handleBooking = async () => {
    if (!pickupLocation || !dropoffLocation) {
      return;
    }

    try {
      const result = await dispatch(
        createBooking({
          userId: user.id,
          pickupLocation,
          dropoffLocation,
          distance,
          price: estimatedPrice,
        })
      ).unwrap();

      setShowTripModal(true);
      setTripStatus("finding");
      setDriverInfo(null);

      // FR-08, FR-09: Simulate trip status updates
      simulateTripProgress(result.id);
    } catch (error) {
      console.error("Booking error:", error);
    }
  };

  // FR-08, FR-09: Simulate realtime trip status updates
  const simulateTripProgress = async (tripId) => {
    setTimeout(() => {
      const mockDriver = {
        name: "Trần Văn B",
        phone: "0987654321",
        rating: 4.8,
        vehicle: {
          licensePlate: "29A-12345",
          type: "Xe máy",
          brand: "Honda Wave",
          color: "Đỏ",
        },
      };
      setDriverInfo(mockDriver);
      dispatch(updateTripStatus({ status: "accepted", driverId: "driver1" }));
      setTripStatus("accepted");
    }, 2000);

    // Driver arriving (5s)
    setTimeout(() => {
      dispatch(updateTripStatus({ status: "arriving" }));
      setTripStatus("arriving");
    }, 5000);

    setTimeout(() => {
      dispatch(updateTripStatus({ status: "arrived" }));
      setTripStatus("arrived");
    }, 8000);

    setTimeout(() => {
      dispatch(updateTripStatus({ status: "in_progress" }));
      setTripStatus("in_progress");
    }, 10000);

    setTimeout(() => {
      dispatch(updateTripStatus({ status: "completed" }));
      setTripStatus("completed");
      // Don't auto-close modal - wait for user to rate
    }, 15000);
  };

  const getStatusText = () => {
    switch (tripStatus) {
      case "finding":
        return "Đang tìm tài xế...";
      case "accepted":
        return "Đã tìm thấy tài xế";
      case "arriving":
        return "Tài xế đang đến";
      case "arrived":
        return "Tài xế đã đến";
      case "in_progress":
        return "Đang di chuyển";
      case "completed":
        return "Hoàn thành";
      default:
        return "";
    }
  };

  return (
    <div className="h-full flex">
      {/* Left Panel - Booking Form */}
      <div className="w-96 p-6 bg-card border-r border-border overflow-auto">
        <h2 className="text-2xl font-bold text-foreground mb-6">
          Đặt chuyến xe
        </h2>

        {/* Vehicle Type Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-foreground mb-2">
            Loại phương tiện
          </label>
          <Select
            value={vehicleTypeId}
            onChange={setVehicleTypeId}
            disabled={routeConfirmed}
            className="w-full"
            size="large"
            options={vehicleTypes.map((vt) => ({
              label: vt.name,
              value: vt.id,
            }))}
          />
        </div>

        {/* FR-05: Pickup location input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-foreground mb-2">
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
              variant="outline"
              size="lg"
              onClick={() => handleGetCurrentLocation("pickup")}
              disabled={loadingLocation || routeConfirmed}
              className="px-3"
              title="Lấy vị trí hiện tại"
            >
              <Crosshair className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="flex justify-center -my-2 mb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSwapLocations}
            disabled={!pickupLocation || !dropoffLocation || routeConfirmed}
          >
            <ArrowLeftRight className="w-4 h-4" />
          </Button>
        </div>

        {/* FR-05: Dropoff location input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-foreground mb-2">
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
              variant="outline"
              size="lg"
              onClick={() => handleGetCurrentLocation("dropoff")}
              disabled={loadingLocation || routeConfirmed}
              className="px-3"
              title="Lấy vị trí hiện tại"
            >
              <Crosshair className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Confirm button to calculate route */}
        <div className="flex gap-2 mb-6">
          <Button
            onClick={fetchRoute}
            disabled={
              !pickupLocation ||
              !dropoffLocation ||
              loadingRoute ||
              routeConfirmed
            }
            className="flex-1 h-12 text-lg"
            size="lg"
            variant={routeConfirmed ? "default" : "outline"}
          >
            {loadingRoute
              ? "Đang tính toán..."
              : routeConfirmed
                ? "✓ Đã xác nhận"
                : "Xác nhận"}
          </Button>
          {routeConfirmed && (
            <Button
              onClick={() => {
                setRouteConfirmed(false);
                setRoute(null);
                setEstimatedPrice(0);
                setDistance(0);
                setDuration(0);
              }}
              variant="outline"
              className="h-12 px-4"
              size="lg"
            >
              ✕ Huỷ
            </Button>
          )}
        </div>

        {/* FR-06: Price estimation */}
        {routeConfirmed && distance > 0 && estimatedPrice > 0 && (
          <Card className="mb-6 bg-secondary border-primary/20">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Khoảng cách
                </span>
                <span className="text-lg font-semibold text-foreground">
                  {distance.toFixed(1)} km
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Thời gian dự kiến
                </span>
                <span className="text-lg font-semibold text-foreground">
                  {duration} phút
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-sm text-muted-foreground">
                  Giá dự kiến
                </span>
                <span className="text-2xl font-bold text-primary">
                  {estimatedPrice.toLocaleString()}đ
                </span>
              </div>
            </div>
          </Card>
        )}

        {/* FR-07: Book button with no driver handling */}
        <Button
          onClick={handleBooking}
          disabled={!routeConfirmed || loading}
          className="w-full h-12 text-lg"
          size="lg"
        >
          {loading ? "Đang xử lý..." : "Đặt xe ngay"}
        </Button>

        {/* No Driver Found Modal */}
        <Modal
          title="Không tìm thấy tài xế"
          open={noDriverFound}
          footer={[
            <Button key="back" onClick={() => setNoDriverFound(false)}>
              Quay lại
            </Button>,
            <Button key="retry" type="primary" onClick={handleBooking}>
              Đặt lại
            </Button>,
          ]}
          closable={false}
        >
          <div className="text-center py-4">
            <p className="text-muted-foreground mb-2">
              Hiện không có tài xế khả dụng cho loại xe này. Vui lòng:
            </p>
            <ul className="text-sm text-left text-muted-foreground space-y-1 ml-4">
              <li>• Thử đổi loại phương tiện khác</li>
              <li>• Chờ một lúc và đặt lại</li>
            </ul>
          </div>
        </Modal>

        <div className="mt-6 p-4 bg-accent/50 rounded-lg">
          <h3 className="font-semibold text-foreground mb-2">Lưu ý</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Giá có thể thay đổi tùy thuộc vào lưu lượng</li>
            <li>• Thời gian chờ tài xế tối đa 5 phút</li>
            <li>• Đánh giá sau chuyến để nhận ưu đãi</li>
          </ul>
        </div>
      </div>

      {/* Right Panel - Map */}
      <div className="flex-1 relative">
        <MapContainer center={mapCenter} zoom={13} className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapUpdater center={mapCenter} />
          {pickupLocation && (
            <Marker position={[pickupLocation.lat, pickupLocation.lng]}>
              <Popup>
                Điểm đón: {pickupLocation.fullAddress || pickupLocation.address}
              </Popup>
            </Marker>
          )}
          {dropoffLocation && (
            <Marker position={[dropoffLocation.lat, dropoffLocation.lng]}>
              <Popup>
                Điểm đến:{" "}
                {dropoffLocation.fullAddress || dropoffLocation.address}
              </Popup>
            </Marker>
          )}
          {route && route.coordinates && route.coordinates.length > 0 && (
            <Polyline
              positions={route.coordinates}
              color="#10b981"
              weight={4}
              opacity={0.7}
              dashArray="5, 5"
            />
          )}
        </MapContainer>
      </div>

      {/* FR-08, FR-09: Trip Status Modal */}
      <Modal
        title="Trạng thái chuyến đi"
        open={showTripModal}
        footer={null}
        closable={false}
        centered
        width={400}
      >
        <div className="py-4">
          {tripStatus === "completed" && !ratingSubmitted ? (
            // Rating Form
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground text-center mb-4">
                Đánh giá chuyến đi
              </h3>

              {/* Driver Information */}
              {driverInfo && (
                <Card className="bg-secondary/50 p-3">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tài xế:</span>
                      <span className="font-semibold">{driverInfo.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Xe:</span>
                      <span className="font-semibold">
                        {driverInfo.vehicle.brand} {driverInfo.vehicle.color}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Biển số:</span>
                      <span className="font-semibold">
                        {driverInfo.vehicle.licensePlate}
                      </span>
                    </div>
                  </div>
                </Card>
              )}

              {/* Trip Details */}
              {distance > 0 && (
                <Card className="bg-secondary/50 p-3">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Khoảng cách:
                      </span>
                      <span className="font-semibold">
                        {distance.toFixed(1)} km
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Thời gian:</span>
                      <span className="font-semibold">{duration} phút</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Giá tiền:</span>
                      <span className="font-semibold text-primary">
                        {estimatedPrice.toLocaleString()}đ
                      </span>
                    </div>
                  </div>
                </Card>
              )}

              {/* Rating Stars */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Chất lượng dịch vụ
                </label>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className="text-4xl transition-transform hover:scale-110"
                    >
                      {star <= rating ? "⭐" : "☆"}
                    </button>
                  ))}
                </div>
                {rating > 0 && (
                  <p className="text-center text-sm text-muted-foreground mt-2">
                    {rating === 5 && "Rất tuyệt vời!"}
                    {rating === 4 && "Tốt lắm!"}
                    {rating === 3 && "Bình thường"}
                    {rating === 2 && "Cần cải thiện"}
                    {rating === 1 && "Không hài lòng"}
                  </p>
                )}
              </div>

              {/* Comment */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Nhận xét (tùy chọn)
                </label>
                <textarea
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                  placeholder="Chia sẻ trải nghiệm của bạn..."
                  className="w-full p-2 border border-border rounded-md text-sm"
                  rows="2"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={handleSubmitRating}
                  className="flex-1"
                  disabled={rating === 0}
                >
                  ✓ Xác nhận đánh giá
                </Button>
                <Button
                  onClick={() => {
                    setShowTripModal(false);
                    dispatch(clearCurrentTrip());
                    setRating(0);
                    setRatingComment("");
                    setRatingSubmitted(false);
                    setTripStatus("");
                    setDriverInfo(null);
                  }}
                  variant="outline"
                  className="px-4"
                >
                  ✕
                </Button>
              </div>
            </div>
          ) : (
            // Trip Status Display
            <>
              <div className="mb-4 text-center">
                <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center animate-pulse">
                  <Navigation className="w-8 h-8 text-primary" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2 text-center">
                {getStatusText()}
              </h3>

              {driverInfo && (
                <Card className="mt-4 bg-accent">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Tài xế
                      </span>
                      <span className="font-semibold text-foreground">
                        {driverInfo.name}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Số điện thoại
                      </span>
                      <span className="font-semibold text-foreground">
                        {driverInfo.phone}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Đánh giá
                      </span>
                      <span className="font-semibold text-foreground">
                        ⭐ {driverInfo.rating}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-border">
                      <div className="text-sm text-muted-foreground mb-1">
                        Thông tin xe
                      </div>
                      <div className="text-sm text-foreground">
                        {driverInfo.vehicle.brand} - {driverInfo.vehicle.color}
                      </div>
                      <div className="text-sm font-semibold text-foreground">
                        Biển số: {driverInfo.vehicle.licensePlate}
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              <p className="text-sm text-muted-foreground text-center mt-4">
                {tripStatus === "completed"
                  ? "Cảm ơn bạn đã sử dụng Leaf Go!"
                  : "Vui lòng chờ trong giây lát..."}
              </p>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
