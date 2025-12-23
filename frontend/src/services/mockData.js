// Mock Database - Simulates backend storage
// Implements data storage for users, trips, and tariff

let users = [
  {
    id: "user1",
    username: "user@leafgo.com",
    password: "123456",
    email: "user@leafgo.com",
    fullName: "Nguyễn Văn A",
    phone: "0123456789",
    role: "user",
    balance: 500000,
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=user1",
    isActive: true,
    createdAt: new Date("2024-01-01"),
  },
  {
    id: "driver1",
    username: "driver@leafgo.com",
    password: "123456",
    email: "driver@leafgo.com",
    fullName: "Trần Văn B",
    phone: "0987654321",
    role: "driver",
    balance: 2000000,
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=driver1",
    isActive: true,
    vehicleInfo: {
      licensePlate: "29A-12345",
      vehicleType: "Xe máy",
      brand: "Honda Wave",
      color: "Đỏ",
    },
    driverStatus: "offline", // online, offline
    rating: 4.8,
    totalTrips: 245,
    createdAt: new Date("2024-01-01"),
  },
  {
    id: "driver2",
    username: "driver2@leafgo.com",
    password: "123456",
    email: "driver2@leafgo.com",
    fullName: "Lê Thị C",
    phone: "0912345678",
    role: "driver",
    balance: 1500000,
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=driver2",
    isActive: true,
    vehicleInfo: {
      licensePlate: "30B-67890",
      vehicleType: "Xe máy",
      brand: "Yamaha Sirius",
      color: "Xanh",
    },
    driverStatus: "offline",
    rating: 4.9,
    totalTrips: 312,
    createdAt: new Date("2024-01-15"),
  },
  {
    id: "admin1",
    username: "admin@leafgo.com",
    password: "admin123",
    email: "admin@leafgo.com",
    fullName: "Admin Leaf Go",
    phone: "0909090909",
    role: "admin",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=admin1",
    isActive: true,
    createdAt: new Date("2023-12-01"),
  },
];

const trips = [
  {
    id: "trip1",
    userId: "user1",
    driverId: "driver1",
    status: "completed",
    pickupLocation: {
      address: "Số 1 Đại Cồ Việt, Hai Bà Trưng, Hà Nội",
      lat: 21.0069,
      lng: 105.8433,
    },
    dropoffLocation: {
      address: "Số 54 Triều Khúc, Thanh Xuân, Hà Nội",
      lat: 20.9948,
      lng: 105.8096,
    },
    distance: 8.5,
    price: 42500,
    rating: 5,
    comment: "Tài xế thân thiện, lái xe an toàn!",
    createdAt: new Date("2024-12-15T08:30:00"),
    completedAt: new Date("2024-12-15T09:00:00"),
  },
  {
    id: "trip2",
    userId: "user1",
    driverId: "driver2",
    status: "completed",
    pickupLocation: {
      address: "Số 144 Xuân Thủy, Cầu Giấy, Hà Nội",
      lat: 21.0378,
      lng: 105.7826,
    },
    dropoffLocation: {
      address: "Big C Thăng Long, Hà Nội",
      lat: 21.0516,
      lng: 105.7789,
    },
    distance: 3.2,
    price: 20000,
    rating: 4,
    comment: "Tốt",
    createdAt: new Date("2024-12-17T14:15:00"),
    completedAt: new Date("2024-12-17T14:35:00"),
  },
];

let tariff = {
  id: "tariff1",
  baseFare: 10000, // Giá mở cửa
  pricePerKm: 5000, // Giá mỗi km
  minFare: 15000, // Giá tối thiểu
  vehicleTypes: [
    {
      id: "bike",
      name: "Xe máy",
      baseFare: 10000,
      pricePerKm: 5000,
      minFare: 15000,
    },
    {
      id: "car4",
      name: "Ô tô 4 chỗ",
      baseFare: 15000,
      pricePerKm: 7000,
      minFare: 25000,
    },
    {
      id: "car7",
      name: "Ô tô 7 chỗ",
      baseFare: 20000,
      pricePerKm: 9000,
      minFare: 35000,
    },
  ],
  updatedAt: new Date(),
};

// Helper to generate unique IDs
const generateId = (prefix) =>
  `${prefix}${Date.now()}${Math.random().toString(36).substr(2, 9)}`;

