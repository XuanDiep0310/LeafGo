"use client"

import { useEffect, useState } from "react"
import { Card, Statistic } from "antd"
import { Users, Car, Route, DollarSign, TrendingUp, Star } from "lucide-react"
import { mockApi } from "../../services/mockData"

// Implements FR-20
export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDrivers: 0,
    totalTrips: 0,
    totalRevenue: 0,
    todayTrips: 0,
    todayRevenue: 0,
  })

  const [topDrivers, setTopDrivers] = useState([])

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const [users, trips] = await Promise.all([mockApi.getAllUsers(), mockApi.getAllTrips()])

      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const todayTrips = trips.filter((trip) => {
        const tripDate = new Date(trip.createdAt)
        tripDate.setHours(0, 0, 0, 0)
        return tripDate.getTime() === today.getTime() && trip.status === "completed"
      })

      const completedTrips = trips.filter((t) => t.status === "completed")
      const totalRevenue = completedTrips.reduce((sum, trip) => sum + trip.price, 0)
      const todayRevenue = todayTrips.reduce((sum, trip) => sum + trip.price, 0)

      // Calculate top drivers
      const driverStats = {}
      completedTrips.forEach((trip) => {
        if (!driverStats[trip.driverId]) {
          driverStats[trip.driverId] = { trips: 0, revenue: 0 }
        }
        driverStats[trip.driverId].trips++
        driverStats[trip.driverId].revenue += trip.price
      })

      const drivers = users.filter((u) => u.role === "driver")
      const topDriversList = drivers
        .map((driver) => ({
          ...driver,
          stats: driverStats[driver.id] || { trips: 0, revenue: 0 },
        }))
        .sort((a, b) => b.stats.revenue - a.stats.revenue)
        .slice(0, 5)

      setStats({
        totalUsers: users.filter((u) => u.role === "user").length,
        totalDrivers: drivers.length,
        totalTrips: completedTrips.length,
        totalRevenue,
        todayTrips: todayTrips.length,
        todayRevenue,
      })

      setTopDrivers(topDriversList)
    } catch (error) {
      console.error("Error fetching stats:", error)
    }
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
            title="Tổng chuyến đi"
            value={stats.totalTrips}
            prefix={<Route className="w-4 h-4" />}
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
            title="Chuyến hôm nay"
            value={stats.todayTrips}
            prefix={<TrendingUp className="w-4 h-4" />}
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
      <Card>
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <Star className="w-5 h-5 text-primary" />
          Top tài xế xuất sắc
        </h3>
        <div className="space-y-4">
          {topDrivers.map((driver, index) => (
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
                    ⭐ {driver.rating} • {driver.stats.trips} chuyến
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-primary">{driver.stats.revenue.toLocaleString()}đ</p>
                <p className="text-xs text-muted-foreground">Doanh thu</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
