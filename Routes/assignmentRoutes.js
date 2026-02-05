// backend/Routes/assignmentRoutes.js - FIXED TO MATCH YOUR AUTH PATTERN
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { verifyToken, isStudent, isTeacher } = require('../Controllers/AuthController'); // FIXED: Using your auth
const {
  createAssignment,
  getCourseAssignments,
  getAssignment,
  updateAssignment,
  deleteAssignment,
  getAssignmentSubmissions
} = require('../Controllers/assignmentController');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/assignments/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'assignment-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Allow documents and common file types
  const allowedTypes = /pdf|doc|docx|txt|zip|rar|jpg|jpeg|png/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only documents, images, and archives are allowed'));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: fileFilter
});

// Assignment routes
router.post('/', verifyToken, isTeacher, upload.array('attachments', 5), createAssignment);
router.get('/course/:courseId', verifyToken, getCourseAssignments);
router.get('/:id', verifyToken, getAssignment);
router.put('/:id', verifyToken, isTeacher, updateAssignment);
router.delete('/:id', verifyToken, isTeacher, deleteAssignment);
router.get('/:id/submissions', verifyToken, isTeacher, getAssignmentSubmissions);

console.log('✅ AssignmentRoutes loaded');

module.exports = router;