// backend/Controllers/assignmentController.js
const Assignment = require('../Models/Assignment');
const Submission = require('../Models/Submission');
const Course = require('../Models/CourseModel');
const Enrollment = require('../Models/EnrollmentModel');

// @desc    Create new assignment
// @route   POST /api/assignments
// @access  Private (Teacher only)
exports.createAssignment = async (req, res) => {
  try {
    const { courseId, title, description, instructions, maxScore, dueDate, allowLateSubmission } = req.body;

    // Verify teacher owns the course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (course.teacherId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to create assignments for this course' });
    }

    const assignment = await Assignment.create({
      courseId,
      teacherId: req.userId,
      title,
      description,
      instructions,
      maxScore: maxScore || 100,
      dueDate,
      allowLateSubmission: allowLateSubmission || false,
      attachments: req.files ? req.files.map(file => ({
        filename: file.originalname,
        filepath: file.path,
        mimetype: file.mimetype,
        size: file.size
      })) : []
    });

    res.status(201).json({
      success: true,
      assignment
    });
  } catch (error) {
    console.error('Create assignment error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all assignments for a course
// @route   GET /api/assignments/course/:courseId
// @access  Private
exports.getCourseAssignments = async (req, res) => {
  try {
    const { courseId } = req.params;

    // Check if user has access to this course
    if (req.userRole === 'student') {
      const enrollment = await Enrollment.findOne({
        studentId: req.userId,
        courseId,
        status: 'approved'
      });

      if (!enrollment) {
        return res.status(403).json({ message: 'Not enrolled in this course' });
      }
    } else if (req.userRole === 'teacher') {
      const course = await Course.findById(courseId);
      if (!course || course.teacherId.toString() !== req.userId) {
        return res.status(403).json({ message: 'Not authorized' });
      }
    }

    const assignments = await Assignment.find({ 
      courseId,
      status: { $ne: 'draft' }
    })
      .populate('teacherId', 'name gmail')
      .sort({ dueDate: -1 });

    // If student, add submission status for each assignment
    if (req.userRole === 'student') {
      const assignmentsWithStatus = await Promise.all(
        assignments.map(async (assignment) => {
          const submission = await Submission.findOne({
            assignmentId: assignment._id,
            studentId: req.userId
          });

          return {
            ...assignment.toObject(),
            submission: submission || null,
            hasSubmitted: !!submission
          };
        })
      );

      return res.json({
        success: true,
        assignments: assignmentsWithStatus
      });
    }

    res.json({
      success: true,
      assignments
    });
  } catch (error) {
    console.error('Get course assignments error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get single assignment
// @route   GET /api/assignments/:id
// @access  Private
exports.getAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate('teacherId', 'name gmail')
      .populate('courseId', 'title');

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Check access
    if (req.userRole === 'student') {
      const enrollment = await Enrollment.findOne({
        studentId: req.userId,
        courseId: assignment.courseId._id,
        status: 'approved'
      });

      if (!enrollment) {
        return res.status(403).json({ message: 'Not enrolled in this course' });
      }

      // Get student's submission if exists
      const submission = await Submission.findOne({
        assignmentId: assignment._id,
        studentId: req.userId
      });

      return res.json({
        success: true,
        assignment: {
          ...assignment.toObject(),
          submission: submission || null
        }
      });
    }

    res.json({
      success: true,
      assignment
    });
  } catch (error) {
    console.error('Get assignment error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update assignment
// @route   PUT /api/assignments/:id
// @access  Private (Teacher only)
exports.updateAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    if (assignment.teacherId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { title, description, instructions, maxScore, dueDate, allowLateSubmission, status } = req.body;

    assignment.title = title || assignment.title;
    assignment.description = description || assignment.description;
    assignment.instructions = instructions !== undefined ? instructions : assignment.instructions;
    assignment.maxScore = maxScore || assignment.maxScore;
    assignment.dueDate = dueDate || assignment.dueDate;
    assignment.allowLateSubmission = allowLateSubmission !== undefined ? allowLateSubmission : assignment.allowLateSubmission;
    assignment.status = status || assignment.status;

    await assignment.save();

    res.json({
      success: true,
      assignment
    });
  } catch (error) {
    console.error('Update assignment error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete assignment
// @route   DELETE /api/assignments/:id
// @access  Private (Teacher only)
exports.deleteAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    if (assignment.teacherId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Delete all submissions for this assignment
    await Submission.deleteMany({ assignmentId: assignment._id });

    await assignment.deleteOne();

    res.json({
      success: true,
      message: 'Assignment deleted'
    });
  } catch (error) {
    console.error('Delete assignment error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get assignment submissions (for teachers)
// @route   GET /api/assignments/:id/submissions
// @access  Private (Teacher only)
exports.getAssignmentSubmissions = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    if (assignment.teacherId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const submissions = await Submission.find({ assignmentId: assignment._id })
      .populate('studentId', 'name gmail')
      .sort({ submittedAt: -1 });

    res.json({
      success: true,
      submissions,
      totalSubmissions: submissions.length
    });
  } catch (error) {
    console.error('Get submissions error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};