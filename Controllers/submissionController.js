// backend/Controllers/submissionController.js - FINAL VERSION
const Submission = require('../Models/Submission');
const Assignment = require('../Models/Assignment');
const Enrollment = require('../Models/EnrollmentModel');

// @desc    Submit assignment
// @route   POST /api/submissions
// @access  Private (Student only)
exports.submitAssignment = async (req, res) => {
  try {
    const { assignmentId, content } = req.body;

    // Get assignment
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Check if student is enrolled
    const enrollment = await Enrollment.findOne({
      studentId: req.userId,
      courseId: assignment.courseId,
      status: 'approved'
    });

    if (!enrollment) {
      return res.status(403).json({ message: 'Not enrolled in this course' });
    }

    // Check if already submitted
    const existingSubmission = await Submission.findOne({
      assignmentId,
      studentId: req.userId
    });

    if (existingSubmission) {
      return res.status(400).json({ message: 'Assignment already submitted. Use update endpoint to modify.' });
    }

    // Check if late
    const isLate = new Date() > assignment.dueDate;
    if (isLate && !assignment.allowLateSubmission) {
      return res.status(400).json({ message: 'Assignment deadline has passed' });
    }

    const submission = await Submission.create({
      assignmentId,
      studentId: req.userId,
      courseId: assignment.courseId,
      content: content || '',
      isLate,
      attachments: req.files ? req.files.map(file => ({
        filename: file.originalname,
        filepath: file.path,
        mimetype: file.mimetype,
        size: file.size
      })) : []
    });

    res.status(201).json({
      success: true,
      submission,
      message: 'Assignment submitted successfully'
    });
  } catch (error) {
    console.error('Submit assignment error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update submission (before grading)
// @route   PUT /api/submissions/:id
// @access  Private (Student only)
exports.updateSubmission = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id);

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    if (submission.studentId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (submission.status === 'graded') {
      return res.status(400).json({ message: 'Cannot update graded submission' });
    }

    const { content } = req.body;

    submission.content = content || submission.content;
    submission.submittedAt = new Date();

    // Add new attachments if provided
    if (req.files && req.files.length > 0) {
      const newAttachments = req.files.map(file => ({
        filename: file.originalname,
        filepath: file.path,
        mimetype: file.mimetype,
        size: file.size
      }));
      submission.attachments = [...submission.attachments, ...newAttachments];
    }

    await submission.save();

    res.json({
      success: true,
      submission,
      message: 'Submission updated successfully'
    });
  } catch (error) {
    console.error('Update submission error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete submission (before grading)
// @route   DELETE /api/submissions/:id
// @access  Private (Student only)
exports.deleteSubmission = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id);

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    if (submission.studentId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (submission.status === 'graded') {
      return res.status(400).json({ message: 'Cannot delete graded submission' });
    }

    await submission.deleteOne();

    res.json({
      success: true,
      message: 'Submission deleted'
    });
  } catch (error) {
    console.error('Delete submission error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Grade submission
// @route   POST /api/submissions/:id/grade
// @access  Private (Teacher only)
exports.gradeSubmission = async (req, res) => {
  try {
    const { score, feedback } = req.body;

    const submission = await Submission.findById(req.params.id)
      .populate('assignmentId');

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // Verify teacher owns the assignment
    if (submission.assignmentId.teacherId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Validate score
    if (score < 0 || score > submission.assignmentId.maxScore) {
      return res.status(400).json({ 
        message: `Score must be between 0 and ${submission.assignmentId.maxScore}` 
      });
    }

    submission.grade = {
      score,
      feedback: feedback || '',
      gradedBy: req.userId,
      gradedAt: new Date()
    };
    submission.status = 'graded';

    await submission.save();

    res.json({
      success: true,
      submission,
      message: 'Submission graded successfully'
    });
  } catch (error) {
    console.error('Grade submission error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get student's submissions
// @route   GET /api/submissions/my-submissions
// @access  Private (Student only)
exports.getMySubmissions = async (req, res) => {
  try {
    const submissions = await Submission.find({ studentId: req.userId })
      .populate('assignmentId', 'title dueDate maxScore')
      .populate('courseId', 'title')
      .sort({ submittedAt: -1 });

    res.json({
      success: true,
      submissions
    });
  } catch (error) {
    console.error('Get my submissions error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get submission by ID
// @route   GET /api/submissions/:id
// @access  Private
exports.getSubmission = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id)
      .populate('assignmentId')
      .populate('studentId', 'name gmail')
      .populate('courseId', 'title');

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // Check authorization
    const isStudent = req.userId === submission.studentId._id.toString();
    const isTeacher = req.userId === submission.assignmentId.teacherId.toString();

    if (!isStudent && !isTeacher) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json({
      success: true,
      submission
    });
  } catch (error) {
    console.error('Get submission error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};