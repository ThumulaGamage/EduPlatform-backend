// Models/EnrollmentModel.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const EnrollmentSchema = new Schema({
    studentId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    courseId: {
        type: Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    progress: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    enrollmentDate: {
        type: Date,
        default: Date.now
    },
    approvedDate: {
        type: Date,
        default: null
    },
    rejectedDate: {
        type: Date,
        default: null
    }
});

// Compound index to prevent duplicate enrollments
EnrollmentSchema.index({ studentId: 1, courseId: 1 }, { unique: true });

module.exports = mongoose.model("Enrollment", EnrollmentSchema);