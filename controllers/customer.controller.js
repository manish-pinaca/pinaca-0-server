const Customer = require("../models/Customer.model");
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
  const { serviceId, serviceName, generatedOn } = req.body;

  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        error: "You must upload a file",
      });
    }

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

      const customer = await Customer.findById(customerId, {
        password: 0,
        __v: 0,
      });

      if (!customer.reports) customer.reports = [];

      customer.reports.push({
        serviceId: serviceId,
        serviceName: serviceName,
        generatedOn: generatedOn,
        awsReportKey: data.Key,
      });

      await Customer.findByIdAndUpdate(customerId, customer);
      return res.status(200).json({ message: "Report uploaded successfully" });
    });
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
  const { reportKey } = req.params;

  try {
    const data = await s3
      .getObject({ Bucket: bucketName, Key: reportKey })
      .promise();

    res.send(data.Body);
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
