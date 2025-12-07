require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

// Import routes
const userRouter = require("./Routes/UserRoutes");
const authRouter = require("./Routes/AuthRoutes");
const courseRouter = require("./Routes/CourseRoutes");
const enrollmentRouter = require("./Routes/EnrollmentRoutes");
const teacherRouter = require("./Routes/TeacherRoutes");

const app = express();

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:8080',
    credentials: true
}));
app.use(express.json());

// LOG ALL INCOMING REQUESTS (for debugging)
app.use((req, res, next) => {
    console.log(`📨 ${req.method} ${req.path}`);
    next();
});

// Routes - THESE ARE THE CRITICAL LINES
app.use("/users", userRouter);
app.use("/auth", authRouter);
app.use("/courses", courseRouter);
app.use("/enrollments", enrollmentRouter);
app.use("/teachers", teacherRouter);

// Default route
app.get("/", (req, res) => {
    res.send("EduPlatform API is working");
});

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://thumulagamage28_db_user:1cAxXUKBkTqf3fz2@usersdata.zjw0i8k.mongodb.net/?appName=UsersData";
const PORT = process.env.PORT || 5000;

mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log("✅ Connected to MongoDB");
        app.listen(PORT, () => {
            console.log(`✅ Server running on port ${PORT}`);
            console.log(`✅ Accepting requests from: ${process.env.FRONTEND_URL || 'http://localhost:8080'}`);
            console.log(`✅ Test it: http://localhost:${PORT}`);
            console.log('\n🎯 All routes loaded successfully!\n');
        });
    })
    .catch((err) => {
        console.error("❌ MongoDB connection error:", err);
        process.exit(1);
    });

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
    console.error('❌ UNHANDLED REJECTION:', err);
});