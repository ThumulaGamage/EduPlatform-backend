// Controllers/AuthController.js
const User = require("../Models/UserModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key_here_change_in_production";

// REGISTER new user
const register = async (req, res) => {
    const { name, gmail, password, age, address, role } = req.body;

    try {
        // Validate role
        if (role && !['student', 'teacher'].includes(role)) {
            return res.status(400).json({ message: "Invalid role. Must be 'student' or 'teacher'" });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ gmail });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists with this email" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const user = new User({
            name,
            gmail,
            password: hashedPassword,
            age,
            address,
            role: role || 'student' // Default to student if not provided
        });

        await user.save();

        // Create JWT token
        const token = jwt.sign(
            { id: user._id, gmail: user.gmail, role: user.role },
            JWT_SECRET,
            { expiresIn: "24h" }
        );

        return res.status(201).json({
            message: "User registered successfully",
            token,
            user: {
                id: user._id,
                name: user.name,
                gmail: user.gmail,
                age: user.age,
                address: user.address,
                role: user.role
            }
        });

    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Server error during registration" });
    }
};

// LOGIN user
const login = async (req, res) => {
    const { gmail, password } = req.body;

    try {
        // Find user by email
        const user = await User.findOne({ gmail });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check password
        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // Create JWT token
        const token = jwt.sign(
            { id: user._id, gmail: user.gmail, role: user.role },
            JWT_SECRET,
            { expiresIn: "24h" }
        );

        return res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                gmail: user.gmail,
                age: user.age,
                address: user.address,
                role: user.role
            }
        });

    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Server error during login" });
    }
};

// VERIFY token (middleware)
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "No token provided" });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.id;
        req.userRole = decoded.role;
        next();
    } catch (err) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
    if (req.userRole !== 'admin') {
        return res.status(403).json({ message: "Access denied. Admin only." });
    }
    next();
};

// Middleware to check if user is teacher
const isTeacher = (req, res, next) => {
    if (req.userRole !== 'teacher' && req.userRole !== 'admin') {
        return res.status(403).json({ message: "Access denied. Teacher only." });
    }
    next();
};

// Middleware to check if user is student
const isStudent = (req, res, next) => {
    if (req.userRole !== 'student' && req.userRole !== 'admin') {
        return res.status(403).json({ message: "Access denied. Student only." });
    }
    next();
};

module.exports = {
    register,
    login,
    verifyToken,
    isAdmin,
    isTeacher,
    isStudent
};