require("dotenv").config();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User.model");
const { capitalizeFirstLetter } = require("../lib/utils");

/**
 * Registers a new user.
 * @param {Object} req - The request object.
 * @param {string} req.body.userId - The user ID.
 * @param {string} req.body.email - The email address.
 * @param {string} req.body.password - The password.
 * @param {Function} res - The response object.
 * @returns {Object} The response body.
 */
module.exports.register = async (req, res) => {
  try {
    // Extract user details from request body
    const { userId, email, password } = req.body;

    // Generate salt
    const salt = bcrypt.genSaltSync(10);

    // Hash password
    const hashedPassword = bcrypt.hashSync(password, salt);

    // Create new user object
    const newUser = new User({
      userId,
      email,
      password: hashedPassword,
    });

    // Save user to Database
    await newUser.save();

    // Return success response
    res.status(200).json({
      message: "User registered successfully",
    });
  } catch (error) {
    // Log error to console
    console.error(error);

    if (error.code === 11000) {
      // User or email already registered
      return res.status(400).json({
        message: `${capitalizeFirstLetter(
          Object.keys(error.keyPattern)[0]
        )} already registered`,
      });
    }

    // Return error response
    res.status(500).json({
      message: "Something went wrong",
    });
  }
};

/**
 * Logs a user in.
 * @param {Object} req - The request object.
 * @param {string} req.body.email - The email address.
 * @param {string} req.body.password - The password.
 * @param {Function} res - The response object.
 * @returns {Object} The response body.
 */
module.exports.login = async (req, res) => {
  try {
    // Extract user details from request body
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });

    // Check if user exists
    if (!user) {
      return res.status(400).json({
        message: "User not found",
      });
    }

    // Compare password
    const isMatch = bcrypt.compareSync(password, user.password);

    // Check if password matches
    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid password",
      });
    }

    const jwtSecret = process.env.JWT_SECRET;

    // Generate token
    const token = jwt.sign({ userId: user._id }, jwtSecret, {
      expiresIn: "6h",
    });

    // Return success response
    res.status(200).json({
      message: "Login successful",
      token,
    });
  } catch (error) {
    // Log error to console
    console.error(error);

    // Return error response
    res.status(500).json({
      message: "Something went wrong",
    });
  }
};
