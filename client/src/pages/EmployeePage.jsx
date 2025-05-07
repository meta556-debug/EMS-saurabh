"use client"

import { useState, useEffect } from "react"
import { useNavigate, Navigate } from "react-router-dom"
import Sidebar from "../components/Sidebar"
import LeaveForm from "../components/LeaveForm"
import NotificationPanel from "../components/NotificationPanel"
import SalaryTable from "../components/SalaryTable"
import AttendanceTable from "../components/AttendanceTable"
import Clock from "../components/Clock"
import { useAuth } from "../context/AuthContext"
import "./EmployeePageS.css"
import TaskList from "../components/TaskList" // Assuming TaskList component exists
import PerformanceEvaluation from "../components/PerformanceEvaluation" // Assuming PerformanceEvaluation component exists

export default function EmployeePage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [activeComponent, setActiveComponent] = useState("attendance")
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
            <h2>Employee Dashboard</h2>
            <div className="dashboard-summary">
              <div className="summary-card">
                <h3>Welcome, {user.username}!</h3>
                <p>Role: Employee</p>
                <p>Today's Date: {new Date().toLocaleDateString()}</p>
              </div>

              <div className="summary-card">
                <h3>Quick Links</h3>
                <ul>
                  <li>
                    <button onClick={() => setActiveComponent("attendance")}>Mark Attendance</button>
                  </li>
                  <li>
                    <button onClick={() => setActiveComponent("leaves")}>Apply for Leave</button>
                  </li>
                  <li>
                    <button onClick={() => setActiveComponent("salaries")}>View Salary</button>
                  </li>
                  {/* <li>
                    <button onClick={() => setActiveComponent("tasks")}>My tasks</button>
                  </li> */}
                </ul>
              </div>
            </div>
          </div>
        )
      case "attendance":
        return <AttendanceTable allowMarking={true} />
      case "leaves":
        return <LeaveForm />
      case "salaries":
        return <SalaryTable />
      case "notifications":
        return <NotificationPanel />
      case "performance":
        return <PerformanceEvaluation />
      case "tasks":
        return <TaskList />
      default:
        return <div className="error-message">Please select a feature from the sidebar.</div>
    }
  }

  if (!user) {
    return <div className="loading-screen">Loading user data...</div>
  }

  if (user.role !== "employee") {
    return <Navigate to="/" replace />
  }

  return (
    <div className="employee-page">
      <Sidebar activeComponent={activeComponent} setActiveComponent={setActiveComponent} userRole="employee" />

      <div className="main-content">
        <header className="page-header">
          <div className="user-info">
            <span className="user-name">Employee: {user.username}</span>
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
