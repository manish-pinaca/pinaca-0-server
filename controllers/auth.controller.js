require("dotenv").config();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const PDFDocument = require("pdfkit");
const moment = require("moment");

const User = require("../models/User.model");
const Customer = require("../models/Customer.model");
const Service = require("../models/Service.model");
const NotificationModel = require("../models/Notification.model");
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
      userEmail: email,
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
    else user = await Customer.findOne({ userEmail: email });

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
          customerEmail: user.userEmail,
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
          customerEmail: user.userEmail,
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

    if (!admin.requestedServices) admin.requestedServices = [];

    const requestedTime = new Date().toUTCString();

    const newNotification = new NotificationModel({
      message: `${customer.customerName} has requested activation of ${service.service}.`,
      type: "ADD_SERVICE_REQUEST",
      sendBy: customerId,
      sendTo: [
        {
          receiverId: adminId,
          seen: false,
        },
      ],
    });

    await newNotification.save();

    admin.requestedServices.push({
      serviceId,
      customerId,
      customerName: customer.customerName,
      serviceName: service.service,
      requestedOn: requestedTime,
    });

    await User.findByIdAndUpdate(adminId, admin);

    customer.pendingServices.push({
      serviceId,
      serviceName: service.service,
      requestedOn: requestedTime,
    });

    return await Customer.findByIdAndUpdate(customerId, customer);
  } catch (error) {
    console.log(error);
    throw new Error("Couldn't add service to pendingService list");
  }
};

module.exports.removePendingService = async (customerId, serviceId) => {
  try {
    const customer = await Customer.findById(customerId);

    customer.pendingServices = customer.pendingServices.filter((service) => {
      return service.serviceId !== serviceId;
    });

    await Customer.findByIdAndUpdate(customerId, {
      $set: { pendingServices: customer.pendingServices },
    });
  } catch (error) {
    console.log(error);
    throw new Error("Couldn't remove service from pendingService list");
  }
};

module.exports.addActiveService = async (customerId, serviceId, adminId) => {
  try {
    const customer = await Customer.findById(customerId);

    const user = await User.findById(adminId, { password: 0, __v: 0 });

    const service = await Service.findById(serviceId);

    const acceptTime = new Date().toUTCString();

    const newNotification = new NotificationModel({
      message: `${user.name} has added ${service.service} to your account.`,
      type: "ADD_SERVICE",
      sendBy: adminId,
      sendTo: [
        {
          receiverId: customerId,
          seen: false,
        },
      ],
    });

    await newNotification.save();

    customer.activeServices.push({
      serviceId,
      serviceName: service.service,
      activateOn: acceptTime,
    });

    return await Customer.findByIdAndUpdate(customerId, customer);
  } catch (error) {
    throw new Error("Error updating active service");
  }
};

