"use client"

import { useState } from "react"
import {
  FaBars,
  FaTimes,
  FaUserAlt,
  FaCalendarCheck,
  FaFileAlt,
  FaDollarSign,
  FaChartLine,
  FaBell,
  FaUsersCog,
  FaHome,
  FaTasks,
} from "react-icons/fa"
import "./Sidebars.css"

export default function Sidebar({ activeComponent, setActiveComponent, userRole }) {
  const [isOpen, setIsOpen] = useState(true)

  const toggleSidebar = () => setIsOpen(!isOpen)

  // Update the getMenuItems function to include tasks
  const getMenuItems = () => {
    // Base items for all roles
    const baseItems = [
      {
        name: "Dashboard",
        icon: <FaHome />,
        value: "dashboard",
      },
    ]

    // Admin-specific items
    if (userRole === "admin") {
      return [
        ...baseItems,
        {
          name: "Users",
          icon: <FaUserAlt />,
          value: "manageUsers",
        },
        {
          name: "Attendance",
          icon: <FaCalendarCheck />,
          value: "attendance",
        },
        {
          name: "Leave Requests",
          icon: <FaFileAlt />,
          value: "leaves",
        },
        {
          name: "All Salaries",
          icon: <FaDollarSign />,
          value: "salaryTable",
        },
        {
          name: "Performance",
          icon: <FaChartLine />,
          value: "performance",
        },
        {
          name: "Tasks",
          icon: <FaTasks />,
          value: "tasks",
        },
        {
          name: "Notifications",
          icon: <FaBell />,
          value: "notifications",
        },
        {
          name: "Manage Roles",
          icon: <FaUsersCog />,
          value: "manageRoles",
        },
      ]
    }

    // Manager-specific items
    if (userRole === "manager") {
      return [
        ...baseItems,
        {
          name: "Employees",
          icon: <FaUserAlt />,
          value: "employeeList",
        },
        {
          name: "Attendance",
          icon: <FaCalendarCheck />,
          value: "attendance",
        },
        {
          name: "Leave Requests",
          icon: <FaFileAlt />,
          value: "leaves",
        },
        {
          name: "Salary Processing",
          icon: <FaDollarSign />,
          value: "salaries",
        },
        {
          name: "Performance",
          icon: <FaChartLine />,
          value: "performance",
        },
        // {
        //   name: "Tasks",
        //   icon: <FaTasks />,
        //   value: "tasks",
        // },
        {
          name: "Notifications",
          icon: <FaBell />,
          value: "notifications",
        },
      ]
    }

    // Employee-specific items
    return [
      ...baseItems,
      {
        name: "My Attendance",
        icon: <FaCalendarCheck />,
        value: "attendance",
      },
      {
        name: "Apply Leave",
        icon: <FaFileAlt />,
        value: "leaves",
      },
      {
        name: "My Salary",
        icon: <FaDollarSign />,
        value: "salaries",
      },
      {
        name: "My Performance",
        icon: <FaChartLine />,
        value: "performance",
      },
      // {
      //   name: "My Tasks",
      //   icon: <FaTasks />,
      //   value: "tasks",
      // },
      {
        name: "Notifications",
        icon: <FaBell />,
        value: "notifications",
      },
    ]
  }

  const menuItems = getMenuItems()

  return (
    <div className={`sidebar ${isOpen ? "open" : "closed"}`}>
      <button className="sidebar-toggle" onClick={toggleSidebar} aria-label={isOpen ? "Close sidebar" : "Open sidebar"}>
        {isOpen ? <FaTimes /> : <FaBars />}
      </button>

      <div className="sidebar-content">
        <div className="sidebar-header">{isOpen && <h3>EMS</h3>}</div>
        <ul className="menu-items">
          {menuItems.map((item) => (
            <li
              key={item.value}
              className={activeComponent === item.value ? "active" : ""}
              onClick={() => setActiveComponent(item.value)}
            >
              <span className="menu-icon">{item.icon}</span>
              {isOpen && <span className="menu-text">{item.name}</span>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
