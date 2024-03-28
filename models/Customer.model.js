const { model, Schema } = require("mongoose");

const customerSchema = new Schema({
  customerName: { type: String, required: true },
  userId: { type: Schema.Types.ObjectId, required: true },
});

const Customer = model("customer", customerSchema);

module.exports = Customer;
