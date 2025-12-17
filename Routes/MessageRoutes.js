// Routes/MessageRoutes.js
const express = require("express");
const router = express.Router();
const MessageController = require("../Controllers/MessageController");
const { verifyToken } = require("../Controllers/AuthController");

// All message routes require authentication
router.use(verifyToken);

// Send a message
router.post("/send", MessageController.sendMessage);

// Get conversation between current user and another user for a course
router.get("/conversation/:userId/:courseId", MessageController.getConversation);

// Get all conversations for current user
router.get("/conversations", MessageController.getConversations);

// Mark messages as read
router.put("/read/:userId/:courseId", MessageController.markAsRead);

// Get unread message count
router.get("/unread-count", MessageController.getUnreadCount);

console.log('✅ MessageRoutes loaded');

module.exports = router;