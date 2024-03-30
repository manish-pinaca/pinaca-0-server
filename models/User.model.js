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
  notifications: { type: Array },
  requestedServices: { type: Array },
});

const User = model("User", userSchema);

module.exports = User;
