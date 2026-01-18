"use client"

import { useEffect, useState } from "react"
import { Card, Statistic, Spin, message } from "antd"
import { Users, Car, Route, DollarSign, TrendingUp, Star } from "lucide-react"
import { getStatistics } from "../../services/adminService"

// Implements FR-20
export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStatistics()
  }, [])

  const fetchStatistics = async () => {
    try {
      setLoading(true)
      const response = await getStatistics()

      if (response.success) {
        setStats(response.data)
      } else {
        message.error(response.message || 'Lỗi khi tải thống kê')
      }
    } catch (error) {
      console.error("Error fetching statistics:", error)
      message.error(error.response?.data?.error || 'Không thể tải dữ liệu thống kê')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Spin size="large" tip="Đang tải dữ liệu..." />
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="p-6">
        <p className="text-center text-muted-foreground">Không có dữ liệu</p>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h2 className="text-2xl font-bold text-foreground mb-6">Tổng quan hệ thống</h2>

      {/* FR-20: Dashboard statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <Card>
          <Statistic
            title="Tổng khách hàng"
            value={stats.totalUsers}
            prefix={<Users className="w-4 h-4" />}
            valueStyle={{ color: "#10b981" }}
          />
        </Card>
        <Card>
          <Statistic
            title="Tổng tài xế"
            value={stats.totalDrivers}
            prefix={<Car className="w-4 h-4" />}
            valueStyle={{ color: "#10b981" }}
          />
        </Card>
        <Card>
          <Statistic
            title="Tài xế online"
            value={stats.onlineDrivers}
            prefix={<Car className="w-4 h-4" />}
            valueStyle={{ color: "#3b82f6" }}
          />
        </Card>
        <Card>
          <Statistic
            title="Tổng chuyến hoàn thành"
            value={stats.totalCompletedRides}
            prefix={<Route className="w-4 h-4" />}
            valueStyle={{ color: "#10b981" }}
          />
        </Card>
        <Card>
          <Statistic
            title="Chuyến đang chờ"
            value={stats.totalPendingRides}
            prefix={<Route className="w-4 h-4" />}
            valueStyle={{ color: "#f59e0b" }}
          />
        </Card>
        <Card>
          <Statistic
            title="Chuyến hôm nay"
            value={stats.todayRides}
            prefix={<TrendingUp className="w-4 h-4" />}
            valueStyle={{ color: "#10b981" }}
          />
        </Card>
        <Card>
          <Statistic
            title="Doanh thu hôm nay"
            value={stats.todayRevenue}
            prefix={<DollarSign className="w-4 h-4" />}
            suffix="đ"
            valueStyle={{ color: "#10b981" }}
          />
        </Card>
        <Card>
          <Statistic
            title="Doanh thu tháng này"
            value={stats.thisMonthRevenue}
            prefix={<DollarSign className="w-4 h-4" />}
            suffix="đ"
            valueStyle={{ color: "#10b981" }}
          />
        </Card>
        <Card>
          <Statistic
            title="Tổng doanh thu"
            value={stats.totalRevenue}
            prefix={<DollarSign className="w-4 h-4" />}
            suffix="đ"
            valueStyle={{ color: "#10b981" }}
          />
        </Card>
      </div>

      {/* FR-20: Top Drivers */}
      <Card className="mb-6">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <Star className="w-5 h-5 text-primary" />
          Top tài xế xuất sắc
        </h3>
        <div className="space-y-4">
          {stats.topDrivers && stats.topDrivers.length > 0 ? (
            stats.topDrivers.map((driver, index) => (
              <div key={driver.id} className="flex items-center justify-between p-4 bg-accent rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <img
                    src={driver.avatar || "/placeholder.svg"}
                    alt={driver.fullName}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <p className="font-medium text-foreground">{driver.fullName}</p>
                    <p className="text-sm text-muted-foreground">
                      ⭐ {driver.averageRating.toFixed(1)} • {driver.totalRides} chuyến
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-primary">{driver.totalEarnings.toLocaleString()}đ</p>
                  <p className="text-xs text-muted-foreground">Doanh thu</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-muted-foreground">Chưa có dữ liệu</p>
          )}
        </div>
      </Card>

      {/* Revenue by Month Chart */}
      {stats.revenueByMonth && stats.revenueByMonth.length > 0 && (
        <Card className="mb-6">
          <h3 className="font-semibold text-foreground mb-4">Doanh thu theo tháng</h3>
          <div className="space-y-2">
            {stats.revenueByMonth.map((item, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-accent rounded">
                <span className="font-medium">{item.month}</span>
                <div className="text-right">
                  <p className="font-bold text-primary">{item.revenue.toLocaleString()}đ</p>
                  <p className="text-xs text-muted-foreground">{item.totalRides} chuyến</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Rides by Status */}
      {stats.ridesByStatus && stats.ridesByStatus.length > 0 && (
        <Card>
          <h3 className="font-semibold text-foreground mb-4">Chuyến đi theo trạng thái</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.ridesByStatus.map((item, index) => (
              <div key={index} className="p-4 bg-accent rounded-lg text-center">
                <p className="text-2xl font-bold text-primary">{item.count}</p>
                <p className="text-sm text-muted-foreground mt-1">{item.status}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}