"use client"

import { useEffect, useState } from "react"
import { useSelector } from "react-redux"
import { Card, Statistic, message } from "antd"
import { DollarSign, TrendingUp, Star, Calendar } from "lucide-react"
import { getDriverStatistics } from "../../services/driverService"

export default function DriverDashboardPage() {
  const { user } = useSelector((state) => state.auth)
  const [stats, setStats] = useState({
    todayEarnings: 0,
    todayTrips: 0,
    monthEarnings: 0,
    monthTrips: 0,
    totalTrips: 0,
    averageRating: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const data = await getDriverStatistics()

      setStats({
        todayEarnings: data.todayEarnings || 0,
        todayTrips: data.todayTrips || 0,
        monthEarnings: data.monthEarnings || 0,
        monthTrips: data.monthTrips || 0,
        totalTrips: data.totalTrips || 0,
        averageRating: data.averageRating || 0,
      })
    } catch (error) {
      console.error("Error fetching stats:", error)
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
            value={stats.todayEarnings}
            prefix={<DollarSign className="w-4 h-4" />}
            suffix="đ"
            valueStyle={{ color: "#10b981" }}
          />
        </Card>
        <Card>
          <Statistic
            title="Chuyến hôm nay"
            value={stats.todayTrips}
            prefix={<TrendingUp className="w-4 h-4" />}
            valueStyle={{ color: "#10b981" }}
          />
        </Card>
        <Card>
          <Statistic
            title="Thu nhập tháng"
            value={stats.monthEarnings}
            prefix={<Calendar className="w-4 h-4" />}
            suffix="đ"
            valueStyle={{ color: "#10b981" }}
          />
        </Card>
        <Card>
          <Statistic
            title="Tổng chuyến"
            value={stats.totalTrips}
            prefix={<Star className="w-4 h-4" />}
            valueStyle={{ color: "#10b981" }}
          />
        </Card>
      </div>

      <Card>
        <h3 className="font-semibold text-foreground mb-4">Thông tin tài xế</h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Họ tên</p>
            <p className="font-medium text-foreground">{user?.fullName}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Số điện thoại</p>
            <p className="font-medium text-foreground">{user?.phone}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Đánh giá</p>
            <p className="font-medium text-foreground">
              ⭐ {stats.averageRating.toFixed(1)} / 5.0
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Số dư</p>
            <p className="font-medium text-primary">
              {(user?.balance || 0).toLocaleString()}đ
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}