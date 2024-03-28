const ServiceModel = require("../models/Service.model");

module.exports.getAll = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const services = await ServiceModel.find()
      .skip((page - 1) * limit)
      .limit(limit);

    const totalServices = await ServiceModel.find().count();

    return res
      .status(200)
      .json({ services, page: Number(page), totalServices });
      
  } catch (error) {
    return res.status(500).json({ error: "Error getting services" });
  }
};
