"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import api from "../services/api"
import "./TaskFormS.css"

function TaskForm({ onClose, onSubmit, employees }) {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    employee_id: "",
    priority: "medium",
    due_date: "",
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Set default due date to tomorrow
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    setFormData((prev) => ({
      ...prev,
      due_date: tomorrow.toISOString().split("T")[0],
    }))
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    // Clear error when field is updated
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.title.trim()) newErrors.title = "Title is required"
    if (!formData.employee_id) newErrors.employee_id = "Employee is required"
    if (!formData.priority) newErrors.priority = "Priority is required"
    if (!formData.due_date) newErrors.due_date = "Due date is required"

    // Validate due date is in the future
    const dueDate = new Date(formData.due_date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (dueDate < today) {
      newErrors.due_date = "Due date must be in the future"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      const response = await api.post("/tasks", formData)
      if (response.status === 201) {
        onSubmit(response.data)
        onClose()
      } else {
        throw new Error("Unexpected server response")
      }
    } catch (error) {
      console.error("Failed to create task:", error)
      setErrors((prev) => ({
        ...prev,
        submit: error.response?.data?.message || "Failed to create task. Please try again.",
      }))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="task-form-overlay" onClick={onClose}>
      <div className="task-form" onClick={(e) => e.stopPropagation()}>
        <h2>Assign New Task</h2>
        <form onSubmit={handleSubmit}>
          {errors.submit && <div className="error-message">{errors.submit}</div>}

          <div className="form-group">
            <label htmlFor="title">Task Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter task title"
            />
            {errors.title && <div className="error">{errors.title}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter task description"
              rows="3"
            />
          </div>

          <div className="form-group">
            <label htmlFor="employee_id">Assign To *</label>
            <select id="employee_id" name="employee_id" value={formData.employee_id} onChange={handleChange}>
              <option value="">Select Employee</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.first_name} {emp.last_name} - {emp.position}
                </option>
              ))}
            </select>
            {errors.employee_id && <div className="error">{errors.employee_id}</div>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="priority">Priority *</label>
              <select id="priority" name="priority" value={formData.priority} onChange={handleChange}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              {errors.priority && <div className="error">{errors.priority}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="due_date">Due Date *</label>
              <input
                type="date"
                id="due_date"
                name="due_date"
                value={formData.due_date}
                onChange={handleChange}
                min={new Date().toISOString().split("T")[0]}
              />
              {errors.due_date && <div className="error">{errors.due_date}</div>}
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? "Creating..." : "Create Task"}
            </button>
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TaskForm
