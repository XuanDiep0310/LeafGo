"use client";

import { useEffect } from "react";
import { useSelector } from "react-redux";
import { Card, Empty, Tag } from "antd";
import {
  Calendar,
  MapPin,
  Navigation,
  DollarSign,
  Star,
  User,
  Phone,
} from "lucide-react";
import { mockApi } from "../../services/mockData";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { useState } from "react";

// Driver history page
export default function DriverHistoryPage() {
  const { user } = useSelector((state) => state.auth);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const driverTrips = await mockApi.getTripsByDriverId(user.id);
      setTrips(driverTrips);
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-foreground mb-6">
        Lịch sử chuyến xe
      </h2>

      {trips.length === 0 ? (
        <Card>
          <Empty description="Chưa có chuyến đi nào" />
        </Card>
      ) : (
        <div className="space-y-4">
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
                <Tag color="green">Hoàn thành</Tag>
              </div>

              {trip.userId && (
                <div className="mb-4 p-3 bg-accent rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">
                      Khách hàng: Nguyễn Văn A
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      0123456789
                    </span>
                  </div>
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
                          className={`w-4 h-4 ${
                            i < trip.rating
                              ? "text-yellow-400 fill-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Display user's comment */}
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
      )}
    </div>
  );
}
