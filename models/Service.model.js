const { model, Schema } = require("mongoose");

const serviceSchema = new Schema({
  service: { type: String, required: true },
  status: { type: String, required: true },
});

const Service = model("Service", serviceSchema);

module.exports = Service;
