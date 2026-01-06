# 🍃 Leaf Go

> A modern Ride-hailing Web Application built with ReactJS and ASP.NET Core 9.

![Project Status](https://img.shields.io/badge/status-development-orange)
![License](https://img.shields.io/badge/license-MIT-blue)

**Leaf Go** is a simplified technology-driven taxi booking platform designed for learning and portfolio demonstration. It connects passengers with drivers in real-time, featuring map integration, route calculation, and a comprehensive management dashboard.

## 🛠 Tech Stack

### Frontend
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Redux](https://img.shields.io/badge/Redux-593D88?style=for-the-badge&logo=redux&logoColor=white)
![Leaflet](https://img.shields.io/badge/Leaflet-199900?style=for-the-badge&logo=leaflet&logoColor=white)

### Backend
![.NET](https://img.shields.io/badge/.NET%209-512BD4?style=for-the-badge&logo=dotnet&logoColor=white)
![C#](https://img.shields.io/badge/C%23-239120?style=for-the-badge&logo=c-sharp&logoColor=white)
![SQL Server](https://img.shields.io/badge/SQL%20Server-CC2927?style=for-the-badge&logo=microsoft-sql-server&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

## ✨ Features

### 👤 User (Passenger)
- **Booking:** Select pick-up/drop-off points via map interaction.
- **Estimation:** View estimated price and distance before booking.
- **Tracking:** Real-time trip status updates.
- **History:** View past trips and rate drivers.

### 🚗 Driver
- **Work Mode:** Toggle online/offline status.
- **Trip Management:** Accept or reject ride requests.
- **Dashboard:** View income and completed trip statistics.

### 🛡 Admin
- **User Management:** Manage Passengers and Drivers (CRUD).
- **Monitoring:** View all active/completed trips.
- **Analytics:** Statistics on revenue and system usage.

## 📂 Project Structure

The solution follows the **Clean Architecture** principles:

```bash
LeafGo/
├── 📂 backend/               # ASP.NET Core Web API (.NET 9)
│   ├── LeafGo.API            # Entry point
│   ├── LeafGo.Application    # Business logic & Interfaces
│   ├── LeafGo.Domain         # Entities & Enterprise logic
│   └── LeafGo.Infrastructure # DB context, External services
├── 📂 frontend/              # ReactJS + Vite Application
└── 📂 db/                    # SQL Scripts & Migrations
```

## 🚀 Getting Started

### Prerequisites

* Node.js (v18+)
* .NET 9 SDK
* SQL Server

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/XuanDiep0310/LeafGo.git
cd LeafGo

```


2. **Setup Frontend**
```bash
cd frontend
npm install
# Create .env file based on .env.example
npm run dev

```


3. **Setup Backend**
```bash
cd backend
# Update ConnectionString in appsettings.json
dotnet restore
dotnet run --project LeafGo.API

```



## 🗺 Roadmap

* [x] UI/UX Design & Frontend Implementation (Mock Data)
* [x] Backend Scaffolding (Clean Architecture)
* [x] Database Implementation (EF Core)
* [x] Authentication (JWT & Identity)
* [ ] Real-time Communication (SignalR)
* [ ] Payment Gateway Integration

## 👥 Contributors

* **Cao Xuan Diep** - *Project Lead & Backend Developer*
* **Luong Thi Kim Ngan** - *Frontend Developer & Tester*
* **Pham Hai Yen** - *Frontend Developer & Tester*

---

Made with ❤️ by the Leaf Go Team.
