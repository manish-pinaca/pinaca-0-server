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
  activeServices: [{ type: String }],
  pendingServices: [{ type: String }],
  rejectedServices: [{ type: String }],
});

const Customer = model("Customer", customerSchema);

module.exports = Customer;
