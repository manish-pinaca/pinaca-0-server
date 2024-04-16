const ServiceModel = require("../models/Service.model");

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
