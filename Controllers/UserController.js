const User = require("../Models/UserModel");

// GET all users
const getAllUsers = async (req, res, next) => {
    try {
        const users = await User.find().select('-password'); // Exclude password

        if (!users || users.length === 0) {
            return res.status(404).json({ message: "No users found" });
        }

        return res.status(200).json({ users });

    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: "Server error" });
    }
};

// ADD user (if you still want this separate from register)
const addUsers = async (req, res, next) => {
    const { name, gmail, password, age, address } = req.body;

    try {
        // Hash password before saving
        const bcrypt = require("bcryptjs");
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            name,
            gmail,
            password: hashedPassword,
            age,
            address
        });

        await user.save();
        
        // Don't send password back
        const userResponse = user.toObject();
        delete userResponse.password;
        
        return res.status(201).json({ user: userResponse });

    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Unable to add user" });
    }
};

// GET user by ID
const getBYID = async (req, res, next) => {
    const id = req.params.id;

    try {
        const user = await User.findById(id).select('-password');

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json({ user });

    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: "Server error" });
    }
};

// UPDATE user
const updateUsers = async (req, res, next) => {
    const id = req.params.id;
    const { name, gmail, age, address } = req.body;

    try {
        const user = await User.findByIdAndUpdate(
            id,
            { name, gmail, age, address },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: "Unable to update user" });
        }

        return res.status(200).json({ user });

    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: "Server error" });
    }
};

// Delete user
const deleteUsers = async (req, res, next) => {
    const id = req.params.id;
    
    try {
        const user = await User.findByIdAndDelete(id).select('-password');
        
        if (!user) {
            return res.status(404).json({ message: "Unable to delete user" });
        }
        
        return res.status(200).json({ user });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: "Server error" });
    }
};

module.exports = {
    getAllUsers,
    addUsers,
    getBYID,
    updateUsers,
    deleteUsers
};