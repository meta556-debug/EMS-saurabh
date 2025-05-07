const db = require("../db/sql")

const tasksController = {
  // Get all tasks (for managers and admins)
  getAlltasks: async (req, res) => {
    try {
      const result = await db.query(`
        SELECT t.*, 
               e.first_name || ' ' || e.last_name as employee_name,
               e.department,
               u.first_name || ' ' || u.last_name as assigned_by_name
        FROM tasks t
        JOIN employees e ON t.employee_id = e.id
        LEFT JOIN employees u ON t.assigned_by = u.id
        ORDER BY t.created_at DESC
      `)

      res.status(200).json(result.rows)
    } catch (error) {
      console.error("Error fetching tasks:", error)
      res.status(500).json({ message: "Failed to fetch tasks", error: error.message })
    }
  },

  // Get tasks for a specific employee
  getEmployeetasks: async (req, res) => {
    const { employeeId } = req.params

    try {
      const result = await db.query(
        `
        SELECT t.*, 
               e.first_name || ' ' || e.last_name as employee_name,
               e.department,
               u.first_name || ' ' || u.last_name as assigned_by_name
        FROM tasks t
        JOIN employees e ON t.employee_id = e.id
        LEFT JOIN employees u ON t.assigned_by = u.id
        WHERE t.employee_id = $1
        ORDER BY t.created_at DESC
      `,
        [employeeId],
      )

      res.status(200).json(result.rows)
    } catch (error) {
      console.error("Error fetching employee tasks:", error)
      res.status(500).json({ message: "Failed to fetch employee tasks", error: error.message })
    }
  },

  // Create a new task (managers and admins)
  createTask: async (req, res) => {
    const { employee_id, title, description, priority, due_date } = req.body

    if (!employee_id || !title || !due_date) {
      return res.status(400).json({ message: "Missing required fields" })
    }

    try {
      const result = await db.query(
        `
        INSERT INTO tasks (
          employee_id, title, description, priority, due_date, 
          status, assigned_by, time_spent
        )
        VALUES ($1, $2, $3, $4, $5, 'assigned', $6, 0)
        RETURNING *
      `,
        [employee_id, title, description, priority, due_date, req.session.user.id],
      )

      // Create a notification for the employee
      const employeeQuery = await db.query(
        `
        SELECT e.id, u.id as user_id 
        FROM employees e 
        JOIN users u ON e.user_id = u.id 
        WHERE e.id = $1
      `,
        [employee_id],
      )

      if (employeeQuery.rows.length > 0) {
        const employeeUserId = employeeQuery.rows[0].user_id

        await db.query(
          `
          INSERT INTO notifications (
            user_id, sender_id, title, message, type
          )
          VALUES ($1, $2, $3, $4, 'alert')
        `,
          [employeeUserId, req.session.user.id, "New Task Assigned", `You have been assigned a new task: ${title}`],
        )
      }

      res.status(201).json(result.rows[0])
    } catch (error) {
      console.error("Error creating task:", error)
      res.status(500).json({ message: "Failed to create task", error: error.message })
    }
  },

  // Update task status
  updatetaskstatus: async (req, res) => {
    const { id } = req.params
    const { status } = req.body

    if (!status || !["assigned", "in_progress", "completed"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" })
    }

    try {
      const result = await db.query(
        `
        UPDATE tasks 
        SET status = $1, updated_at = NOW() 
        WHERE id = $2 
        RETURNING *
      `,
        [status, id],
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Task not found" })
      }

      res.status(200).json(result.rows[0])
    } catch (error) {
      console.error("Error updating task status:", error)
      res.status(500).json({ message: "Failed to update task status", error: error.message })
    }
  },

  // Delete a task
  deleteTask: async (req, res) => {
    const { id } = req.params

    try {
      // First, delete any timer records associated with this task
      await db.query("DELETE FROM task_timers WHERE task_id = $1", [id])

      // Then delete the task
      const result = await db.query("DELETE FROM tasks WHERE id = $1 RETURNING *", [id])

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Task not found" })
      }

      res.status(200).json({ message: "Task deleted successfully" })
    } catch (error) {
      console.error("Error deleting task:", error)
      res.status(500).json({ message: "Failed to delete task", error: error.message })
    }
  },

  // Start task timer
  startTaskTimer: async (req, res) => {
    const { taskId } = req.params

    try {
      // Check if there's already an active timer for this task
      const activeTimer = await db.query(
        `
        SELECT * FROM task_timers 
        WHERE task_id = $1 AND end_time IS NULL
      `,
        [taskId],
      )

      if (activeTimer.rows.length > 0) {
        return res.status(400).json({ message: "There is already an active timer for this task" })
      }

      // Create a new timer
      const result = await db.query(
        `
        INSERT INTO task_timers (task_id, start_time)
        VALUES ($1, NOW())
        RETURNING *
      `,
        [taskId],
      )

      // Update task status to in_progress if it's not already
      await db.query(
        `
        UPDATE tasks 
        SET status = 'in_progress', updated_at = NOW() 
        WHERE id = $1 AND status != 'completed'
      `,
        [taskId],
      )

      res.status(201).json(result.rows[0])
    } catch (error) {
      console.error("Error starting task timer:", error)
      res.status(500).json({ message: "Failed to start task timer", error: error.message })
    }
  },

  // Stop task timer
  stopTaskTimer: async (req, res) => {
    const { taskId } = req.params

    try {
      // Find the active timer
      const activeTimer = await db.query(
        `
        SELECT * FROM task_timers 
        WHERE task_id = $1 AND end_time IS NULL
      `,
        [taskId],
      )

      if (activeTimer.rows.length === 0) {
        return res.status(400).json({ message: "No active timer found for this task" })
      }

      const timer = activeTimer.rows[0]

      // Update the timer with end time
      const result = await db.query(
        `
        UPDATE task_timers 
        SET end_time = NOW(), 
            duration = EXTRACT(EPOCH FROM (NOW() - start_time))
        WHERE id = $1
        RETURNING *
      `,
        [timer.id],
      )

      const updatedTimer = result.rows[0]

      // Update the task's total time spent
      await db.query(
        `
        UPDATE tasks 
        SET time_spent = time_spent + $1, updated_at = NOW() 
        WHERE id = $2
      `,
        [updatedTimer.duration, taskId],
      )

      res.status(200).json(updatedTimer)
    } catch (error) {
      console.error("Error stopping task timer:", error)
      res.status(500).json({ message: "Failed to stop task timer", error: error.message })
    }
  },

  // Get task timer history
  getTaskTimerHistory: async (req, res) => {
    const { taskId } = req.params

    try {
      const result = await db.query(
        `
        SELECT * FROM task_timers 
        WHERE task_id = $1 
        ORDER BY start_time DESC
      `,
        [taskId],
      )

      res.status(200).json(result.rows)
    } catch (error) {
      console.error("Error fetching task timer history:", error)
      res.status(500).json({ message: "Failed to fetch task timer history", error: error.message })
    }
  },
}

module.exports = tasksController
