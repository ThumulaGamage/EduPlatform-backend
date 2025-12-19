// Controllers/ReviewController.js
const Review = require("../Models/ReviewModel");
const Course = require("../Models/CourseModel");
const Enrollment = require("../Models/EnrollmentModel");

// Create or update a review
const createOrUpdateReview = async (req, res) => {
    const { courseId, rating, review } = req.body;
    const studentId = req.userId;

    try {
        // Verify course exists
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }

        // Check if student is enrolled and approved
        const enrollment = await Enrollment.findOne({
            studentId,
            courseId,
            status: "approved"
        });

        if (!enrollment) {
            return res.status(403).json({ 
                message: "You must be enrolled in this course to leave a review" 
            });
        }

        // Validate rating
        if (rating < 1 || rating > 5) {
            return res.status(400).json({ 
                message: "Rating must be between 1 and 5" 
            });
        }

        // Check if review already exists
        let existingReview = await Review.findOne({ courseId, studentId });

        if (existingReview) {
            // Update existing review
            existingReview.rating = rating;
            existingReview.review = review;
            existingReview.updatedAt = Date.now();
            await existingReview.save();

            const populatedReview = await Review.findById(existingReview._id)
                .populate('studentId', 'name gmail')
                .populate('courseId', 'title');

            return res.status(200).json({ 
                message: "Review updated successfully",
                review: populatedReview 
            });
        } else {
            // Create new review
            const newReview = new Review({
                courseId,
                studentId,
                rating,
                review
            });

            await newReview.save();

            const populatedReview = await Review.findById(newReview._id)
                .populate('studentId', 'name gmail')
                .populate('courseId', 'title');

            return res.status(201).json({ 
                message: "Review created successfully",
                review: populatedReview 
            });
        }
    } catch (err) {
        console.error("Error creating/updating review:", err);
        
        // Handle duplicate key error
        if (err.code === 11000) {
            return res.status(400).json({ 
                message: "You have already reviewed this course" 
            });
        }
        
        return res.status(500).json({ error: "Failed to save review" });
    }
};

// Get all reviews for a course
const getCourseReviews = async (req, res) => {
    const { courseId } = req.params;

    try {
        const reviews = await Review.find({ courseId })
            .populate('studentId', 'name gmail')
            .sort({ createdAt: -1 });

        // Calculate average rating
        const totalReviews = reviews.length;
        const averageRating = totalReviews > 0
            ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
            : 0;

        // Rating distribution
        const ratingDistribution = {
            5: reviews.filter(r => r.rating === 5).length,
            4: reviews.filter(r => r.rating === 4).length,
            3: reviews.filter(r => r.rating === 3).length,
            2: reviews.filter(r => r.rating === 2).length,
            1: reviews.filter(r => r.rating === 1).length
        };

        return res.status(200).json({ 
            reviews,
            stats: {
                totalReviews,
                averageRating: Math.round(averageRating * 10) / 10,
                ratingDistribution
            }
        });
    } catch (err) {
        console.error("Error fetching reviews:", err);
        return res.status(500).json({ error: "Failed to fetch reviews" });
    }
};

// Get student's review for a course
const getMyReview = async (req, res) => {
    const { courseId } = req.params;
    const studentId = req.userId;

    try {
        const review = await Review.findOne({ courseId, studentId })
            .populate('studentId', 'name gmail')
            .populate('courseId', 'title');

        if (!review) {
            return res.status(404).json({ message: "Review not found" });
        }

        return res.status(200).json({ review });
    } catch (err) {
        console.error("Error fetching review:", err);
        return res.status(500).json({ error: "Failed to fetch review" });
    }
};

// Delete a review
const deleteReview = async (req, res) => {
    const { courseId } = req.params;
    const studentId = req.userId;

    try {
        const review = await Review.findOneAndDelete({ courseId, studentId });

        if (!review) {
            return res.status(404).json({ message: "Review not found" });
        }

        return res.status(200).json({ 
            message: "Review deleted successfully" 
        });
    } catch (err) {
        console.error("Error deleting review:", err);
        return res.status(500).json({ error: "Failed to delete review" });
    }
};

// Get all reviews by a student
const getStudentReviews = async (req, res) => {
    const studentId = req.userId;

    try {
        const reviews = await Review.find({ studentId })
            .populate('courseId', 'title')
            .sort({ createdAt: -1 });

        return res.status(200).json({ reviews });
    } catch (err) {
        console.error("Error fetching student reviews:", err);
        return res.status(500).json({ error: "Failed to fetch reviews" });
    }
};

module.exports = {
    createOrUpdateReview,
    getCourseReviews,
    getMyReview,
    deleteReview,
    getStudentReviews
};