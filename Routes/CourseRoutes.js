const express = require("express");
const router = express.Router();
const CourseController = require("../Controllers/CourseController");
const { verifyToken, isAdmin, isTeacher } = require("../Controllers/AuthController");

// Public routes (no authentication needed)
router.get("/", CourseController.getAllCourses);

// Get logged-in teacher's own courses - ADD THIS BEFORE other routes
router.get("/teacher", verifyToken, CourseController.getTeacherCourses);

router.get("/teacher/:teacherId", CourseController.getCoursesByTeacher);
router.get("/:id", CourseController.getCourseById);

// UPDATED: Teachers can now create courses for themselves
router.post("/", verifyToken, isTeacher, CourseController.createCourse);

// UPDATED: Teachers can update their own courses
router.put("/:id", verifyToken, isTeacher, CourseController.updateCourse);

// UPDATED: Teachers can delete their own courses
router.delete("/:id", verifyToken, isTeacher, CourseController.deleteCourse);

// Admin routes (if you want admin to have full access, add these separately)
// router.post("/admin/create", verifyToken, isAdmin, CourseController.createCourse);
// router.put("/admin/:id", verifyToken, isAdmin, CourseController.updateCourse);
// router.delete("/admin/:id", verifyToken, isAdmin, CourseController.deleteCourse);

console.log('✅ CourseRoutes loaded');

module.exports = router;