"use client"

import { useState, useEffect } from "react"
import { useNavigate, Navigate } from "react-router-dom"
import Sidebar from "../components/Sidebar"
import EmployeeList from "../components/EmployeeList"
import LeaveRequestsManager from "../components/LeaveRequestsManager"
import NotificationPanel from "../components/NotificationPanel"
import PerformanceEvaluation from "../components/PerformanceEvaluation"
import SalaryTable from "../components/SalaryTable"
import AttendanceTable from "../components/AttendanceTable"
import Clock from "../components/Clock"
import { useAuth } from "../context/AuthContext"
import "./ManagerPageS.css"
import TaskList from "../components/TaskList"

function ManagerPage() {
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
            <h2>Manager Dashboard</h2>
            <div className="dashboard-summary">
              <div className="summary-card">
                <h3>Welcome, {user.username}!</h3>
                <p>Role: Manager</p>
                <p>Today's Date: {new Date().toLocaleDateString()}</p>
              </div>

              <div className="summary-card">
                <h3>Quick Links</h3>
                <ul>
                  <li>
                    <button onClick={() => setActiveComponent("employeeList")}>Manage Employees</button>
                  </li>
                  <li>
                    <button onClick={() => setActiveComponent("attendance")}>View Attendance</button>
                  </li>
                  <li>
                    <button onClick={() => setActiveComponent("leaves")}>Manage Leave Requests</button>
                  </li>
                  <li>
                    <button onClick={() => setActiveComponent("salaries")}>Process Salaries</button>
                  </li>
                  {/* <li>
                    <button onClick={() => setActiveComponent("tasks")}>Manage tasks</button>
                  </li> */}
                </ul>
              </div>
            </div>
          </div>
        )
      case "employeeList":
        return <EmployeeList />
      case "attendance":
        return <AttendanceTable allowMarking={true} />
      case "leaves":
        return <LeaveRequestsManager />
      case "performance":
        return <PerformanceEvaluation />
      case "salaries":
        return <SalaryTable />
      case "notifications":
        return <NotificationPanel />
      case "tasks":
        return <TaskList />
      default:
        return <div className="error-message">Please select a feature from the sidebar.</div>
    }
  }

  if (!user) {
    return <div className="loading-screen">Loading user data...</div>
  }

  if (user.role !== "manager") {
    return <Navigate to="/" replace />
  }

  return (
    <div className="manager-page">
      <Sidebar activeComponent={activeComponent} setActiveComponent={setActiveComponent} userRole="manager" />

      <div className="main-content">
        <header className="page-header">
          <div className="user-info">
            <span className="user-name">Manager: {user.username}</span>
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

export default ManagerPage
