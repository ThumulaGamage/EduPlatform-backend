const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const userRouter = require("./Routes/UserRoutes");
const authRouter = require("./Routes/AuthRoutes");

const app = express();

// Middleware
app.use(cors()); // Enable CORS for frontend
app.use(express.json());

// Routes
app.use("/users", userRouter);
app.use("/auth", authRouter); // Auth routes

// Default route
app.get("/", (req, res) => {
    res.send("It is working");
});

// Connect to MongoDB
mongoose.connect("mongodb+srv://thumulagamage28_db_user:1cAxXUKBkTqf3fz2@usersdata.zjw0i8k.mongodb.net/?appName=UsersData")
    .then(() => {
        console.log("Connected to MongoDB");
        app.listen(5000, () => {
            console.log("Server running on port 5000");
        });
    })
    .catch((err) => console.log(err));