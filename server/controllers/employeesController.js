const db = require("../db/sql")

const employeesController = {
  // Get all employees (Admin, Manager)
  getAllEmployees: async (req, res) => {
    try {
      if (["admin", "manager"].includes(req.session.user.role)) {
        const result = await db.query("SELECT * FROM employees")
        return res.json(result.rows)
      }
      return res.status(403).json({ message: "Unauthorized" })
    } catch (error) {
      console.error("Error fetching employees:", error)
      res.status(500).json({ message: "Failed to fetch employees", error: error.message })
    }
  },

  // Get employee by ID (Admin, Manager, or the employee themselves)
  getEmployeeById: async (req, res) => {
    const { id } = req.params
    try {
      const result = await db.query("SELECT * FROM employees WHERE id = $1", [id])
      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Employee not found" })
      }

      // Allow Admin, Manager, or the employee themselves to view their data
      if (req.session.user.role === "admin" || req.session.user.role === "manager" || req.session.user.id === id) {
        return res.json(result.rows[0])
      }

      return res.status(403).json({ message: "Unauthorized" })
    } catch (error) {
      console.error("Error fetching employee:", error)
      res.status(500).json({ message: "Failed to fetch employee", error: error.message })
    }
  },

  // Create a new employee (Admin, Manager only)
  createEmployee: async (req, res) => {
    if (!["admin", "manager"].includes(req.session.user.role)) {
      return res
        .status(403)
        .json({ message: "Unauthorized", error: "You do not have permission to create an employee" })
    }

    const { user_id, first_name, last_name, email, phone, address, position, department, joining_date, base_salary } =
      req.body

    try {
      const result = await db.query(
        `INSERT INTO employees 
        (user_id, first_name, last_name, email, phone, address, position, department, joining_date, base_salary) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
        RETURNING *`,
        [user_id, first_name, last_name, email, phone, address, position, department, joining_date, base_salary],
      )
      res.status(201).json(result.rows[0])
    } catch (error) {
      console.error("Error creating employee:", error)
      res.status(500).json({ message: "Failed to create employee", error: error.message })
    }
  },

  // Update an existing employee (Admin, Manager only)
  updateEmployee: async (req, res) => {
    if (!["admin", "manager"].includes(req.session.user.role)) {
      return res
        .status(403)
        .json({ message: "Unauthorized", error: "You do not have permission to update an employee" })
    }

    const { id } = req.params
    const { user_id, first_name, last_name, email, phone, address, position, department, joining_date, base_salary } =
      req.body

    try {
      const result = await db.query(
        `UPDATE employees 
         SET user_id = $1, first_name = $2, last_name = $3, email = $4, phone = $5, address = $6, 
             position = $7, department = $8, joining_date = $9, base_salary = $10 
         WHERE id = $11 RETURNING *`,
        [user_id, first_name, last_name, email, phone, address, position, department, joining_date, base_salary, id],
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Employee not found" })
      }

      res.json(result.rows[0])
    } catch (error) {
      console.error("Error updating employee:", error)
      res.status(500).json({ message: "Failed to update employee", error: error.message })
    }
  },

  // Delete an employee (Admin only)
  deleteEmployee: async (req, res) => {
    if (!req.session.user || req.session.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Unauthorized", error: "You do not have permission to delete an employee" })
    }

    const { id } = req.params
    try {
      const result = await db.query("DELETE FROM employees WHERE id = $1 RETURNING *", [id])
      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Employee not found" })
      }
      res.json({ message: "Employee deleted successfully" })
    } catch (error) {
      console.error("Error deleting employee:", error)
      res.status(500).json({ message: "Failed to delete employee", error: error.message })
    }
  },
}

module.exports = employeesController
