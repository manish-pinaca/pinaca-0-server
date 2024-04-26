const { model, Schema } = require("mongoose");

const userSchema = new Schema({
  name: { type: String, required: true },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  requestedServices: [
    {
      _id: false,
      serviceId: { type: String },
      serviceName: { type: String },
      customerId: { type: String },
      customerName: { type: String },
      requestedOn: { type: String },
    },
  ],
});

const User = model("User", userSchema);

module.exports = User;