module.exports.addRejectedService = async (customerId, serviceId, adminId) => {
  try {
    const customer = await Customer.findById(customerId);

    const service = await Service.findById(serviceId);

    const admin = await User.findById(adminId);

    customer.rejectedServices.push({
      serviceId,
      serviceName: service.service,
      rejectedOn: new Date().toUTCString(),
    });

    const newNotification = new NotificationModel({
      message: `${admin.name} has rejected activation of ${service.service}.`,
      type: "REMOVE_SERVICE_REQUEST",
      sendBy: adminId,
      sendTo: [
        {
          receiverId: customerId,
          seen: false,
        },
      ],
    });

    await newNotification.save();

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

/*
module.exports.downloadReport = async (req, res) => {
  try {
    const doc = new PDFDocument({ size: "A4", margin: 10 });

    // Set response headers for PDF download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=example.pdf");

    const { customerId, serviceId } = req.params;
    doc.pipe(res);
    if (customerId !== "all" && serviceId !== "all") {
      const customer = await Customer.findById(customerId);

      const filteredService = customer.activeServices.filter(
        (service) => service.serviceId === serviceId
      );

      if (!filteredService.length) {
        return res.status(400).json({
          message: "Service is not active.",
        });
      }

      const tableData = [
        customer.customerName,
        filteredService[0].serviceName,
        moment(
          filteredService[0].activateOn !== "DD/MM/YYYY"
            ? filteredService[0].activateOn
            : "01/01/2022"
        ).format("L"),
      ];

      drawTable(doc, [tableData]);
    } else if (customerId === "all" && serviceId !== "all") {
      const customers = await Customer.find();

      const filteredCustomers = customers.filter(
        (customer) =>
          customer.activeServices.filter(
            (service) => service.serviceId === serviceId
          ).length > 0
      );

      if (filteredCustomers.length === 0) {
        return res.status(400).json({
          message: "Service is not active.",
        });
      }

      const tableData = filteredCustomers.map((customer) => {
        const filteredService = customer.activeServices.filter(
          (service) => service.serviceId === serviceId
        )[0];

        return [
          customer.customerName,
          filteredService.serviceName,
          moment(
            filteredService.activateOn !== "DD/MM/YYYY"
              ? filteredService.activateOn
              : "01/01/2022"
          ).format("L"),
        ];
      });

      drawTable(doc, tableData);
    } else if (customerId !== "all" && serviceId === "all") {
      const customer = await Customer.findById(customerId);

      if (customer.activeServices.length === 0) {
        return res.status(400).json({
          message: "Service is not active.",
        });
      }

      const tableData = customer.activeServices.map((service) => [
        customer.customerName,
        service.serviceName,
        moment(
          service.activateOn !== "DD/MM/YYYY"
            ? service.activateOn
            : "01/01/2022"
        ).format("L"),
      ]);

      drawTable(doc, tableData);
    } else {
      const customers = await Customer.find();

      const tableData = [];

      customers.forEach((customer) => {
        if (customer.activeServices.length === 0) {
          tableData.push([customer.customerName, "-", "-"]);
        } else {
          for (let i = 0; i < customer.activeServices.length; i++) {
            tableData.push([
              customer.customerName,
              customer.activeServices[i].serviceName,
              moment(
                customer.activeServices[i].activateOn !== "DD/MM/YYYY"
                  ? customer.activeServices[i].activateOn
                  : "01/01/2022"
              ).format("L"),
            ]);
          }
        }
      });

      drawTable(doc, tableData);
    }

    doc.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error generating report" });
  }
};
*/

function drawTable(doc, data) {
  // Calculate the maximum number of rows that fit on a page
  const maxRowsPerPage = 30; // Adjust according to your requirement
  const rowsPerPage = maxRowsPerPage - 1; // Reserve space for header row
  const numberOfPages = Math.ceil(data.length / rowsPerPage);

  function addRows(pageIndex) {
    const startIndex = pageIndex * rowsPerPage;
    const endIndex = Math.min((pageIndex + 1) * rowsPerPage, data.length);

    // Add header row
    doc.font("Helvetica-Bold").fontSize(12);
    doc.text("Customer", 30, 50);
    doc.text("Service", 300, 50);
    doc.text("Start Date", 500, 50);
    // Add rows
    doc.font("Helvetica").fontSize(10);
    let y = 70;
    for (let i = startIndex; i < endIndex; i++) {
      const rowData = data[i];
      if (!rowData) continue; // Skip empty rows
      doc.text(rowData[0], 30, y);
      doc.text(rowData[1], 300, y);
      doc.text(rowData[2], 500, y);
      y += 20;
    }
  }

  // Add rows for each page
  for (let pageIndex = 0; pageIndex < numberOfPages; pageIndex++) {
    if (pageIndex > 0) {
      doc.addPage();
    }
    addRows(pageIndex);
  }
}

module.exports.getReports = async (req, res) => {
  try {
    const { customerId, serviceId } = req.params;

    if (!customerId || !serviceId)
      return res
        .status(404)
        .json({ message: "Customer id and service id are required" });

    if (customerId !== "all" && serviceId !== "all") {
      const customer = await Customer.findById(customerId);

      const filteredReports = customer.reports
        ? customer.reports.filter((report) => report.serviceId === serviceId)
        : [];

      if (!filteredReports.length) {
        return res.status(400).json({
          message: "No reports found for service",
        });
      }

      const data = filteredReports.map((report) => {
        return {
          customerId,
          customerName: customer.customerName,
          serviceId: report.serviceId,
          serviceName: report.serviceName,
          generatedOn: report.generatedOn,
          awsReportKey: report.awsReportKey,
        };
      });

      return res.status(200).json(data);
    } else if (customerId === "all" && serviceId !== "all") {
      const customers = await Customer.find();

      const filteredCustomers = customers.filter(
        (customer) =>
          customer.reports?.filter((report) => report.serviceId === serviceId)
            .length > 0
      );

      if (filteredCustomers.length === 0) {
        return res.status(400).json({
          message: "No reports found for service",
        });
      }

      const data = [];

      filteredCustomers.forEach((customer) => {
        customer.reports.forEach((report) => {
          if (report.serviceId === serviceId)
            data.push({
              customerId: customer._id,
              customerName: customer.customerName,
              serviceId: report.serviceId,
              serviceName: report.serviceName,
              awsReportKey: report.awsReportKey,
              generatedOn: report.generatedOn,
            });
        });
      });
      return res.status(200).json(data);
    } else if (customerId !== "all" && serviceId === "all") {
      const customer = await Customer.findById(customerId);

      if (customer.reports?.length === 0) {
        return res.status(400).json({
          message: "No reports found",
        });
      }

      const data = customer.reports.map((report) => {
        return {
          customerId,
          customerName: customer.customerName,
          serviceId: report.serviceId,
          serviceName: report.serviceName,
          generatedOn: report.generatedOn,
          awsReportKey: report.awsReportKey,
        };
      });

      return res.status(200).json(data);
    } else {
      const customers = await Customer.find();

      const data = [];

      customers.forEach((customer) => {
        customer.reports?.forEach((report) => {
          data.push({
            customerId: customer._id,
            customerName: customer.customerName,
            serviceId: report.serviceId,
            serviceName: report.serviceName,
            awsReportKey: report.awsReportKey,
            generatedOn: report.generatedOn,
          });
        });
      });

      return res.status(200).json(data);
    }
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong" });
  }
};
