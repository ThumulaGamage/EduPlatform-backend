const User = require("../Models/UserModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Secret key for JWT (put this in .env file in production)
const JWT_SECRET = process.env.JWT_SECRET || "11bcc2adea6cd9b51b4cead027ad9505c7f72df7498b522fe1f399fdb7aba87b2d21e22ced88a9f72fb95890564f15b79bab8d4f2068b945aa5484ad9d95ac3b";

// REGISTER new user
const register = async (req, res) => {
    const { name, gmail, password, age, address } = req.body;

    try {
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
            address
        });

        await user.save();

        // Create JWT token
        const token = jwt.sign(
            { id: user._id, gmail: user.gmail },
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
                address: user.address
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
            { id: user._id, gmail: user.gmail },
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
                address: user.address
            }
        });

    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Server error during login" });
    }
};

// VERIFY token (middleware)
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ message: "No token provided" });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.id;
        next();
    } catch (err) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};

module.exports = {
    register,
    login,
    verifyToken
};