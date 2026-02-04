"use client"

import { useEffect } from "react"
import { Outlet, Link, useLocation } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import { logout } from "../store/slices/authSlice"
import { LayoutDashboard, Users, Route, DollarSign, User, LogOut, Leaf } from "lucide-react"
import { Button } from "antd"

export default function AdminLayout() {
  const location = useLocation()
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)

  const menuItems = [
    { path: "/admin/dashboard", icon: LayoutDashboard, label: "Tổng quan" },
    { path: "/admin/users", icon: Users, label: "Người dùng" },
    { path: "/admin/trips", icon: Route, label: "Chuyến đi" },
    { path: "/admin/tariff", icon: DollarSign, label: "Gói cước" },
    { path: "/admin/profile", icon: User, label: "Tài khoản" },
  ]

  const handleLogout = () => {
    dispatch(logout())
  }

  // Helper: Build full avatar URL
  const getAvatarUrl = (avatar) => {
    if (!avatar) return "/placeholder.svg"
    if (avatar.startsWith("http")) return avatar
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000"
    return `${baseUrl}${avatar.startsWith("/") ? avatar : "/" + avatar}`
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card flex flex-col">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <Leaf className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-foreground">Leaf Go</h1>
              <p className="text-xs text-muted-foreground">Quản trị viên</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-accent hover:text-accent-foreground"
                      }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="p-4 border-t">
          <div className="flex items-center gap-3 mb-4">
            <img
              src={getAvatarUrl(user?.avatar)}
              alt={user?.fullName}
              className="w-10 h-10 rounded-full object-cover bg-gray-200"
              onError={(e) => {
                e.target.src = "/placeholder.svg"
              }}
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{user?.fullName}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
          <Button onClick={() => dispatch(logout())} className="w-full">
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
