// Controllers/MaterialController.js - WITH CLOUDINARY CLOUD STORAGE
const Course = require("../Models/CourseModel");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Cloudinary storage for multer
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        // Determine resource type and folder
        let resourceType = 'auto'; // auto-detect
        let folder = 'course-materials';

        // Determine file type
        if (file.mimetype.startsWith('video/')) {
            resourceType = 'video';
            folder = 'course-materials/videos';
        } else if (file.mimetype.startsWith('image/')) {
            resourceType = 'image';
            folder = 'course-materials/images';
        } else if (file.mimetype === 'application/pdf') {
            resourceType = 'raw';
            folder = 'course-materials/pdfs';
        } else {
            resourceType = 'raw';
            folder = 'course-materials/documents';
        }

        return {
            folder: folder,
            resource_type: resourceType,
            allowed_formats: ['pdf', 'mp4', 'webm', 'ogg', 'jpg', 'jpeg', 'png', 'gif', 'doc', 'docx', 'ppt', 'pptx'],
            transformation: file.mimetype.startsWith('image/') ? [
                { width: 1920, height: 1080, crop: 'limit' }
            ] : undefined
        };
    }
});

// File filter to validate file types
const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'application/pdf',
        'video/mp4',
        'video/webm',
        'video/ogg',
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Allowed: PDF, Videos (MP4, WebM), Images (JPG, PNG), Documents (DOC, DOCX, PPT, PPTX)'));
    }
};

// Multer upload configuration with Cloudinary
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB max file size
    }
});

// Upload material to course
const uploadMaterial = async (req, res) => {
    const { courseId } = req.params;
    const { title } = req.body;
    const teacherId = req.userId;

    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        // Find course and verify ownership
        const course = await Course.findById(courseId);
        if (!course) {
            // Delete uploaded file from Cloudinary if course not found
            if (req.file.public_id) {
                await cloudinary.uploader.destroy(req.file.public_id, {
                    resource_type: req.file.resource_type || 'raw'
                });
            }
            return res.status(404).json({ message: "Course not found" });
        }

        if (course.teacherId.toString() !== teacherId) {
            // Delete uploaded file from Cloudinary if unauthorized
            if (req.file.public_id) {
                await cloudinary.uploader.destroy(req.file.public_id, {
                    resource_type: req.file.resource_type || 'raw'
                });
            }
            return res.status(403).json({ message: "You can only upload materials to your own courses" });
        }

        // Determine material type
        const mimeType = req.file.mimetype;
        let materialType = 'other';
        if (mimeType === 'application/pdf') {
            materialType = 'pdf';
        } else if (mimeType.startsWith('video/')) {
            materialType = 'video';
        } else if (mimeType.startsWith('image/')) {
            materialType = 'image';
        } else if (mimeType.includes('document') || mimeType.includes('presentation') || mimeType.includes('msword')) {
            materialType = 'document';
        }

        // Create material object with Cloudinary data
        const material = {
            title: title || req.file.originalname,
            type: materialType,
            url: req.file.path, // Cloudinary secure URL
            filename: req.file.filename || req.file.originalname,
            filesize: req.file.size || 0,
            cloudinaryId: req.file.public_id, // Store Cloudinary public_id for deletion
            cloudinaryResourceType: req.file.resource_type || 'raw'
        };

        // Add material to course
        course.materials.push(material);
        await course.save();

        return res.status(201).json({ 
            message: "Material uploaded successfully",
            material: course.materials[course.materials.length - 1]
        });
    } catch (err) {
        console.error("Error uploading material:", err);
        
        // Delete uploaded file from Cloudinary on error
        if (req.file && req.file.public_id) {
            try {
                await cloudinary.uploader.destroy(req.file.public_id, {
                    resource_type: req.file.resource_type || 'raw'
                });
            } catch (deleteErr) {
                console.error("Error deleting file from Cloudinary:", deleteErr);
            }
        }
        
        return res.status(500).json({ error: "Failed to upload material" });
    }
};

// Get all materials for a course
const getCourseMaterials = async (req, res) => {
    const { courseId } = req.params;

    try {
        const course = await Course.findById(courseId).select('materials');
        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }

        return res.status(200).json({ materials: course.materials });
    } catch (err) {
        console.error("Error fetching materials:", err);
        return res.status(500).json({ error: "Failed to fetch materials" });
    }
};

// Delete material
const deleteMaterial = async (req, res) => {
    const { courseId, materialId } = req.params;
    const teacherId = req.userId;

    try {
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }

        if (course.teacherId.toString() !== teacherId) {
            return res.status(403).json({ message: "You can only delete materials from your own courses" });
        }

        const material = course.materials.id(materialId);
        if (!material) {
            return res.status(404).json({ message: "Material not found" });
        }

        // Delete file from Cloudinary
        if (material.cloudinaryId) {
            try {
                await cloudinary.uploader.destroy(material.cloudinaryId, {
                    resource_type: material.cloudinaryResourceType || 'raw'
                });
                console.log(`Deleted file from Cloudinary: ${material.cloudinaryId}`);
            } catch (cloudErr) {
                console.error("Error deleting from Cloudinary:", cloudErr);
                // Continue with database deletion even if Cloudinary delete fails
            }
        }

        // Remove material from course
        course.materials.pull(materialId);
        await course.save();

        return res.status(200).json({ message: "Material deleted successfully" });
    } catch (err) {
        console.error("Error deleting material:", err);
        return res.status(500).json({ error: "Failed to delete material" });
    }
};

module.exports = {
    upload,
    uploadMaterial,
    getCourseMaterials,
    deleteMaterial
};