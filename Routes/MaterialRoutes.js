// Routes/MaterialRoutes.js
const express = require("express");
const router = express.Router();
const MaterialController = require("../Controllers/MaterialController");
const { verifyToken } = require("../Controllers/AuthController");

// All material routes require authentication
router.use(verifyToken);

// Upload material to course (teachers only)
router.post("/upload/:courseId", MaterialController.upload.single('file'), MaterialController.uploadMaterial);

// Get all materials for a course
router.get("/course/:courseId", MaterialController.getCourseMaterials);

// Delete material
router.delete("/:courseId/:materialId", MaterialController.deleteMaterial);

console.log('✅ MaterialRoutes loaded');

module.exports = router;