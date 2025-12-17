// Controllers/MessageController.js
const Message = require("../Models/MessageModel");
const User = require("../Models/UserModel");
const Course = require("../Models/CourseModel");

// Send a message
const sendMessage = async (req, res) => {
    const { receiverId, courseId, message } = req.body;
    const senderId = req.userId; // From auth middleware

    try {
        // Validate receiver exists
        const receiver = await User.findById(receiverId);
        if (!receiver) {
            return res.status(404).json({ message: "Receiver not found" });
        }

        // Validate course exists
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }

        // Create message
        const newMessage = new Message({
            senderId,
            receiverId,
            courseId,
            message: message.trim(),
            isRead: false
        });

        await newMessage.save();

        // Populate sender and receiver info
        const populatedMessage = await Message.findById(newMessage._id)
            .populate('senderId', 'name gmail role')
            .populate('receiverId', 'name gmail role')
            .populate('courseId', 'title');

        return res.status(201).json({ message: populatedMessage });
    } catch (err) {
        console.error("Error sending message:", err);
        return res.status(500).json({ error: "Failed to send message" });
    }
};

// Get conversation between two users for a specific course
const getConversation = async (req, res) => {
    const { userId, courseId } = req.params;
    const currentUserId = req.userId; // From auth middleware

    try {
        // Get all messages between these two users for this course
        const messages = await Message.find({
            courseId,
            $or: [
                { senderId: currentUserId, receiverId: userId },
                { senderId: userId, receiverId: currentUserId }
            ]
        })
        .populate('senderId', 'name gmail role')
        .populate('receiverId', 'name gmail role')
        .populate('courseId', 'title')
        .sort({ createdAt: 1 }); // Oldest first

        return res.status(200).json({ messages });
    } catch (err) {
        console.error("Error fetching conversation:", err);
        return res.status(500).json({ error: "Failed to fetch messages" });
    }
};

// Get all conversations for current user (grouped by user and course)
const getConversations = async (req, res) => {
    const currentUserId = req.userId;

    try {
        // Get all messages where user is sender or receiver
        const messages = await Message.find({
            $or: [
                { senderId: currentUserId },
                { receiverId: currentUserId }
            ]
        })
        .populate('senderId', 'name gmail role')
        .populate('receiverId', 'name gmail role')
        .populate('courseId', 'title')
        .sort({ createdAt: -1 });

        // Group messages by conversation (unique combination of other user + course)
        const conversationsMap = new Map();

        messages.forEach(msg => {
            // Determine the "other" user
            const otherUser = msg.senderId._id.toString() === currentUserId 
                ? msg.receiverId 
                : msg.senderId;
            
            const key = `${otherUser._id}_${msg.courseId._id}`;
            
            if (!conversationsMap.has(key)) {
                conversationsMap.set(key, {
                    user: otherUser,
                    course: msg.courseId,
                    lastMessage: msg,
                    unreadCount: 0
                });
            }

            // Count unread messages (where I'm the receiver and it's not read)
            if (msg.receiverId._id.toString() === currentUserId && !msg.isRead) {
                conversationsMap.get(key).unreadCount++;
            }
        });

        const conversations = Array.from(conversationsMap.values());

        return res.status(200).json({ conversations });
    } catch (err) {
        console.error("Error fetching conversations:", err);
        return res.status(500).json({ error: "Failed to fetch conversations" });
    }
};

// Mark messages as read
const markAsRead = async (req, res) => {
    const { userId, courseId } = req.params;
    const currentUserId = req.userId;

    try {
        // Mark all messages from userId to currentUserId in this course as read
        await Message.updateMany(
            {
                senderId: userId,
                receiverId: currentUserId,
                courseId,
                isRead: false
            },
            { isRead: true }
        );

        return res.status(200).json({ message: "Messages marked as read" });
    } catch (err) {
        console.error("Error marking messages as read:", err);
        return res.status(500).json({ error: "Failed to mark messages as read" });
    }
};

// Get unread message count
const getUnreadCount = async (req, res) => {
    const currentUserId = req.userId;

    try {
        const unreadCount = await Message.countDocuments({
            receiverId: currentUserId,
            isRead: false
        });

        return res.status(200).json({ unreadCount });
    } catch (err) {
        console.error("Error getting unread count:", err);
        return res.status(500).json({ error: "Failed to get unread count" });
    }
};

module.exports = {
    sendMessage,
    getConversation,
    getConversations,
    markAsRead,
    getUnreadCount
};