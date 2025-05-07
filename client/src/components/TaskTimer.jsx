"use client"

import { useState, useEffect, useRef } from "react"
import api from "../services/api"
import "./TaskTimerS.css"

function TaskTimer({ task, onClose }) {
  const [isRunning, setIsRunning] = useState(false)
  const [time, setTime] = useState(0)
  const [timerHistory, setTimerHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const intervalRef = useRef(null)

  useEffect(() => {
    // Fetch timer history when component mounts
    fetchTimerHistory()

    return () => {
      // Clean up interval on unmount
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  // Update the fetchTimerHistory function to handle API responses correctly
  const fetchTimerHistory = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/tasks/${task.id}/timer/history`)
      if (Array.isArray(response.data)) {
        setTimerHistory(response.data)
      } else {
        setTimerHistory([])
      }
      setLoading(false)
    } catch (err) {
      console.error("Failed to fetch timer history:", err)
      setError("Failed to load timer history")
      setLoading(false)
    }
  }

  // Update the startTimer function
  const startTimer = async () => {
    try {
      await api.post(`/tasks/${task.id}/timer/start`)
      setIsRunning(true)
      setTime(0)

      // Start the timer
      intervalRef.current = setInterval(() => {
        setTime((prevTime) => prevTime + 1)
      }, 1000)

      // Update task status to in_progress
      await api.put(`/tasks/${task.id}/status`, { status: "in_progress" })

      setSuccess("Timer started successfully")
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      console.error("Failed to start timer:", err)
      setError(err.response?.data?.message || "Failed to start timer")
      setTimeout(() => setError(""), 3000)
    }
  }

  // Update the stopTimer function
  const stopTimer = async () => {
    try {
      await api.post(`/tasks/${task.id}/timer/stop`)

      // Stop the timer
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }

      setIsRunning(false)
      setSuccess("Timer stopped successfully")
      setTimeout(() => setSuccess(""), 3000)

      // Refresh timer history
      fetchTimerHistory()
    } catch (err) {
      console.error("Failed to stop timer:", err)
      setError(err.response?.data?.message || "Failed to stop timer")
      setTimeout(() => setError(""), 3000)
    }
  }

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const formatDateTime = (dateTimeString) => {
    const date = new Date(dateTimeString)
    return date.toLocaleString()
  }

  const formatDuration = (seconds) => {
    if (!seconds) return "0m"

    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  return (
    <div className="task-timer-overlay" onClick={onClose}>
      <div className="task-timer" onClick={(e) => e.stopPropagation()}>
        <div className="timer-header">
          <h2>Task Timer</h2>
          <button className="close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="task-info">
          <h3>{task.title}</h3>
          <p className="task-description">{task.description || "No description provided"}</p>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <div className="timer-display">
          <div className="time">{formatTime(time)}</div>
          <div className="timer-controls">
            {!isRunning ? (
              <button className="start-btn" onClick={startTimer}>
                Start Timer
              </button>
            ) : (
              <button className="stop-btn" onClick={stopTimer}>
                Stop Timer
              </button>
            )}
          </div>
        </div>

        <div className="timer-history">
          <h3>Timer History</h3>
          {loading ? (
            <p className="loading">Loading timer history...</p>
          ) : timerHistory.length === 0 ? (
            <p className="no-history">No timer history available</p>
          ) : (
            <table className="history-table">
              <thead>
                <tr>
                  <th>Start Time</th>
                  <th>End Time</th>
                  <th>Duration</th>
                </tr>
              </thead>
              <tbody>
                {timerHistory.map((timer) => (
                  <tr key={timer.id}>
                    <td>{formatDateTime(timer.start_time)}</td>
                    <td>{timer.end_time ? formatDateTime(timer.end_time) : "In progress"}</td>
                    <td>{timer.duration ? formatDuration(timer.duration) : "--"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

export default TaskTimer
