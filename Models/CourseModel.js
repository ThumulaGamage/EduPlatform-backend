// Models/CourseModel.js - UPDATED with Cloudinary fields
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

const MaterialSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['pdf', 'video', 'document', 'image', 'other'],
        required: true
    },
    url: {
        type: String,
        required: true
    },
    filename: {
        type: String,
        required: true
    },
    filesize: {
        type: Number, // in bytes
        default: 0
    },
    cloudinaryId: {
        type: String, // Cloudinary public_id for deletion
        default: ""
    },
    cloudinaryResourceType: {
        type: String, // 'image', 'video', 'raw'
        default: "raw"
    },
    uploadedAt: {
        type: Date,
        default: Date.now
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
        type: String,
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
        type: String,
        default: ''
    },
    totalLessons: {
        type: Number,
        default: 0
    },
    learningObjectives: [{
        type: String
    }],
    requirements: [{
        type: String
    }],
    lessons: [LessonSchema],
    materials: [MaterialSchema],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Course", CourseSchema);