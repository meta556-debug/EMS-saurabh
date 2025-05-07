"use client"

import { useState } from "react"
import api from "../services/api"
import { useAuth } from "../context/AuthContext"
import "./AttendancePopups.css"

function AttendancePopup({ onClose, status, setStatus, setAccessBlocked }) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  // Modify the handleAttendance function to use the current time
  const handleAttendance = async (action) => {
    setError("")
    setLoading(true)
    try {
      let response
      const currentTime = new Date().toISOString()

      if (action === "checkin") {
        response = await api.post("/attendance/checkin", {
          employeeId: user.id,
          checkInTime: currentTime, // Use the current time
        })
      } else if (action === "checkout") {
        response = await api.put("/attendance/checkout", {
          employeeId: user.id,
          checkOutTime: currentTime, // Use the current time
        })
      } else if (action === "absent") {
        response = await api.post("/attendance/absent", {
          employeeId: user.id,
          absentTime: currentTime, // Use the current time
        })
      }

      const map = { checkin: "check-in", checkout: "check-out", absent: "absent" }
      const newStatus = map[action]
      setStatus(newStatus)

      if (newStatus !== "check-in") setAccessBlocked(true)
      setSuccessMessage(`Successfully marked ${newStatus}.`)

      // Auto close after success
      setTimeout(() => {
        onClose()
      }, 2000)
    } catch (err) {
      console.error(`Failed to ${action}:`, err)
      setError(err.response?.data?.message || `Failed to ${action}.`)
    } finally {
      setLoading(false)
    }
  }

  const isCheckedIn = status === "check-in"
  const isCheckedOutOrAbsent = status === "check-out" || status === "absent"

  return (
    <div className="attendance-popup-overlay" onClick={onClose}>
      <div className="attendance-popup" onClick={(e) => e.stopPropagation()}>
        <header className="popup-header">
          <h3>Mark Your Attendance</h3>
          <button onClick={onClose} className="popup-close-btn" disabled={loading}>
            &times;
          </button>
        </header>
        <div className="popup-body">
          {error && <div className="popup-error">{error}</div>}
          {successMessage ? (
            <div className="popup-success">{successMessage}</div>
          ) : (
            <>
              <p>Please select your attendance option for today:</p>
              <div className="attendance-options">
                <button
                  onClick={() => handleAttendance("checkin")}
                  disabled={loading || isCheckedIn || isCheckedOutOrAbsent}
                  className="popup-btn checkin"
                >
                  Check In
                </button>
                <button
                  onClick={() => handleAttendance("checkout")}
                  disabled={loading || !isCheckedIn}
                  className="popup-btn checkout"
                >
                  Check Out
                </button>
                <button
                  onClick={() => handleAttendance("absent")}
                  disabled={loading || !!status}
                  className="popup-btn absent"
                >
                  Mark Absent
                </button>
              </div>
              <div className="attendance-status-info">
                {status ? (
                  <p>
                    Current status: <span className={`status-text ${status}`}>{status}</span>
                  </p>
                ) : (
                  <p>No attendance marked for today</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default AttendancePopup
