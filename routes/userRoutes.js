const express = require("express");
const users = require("../controllers/userControllers");
const router = express.Router();

// Create a new user
router.post("/", users.signup);

// Log a user in
router.post("/login", users.login);

// Log a user out
router.post("/logout", users.logout);

// Return information about the current user (based on cookie value)
router.get("/me", users.getUserWithId);

module.exports = router;
