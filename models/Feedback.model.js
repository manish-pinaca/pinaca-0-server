const { model, Schema } = require("mongoose");

const feedbackSchema = new Schema({
  customerId: { type: String, required: true },
  customerName: { type: String, required: true },
  serviceId: { type: String, required: true },
  serviceName: { type: String, required: true },
  feedback: { type: String, required: true },
  rating: { type: Number, required: true },
}, { timestamps: true });

const FeedbackModel = model("feedback", feedbackSchema);

module.exports = FeedbackModel;
