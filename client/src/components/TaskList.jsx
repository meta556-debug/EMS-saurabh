"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import api from "../services/api"
import TaskForm from "./TaskForm"
import TaskTimer from "./TaskTimer"
import "./TaskListS.css"

function TaskList() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [activeTask, setActiveTask] = useState(null)
  const [showTimer, setShowTimer] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [filter, setFilter] = useState("all") // all, assigned, in_progress, completed, overdue

  // Update the fetchTasks function to handle API responses correctly
  const fetchTasks = async () => {
    setLoading(true)
    setError("")
    try {
      let response
      if (user.role === "manager" || user.role === "admin") {
        response = await api.get("/tasks")
      } else {
        // For employees, fetch only their tasks
        const employeeData = await api.get(`/employees?userId=${user.id}`)
        const employeeId = employeeData.data.find((emp) => emp.user_id === user.id)?.id
        if (employeeId) {
          response = await api.get(`/tasks/${employeeId}`)
        } else {
          throw new Error("Employee record not found")
        }
      }

      if (response.data) {
        setTasks(response.data)
      } else {
        setTasks([])
      }
    } catch (err) {
      console.error("Failed to fetch tasks:", err)
      setError(err.response?.data?.message || "Failed to load tasks. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const fetchEmployees = async () => {
    if (user.role !== "manager" && user.role !== "admin") return
    try {
      const response = await api.get("/employees")
      setEmployees(response.data)
    } catch (err) {
      console.error("Failed to fetch employees:", err)
    }
  }

  useEffect(() => {
    if (user) {
      fetchTasks()
      fetchEmployees()
    }
  }, [user])

  const handleCreateTask = (newTask) => {
    setTasks((prev) => [newTask, ...prev])
    setSuccessMessage("Task created successfully")
    setTimeout(() => setSuccessMessage(""), 3000)
  }

  const handleUpdateStatus = async (taskId, newStatus) => {
    try {
      await api.put(`/tasks/${taskId}/status`, { status: newStatus })
      setTasks((prev) =>
        prev.map((task) => (task.id === taskId ? { ...task, status: newStatus, updated_at: new Date() } : task)),
      )
      setSuccessMessage(`Task status updated to ${newStatus}`)
      setTimeout(() => setSuccessMessage(""), 3000)
    } catch (err) {
      console.error("Failed to update task status:", err)
      setError(err.response?.data?.message || "Failed to update task status. Please try again.")
    }
  }

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return

    try {
      await api.delete(`/tasks/${taskId}`)
      setTasks((prev) => prev.filter((task) => task.id !== taskId))
      setSuccessMessage("Task deleted successfully")
      setTimeout(() => setSuccessMessage(""), 3000)
    } catch (err) {
      console.error("Failed to delete task:", err)
      setError(err.response?.data?.message || "Failed to delete task. Please try again.")
    }
  }

  const handleStartTimer = (task) => {
    setActiveTask(task)
    setShowTimer(true)
  }

  const handleTimerClose = () => {
    setShowTimer(false)
    setActiveTask(null)
    fetchTasks() // Refresh tasks to get updated time spent
  }

  const getStatusClass = (status) => {
    switch (status) {
      case "assigned":
        return "status-assigned"
      case "in_progress":
        return "status-in-progress"
      case "completed":
        return "status-completed"
      case "overdue":
        return "status-overdue"
      default:
        return ""
    }
  }

  const formatTimeSpent = (seconds) => {
    if (!seconds) return "0h 0m"
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  const formatDueDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  const isOverdue = (dueDate) => {
    const now = new Date()
    const due = new Date(dueDate)
    return due < now
  }

  const filteredTasks = tasks.filter((task) => {
    if (filter === "all") return true
    if (filter === "overdue") return isOverdue(task.due_date) && task.status !== "completed"
    return task.status === filter
  })

  return (
    <div className="task-list-container">
      <div className="task-list-header">
        <h2>Task Management</h2>
        {(user.role === "manager" || user.role === "admin") && (
          <button className="add-task-btn" onClick={() => setShowForm(true)}>
            Assign New Task
          </button>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}

      <div className="task-filters">
        <button className={`filter-btn ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>
          All
        </button>
        <button className={`filter-btn ${filter === "assigned" ? "active" : ""}`} onClick={() => setFilter("assigned")}>
          Assigned
        </button>
        <button
          className={`filter-btn ${filter === "in_progress" ? "active" : ""}`}
          onClick={() => setFilter("in_progress")}
        >
          In Progress
        </button>
        <button
          className={`filter-btn ${filter === "completed" ? "active" : ""}`}
          onClick={() => setFilter("completed")}
        >
          Completed
        </button>
        <button className={`filter-btn ${filter === "overdue" ? "active" : ""}`} onClick={() => setFilter("overdue")}>
          Overdue
        </button>
      </div>

      {loading ? (
        <div className="loading-message">Loading tasks...</div>
      ) : filteredTasks.length === 0 ? (
        <div className="no-tasks">No tasks found</div>
      ) : (
        <div className="tasks-grid">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              className={`task-card ${getStatusClass(task.status)} ${
                isOverdue(task.due_date) && task.status !== "completed" ? "overdue" : ""
              }`}
            >
              <div className="task-header">
                <h3 className="task-title">{task.title}</h3>
                <div className={`task-priority priority-${task.priority}`}>
                  {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                </div>
              </div>

              <div className="task-description">{task.description || "No description provided"}</div>

              <div className="task-meta">
                {user.role === "manager" || user.role === "admin" ? (
                  <div className="task-assignee">
                    <span className="meta-label">Assigned to:</span> {task.employee_name || "Unknown"}
                  </div>
                ) : (
                  <div className="task-assignee">
                    <span className="meta-label">Assigned by:</span> {task.assigned_by_name || "Unknown"}
                  </div>
                )}

                <div className="task-due-date">
                  <span className="meta-label">Due:</span> {formatDueDate(task.due_date)}
                  {isOverdue(task.due_date) && task.status !== "completed" && (
                    <span className="overdue-badge">Overdue</span>
                  )}
                </div>

                <div className="task-time-spent">
                  <span className="meta-label">Time spent:</span> {formatTimeSpent(task.time_spent)}
                </div>
              </div>

              <div className="task-status">
                <span className="meta-label">Status:</span>
                <span className={`status-badge ${getStatusClass(task.status)}`}>
                  {task.status.replace("_", " ").charAt(0).toUpperCase() + task.status.replace("_", " ").slice(1)}
                </span>
              </div>

              <div className="task-actions">
                {user.role === "employee" && task.status !== "completed" && (
                  <button className="timer-btn" onClick={() => handleStartTimer(task)}>
                    {task.status === "in_progress" ? "Continue Working" : "Start Working"}
                  </button>
                )}

                {task.status !== "completed" && (
                  <button className="complete-btn" onClick={() => handleUpdateStatus(task.id, "completed")}>
                    Mark Complete
                  </button>
                )}

                {(user.role === "manager" || user.role === "admin") && (
                  <button className="delete-btn" onClick={() => handleDeleteTask(task.id)}>
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && <TaskForm onClose={() => setShowForm(false)} onSubmit={handleCreateTask} employees={employees} />}

      {showTimer && activeTask && <TaskTimer task={activeTask} onClose={handleTimerClose} />}
    </div>
  )
}

export default TaskList
