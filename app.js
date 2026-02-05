require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

// Import routes
const userRouter = require("./Routes/UserRoutes");
const authRouter = require("./Routes/AuthRoutes");
const courseRouter = require("./Routes/CourseRoutes");
const enrollmentRouter = require("./Routes/EnrollmentRoutes");
const teacherRouter = require("./Routes/TeacherRoutes");
const messageRouter = require("./Routes/MessageRoutes");
const reviewRouter = require("./Routes/ReviewRoutes");
const materialRouter = require("./Routes/MaterialRoutes");

console.log('🔍 About to load assignment routes...');
let assignmentRoutesLoaded;
let submissionRoutesLoaded;

try {
  assignmentRoutesLoaded = require('./Routes/assignmentRoutes');
  console.log('✅ assignmentRoutes loaded successfully');
} catch (error) {
  console.error('❌ Error loading assignmentRoutes:', error.message);
  console.error(error);
}

try {
  submissionRoutesLoaded = require('./Routes/submissionRoutes');
  console.log('✅ submissionRoutes loaded successfully');
} catch (error) {
  console.error('❌ Error loading submissionRoutes:', error.message);
  console.error(error);
}

const app = express();

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:8080',
    credentials: true
}));
app.use(express.json());

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// LOG ALL INCOMING REQUESTS (for debugging)
app.use((req, res, next) => {
    console.log(`📨 ${req.method} ${req.path}`);
    next();
});

// Routes
app.use("/users", userRouter);
app.use("/auth", authRouter);
app.use("/courses", courseRouter);
app.use("/enrollments", enrollmentRouter);
app.use("/teachers", teacherRouter);
app.use("/messages", messageRouter);
app.use("/reviews", reviewRouter);
app.use("/materials", materialRouter);

if (assignmentRoutesLoaded) {
  app.use('/api/assignments', assignmentRoutesLoaded);
  console.log('🚀 Assignment routes registered');
}

if (submissionRoutesLoaded) {
  app.use('/api/submissions', submissionRoutesLoaded);
  console.log('🚀 Submission routes registered');
}

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
            console.log(`✅ Test it: http://localhost:${PORT}\n`);
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