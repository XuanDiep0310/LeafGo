"use client"

import { useState, useEffect } from "react"
import { useSelector } from "react-redux"
import { Card, Switch, Modal, Tag, List, Button, App } from "antd"
import {
  Power,
  Bell,
  MapPin,
  Navigation,
  DollarSign,
  Phone,
  User,
  Clock,
  Settings,
} from "lucide-react"
import {
  toggleDriverOnline,
  getPendingRides,
  acceptRide,
  getCurrentRide,
  updateRideStatus,
  updateDriverLocation,
  getDriverVehicle,
} from "../../services/driverService"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import VehicleConfigModal from "../../components/VehicleConfigModal"

function WorkplacePageContent() {
  const { user } = useSelector((state) => state.auth)
  const { message } = App.useApp()
  const [isOnline, setIsOnline] = useState(false)
  const [currentTrip, setCurrentTrip] = useState(null)
  const [pendingTrips, setPendingTrips] = useState([])
  const [showIncomingModal, setShowIncomingModal] = useState(false)
  const [selectedTrip, setSelectedTrip] = useState(null)
  const [loading, setLoading] = useState(false)

  // Vehicle-related states
  const [hasVehicle, setHasVehicle] = useState(false)
  const [showVehicleModal, setShowVehicleModal] = useState(false)
  const [checkingVehicle, setCheckingVehicle] = useState(true)

  useEffect(() => {
    loadCurrentRide()
    getCurrentLocation()
    checkVehicleInfo()
  }, [])

  useEffect(() => {
    let interval
    if (isOnline && !currentTrip) {
      loadPendingRides()
      interval = setInterval(loadPendingRides, 10000) // Refresh mỗi 10s
    }
    return () => clearInterval(interval)
  }, [isOnline, currentTrip])

  const checkVehicleInfo = async () => {
    try {
      setCheckingVehicle(true)
      const response = await getDriverVehicle()
      console.log("Vehicle check response:", response)

      // Check if vehicle exists and has required data
      const hasValidVehicle = response?.success && response?.data?.id
      setHasVehicle(hasValidVehicle)

      if (!hasValidVehicle) {
        console.log("No vehicle configured")
      } else {
        console.log("Vehicle configured:", response.data)
      }
    } catch (error) {
      console.error("Error checking vehicle:", error)
      setHasVehicle(false)
    } finally {
      setCheckingVehicle(false)
    }
  }

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          updateDriverLocation(
            position.coords.latitude,
            position.coords.longitude
          ).catch(console.error)
        },
        (error) => console.error("Error getting location:", error)
      )
    }
  }

  const loadCurrentRide = async () => {
    try {
      const ride = await getCurrentRide()
      if (ride) {
        setCurrentTrip(mapRideToTrip(ride))
      }
    } catch (error) {
      console.error("Error loading current ride:", error)
    }
  }

  const loadPendingRides = async () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const response = await getPendingRides(
              position.coords.latitude,
              position.coords.longitude,
              5
            )
            // Handle ApiResponse wrapper - rides are in data.data or data
            const rides = response?.data || response || []
            if (Array.isArray(rides)) {
              setPendingTrips(rides.map(mapRideToTrip))
              if (rides.length > 0) {
                message.info(`Có ${rides.length} yêu cầu đặt xe mới`)
              }
            } else {
              console.warn("Rides data is not an array:", rides)
              setPendingTrips([])
            }
          } catch (error) {
            console.error("Error loading pending rides:", error)
          }
        },
        (error) => console.error("Error getting location:", error)
      )
    }
  }

  const mapRideToTrip = (ride) => ({
    id: ride.id,
    createdAt: ride.requestTime || ride.createdAt,
    pickupLocation: {
      address: ride.pickupAddress,
      lat: ride.pickupLatitude,
      lng: ride.pickupLongitude,
    },
    dropoffLocation: {
      address: ride.dropoffAddress,
      lat: ride.dropoffLatitude,
      lng: ride.dropoffLongitude,
    },
    distance: ride.distance,
    price: ride.estimatedPrice || ride.finalPrice,
    customerName: ride.customerName || "Khách hàng",
    customerPhone: ride.customerPhone || "",
    status: ride.status?.toLowerCase(),
    version: ride.version,
  })

  const handleToggleOnline = async (checked) => {
    // Check if trying to go online without vehicle
    if (checked && !hasVehicle) {
      message.warning("Vui lòng cấu hình thông tin xe trước khi online")
      setShowVehicleModal(true)
      return
    }

    try {
      setLoading(true)
      await toggleDriverOnline(checked)
      setIsOnline(checked)
      message.success(
        checked ? "Bạn đã online, sẵn sàng nhận chuyến!" : "Bạn đã offline"
      )
      if (checked) {
        getCurrentLocation()
        loadPendingRides()
      } else {
        setPendingTrips([])
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message || "Có lỗi xảy ra khi cập nhật trạng thái"
      message.error(errorMsg)
      console.error("Toggle online error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptTrip = async (trip) => {
    try {
      setLoading(true)
      await acceptRide(trip.id, trip.version)
      setCurrentTrip({ ...trip, status: "accepted" })
      setPendingTrips(pendingTrips.filter((t) => t.id !== trip.id))
      setShowIncomingModal(false)
      setSelectedTrip(null)
      message.success("Đã nhận chuyến!")
    } catch (error) {
      message.error("Không thể nhận chuyến. Có thể đã có tài xế khác nhận.")
      console.error(error)
      loadPendingRides()
    } finally {
      setLoading(false)
    }
  }

  const handleViewTrip = (trip) => {
    setSelectedTrip(trip)
    setShowIncomingModal(true)
  }

  const handleRejectTrip = () => {
    if (selectedTrip) {
      setPendingTrips(pendingTrips.filter((t) => t.id !== selectedTrip.id))
      message.info("Đã từ chối chuyến")
    }
    setShowIncomingModal(false)
    setSelectedTrip(null)
  }

  const handleUpdateStatus = async (status) => {
    try {
      setLoading(true)
      const apiStatus = {
        arriving: "OnTheWay",
        arrived: "Arrived",
        in_progress: "InProgress",
        completed: "Completed",
      }[status]

      const finalPrice = status === "completed" ? currentTrip.price : undefined
      await updateRideStatus(currentTrip.id, apiStatus, finalPrice)

      setCurrentTrip({ ...currentTrip, status })
      const statusMessages = {
        arriving: "Đang đến điểm đón",
        arrived: "Đã đến điểm đón",
        in_progress: "Đang di chuyển",
        completed: "Hoàn thành chuyến đi",
      }
      message.success(statusMessages[status])

      if (status === "completed") {
        setTimeout(() => {
          setCurrentTrip(null)
          if (isOnline) {
            loadPendingRides()
          }
        }, 2000)
      }
    } catch (error) {
      message.error("Không thể cập nhật trạng thái chuyến đi")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleVehicleConfigSuccess = async (vehicleData) => {
    console.log("Vehicle configured successfully:", vehicleData)
    await checkVehicleInfo()
    message.success("Bạn có thể bật trạng thái online ngay bây giờ!")
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
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
          <div className="flex items-center gap-2">
            <Button
              icon={<Settings className="w-4 h-4" />}
              onClick={() => setShowVehicleModal(true)}
              type="text"
              title="Cấu hình xe"
            >
              Xe
            </Button>
            <Switch
              checked={isOnline}
              onChange={handleToggleOnline}
              loading={loading || checkingVehicle}
              size="large"
            />
          </div>
        </div>

        {/* Warning if no vehicle configured */}
        {!checkingVehicle && !hasVehicle && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
            <Bell className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-yellow-800 font-medium mb-1">
                Chưa cấu hình thông tin xe
              </p>
              <p className="text-xs text-yellow-700 mb-2">
                Vui lòng cập nhật thông tin xe để có thể nhận chuyến
              </p>
              <Button
                size="small"
                type="primary"
                onClick={() => setShowVehicleModal(true)}
              >
                Cấu hình ngay
              </Button>
            </div>
          </div>
        )}
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
                      {(trip.price || 0).toLocaleString()}đ
                    </span>
                  </div>
                </div>
              </List.Item>
            )}
          />
        </Card>
      )}

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
              {currentTrip.customerPhone && (
                <>
                  <span className="text-muted-foreground">•</span>
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="text-foreground">
                    {currentTrip.customerPhone}
                  </span>
                </>
              )}
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
                  {(currentTrip.price || 0).toLocaleString()}đ
                </span>
              </div>
              <span className="text-sm text-muted-foreground">
                {currentTrip.distance} km
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            {currentTrip.status === "accepted" && (
              <Button
                onClick={() => handleUpdateStatus("arriving")}
                loading={loading}
                className="flex-1"
              >
                Đang đến
              </Button>
            )}
            {currentTrip.status === "arriving" && (
              <Button
                onClick={() => handleUpdateStatus("arrived")}
                loading={loading}
                className="flex-1"
              >
                Đã đến điểm đón
              </Button>
            )}
            {currentTrip.status === "arrived" && (
              <Button
                onClick={() => handleUpdateStatus("in_progress")}
                loading={loading}
                className="flex-1"
              >
                Bắt đầu chuyến đi
              </Button>
            )}
            {currentTrip.status === "in_progress" && (
              <Button
                onClick={() => handleUpdateStatus("completed")}
                loading={loading}
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

      {/* Trip Detail Modal */}
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
          <Button key="reject" onClick={handleRejectTrip} disabled={loading}>
            Từ chối
          </Button>,
          <Button
            key="accept"
            type="primary"
            onClick={() => handleAcceptTrip(selectedTrip)}
            loading={loading}
          >
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
            {selectedTrip.customerPhone && (
              <div className="flex items-center gap-2 mt-1">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {selectedTrip.customerPhone}
                </span>
              </div>
            )}
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
                  {(selectedTrip.price || 0).toLocaleString()}đ
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Vehicle Configuration Modal */}
      <VehicleConfigModal
        open={showVehicleModal}
        onClose={() => setShowVehicleModal(false)}
        onSuccess={handleVehicleConfigSuccess}
      />
    </div>
  )
}

function getStatusText(status) {
  const texts = {
    accepted: "Đã nhận",
    arriving: "Đang đến",
    arrived: "Đã đến",
    in_progress: "Đang đi",
    completed: "Hoàn thành",
  }
  return texts[status] || status
}

export default function WorkplacePage() {
  return (
    <App>
      <WorkplacePageContent />
    </App>
  )
}