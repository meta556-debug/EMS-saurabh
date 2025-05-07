"use client"

import { useState, useEffect } from "react"
import { useNavigate, Navigate } from "react-router-dom"
import Sidebar from "../components/Sidebar"
import EmployeeList from "../components/EmployeeList"
import NotificationPanel from "../components/NotificationPanel"
import AttendanceTable from "../components/AttendanceTable"
import SalaryTable from "../components/SalaryTable"
import PerformanceEvaluation from "../components/PerformanceEvaluation"
import LeaveRequestsManager from "../components/LeaveRequestsManager"
import Clock from "../components/Clock"
import { useAuth } from "../context/AuthContext"
import "./AdminPageS.css"
import TaskList from "../components/TaskList"

export default function AdminPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [activeComponent, setActiveComponent] = useState("dashboard")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true)
        // You can add any initial data fetching here
        setLoading(false)
      } catch (err) {
        console.error("Error fetching initial data:", err)
        setError("Failed to load dashboard data")
        setLoading(false)
      }
    }

    if (user?.id) {
      fetchInitialData()
    }
  }, [user?.id])

  // Logout handler
  const handleLogout = async () => {
    try {
      await logout()
      navigate("/login")
    } catch (err) {
      console.error("Logout failed:", err)
      alert("Logout failed. Please try again.")
    }
  }

  // Render main page content
  const renderComponent = () => {
    switch (activeComponent) {
      case "dashboard":
        return (
          <div className="dashboard-container">
            <h2>Admin Dashboard</h2>
            <div className="dashboard-summary">
              <div className="summary-card">
                <h3>Welcome, {user.username}!</h3>
                <p>Role: Administrator</p>
                <p>Today's Date: {new Date().toLocaleDateString()}</p>
              </div>

              <div className="summary-card">
                <h3>Quick Links</h3>
                <ul>
                  <li>
                    <button onClick={() => setActiveComponent("manageUsers")}>Manage Users</button>
                  </li>
                  <li>
                    <button onClick={() => setActiveComponent("attendance")}>View Attendance</button>
                  </li>
                  <li>
                    <button onClick={() => setActiveComponent("leaves")}>Manage Leave Requests</button>
                  </li>
                  <li>
                    <button onClick={() => setActiveComponent("salaryTable")}>View Salaries</button>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )
      case "manageUsers":
        return <EmployeeList />
      case "attendance":
        return <AttendanceTable allowMarking={false} />
      case "leaves":
        return <LeaveRequestsManager />
      case "salaryTable":
        return <SalaryTable />
      case "performance":
        return <PerformanceEvaluation />
      case "notifications":
        return <NotificationPanel />
      case "tasks":
        return <TaskList />
      case "manageRoles":
        return (
          <div className="admin-section">
            <h2>Manage User Roles</h2>
            <p>This section will allow you to manage user roles and permissions.</p>
          </div>
        )
      default:
        return <div className="error-message">Select a feature from the sidebar.</div>
    }
  }

  if (!user) {
    return <div className="loading-screen">Loading user data...</div>
  }

  if (user.role !== "admin") {
    return <Navigate to="/" replace />
  }

  return (
    <div className="admin-page">
      <Sidebar activeComponent={activeComponent} setActiveComponent={setActiveComponent} userRole="admin" />

      <div className="main-content">
        <header className="page-header">
          <div className="user-info">
            <span className="user-name">Admin: {user.username}</span>
            <Clock />
          </div>
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </header>

        <main className="page-content">
          {loading ? (
            <div className="loading-screen">Loading dashboard...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : (
            renderComponent()
          )}
        </main>
      </div>
    </div>
  )
}
