const express = require("express");
const router = express.Router();
const User = require("../Models/UserModel");
const UserController = require("../Controllers/UserController");
const { verifyToken } = require("../Controllers/AuthController"); // Import middleware

// Protected routes - require authentication
router.get("/", verifyToken, UserController.getAllUsers);
router.post("/", verifyToken, UserController.addUsers);
router.get("/:id", verifyToken, UserController.getBYID);
router.put("/:id", verifyToken, UserController.updateUsers);
router.delete("/:id", verifyToken, UserController.deleteUsers);

module.exports = router;