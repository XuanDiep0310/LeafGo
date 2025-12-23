"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchTripHistory, rateTrip } from "../../store/slices/bookingSlice";
import { Card, Empty, Rate, Modal, Input, message, Tag } from "antd";
import {
  Calendar,
  MapPin,
  Navigation,
  DollarSign,
  Star,
  User,
  Phone,
  Car,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

const { TextArea } = Input;

// Implements FR-10, FR-11
export default function HistoryPage() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { trips, loading } = useSelector((state) => state.booking);
  const [ratingModal, setRatingModal] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  useEffect(() => {
    // FR-10: Fetch trip history
    dispatch(fetchTripHistory(user.id));
  }, [dispatch, user.id]);

  // FR-11: Open rating modal
  const handleOpenRating = (trip) => {
    setSelectedTrip(trip);
    setRating(trip.rating || 5);
    setComment(trip.comment || "");
    setRatingModal(true);
  };

  // FR-11: Submit rating
  const handleSubmitRating = async () => {
    try {
      await dispatch(
        rateTrip({
          tripId: selectedTrip.id,
          rating,
          comment,
        })
      ).unwrap();
      message.success("Đánh giá thành công!");
      setRatingModal(false);
    } catch (error) {
      message.error("Đánh giá thất bại");
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      completed: "green",
      cancelled: "red",
      in_progress: "blue",
    };
    return colors[status] || "default";
  };

  const getStatusText = (status) => {
    const texts = {
      completed: "Hoàn thành",
      cancelled: "Đã hủy",
      in_progress: "Đang đi",
    };
    return texts[status] || status;
  };

  if (loading && trips.length === 0) {
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
        Lịch sử chuyến đi
      </h2>

      {trips.length === 0 ? (
        <Card>
          <Empty description="Bạn chưa có chuyến đi nào" />
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
                <Tag color={getStatusColor(trip.status)}>
                  {getStatusText(trip.status)}
                </Tag>
              </div>

              {trip.driverId && trip.status === "completed" && (
                <div className="mb-4 p-3 bg-accent rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">
                      Tài xế: Trần Văn B
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      0987654321
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Car className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Honda Wave - Đỏ - 29A-12345
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
                    <span className="font-semibold text-foreground">
                      {trip.price.toLocaleString()}đ
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {trip.distance} km
                  </span>
                </div>
                {trip.status === "completed" && (
                  <div className="flex items-center gap-2">
                    {trip.rating ? (
                      <div className="flex items-center gap-2">
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
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenRating(trip)}
                      >
                        <Star className="w-4 h-4 mr-1" />
                        Đánh giá
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Display user's comment */}
              {trip.comment && (
                <div className="mt-4 p-3 bg-secondary/50 rounded-lg border-l-2 border-primary">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">
                    Nhận xét của bạn:
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

      {/* FR-11: Rating Modal */}
      <Modal
        title="Đánh giá tài xế"
        open={ratingModal}
        onOk={handleSubmitRating}
        onCancel={() => setRatingModal(false)}
        okText="Gửi đánh giá"
        cancelText="Hủy"
      >
        <div className="py-4">
          <div className="mb-4 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Bạn đánh giá tài xế như thế nào?
            </p>
            <div className="flex justify-center gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  onClick={() => setRating(value)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-10 h-10 ${
                      value <= rating
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Nhận xét
            </label>
            <TextArea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Chia sẻ trải nghiệm về tài xế..."
              rows={4}
              maxLength={200}
              showCount
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
