const Customer = require("../models/Customer.model");
const ServiceModel = require("../models/Service.model");
const NotificationModel = require("../models/Notification.model");
const UserModel = require("../models/User.model");

module.exports.saveAll = async (req, res) => {
  try {
    const { services } = req.body;

    const response = await ServiceModel.insertMany(services);

    return res.json({ message: "Services saved successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error saving service details" });
  }
};

module.exports.getAll = async (req, res) => {
  try {
    const { page, limit } = req.query;

    if (!(page && limit)) {
      const services = await ServiceModel.find({}, { __v: 0 });

      return res.status(200).json({ services });
    }

    const services = await ServiceModel.find()
      .skip((page - 1) * limit)
      .limit(limit);

    const totalServices = await ServiceModel.find().count();

    return res
      .status(200)
      .json({ services, page: Number(page), totalServices });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error getting services" });
  }
};

module.exports.getService = async (req, res) => {
  try {
    const { serviceId } = req.params;

    const service = await ServiceModel.findById(serviceId, { __v: 0 });

    return res.status(200).json(service);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error getting service" });
  }
};

module.exports.addService = async (req, res) => {
  try {
    const { service, adminId } = req.body;

    const response = await ServiceModel.create({ service });

    const admin = await UserModel.findById(adminId);

    const customers = await Customer.find({}, { password: 0, __v: 0 });

    const newNotification = new NotificationModel({
      message: `${admin.name} has added a ${service}.`,
      type: "ADD_SERVICE",
      sendBy: adminId,
      sendTo: customers.map((customer) => {
        return {
          receiverId: customer._id,
          seen: false,
        };
      }),
    });

    await newNotification.save();

    return res.json({ message: "Service saved successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error saving service details" });
  }
};

module.exports.getAllServicesFilterByCustomerId = async (req, res) => {
  try {
    const { customerId } = req.params;

    const customer = await Customer.findById(customerId);

    const services = customer.activeServices.map((service) => {
      return {
        _id: service.serviceId,
        service: service.serviceName,
      };
    });

    return res.status(200).json({ services });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error getting services" });
  }
};
