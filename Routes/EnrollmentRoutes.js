const express = require("express");
const router = express.Router();
const EnrollmentController = require("../Controllers/EnrollmentController");
const { verifyToken, isStudent, isTeacher } = require("../Controllers/AuthController");

// Student routes - these create /enrollments/request and /enrollments/my-enrollments
router.post("/request", verifyToken, isStudent, EnrollmentController.requestEnrollment);
router.get("/my-enrollments", verifyToken, isStudent, EnrollmentController.getMyEnrollments);

// Teacher routes - these create /enrollments/pending and /enrollments/my-students
router.get("/pending", verifyToken, isTeacher, EnrollmentController.getPendingEnrollments);
router.get("/my-students", verifyToken, isTeacher, EnrollmentController.getMyStudents);
router.put("/:id/approve", verifyToken, isTeacher, EnrollmentController.approveEnrollment);
router.put("/:id/reject", verifyToken, isTeacher, EnrollmentController.rejectEnrollment);

// Both teacher and student can update progress
router.put("/:id/progress", verifyToken, EnrollmentController.updateProgress);

console.log('✅ EnrollmentRoutes loaded');

module.exports = router;