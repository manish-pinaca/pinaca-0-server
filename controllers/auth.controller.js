require("dotenv").config();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User.model");
const Customer = require("../models/Customer.model");
const Service = require("../models/Service.model");
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
    const { userName, email, password } = req.body;

    // Generate salt
    const salt = bcrypt.genSaltSync(10);

    // Hash password
    const hashedPassword = bcrypt.hashSync(password, salt);

    const newUser = new Customer({
      customerEmail: email,
      customerName: userName,
      password: hashedPassword,
    });

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
    const { email, password, role = "customer" } = req.body;

    let user;

    // Find user
    if (role === "admin") user = await User.findOne({ email });
    else user = await Customer.findOne({ customerEmail: email });

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
    if (role === "customer") {
      return res.status(200).json({
        message: "Login successful",
        token,
        role,
        user: {
          _id: user._id,
          customerEmail: user.customerEmail,
          customerName: user.customerName,
          pendingServices: user.pendingServices,
          activeServices: user.activeServices,
          rejectedServices: user.rejectedServices,
        },
      });
    }

    return res.status(200).json({
      message: "Login successful",
      token,
      role,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        notifications: user.notifications,
        requestedServices: user.requestedServices,
      },
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

module.exports.getUserData = async (req, res) => {
  try {
    const { role, userId } = req.params;

    if (role === "admin") {
      const user = await User.findById(userId, { __v: 0 });

      return res.status(200).json({
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          notifications: user.notifications,
          requestedServices: user.requestedServices,
        },
      });
    } else {
      const user = await Customer.findById(userId, { __v: 0 });

      return res.status(200).json({
        user: {
          _id: user._id,
          customerEmail: user.customerEmail,
          customerName: user.customerName,
          pendingServices: user.pendingServices,
          activeServices: user.activeServices,
          rejectedServices: user.rejectedServices,
          adminId: user.adminId,
        },
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error getting user data" });
  }
};

module.exports.addPendingService = async (customerId, serviceId, adminId) => {
  try {
    const admin = await User.findById(adminId);

    const service = await Service.findById(serviceId);

    const customer = await Customer.findById(customerId);

    if (!admin.notifications) admin.notifications = [];
    if (!admin.requestedServices) admin.requestedServices = [];

    admin.notifications.push({
      customerName: customer.customerName,
      serviceName: service.service,
      action: "requested",
    });

    admin.requestedServices.push({
      customerId,
      customerName: customer.customerName,
      serviceId,
      serviceName: service.service,
    });

    await User.findByIdAndUpdate(adminId, admin);

    customer.pendingServices.push(serviceId);

    return await Customer.findByIdAndUpdate(customerId, customer);
  } catch (error) {
    console.log(error);
    throw new Error("Couldn't add service to pendingService list");
  }
};

module.exports.removePendingService = async (customerId, serviceId) => {
  console.log(
    "🚀 ~ file: auth.controller.js:218 ~ module.exports.removePendingService= ~ serviceId:",
    serviceId
  );
  try {
    const customer = await Customer.findById(customerId);

    console.log(customer.pendingServices, "pending services:");

    customer.pendingServices = customer.pendingServices.filter((service) => {
      console.log("service: ", service, "serviceId: ", serviceId);
      return service !== serviceId;
    });

    console.log(customer.pendingServices, "pending services:");

    await Customer.findByIdAndUpdate(customerId, {
      $set: { pendingServices: customer.pendingServices },
    });
  } catch (error) {
    console.log(error);
    throw new Error("Couldn't remove service from pendingService list");
  }
};

module.exports.addActiveService = async (customerId, serviceId) => {
  try {
    const customer = await Customer.findById(customerId);

    customer.activeServices.push(serviceId);

    return await Customer.findByIdAndUpdate(customerId, customer);
  } catch (error) {
    throw new Error("Error updating active service");
  }
};

module.exports.addRejectedService = async (customerId, serviceId) => {
  try {
    const customer = await Customer.findById(customerId);

    customer.rejectedServices.push(serviceId);

    return await Customer.findByIdAndUpdate(customerId, customer);
  } catch (error) {
    throw new Error("Error updating rejected service");
  }
};

module.exports.removeRequestedService = async (
  customerId,
  serviceId,
  adminId
) => {
  try {
    const admin = await User.findById(adminId);

    admin.requestedServices = admin.requestedServices.filter(
      (request) =>
        !(request.serviceId === serviceId && request.customerId === customerId)
    );

    return await User.findByIdAndUpdate(adminId, admin);
  } catch (error) {
    console.log(error);
    throw new Error("Couldn't remove service from requestedService list");
  }
};