// Mock API functions
export const mockApi = {
  // Users
  getAllUsers: () => {
    return Promise.resolve([...users]);
  },

  getUserById: (id) => {
    const user = users.find((u) => u.id === id);
    return Promise.resolve(user ? { ...user } : null);
  },

  createUser: (userData) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newUser = {
          id: generateId("user"),
          ...userData,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.username}`,
          balance: 0,
          isActive: true,
          createdAt: new Date(),
        };
        users.push(newUser);
        resolve({ ...newUser });
      }, 1000);
    });
  },

  updateUser: (id, userData) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const index = users.findIndex((u) => u.id === id);
        if (index !== -1) {
          users[index] = { ...users[index], ...userData };
          resolve({ ...users[index] });
        } else {
          resolve(null);
        }
      }, 1000);
    });
  },

  deleteUser: (id) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        users = users.filter((u) => u.id !== id);
        resolve({ success: true });
      }, 500);
    });
  },

  toggleUserStatus: (id) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const user = users.find((u) => u.id === id);
        if (user) {
          user.isActive = !user.isActive;
          resolve({ ...user });
        } else {
          resolve(null);
        }
      }, 500);
    });
  },

  // Trips
  getAllTrips: () => {
    return Promise.resolve([...trips]);
  },

  getTripsByUserId: (userId) => {
    const userTrips = trips.filter((t) => t.userId === userId);
    return Promise.resolve([...userTrips]);
  },

  getTripsByDriverId: (driverId) => {
    const driverTrips = trips.filter((t) => t.driverId === driverId);
    return Promise.resolve([...driverTrips]);
  },

  createTrip: (tripData) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newTrip = {
          id: generateId("trip"),
          ...tripData,
          status: "finding",
          createdAt: new Date().toISOString(),
        };
        trips.push(newTrip);
        resolve({ ...newTrip });
      }, 1000);
    });
  },

  updateTrip: (id, tripData) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const index = trips.findIndex((t) => t.id === id);
        if (index !== -1) {
          trips[index] = { ...trips[index], ...tripData };
          resolve({ ...trips[index] });
        } else {
          resolve(null);
        }
      }, 1000);
    });
  },

  // Tariff
  getTariff: () => {
    return Promise.resolve({ ...tariff });
  },

  updateTariff: (tariffData) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        tariff = { ...tariff, ...tariffData, updatedAt: new Date() };
        resolve({ ...tariff });
      }, 1000);
    });
  },

  // Driver Status
  updateDriverStatus: (driverId, status) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const driver = users.find(
          (u) => u.id === driverId && u.role === "driver"
        );
        if (driver) {
          driver.driverStatus = status;
          resolve({ ...driver });
        } else {
          resolve(null);
        }
      }, 500);
    });
  },

  getOnlineDrivers: () => {
    const onlineDrivers = users.filter(
      (u) => u.role === "driver" && u.driverStatus === "online"
    );
    return Promise.resolve([...onlineDrivers]);
  },

  // Get vehicle types
  getVehicleTypes: () => {
    return Promise.resolve([...tariff.vehicleTypes]);
  },
};

// Calculate trip price based on tariff and vehicle type
export const calculateTripPrice = (distance, vehicleTypeId = "bike") => {
  const vehicleType = tariff.vehicleTypes.find((vt) => vt.id === vehicleTypeId);
  const config = vehicleType || tariff.vehicleTypes[0];
  const price = config.baseFare + distance * config.pricePerKm;
  return Math.max(price, config.minFare);
};

// Mock locations for autocomplete
export const mockLocations = [
  {
    id: 1,
    address: "Số 1 Đại Cồ Việt, Hai Bà Trưng, Hà Nội",
    lat: 21.0069,
    lng: 105.8433,
  },
  {
    id: 2,
    address: "Số 144 Xuân Thủy, Cầu Giấy, Hà Nội",
    lat: 21.0378,
    lng: 105.7826,
  },
  {
    id: 3,
    address: "Số 54 Triều Khúc, Thanh Xuân, Hà Nội",
    lat: 20.9948,
    lng: 105.8096,
  },
  {
    id: 4,
    address: "Big C Thăng Long, Hà Nội",
    lat: 21.0516,
    lng: 105.7789,
  },
  {
    id: 5,
    address: "Hồ Hoàn Kiếm, Hà Nội",
    lat: 21.0285,
    lng: 105.8542,
  },
  {
    id: 6,
    address: "Sân bay Nội Bài, Hà Nội",
    lat: 21.2187,
    lng: 105.8067,
  },
  {
    id: 7,
    address: "Bến xe Mỹ Đình, Hà Nội",
    lat: 21.0285,
    lng: 105.7768,
  },
  {
    id: 8,
    address: "Vincom Mega Mall Royal City, Hà Nội",
    lat: 21.0024,
    lng: 105.8093,
  },
];
