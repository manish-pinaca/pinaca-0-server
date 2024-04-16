const Customer = require("../models/Customer.model");

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
