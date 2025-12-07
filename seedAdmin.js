// seedAdmin.js - Run this once to create admin account
require('dotenv').config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./Models/UserModel");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://thumulagamage28_db_user:1cAxXUKBkTqf3fz2@usersdata.zjw0i8k.mongodb.net/?appName=UsersData";

const createAdmin = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to MongoDB");

        // Check if admin already exists
        const existingAdmin = await User.findOne({ gmail: "admin@eduplatform.com" });
        
        if (existingAdmin) {
            console.log("Admin already exists!");
            process.exit(0);
        }

        // Create admin user
        const hashedPassword = await bcrypt.hash("admin123", 10);
        
        const admin = new User({
            name: "Admin",
            gmail: "admin@eduplatform.com",
            password: hashedPassword,
            age: 30,
            address: "Admin Office",
            role: "admin"
        });

        await admin.save();
        console.log("Admin created successfully!");
        console.log("Email: admin@eduplatform.com");
        console.log("Password: admin123");
        console.log("⚠️  CHANGE THIS PASSWORD IMMEDIATELY!");

        process.exit(0);
    } catch (err) {
        console.error("Error creating admin:", err);
        process.exit(1);
    }
};

createAdmin();