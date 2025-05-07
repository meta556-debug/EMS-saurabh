const express = require("express")
const router = express.Router()
const employeeController = require("../controllers/employeesController")
const auth = require("../middleware/authMiddleware")

// Middleware for Admin or Manager access
const isAdminOrManager = (req, res, next) => {
  const role = req.session?.user?.role
  if (role === "admin" || role === "manager") {
    return next()
  }
  return res.status(403).json({ message: "Access denied: Admin or Manager role required" })
}

// Middleware for Admin, Manager, or Self access
const isAdminManagerOrSelf = (req, res, next) => {
  const sessionUser = req.session.user
  const requestedId = Number.parseInt(req.params.id)
  if (sessionUser.role === "admin" || sessionUser.role === "manager" || sessionUser.id === requestedId) {
    return next()
  }
  return res.status(403).json({ message: "Access denied: Not authorized to access this employee's data" })
}

// Get all employees (Admin and Manager only)
router.get("/", auth.isAuthenticated, isAdminOrManager, employeeController.getAllEmployees)

// Get a specific employee by ID (Admin, Manager, or Self)
router.get("/:id", auth.isAuthenticated, isAdminManagerOrSelf, employeeController.getEmployeeById)

// Create a new employee (Admin and Manager)
router.post("/", auth.isAuthenticated, isAdminOrManager, employeeController.createEmployee)

// Update an employee (Admin and Manager)
router.put("/:id", auth.isAuthenticated, isAdminOrManager, employeeController.updateEmployee)

// Delete an employee (Admin only)
router.delete("/:id", auth.isAuthenticated, auth.isAdmin, employeeController.deleteEmployee)

module.exports = router
