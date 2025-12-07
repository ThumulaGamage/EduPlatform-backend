// Controllers/TeacherController.js
const User = require("../Models/UserModel");
const Course = require("../Models/CourseModel");
const Enrollment = require("../Models/EnrollmentModel");

// GET all teachers (public - no auth needed)
const getAllTeachers = async (req, res) => {
    try {
        const teachers = await User.find({ role: 'teacher' })
            .select('-password')
            .sort({ createdAt: -1 });

        // Get course count for each teacher
        const teachersWithCourseCount = await Promise.all(
            teachers.map(async (teacher) => {
                const courseCount = await Course.countDocuments({ teacherId: teacher._id });
                return {
                    ...teacher.toObject(),
                    courseCount
                };
            })
        );

        return res.status(200).json({ teachers: teachersWithCourseCount });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: "Server error" });
    }
};

// GET teacher by ID (public)
const getTeacherById = async (req, res) => {
    const { id } = req.params;

    try {
        const teacher = await User.findById(id).select('-password');

        if (!teacher || teacher.role !== 'teacher') {
            return res.status(404).json({ message: "Teacher not found" });
        }

        // Get courses by this teacher
        const courses = await Course.find({ teacherId: id });

        // Get student count
        const courseIds = courses.map(course => course._id);
        const studentCount = await Enrollment.countDocuments({
            courseId: { $in: courseIds },
            status: 'approved'
        });

        return res.status(200).json({ 
            teacher: {
                ...teacher.toObject(),
                courseCount: courses.length,
                studentCount
            },
            courses
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: "Server error" });
    }
};

// GET teacher dashboard stats (Teacher only)
const getTeacherStats = async (req, res) => {
    const teacherId = req.userId;

    try {
        // Get all courses by this teacher
        const courses = await Course.find({ teacherId });
        const courseIds = courses.map(course => course._id);

        // Get total students (approved enrollments)
        const totalStudents = await Enrollment.countDocuments({
            courseId: { $in: courseIds },
            status: 'approved'
        });

        // Get pending enrollments
        const pendingEnrollments = await Enrollment.countDocuments({
            courseId: { $in: courseIds },
            status: 'pending'
        });

        // Get recent enrollments
        const recentEnrollments = await Enrollment.find({
            courseId: { $in: courseIds }
        })
            .populate('studentId', 'name gmail')
            .populate('courseId', 'title')
            .sort({ enrollmentDate: -1 })
            .limit(5);

        return res.status(200).json({
            stats: {
                totalCourses: courses.length,
                totalStudents,
                pendingEnrollments,
                recentEnrollments
            }
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: "Server error" });
    }
};

module.exports = {
    getAllTeachers,
    getTeacherById,
    getTeacherStats
};