// backend/Routes/submissionRoutes.js - FIXED TO MATCH YOUR AUTH PATTERN
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { verifyToken, isStudent, isTeacher } = require('../Controllers/AuthController'); // FIXED: Using your auth
const {
  submitAssignment,
  updateSubmission,
  deleteSubmission,
  gradeSubmission,
  getMySubmissions,
  getSubmission
} = require('../Controllers/submissionController');

// Configure multer for submission file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/submissions/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'submission-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Allow documents and common file types
  const allowedTypes = /pdf|doc|docx|txt|zip|rar|jpg|jpeg|png|ppt|pptx|xls|xlsx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only documents, images, and archives are allowed'));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: fileFilter
});

// Submission routes
router.post('/', verifyToken, isStudent, upload.array('attachments', 5), submitAssignment);
router.get('/my-submissions', verifyToken, isStudent, getMySubmissions);
router.get('/:id', verifyToken, getSubmission);
router.put('/:id', verifyToken, isStudent, upload.array('attachments', 5), updateSubmission);
router.delete('/:id', verifyToken, isStudent, deleteSubmission);
router.post('/:id/grade', verifyToken, isTeacher, gradeSubmission);

console.log('✅ SubmissionRoutes loaded');

module.exports = router;