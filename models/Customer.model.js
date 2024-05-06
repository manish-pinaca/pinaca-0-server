const { model, Schema } = require("mongoose");

const customerSchema = new Schema({
  userEmail: { type: String, required: true, unique: true },
  customerName: { type: String, required: true },
  adminId: {
    type: Schema.Types.ObjectId,
    default: "65fe5609b50735ce980e5082",
    required: true,
  },
  password: { type: String, required: true },
  activeServices: [
    {
      _id: false,
      serviceId: { type: String },
      serviceName: { type: String },
      activateOn: { type: String },
    },
  ],
  pendingServices: [
    {
      _id: false,
      serviceId: { type: String },
      serviceName: { type: String },
      requestedOn: { type: String },
    },
  ],
  rejectedServices: [
    {
      _id: false,
      serviceId: { type: String },
      serviceName: { type: String },
      rejectedOn: { type: String },
    },
  ],
  reports: [
    {
      _id: false,
      serviceId: { type: String },
      serviceName: { type: String },
      generatedOn: { type: String },
      awsReportKey: { type: String },
      filename: { type: String },
    },
  ],
});

const Customer = model("Customer", customerSchema);

module.exports = Customer;
