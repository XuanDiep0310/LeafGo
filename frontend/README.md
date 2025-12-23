# Leaf Go - Ứng dụng đặt xe công nghệ

Website đặt xe công nghệ với giao diện tối giản, tông màu xanh lá thân thiện với môi trường.

## 🚀 Công nghệ sử dụng

- **Core**: ReactJS + Vite + React Router DOM
- **UI**: Ant Design + Tailwind CSS v4
- **State**: Redux Toolkit
- **Map**: React-Leaflet (OpenStreetMap)
- **Icons**: Lucide React

## 📦 Cài đặt

```bash
# Cài đặt dependencies
npm install

# Chạy development server
npm run dev

# Build production
npm run build
```

## 👥 Tài khoản demo

### Khách hàng
- Username: `user@leafgo.com`
- Password: `123456`

### Tài xế
- Username: `driver@leafgo.com`
- Password: `123456`

### Admin
- Username: `admin@leafgo.com`
- Password: `admin123`

## ✨ Tính năng

### Phân hệ Khách hàng (User)
- **FR-05**: Chọn điểm đón/điểm đến trên bản đồ
- **FR-06**: Tính giá chuyến đi tự động
- **FR-07**: Đặt xe và tìm tài xế
- **FR-08, FR-09**: Theo dõi trạng thái chuyến đi realtime
- **FR-10**: Xem lịch sử chuyến đi
- **FR-11**: Đánh giá tài xế sau chuyến đi

### Phân hệ Tài xế (Driver)
- **FR-12**: Bật/tắt trạng thái Online/Offline
- **FR-13**: Nhận thông báo chuyến mới và chấp nhận/từ chối
- **FR-14**: Cập nhật tiến trình chuyến đi (Đang đến → Đã đến → Đang đi → Hoàn thành)
- **FR-15**: Dashboard thống kê thu nhập
- Xem lịch sử chuyến xe và đánh giá

### Phân hệ Quản trị viên (Admin)
- **FR-16**: CRUD tài khoản User/Driver
- **FR-17**: Khóa/Mở khóa tài khoản
- **FR-18**: Xem toàn bộ lịch sử chuyến đi hệ thống
- **FR-19**: Chỉnh sửa gói cước (Giá mở cửa, Giá/km)
- **FR-20**: Dashboard tổng hợp (Doanh thu, Top Driver)

### Authentication & Profile (Tất cả role)
- **FR-01**: Đăng nhập, Đăng ký, Đăng xuất
- **FR-02**: Quên mật khẩu (OTP), Đổi mật khẩu
- **FR-04, FR-54**: Quản lý thông tin cá nhân

## 📁 Cấu trúc thư mục

```
src/
├── pages/
│   ├── auth/              # Login, Register, ForgotPassword
│   ├── user/              # BookingPage, HistoryPage
│   ├── driver/            # WorkplacePage, DashboardPage, HistoryPage
│   ├── admin/             # DashboardPage, UsersPage, TripsPage, TariffPage
│   └── shared/            # ProfilePage
├── layouts/               # UserLayout, DriverLayout, AdminLayout
├── store/
│   └── slices/            # authSlice, bookingSlice, appSlice
├── services/              # mockData.js, authService.js
└── components/ui/         # Shadcn UI components
```

## 🎨 Design System

- **Primary Color**: Green (#10b981) - Thân thiện với môi trường
- **Typography**: System UI fonts
- **Border Radius**: 8px
- **Spacing**: Tailwind spacing scale

## 🔧 Mock Data & Services

Ứng dụng sử dụng mock data để giả lập backend:

- **Users Database**: Lưu trữ thông tin user, driver, admin
- **Trips Database**: Lưu lịch sử chuyến đi
- **Tariff Config**: Cấu hình giá cước (Giá mở cửa, Giá/km)
- **Auth Logic**: Giả lập login, register, forgot password với delay 1s

## 📝 Ghi chú

- Mọi chức năng đều được comment mã FR tương ứng trong code
- Sử dụng Redux Toolkit để quản lý state toàn cục
- Map được tích hợp với React-Leaflet và OpenStreetMap
- Responsive design cho mọi thiết bị
- Hỗ trợ tiếng Việt với Ant Design locale

## 📄 License

MIT
