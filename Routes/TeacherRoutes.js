const express = require("express");
const router = express.Router();
const TeacherController = require("../Controllers/TeacherController");
const { verifyToken, isTeacher } = require("../Controllers/AuthController");

// ⚠️ IMPORTANT: Specific routes MUST come BEFORE :id routes
// This will create route: /teachers/dashboard/stats
router.get("/dashboard/stats", verifyToken, isTeacher, TeacherController.getTeacherStats);

// Public routes
// These will create: /teachers/ and /teachers/:id
router.get("/", TeacherController.getAllTeachers);
router.get("/:id", TeacherController.getTeacherById);

console.log('✅ TeacherRoutes loaded');

module.exports = router;