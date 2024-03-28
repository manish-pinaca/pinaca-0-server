const { model, Schema } = require("mongoose");

const serviceSchema = new Schema({
  service: { type: String, required: true },
  userId: { type: Schema.Types.ObjectId, required: true },
});

const ServiceModel = model("service", serviceSchema);

module.exports = ServiceModel;