// Routes/ReviewRoutes.js
const express = require("express");
const router = express.Router();
const ReviewController = require("../Controllers/ReviewController");
const { verifyToken } = require("../Controllers/AuthController");

// All review routes require authentication
router.use(verifyToken);

// Create or update a review (students only)
router.post("/", ReviewController.createOrUpdateReview);

// Get all reviews for a course (public - but behind auth for now)
router.get("/course/:courseId", ReviewController.getCourseReviews);

// Get current student's review for a course
router.get("/my-review/:courseId", ReviewController.getMyReview);

// Delete a review
router.delete("/:courseId", ReviewController.deleteReview);

// Get all reviews by current student
router.get("/my-reviews", ReviewController.getStudentReviews);

console.log('✅ ReviewRoutes loaded');

module.exports = router;