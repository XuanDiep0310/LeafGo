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
      console.log('[WorkplacePage] Starting to poll for pending rides...')
      loadPendingRides() // Load immediately
      interval = setInterval(() => {
        console.log('[WorkplacePage] Polling for pending rides...')
        loadPendingRides()
      }, 5000) // Poll every 5 seconds for better responsiveness
    }
    return () => {
      if (interval) {
        console.log('[WorkplacePage] Stopping poll')
        clearInterval(interval)
      }
    }
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
          console.log('[WorkplacePage] Current location:', {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
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
      console.log('[WorkplacePage] Loading current ride...')
      const response = await getCurrentRide()
      console.log('[WorkplacePage] Current ride response:', response)

      // Handle different response formats
      let ride = null
      if (response?.data) {
        ride = response.data
      } else if (response) {
        ride = response
      }

      console.log('[WorkplacePage] Extracted ride:', ride)

      if (ride && ride.id) {
        const mappedTrip = mapRideToTrip(ride)
        console.log('[WorkplacePage] Mapped trip:', mappedTrip)
        setCurrentTrip(mappedTrip)
      } else {
        console.log('[WorkplacePage] No active ride found')
        setCurrentTrip(null)
      }
    } catch (error) {
      console.error("Error loading current ride:", error)
      setCurrentTrip(null)
    }
  }

  const loadPendingRides = async () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            console.log('[WorkplacePage] Fetching pending rides at location:', {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            })

            const response = await getPendingRides(
              position.coords.latitude,
              position.coords.longitude,
              10 // Increase radius to 10km
            )

            console.log('[WorkplacePage] getPendingRides response:', response)

            // Handle different response structures
            let rides = []

            // Case 1: response.data.data (ApiResponse wrapper with nested data)
            if (response?.data?.data && Array.isArray(response.data.data)) {
              rides = response.data.data
            }
            // Case 2: response.data (ApiResponse wrapper)
            else if (response?.data && Array.isArray(response.data)) {
              rides = response.data
            }
            // Case 3: Direct array response
            else if (Array.isArray(response)) {
              rides = response
            }

            console.log('[WorkplacePage] Extracted rides array:', rides)

            if (rides.length > 0) {
              const mappedTrips = rides.map(mapRideToTrip)
              console.log('[WorkplacePage] Mapped trips:', mappedTrips)
              setPendingTrips(mappedTrips)
              // Auto-open modal for first pending ride
              if (!showIncomingModal && mappedTrips.length > 0) {
                setSelectedTrip(mappedTrips[0])
                setShowIncomingModal(true)
              }
              message.info(`Có ${rides.length} yêu cầu đặt xe mới`, 2)
            } else {
              console.log('[WorkplacePage] No pending rides found')
              setPendingTrips([])
            }
          } catch (error) {
            console.error("[WorkplacePage] Error loading pending rides:", error)
            console.error("[WorkplacePage] Error details:", {
              message: error.message,
              response: error.response?.data,
              status: error.response?.status
            })
          }
        },
        (error) => {
          console.error("Error getting location:", error)
          message.error("Không thể lấy vị trí hiện tại")
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      )
    } else {
      message.error("Trình duyệt không hỗ trợ định vị")
    }
  }

  const mapRideToTrip = (ride) => {
    console.log('[WorkplacePage] Mapping ride to trip:', ride)

    // Extract actual ride data if nested
    const rideData = ride.data || ride

    const mapped = {
      id: rideData.id,
      createdAt: rideData.requestTime || rideData.requestedAt || rideData.createdAt || new Date().toISOString(),
      pickupLocation: {
        address: rideData.pickupAddress || 'Chưa có địa chỉ',
        lat: rideData.pickupLatitude || 0,
        lng: rideData.pickupLongitude || 0,
      },
      dropoffLocation: {
        address: rideData.dropoffAddress || rideData.destinationAddress || 'Chưa có địa chỉ',
        lat: rideData.dropoffLatitude || rideData.destinationLatitude || 0,
        lng: rideData.dropoffLongitude || rideData.destinationLongitude || 0,
      },
      distance: rideData.distance || 0,
      price: rideData.estimatedPrice || rideData.finalPrice || 0,
      customerName: rideData.customerName || rideData.userName || "Khách hàng",
      customerPhone: rideData.customerPhone || rideData.userPhone || "",
      status: rideData.status?.toLowerCase() || 'pending',
      version: rideData.version || 0,
    }

    console.log('[WorkplacePage] Mapped trip:', mapped)
    return mapped
  }

  const handleToggleOnline = async (checked) => {
    // Check if trying to go online without vehicle
    if (checked && !hasVehicle) {
      message.warning("Vui lòng cấu hình thông tin xe trước khi online")
      setShowVehicleModal(true)
      return
    }

    try {
      setLoading(true)
      console.log('[WorkplacePage] Toggling online status to:', checked)
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
      console.log('[WorkplacePage] Accepting trip:', trip)
      await acceptRide(trip.id, trip.version)
      setCurrentTrip({ ...trip, status: "accepted" })
      setPendingTrips(pendingTrips.filter((t) => t.id !== trip.id))
      setShowIncomingModal(false)
      setSelectedTrip(null)
      message.success("Đã nhận chuyến!")
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message || "Không thể nhận chuyến"
      message.error(errorMsg + " Có thể đã có tài xế khác nhận.")
      console.error('[WorkplacePage] Accept ride error:', error)
      loadPendingRides()
    } finally {
      setLoading(false)
    }
  }

  const handleViewTrip = (trip) => {
    console.log('[WorkplacePage] Viewing trip:', trip)
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
        arriving: "DriverArriving",
        arrived: "DriverArrived",
        in_progress: "InProgress",
        completed: "Completed",
      }[status]

      console.log('[WorkplacePage] Updating status to:', apiStatus)

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
      const errorMsg = error.response?.data?.error || error.message || "Không thể cập nhật trạng thái"
      message.error(errorMsg)
      console.error('[WorkplacePage] Update status error:', error)
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
              className={`w-12 h-12 rounded-full flex items-center justify-center ${isOnline ? "bg-green-100" : "bg-gray-100"
                }`}
            >
              <Power
                className={`w-6 h-6 ${isOnline ? "text-green-600" : "text-gray-400"
                  }`}
              />
            </div>
            <div>
              <h3 className="font-semibold">Trạng thái</h3>
              <p className="text-sm text-gray-500">
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

      {/* Debug info - remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="mb-6 bg-blue-50">
          <div className="text-xs space-y-1">
            <div>Online: {isOnline ? 'Yes' : 'No'}</div>
            <div>Has Vehicle: {hasVehicle ? 'Yes' : 'No'}</div>
            <div>Current Trip: {currentTrip ? currentTrip.id : 'None'}</div>
            <div>Pending Trips: {pendingTrips.length}</div>
          </div>
        </Card>
      )}

      {!currentTrip && isOnline && pendingTrips.length > 0 && (
        <Card className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">
              Yêu cầu đặt xe ({pendingTrips.length})
            </h3>
            <Button
              size="small"
              onClick={loadPendingRides}
              icon={<Bell className="w-4 h-4" />}
            >
              Làm mới
            </Button>
          </div>
          <List
            dataSource={pendingTrips}
            renderItem={(trip) => (
              <List.Item
                className="hover:bg-gray-50 cursor-pointer rounded-lg p-4 transition-colors"
                onClick={() => handleViewTrip(trip)}
              >
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">
                        {trip.customerName}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {format(new Date(trip.createdAt), "HH:mm", {
                        locale: vi,
                      })}
                    </span>
                  </div>
                  <div className="flex items-start gap-2 mb-1">
                    <MapPin className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600">
                      {trip.pickupLocation.address}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Navigation className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600">
                      {trip.dropoffLocation.address}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-sm text-gray-500">
                      {trip.distance} km
                    </span>
                    <span className="text-lg font-bold text-green-600">
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
              <h3 className="text-lg font-semibold">
                Chuyến đi hiện tại
              </h3>
              <Tag color="blue">{getStatusText(currentTrip.status)}</Tag>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-gray-400" />
              <span>
                {currentTrip.customerName}
              </span>
              {currentTrip.customerPhone && (
                <>
                  <span className="text-gray-400">•</span>
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span>
                    {currentTrip.customerPhone}
                  </span>
                </>
              )}
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Điểm đón</p>
                <p className="text-sm font-medium">
                  {currentTrip.pickupLocation.address}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Navigation className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Điểm đến</p>
                <p className="text-sm font-medium">
                  {currentTrip.dropoffLocation.address}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 pt-2">
              <div className="flex items-center gap-1">
                <DollarSign className="w-4 h-4 text-green-600" />
                <span className="font-semibold">
                  {(currentTrip.price || 0).toLocaleString()}đ
                </span>
              </div>
              <span className="text-sm text-gray-500">
                {currentTrip.distance} km
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            {currentTrip.status === "accepted" && (
              <Button
                type="primary"
                onClick={() => handleUpdateStatus("arriving")}
                loading={loading}
                className="flex-1"
              >
                Đang đến
              </Button>
            )}
            {currentTrip.status === "arriving" && (
              <Button
                type="primary"
                onClick={() => handleUpdateStatus("arrived")}
                loading={loading}
                className="flex-1"
              >
                Đã đến điểm đón
              </Button>
            )}
            {currentTrip.status === "arrived" && (
              <Button
                type="primary"
                onClick={() => handleUpdateStatus("in_progress")}
                loading={loading}
                className="flex-1"
              >
                Bắt đầu chuyến đi
              </Button>
            )}
            {currentTrip.status === "in_progress" && (
              <Button
                type="primary"
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
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Bell className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="font-semibold mb-2">
              {isOnline
                ? pendingTrips.length > 0
                  ? "Chọn chuyến để nhận"
                  : "Đang chờ chuyến mới"
                : "Bạn đang offline"}
            </h3>
            <p className="text-sm text-gray-500">
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
            <Bell className="w-5 h-5 text-blue-600" />
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
              <User className="w-4 h-4 text-gray-400" />
              <span className="font-medium">
                {selectedTrip.customerName}
              </span>
            </div>
            {selectedTrip.customerPhone && (
              <div className="flex items-center gap-2 mt-1">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-500">
                  {selectedTrip.customerPhone}
                </span>
              </div>
            )}
            {selectedTrip.createdAt && (
              <div className="flex items-center gap-2 mt-1">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-500">
                  {format(new Date(selectedTrip.createdAt), "HH:mm:ss", {
                    locale: vi,
                  })}
                </span>
              </div>
            )}
            <div className="space-y-3 mb-4 mt-4">
              <div className="flex items-start gap-2">
                <MapPin className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Điểm đón</p>
                  <p className="text-sm font-medium">
                    {selectedTrip.pickupLocation.address}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Navigation className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Điểm đến</p>
                  <p className="text-sm font-medium">
                    {selectedTrip.dropoffLocation.address}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-xs text-gray-500">Khoảng cách</p>
                <p className="text-sm font-semibold">
                  {selectedTrip.distance} km
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Thu nhập</p>
                <p className="text-xl font-bold text-green-600">
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
    pending: "Chờ xác nhận",
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