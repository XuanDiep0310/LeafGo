"use client"

import { useEffect, useState } from "react"
import { Card, Empty, Tag, Pagination, message, DatePicker, Select } from "antd"
import {
  Calendar,
  MapPin,
  Navigation,
  DollarSign,
  Star,
  User,
  Phone,
} from "lucide-react"
import { getRideHistory } from "../../services/driverService"
import { format } from "date-fns"
import { vi } from "date-fns/locale"

const { RangePicker } = DatePicker
const { Option } = Select

export default function DriverHistoryPage() {
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  })
  const [filters, setFilters] = useState({
    status: null,
    dateRange: null,
  })

  useEffect(() => {
    fetchHistory()
  }, [pagination.current, pagination.pageSize, filters])

  const fetchHistory = async () => {
    try {
      setLoading(true)
      const params = {
        Page: pagination.current,
        PageSize: pagination.pageSize,
      }

      if (filters.status) {
        params.Status = filters.status
      }

      if (filters.dateRange && filters.dateRange.length === 2) {
        params.FromDate = filters.dateRange[0].toISOString()
        params.ToDate = filters.dateRange[1].toISOString()
      }

      const response = await getRideHistory(params)

      // Handle both direct data and wrapped response
      const items = response.data?.items || response.items || []
      if (!items || items.length === 0) {
        setTrips([])
        setPagination({
          ...pagination,
          total: 0,
        })
        return
      }

      const mappedTrips = items.map((ride) => ({
        id: ride.id,
        createdAt: ride.requestTime || ride.createdAt,
        userId: ride.customerId,
        customerName: ride.customerName || "Khách hàng",
        customerPhone: ride.customerPhone || "",
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
        price: ride.finalPrice || ride.estimatedPrice,
        status: ride.status,
        rating: ride.rating,
        comment: ride.comment,
      }))

      setTrips(mappedTrips)
      const totalCount = response.data?.totalCount || response.totalCount || 0
      setPagination({
        ...pagination,
        total: totalCount,
      })
    } catch (error) {
      console.error("Error fetching history:", error)
      message.error("Không thể tải lịch sử chuyến đi")
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (page, pageSize) => {
    setPagination({
      ...pagination,
      current: page,
      pageSize: pageSize,
    })
  }

  const handleStatusChange = (value) => {
    setFilters({
      ...filters,
      status: value,
    })
    setPagination({
      ...pagination,
      current: 1,
    })
  }

  const handleDateRangeChange = (dates) => {
    setFilters({
      ...filters,
      dateRange: dates,
    })
    setPagination({
      ...pagination,
      current: 1,
    })
  }

  if (loading && trips.length === 0) {
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
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-foreground mb-6">
        Lịch sử chuyến xe
      </h2>

      <Card className="mb-6">
        <div className="flex flex-wrap gap-4">
          <Select
            placeholder="Lọc theo trạng thái"
            allowClear
            style={{ width: 200 }}
            onChange={handleStatusChange}
            value={filters.status}
          >
            <Option value="Completed">Hoàn thành</Option>
            <Option value="Cancelled">Đã hủy</Option>
          </Select>

          <RangePicker
            format="DD/MM/YYYY"
            placeholder={["Từ ngày", "Đến ngày"]}
            onChange={handleDateRangeChange}
            value={filters.dateRange}
          />
        </div>
      </Card>

      {trips.length === 0 ? (
        <Card>
          <Empty description="Chưa có chuyến đi nào" />
        </Card>
      ) : (
        <>
          <div className="space-y-4 mb-6">
            {trips.map((trip) => (
              <Card key={trip.id} className="hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(trip.createdAt), "dd/MM/yyyy HH:mm", {
                        locale: vi,
                      })}
                    </span>
                  </div>
                  <Tag color={trip.status === "Completed" ? "green" : "red"}>
                    {trip.status === "Completed" ? "Hoàn thành" : "Đã hủy"}
                  </Tag>
                </div>

                {trip.userId && (
                  <div className="mb-4 p-3 bg-accent rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">
                        Khách hàng: {trip.customerName}
                      </span>
                    </div>
                    {trip.customerPhone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {trip.customerPhone}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-3 mb-4">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Điểm đón</p>
                      <p className="text-sm text-foreground font-medium">
                        {trip.pickupLocation.address}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Navigation className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Điểm đến</p>
                      <p className="text-sm text-foreground font-medium">
                        {trip.dropoffLocation.address}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-border">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4 text-primary" />
                      <span className="font-semibold text-primary">
                        {trip.price.toLocaleString()}đ
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {trip.distance} km
                    </span>
                  </div>
                  {trip.rating && (
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${i < trip.rating
                              ? "text-yellow-400 fill-yellow-400"
                              : "text-gray-300"
                              }`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {trip.comment && (
                  <div className="mt-4 p-3 bg-secondary/50 rounded-lg border-l-2 border-primary">
                    <p className="text-xs font-semibold text-muted-foreground mb-1">
                      Nhận xét từ khách:
                    </p>
                    <p className="text-sm text-foreground italic">
                      "{trip.comment}"
                    </p>
                  </div>
                )}
              </Card>
            ))}
          </div>

          <div className="flex justify-center">
            <Pagination
              current={pagination.current}
              pageSize={pagination.pageSize}
              total={pagination.total}
              onChange={handlePageChange}
              showSizeChanger
              showTotal={(total) => `Tổng ${total} chuyến`}
              pageSizeOptions={["10", "20", "50"]}
            />
          </div>
        </>
      )}
    </div>
  )
}