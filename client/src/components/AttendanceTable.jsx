"use client"

import { useEffect, useState } from "react"
import { useAuth } from "../context/AuthContext"
import api from "../services/api"
import AttendancePopup from "./AttendancePopup"
import "./AttendanceTableS.css"

function AttendanceTable({ allowMarking = false }) {
  const { user, refreshUser } = useAuth()
  const [own, setOwn] = useState([])
  const [team, setTeam] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [status, setStatus] = useState(null)
  const [successMessage, setSuccessMessage] = useState("")
  const [showPopup, setShowPopup] = useState(false)
  const [accessBlocked, setAccessBlocked] = useState(false)

  const fetchAttendanceData = async () => {
    if (!user) return
    setLoading(true)
    setError("")
    try {
      let response

      // Fetch attendance only for authorized roles
      if (user.role === "admin" || user.role === "manager") {
        response = await api.get("/attendance")
      } else if (user.role === "employee") {
        response = await api.get(`/attendance/${user.id}`)
      } else {
        setError("Unauthorized role")
        return
      }

      const data = response.data
      const mine = data.filter((r) => r.employee_id === user.id)
      setOwn(mine)

      if (user.role === "manager") {
        setTeam(data.filter((r) => r.employee_id !== user.id))
      } else if (user.role === "admin") {
        setTeam(data)
      }

      // Check today's status
      try {
        const todayResponse = await api.get(`/attendance/today/${user.id}`)
        if (todayResponse.data && todayResponse.data.status) {
          setStatus(todayResponse.data.status)
          if (todayResponse.data.status !== "check-in") {
            setAccessBlocked(true)
          }
        } else {
          setStatus(null)
          setAccessBlocked(false)
        }
      } catch (err) {
        console.error("Error fetching today's status:", err)
        setStatus(null)
        setAccessBlocked(false)
      }
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.message || "Could not load attendance.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAttendanceData()

    // Set up auto-refresh every minute
    const intervalId = setInterval(() => {
      fetchAttendanceData()
    }, 60000)

    return () => clearInterval(intervalId)
  }, [user])

  const handleAttendanceClick = () => {
    setShowPopup(true)
  }

  const handlePopupClose = () => {
    setShowPopup(false)
    fetchAttendanceData() // Refresh data when popup closes
  }

  const render = (rows, showId = false) => {
    if (!rows.length) return <p className="no-records">No records found</p>
    return (
      <table className="attendance-table">
        <thead>
          <tr>
            {showId && <th>Employee ID</th>}
            {showId && <th>Name</th>}
            {showId && <th>Department</th>}
            <th>Date</th>
            <th>Check-In</th>
            <th>Check-Out</th>
            <th>Hours</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={`${r.employee_id}-${r.date}`}>
              {showId && <td>{r.employee_id}</td>}
              {showId && (
                <td>
                  {r.first_name} {r.last_name}
                </td>
              )}
              {showId && <td>{r.department || "N/A"}</td>}
              <td>{new Date(r.date).toLocaleDateString()}</td>
              <td>{r.check_in ? new Date(r.check_in).toLocaleTimeString() : "--"}</td>
              <td>{r.check_out ? new Date(r.check_out).toLocaleTimeString() : "--"}</td>
              <td>{r.hours_worked ?? "--"}</td>
              <td className={`status-${r.status}`}>{r.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    )
  }

  if (loading) return <p className="loading-message">Loading attendance data...</p>

  return (
    <div className="attendance-table-container">
      <h2 className="attendance-title">Attendance Dashboard</h2>

      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}

      {/* Only show attendance marking for employees and managers */}
      {allowMarking && (user.role === "employee" || user.role === "manager") && (
        <div className="attendance-actions">
          <h3>Today's Attendance</h3>
          <div className="attendance-status-container">
            <div className="attendance-status">
              {status ? (
                <p>
                  Your status today: <span className={`status-badge ${status}`}>{status}</span>
                </p>
              ) : (
                <p>You haven't marked attendance today</p>
              )}
            </div>
            <button className="attendance-status-btn" onClick={handleAttendanceClick} disabled={accessBlocked}>
              Attendance Status
            </button>
          </div>
          {accessBlocked && status !== "check-in" && (
            <p className="attendance-note">You have already marked your attendance for today.</p>
          )}
        </div>
      )}

      {/* Attendance Popup */}
      {showPopup && (
        <AttendancePopup
          onClose={handlePopupClose}
          status={status}
          setStatus={setStatus}
          setAccessBlocked={setAccessBlocked}
        />
      )}

      {/* Admin sees all attendance */}
      {user.role === "admin" && (
        <div className="attendance-section">
          <h3>All Employee Attendance Records</h3>
          {render(team, true)}
        </div>
      )}

      {/* Manager sees their attendance and team's attendance */}
      {user.role === "manager" && (
        <>
          <div className="attendance-section">
            <h3>Your Attendance Records</h3>
            {render(own)}
          </div>
          <div className="attendance-section">
            <h3>Team Attendance Records</h3>
            {render(team, true)}
          </div>
        </>
      )}

      {/* Employee sees only their attendance */}
      {user.role === "employee" && (
        <div className="attendance-section">
          <h3>Your Attendance Records</h3>
          {render(own)}
        </div>
      )}
    </div>
  )
}

export default AttendanceTable
