// Controllers/EnrollmentController.js
const Enrollment = require("../Models/EnrollmentModel");
const Course = require("../Models/CourseModel");
const User = require("../Models/UserModel");

// REQUEST enrollment (Student)
const requestEnrollment = async (req, res) => {
    const { courseId } = req.body;
    const studentId = req.userId;

    try {
        // Check if course exists
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }

        // Check if already enrolled
        const existingEnrollment = await Enrollment.findOne({ studentId, courseId });
        if (existingEnrollment) {
            return res.status(400).json({ 
                message: `Already ${existingEnrollment.status}. Cannot request again.` 
            });
        }

        const enrollment = new Enrollment({
            studentId,
            courseId,
            status: 'pending'
        });

        await enrollment.save();

        const populatedEnrollment = await Enrollment.findById(enrollment._id)
            .populate('studentId', 'name gmail')
            .populate('courseId', 'title description');

        return res.status(201).json({ 
            message: "Enrollment request submitted",
            enrollment: populatedEnrollment 
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Unable to request enrollment" });
    }
};

// GET student's enrollments (Student)
const getMyEnrollments = async (req, res) => {
    const studentId = req.userId;

    try {
        const enrollments = await Enrollment.find({ studentId })
            .populate('courseId')
            .populate({
                path: 'courseId',
                populate: {
                    path: 'teacherId',
                    select: 'name gmail'
                }
            })
            .sort({ enrollmentDate: -1 });

        return res.status(200).json({ enrollments });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: "Server error" });
    }
};

// GET pending enrollments for teacher's courses (Teacher)
const getPendingEnrollments = async (req, res) => {
    const teacherId = req.userId;

    try {
        // Find all courses by this teacher
        const courses = await Course.find({ teacherId });
        const courseIds = courses.map(course => course._id);

        // Find pending enrollments for these courses
        const enrollments = await Enrollment.find({ 
            courseId: { $in: courseIds },
            status: 'pending'
        })
            .populate('studentId', 'name gmail age address')
            .populate('courseId', 'title description')
            .sort({ enrollmentDate: -1 });

        return res.status(200).json({ enrollments });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: "Server error" });
    }
};

// GET all students enrolled in teacher's courses (Teacher)
const getMyStudents = async (req, res) => {
    const teacherId = req.userId;

    try {
        // Find all courses by this teacher
        const courses = await Course.find({ teacherId });
        const courseIds = courses.map(course => course._id);

        // Find approved enrollments
        const enrollments = await Enrollment.find({ 
            courseId: { $in: courseIds },
            status: 'approved'
        })
            .populate('studentId', 'name gmail age address')
            .populate('courseId', 'title description')
            .sort({ approvedDate: -1 });

        return res.status(200).json({ enrollments });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: "Server error" });
    }
};

// APPROVE enrollment (Teacher)
const approveEnrollment = async (req, res) => {
    const { id } = req.params;
    const teacherId = req.userId;

    try {
        const enrollment = await Enrollment.findById(id).populate('courseId');
        
        if (!enrollment) {
            return res.status(404).json({ message: "Enrollment not found" });
        }

        // Check if this teacher owns the course
        if (enrollment.courseId.teacherId.toString() !== teacherId) {
            return res.status(403).json({ message: "Not authorized to approve this enrollment" });
        }

        if (enrollment.status !== 'pending') {
            return res.status(400).json({ message: "Enrollment already processed" });
        }

        enrollment.status = 'approved';
        enrollment.approvedDate = new Date();
        await enrollment.save();

        const populatedEnrollment = await Enrollment.findById(enrollment._id)
            .populate('studentId', 'name gmail')
            .populate('courseId', 'title description');

        return res.status(200).json({ 
            message: "Enrollment approved",
            enrollment: populatedEnrollment 
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: "Server error" });
    }
};

// REJECT enrollment (Teacher)
const rejectEnrollment = async (req, res) => {
    const { id } = req.params;
    const teacherId = req.userId;

    try {
        const enrollment = await Enrollment.findById(id).populate('courseId');
        
        if (!enrollment) {
            return res.status(404).json({ message: "Enrollment not found" });
        }

        // Check if this teacher owns the course
        if (enrollment.courseId.teacherId.toString() !== teacherId) {
            return res.status(403).json({ message: "Not authorized to reject this enrollment" });
        }

        if (enrollment.status !== 'pending') {
            return res.status(400).json({ message: "Enrollment already processed" });
        }

        enrollment.status = 'rejected';
        enrollment.rejectedDate = new Date();
        await enrollment.save();

        const populatedEnrollment = await Enrollment.findById(enrollment._id)
            .populate('studentId', 'name gmail')
            .populate('courseId', 'title description');

        return res.status(200).json({ 
            message: "Enrollment rejected",
            enrollment: populatedEnrollment 
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: "Server error" });
    }
};

// UPDATE enrollment progress (Teacher or Student)
const updateProgress = async (req, res) => {
    const { id } = req.params;
    const { progress } = req.body;

    try {
        if (progress < 0 || progress > 100) {
            return res.status(400).json({ message: "Progress must be between 0 and 100" });
        }

        const enrollment = await Enrollment.findById(id);
        
        if (!enrollment) {
            return res.status(404).json({ message: "Enrollment not found" });
        }

        if (enrollment.status !== 'approved') {
            return res.status(400).json({ message: "Can only update progress for approved enrollments" });
        }

        enrollment.progress = progress;
        await enrollment.save();

        const populatedEnrollment = await Enrollment.findById(enrollment._id)
            .populate('studentId', 'name gmail')
            .populate('courseId', 'title description');

        return res.status(200).json({ enrollment: populatedEnrollment });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: "Server error" });
    }
};

module.exports = {
    requestEnrollment,
    getMyEnrollments,
    getPendingEnrollments,
    getMyStudents,
    approveEnrollment,
    rejectEnrollment,
    updateProgress
};