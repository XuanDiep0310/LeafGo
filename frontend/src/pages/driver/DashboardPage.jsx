"use client"

import { useEffect, useState } from "react"
import { useSelector } from "react-redux"
import { Card, Statistic } from "antd"
import { DollarSign, TrendingUp, Star, Calendar } from "lucide-react"
import { mockApi } from "../../services/mockData"

// Implements FR-15
export default function DriverDashboardPage() {
  const { user } = useSelector((state) => state.auth)
  const [stats, setStats] = useState({
    todayEarnings: 0,
    todayTrips: 0,
    monthEarnings: 0,
    monthTrips: 0,
  })

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const trips = await mockApi.getTripsByDriverId(user.id)
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const todayTrips = trips.filter((trip) => {
        const tripDate = new Date(trip.createdAt)
        tripDate.setHours(0, 0, 0, 0)
        return tripDate.getTime() === today.getTime() && trip.status === "completed"
      })

      const thisMonth = trips.filter((trip) => {
        const tripDate = new Date(trip.createdAt)
        return (
          tripDate.getMonth() === today.getMonth() &&
          tripDate.getFullYear() === today.getFullYear() &&
          trip.status === "completed"
        )
      })

      setStats({
        todayEarnings: todayTrips.reduce((sum, trip) => sum + trip.price, 0),
        todayTrips: todayTrips.length,
        monthEarnings: thisMonth.reduce((sum, trip) => sum + trip.price, 0),
        monthTrips: thisMonth.length,
      })
    } catch (error) {
      console.error("Error fetching stats:", error)
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold text-foreground mb-6">Thống kê thu nhập</h2>

      {/* FR-15: Dashboard statistics */}
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
            value={user?.totalTrips || 0}
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
            <p className="font-medium text-foreground">⭐ {user?.rating || 0} / 5.0</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Số dư</p>
            <p className="font-medium text-primary">{(user?.balance || 0).toLocaleString()}đ</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
