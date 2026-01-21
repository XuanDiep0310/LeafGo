"use client"

import { useEffect, useState } from "react"
import { useSelector } from "react-redux"
import { Card, Statistic, message } from "antd"
import { DollarSign, TrendingUp, Star, Calendar } from "lucide-react"
import { getDriverStatistics, getDriverVehicle } from "../../services/driverService"
import { getUserProfile } from "../../services/userService"

export default function DriverDashboardPage() {
  const { user } = useSelector((state) => state.auth)
  const [userProfile, setUserProfile] = useState(null)
  const [existingVehicle, setExistingVehicle] = useState(null)
  const [stats, setStats] = useState({
    TodayEarnings: 0,
    TodayRides: 0,
    ThisMonthEarnings: 0,
    ThisMonthRides: 0,
    TotalRides: 0,
    AverageRating: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
    fetchUserProfile()
    fetchVehicle()
  }, [])

  const fetchUserProfile = async () => {
    try {
      const profile = await getUserProfile()
      setUserProfile(profile)
    } catch (error) {
      console.error("Error fetching user profile:", error)
    }
  }

  const fetchVehicle = async () => {
    try {
      const vehicle = await getDriverVehicle()
      console.log('[DashboardPage] Vehicle response:', vehicle)

      // Handle different response structures
      let vehicleData = vehicle

      // If nested in vehicle.data
      if (vehicle?.data && typeof vehicle.data === 'object') {
        vehicleData = vehicle.data
      }

      setExistingVehicle(vehicleData)
    } catch (error) {
      console.error("Error fetching vehicle:", error)
      // Don't show error message as vehicle might not be set up yet
      setExistingVehicle(null)
    }
  }

  const fetchStats = async () => {
    try {
      setLoading(true)
      const response = await getDriverStatistics()

      console.log('[DashboardPage] Statistics response:', response)
      console.log('[DashboardPage] Response type:', typeof response)
      console.log('[DashboardPage] Response keys:', Object.keys(response || {}))

      // Handle different response structures
      let data = response

      // If nested in response.data
      if (response?.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
        data = response.data
        console.log('[DashboardPage] Found data in response.data')
      }

      console.log('[DashboardPage] Final extracted data:', data)
      console.log('[DashboardPage] Data keys:', Object.keys(data || {}))

      // Try both PascalCase and camelCase
      setStats({
        TodayEarnings: data?.TodayEarnings || data?.todayEarnings || 0,
        TodayRides: data?.TodayRides || data?.todayRides || 0,
        ThisMonthEarnings: data?.ThisMonthEarnings || data?.thisMonthEarnings || 0,
        ThisMonthRides: data?.ThisMonthRides || data?.thisMonthRides || 0,
        TotalRides: data?.TotalRides || data?.totalRides || 0,
        AverageRating: data?.AverageRating || data?.averageRating || 0,
      })
    } catch (error) {
      console.error("Error fetching stats:", error)
      console.error("Error details:", error.response?.data)
      message.error("Không thể tải thống kê")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Đang tải...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold text-foreground mb-6">Thống kê thu nhập</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <Statistic
            title="Thu nhập hôm nay"
            value={stats.TodayEarnings}
            prefix={<DollarSign className="w-4 h-4" />}
            suffix="đ"
            valueStyle={{ color: "#10b981" }}
          />
        </Card>
        <Card>
          <Statistic
            title="Chuyến hôm nay"
            value={stats.TodayRides}
            prefix={<TrendingUp className="w-4 h-4" />}
            valueStyle={{ color: "#10b981" }}
          />
        </Card>
        <Card>
          <Statistic
            title="Thu nhập tháng"
            value={stats.ThisMonthEarnings}
            prefix={<Calendar className="w-4 h-4" />}
            suffix="đ"
            valueStyle={{ color: "#10b981" }}
          />
        </Card>
        <Card>
          <Statistic
            title="Tổng chuyến"
            value={stats.TotalRides}
            prefix={<Star className="w-4 h-4" />}
            valueStyle={{ color: "#10b981" }}
          />
        </Card>
      </div>

      <Card>
        <h3 className="font-semibold text-foreground mb-4">
          Thông tin tài xế
        </h3>

        {/* Thông tin tài xế */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Họ tên</p>
            <p className="font-medium text-foreground">
              {userProfile?.fullName || user?.fullName}
            </p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-1">Số điện thoại</p>
            <p className="font-medium text-foreground">
              {userProfile?.data?.phoneNumber || user?.phoneNumber}
            </p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-1">Đánh giá</p>
            <p className="font-medium text-foreground">
              ⭐ {stats?.AverageRating?.toFixed(1) || "0.0"} / 5.0
            </p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-1">Số dư</p>
            <p className="font-medium text-primary">
              {(user?.balance || 0).toLocaleString()}đ
            </p>
          </div>
        </div>

        {/* Thông tin xe */}
        <h4 className="font-semibold text-foreground mb-3">
          Thông tin xe
        </h4>

        {existingVehicle ? (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-xs font-semibold text-green-900 mb-2">
              ✓ Xe đang sử dụng
            </p>

            <div className="text-sm text-green-800 space-y-1">
              <p>
                • Loại xe: {existingVehicle.vehicleType?.name || 'N/A'}
              </p>
              <p>
                • Biển số: {existingVehicle.licensePlate || 'N/A'}
              </p>
              <p>
                • Hãng & mẫu: {existingVehicle.vehicleBrand || 'N/A'} {existingVehicle.vehicleModel || ''}
              </p>
              <p>
                • Màu xe: {existingVehicle.vehicleColor || 'N/A'}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Chưa có thông tin xe
          </p>
        )}
      </Card>
    </div>
  )
}