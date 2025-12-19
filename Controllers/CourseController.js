// Controllers/CourseController.js - UPDATED with getTeacherCourses
const Course = require("../Models/CourseModel");
const User = require("../Models/UserModel");

// GET all courses (public - no auth needed)
const getAllCourses = async (req, res) => {
    try {
        const courses = await Course.find()
            .populate('teacherId', 'name gmail')
            .sort({ createdAt: -1 });

        return res.status(200).json({ courses });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: "Server error" });
    }
};

// GET courses by teacher ID
const getCoursesByTeacher = async (req, res) => {
    const { teacherId } = req.params;

    try {
        const courses = await Course.find({ teacherId })
            .populate('teacherId', 'name gmail')
            .sort({ createdAt: -1 });

        return res.status(200).json({ courses });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: "Server error" });
    }
};

// GET all courses for logged-in teacher - NEW FUNCTION
const getTeacherCourses = async (req, res) => {
    const teacherId = req.userId; // From verifyToken middleware

    try {
        const courses = await Course.find({ teacherId })
            .populate('teacherId', 'name gmail')
            .sort({ createdAt: -1 });

        return res.status(200).json({ 
            courses,
            count: courses.length
        });
    } catch (err) {
        console.error("Error fetching teacher courses:", err);
        return res.status(500).json({ error: "Failed to fetch courses" });
    }
};

// GET single course by ID - RETURNS ALL FIELDS
const getCourseById = async (req, res) => {
    const { id } = req.params;

    try {
        const course = await Course.findById(id)
            .populate('teacherId', 'name gmail age address');

        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }

        // Ensure all fields are returned including new content fields
        const courseData = {
            _id: course._id,
            title: course.title,
            description: course.description,
            teacherId: course.teacherId,
            duration: course.duration,
            level: course.level,
            category: course.category,
            image: course.image || '',
            totalLessons: course.totalLessons || 0,
            learningObjectives: course.learningObjectives || [],
            requirements: course.requirements || [],
            lessons: course.lessons || [],
            createdAt: course.createdAt
        };

        return res.status(200).json({ course: courseData });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: "Server error" });
    }
};

// CREATE new course (Teacher can create for themselves, Admin can create for any teacher)
const createCourse = async (req, res) => {
    const { 
        title, 
        description, 
        teacherId, 
        duration, 
        level, 
        category, 
        image, 
        totalLessons,
        learningObjectives,
        requirements,
        lessons
    } = req.body;

    try {
        // Determine the teacher ID
        let finalTeacherId = teacherId;
        
        // If user is a teacher (not admin), they can only create courses for themselves
        if (req.userRole === 'teacher') {
            finalTeacherId = req.userId;
        } else if (req.userRole === 'admin' && !teacherId) {
            return res.status(400).json({ message: "Admin must specify teacherId" });
        }

        // Verify teacher exists
        const teacher = await User.findById(finalTeacherId);
        if (!teacher || teacher.role !== 'teacher') {
            return res.status(400).json({ message: "Invalid teacher ID" });
        }

        const course = new Course({
            title,
            description,
            teacherId: finalTeacherId,
            duration,
            level,
            category,
            image: image || '',
            totalLessons: totalLessons || 0,
            learningObjectives: learningObjectives || [],
            requirements: requirements || [],
            lessons: lessons || []
        });

        await course.save();

        const populatedCourse = await Course.findById(course._id)
            .populate('teacherId', 'name gmail');

        return res.status(201).json({ course: populatedCourse });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Unable to create course" });
    }
};

// UPDATE course (Teacher can update their own, Admin can update any)
const updateCourse = async (req, res) => {
    const { id } = req.params;
    const { 
        title, 
        description, 
        teacherId, 
        duration, 
        level, 
        category, 
        image, 
        totalLessons,
        learningObjectives,
        requirements,
        lessons
    } = req.body;

    try {
        // Find the course first
        const existingCourse = await Course.findById(id);
        
        if (!existingCourse) {
            return res.status(404).json({ message: "Course not found" });
        }

        // Authorization check: Teachers can only update their own courses
        if (req.userRole === 'teacher' && existingCourse.teacherId.toString() !== req.userId) {
            return res.status(403).json({ message: "You can only update your own courses" });
        }

        // If teacherId is being updated, verify it's valid (only admin can change teacher)
        if (teacherId && teacherId !== existingCourse.teacherId.toString()) {
            if (req.userRole !== 'admin') {
                return res.status(403).json({ message: "Only admin can reassign courses" });
            }
            
            const teacher = await User.findById(teacherId);
            if (!teacher || teacher.role !== 'teacher') {
                return res.status(400).json({ message: "Invalid teacher ID" });
            }
        }

        const updateData = {
            title,
            description,
            duration,
            level,
            category,
            image,
            totalLessons: totalLessons !== undefined ? totalLessons : existingCourse.totalLessons,
            learningObjectives: learningObjectives !== undefined ? learningObjectives : existingCourse.learningObjectives,
            requirements: requirements !== undefined ? requirements : existingCourse.requirements,
            lessons: lessons !== undefined ? lessons : existingCourse.lessons
        };

        // Only update teacherId if user is admin and it's provided
        if (req.userRole === 'admin' && teacherId) {
            updateData.teacherId = teacherId;
        }

        const course = await Course.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        ).populate('teacherId', 'name gmail');

        console.log('Course updated successfully:', course._id);
        console.log('Learning objectives:', course.learningObjectives?.length || 0);
        console.log('Requirements:', course.requirements?.length || 0);
        console.log('Lessons:', course.lessons?.length || 0);

        return res.status(200).json({ course });
    } catch (err) {
        console.log('Error updating course:', err);
        return res.status(500).json({ error: "Server error" });
    }
};

// DELETE course (Teacher can delete their own, Admin can delete any)
const deleteCourse = async (req, res) => {
    const { id } = req.params;

    try {
        const course = await Course.findById(id);

        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }

        // Authorization check: Teachers can only delete their own courses
        if (req.userRole === 'teacher' && course.teacherId.toString() !== req.userId) {
            return res.status(403).json({ message: "You can only delete your own courses" });
        }

        await Course.findByIdAndDelete(id);

        return res.status(200).json({ message: "Course deleted successfully", course });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: "Server error" });
    }
};

module.exports = {
    getAllCourses,
    getCoursesByTeacher,
    getTeacherCourses,  // ← ADDED THIS
    getCourseById,
    createCourse,
    updateCourse,
    deleteCourse
};