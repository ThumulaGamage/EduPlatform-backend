// Models/CourseModel.js - UPDATED with detailed content fields
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const LessonSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ""
    },
    duration: {
        type: Number, // in minutes
        default: 0
    },
    order: {
        type: Number,
        required: true
    }
});

const CourseSchema = new Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    teacherId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    duration: {
        type: String, // e.g., "8 weeks", "3 months"
        required: true,
    },
    level: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced'],
        required: true
    },
    category: {
        type: String,
        required: true
    },
    image: {
        type: String, // URL to course image
        default: ''
    },
    totalLessons: {
        type: Number,
        default: 0
    },
    // NEW FIELDS FOR DETAILED CONTENT
    learningObjectives: [{
        type: String
    }],
    requirements: [{
        type: String
    }],
    lessons: [LessonSchema],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Course", CourseSchema);