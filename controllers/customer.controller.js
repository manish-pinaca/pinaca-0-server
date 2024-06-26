const Customer = require("../models/Customer.model");
const NotificationModel = require("../models/Notification.model");
const UserModel = require("../models/User.model");
const AWS = require("aws-sdk");
const fs = require("fs");

const bucketName = process.env.AWS_BUCKET_NAME;
const region = process.env.AWS_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

const s3 = new AWS.S3({
  region: region,
  accessKeyId: accessKeyId,
  secretAccessKey: secretAccessKey,
});

module.exports.saveAll = async (req, res) => {
  try {
    const { customers } = req.body;

    const response = await Customer.insertMany(customers);

    return res.json({ message: "Customers details saved successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error saving customers details" });
  }
};

module.exports.getAll = async (req, res) => {
  try {
    const { page, limit } = req.query;

    if (!(page && limit)) {
      const customers = await Customer.find({}, { __v: 0, password: 0 });

      return res.status(200).json({ customers });
    }
    const customers = await Customer.find({}, { __v: 0, password: 0 })
      .skip((page - 1) * limit)
      .limit(limit);

    const totalCustomers = await Customer.find().count();

    return res.json({ customers, page: Number(page), totalCustomers });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error retrieving customers details" });
  }
};

module.exports.getAllActiveCustomers = async (req, res) => {
  try {
    const customers = await Customer.find({}, { __v: 0, password: 0 });
    const updatedCustomers = [];

    customers.forEach((customer) => {
      if (customer.activeServices.length === 0) {
        updatedCustomers.push({
          _id: customer._id,
          customerName: customer.customerName,
          userEmail: customer.userEmail,
          adminId: customer.adminId,
          activeService: "",
        });
      } else {
        customer.activeServices.forEach((service) => {
          updatedCustomers.push({
            _id: customer._id,
            customerName: customer.customerName,
            userEmail: customer.userEmail,
            adminId: customer.adminId,
            activeService: service,
          });
        });
      }
    });

    return res.status(200).json({ customers: updatedCustomers });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving customers details" });
  }
};

module.exports.getCustomerName = async (req, res) => {
  try {
    const { customerId } = req.params;

    const customer = await Customer.findById(customerId, {
      __v: 0,
      password: 0,
    });

    return res.status(200).json({ customerName: customer.customerName });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error retrieving customers details" });
  }
};

module.exports.uploadReport = async (req, res) => {
  const { customerId } = req.params;
  const { serviceId, serviceName, generatedOn, adminId } = req.body;

  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        error: "You must upload a file",
      });
    }

    const customer = await Customer.findById(customerId, {
      password: 0,
      __v: 0,
    });

    const user = await UserModel.findById(adminId, { password: 0, __v: 0 });

    if (
      !customer.activeServices.find(
        (service) => service.serviceId === serviceId
      )
    ) {
      customer.activeServices.push({
        serviceId: serviceId,
        serviceName: serviceName,
        activateOn: new Date().toUTCString(),
      });
    }

    if (
      customer.pendingServices.find(
        (service) => service.serviceId === serviceId
      )
    ) {
      customer.pendingServices = customer.pendingServices.filter(
        (service) => service.serviceId !== serviceId
      );
    }

    // comment below code for later reference
    /*
    const fileStream = fs.createReadStream(file.path);

    const params = {
      Bucket: bucketName,
      Key: file.originalname,
      Body: fileStream,
    };

    s3.upload(params, async (err, data) => {
      if (err) {
        console.log("[ERROR]:", err);
        return res.status(400).json({
          success: false,
          error: err.message,
          message: "Failed to upload file",
        });
      }
      fs.unlinkSync(file.path);
      console.log("File uploaded successfully");

      if (!customer.reports) customer.reports = [];

      customer.reports.push({
        serviceId: serviceId,
        serviceName: serviceName,
        generatedOn: generatedOn,
        awsReportKey: data.Key,
        filename: file.filename
      });

      const newNotification = new NotificationModel({
        message: `${user.name} has added a new service ${serviceName} to your account.`,
        type: "ADD_SERVICE",
        sendBy: adminId,
        sendTo: [{ receiverId: customerId, seen: false }],
      });

      if (
        user.requestedServices.find(
          (service) => service.serviceId === serviceId
        )
      ) {
        user.requestedServices = user.requestedServices.filter(
          (service) => service.serviceId !== serviceId
        );
        await UserModel.findByIdAndUpdate(adminId, user);
      }

      await newNotification.save();

      await Customer.findByIdAndUpdate(customerId, customer);

      return res.status(200).json({ message: "Report uploaded successfully" });
    });
    */

    if (!customer.reports) customer.reports = [];

    customer.reports.push({
      serviceId: serviceId,
      serviceName: serviceName,
      generatedOn: generatedOn,
      // awsReportKey: data.Key,
      filename: file.filename,
    });

    const newNotification = new NotificationModel({
      message: `${user.name} has added a new service ${serviceName} to your account.`,
      type: "ADD_SERVICE",
      sendBy: adminId,
      sendTo: [{ receiverId: customerId, seen: false }],
    });

    if (
      user.requestedServices.find((service) => service.serviceId === serviceId)
    ) {
      user.requestedServices = user.requestedServices.filter(
        (service) => service.serviceId !== serviceId
      );
      await UserModel.findByIdAndUpdate(adminId, user);
    }

    await newNotification.save();

    await Customer.findByIdAndUpdate(customerId, customer);

    return res.status(200).json({ message: "Report uploaded successfully" });
  } catch (error) {
    console.log("[ERROR]:", error);
    return res.status(500).json({ message: "Error uploading reports" });
  }
};

function uploadFileToS3(file) {
  const fileStream = fs.createReadStream(file.path);

  const params = {
    Bucket: bucketName,
    Key: file.originalname,
    Body: fileStream,
  };

  s3.upload(params, (err, data) => {
    if (err) throw new Error(err.message);
    fs.unlinkSync(file.path);
    console.log("File uploaded successfully");
    return data;
  });
}

module.exports.downloadReport = async (req, res) => {
  const { filename } = req.params;

  try {
    // comment below code for later reference
    /*
    const data = await s3
      .getObject({ Bucket: bucketName, Key: reportKey })
      .promise();

    res.send(data.Body);
    */

    if (!filename) {
      return res.status(400).send("filename is required.");
    }

    fs.access("uploads/" + filename, fs.constants.F_OK, (err) => {
      if (err) {
        return res.status(404).send("File not found.");
      }

      // Read the file and send it as a blob
      const file = fs.readFileSync("uploads/" + filename);

      return res.send(file);
    });
  } catch (error) {
    console.error("Error fetching file from S3:", error);
    res.status(500).send("Failed to download file");
  }
};

module.exports.getAllCustomersFilterByServiceId = async (req, res) => {
  const { serviceId } = req.params;

  try {
    const customers = await Customer.find({}, { password: 0, __v: 0 });

    const updatedCustomers = customers.filter(
      (customer) =>
        customer.activeServices.filter(
          (service) => service.serviceId === serviceId
        ).length > 0
    );

    return res.status(200).json({ customers: updatedCustomers });
  } catch (error) {
    return res.status(500).json({ message: "Error while getting customers" });
  }
};
