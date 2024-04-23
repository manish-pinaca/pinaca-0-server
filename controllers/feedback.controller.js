const FeedbackModel = require("../models/Feedback.model");

module.exports.sendFeedback = async (req, res) => {
  try {
    const body = req.body;

    const feedback = new FeedbackModel(body);
    const response = await feedback.save();
    return res.status(200).json({ message: "Feedback sent successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error sending feedback" });
  }
};

module.exports.getAllFeedbacks = async (req, res) => {
  try {
    const { page, limit } = req.query;

    if (!(page && limit)) {
      const feedbacks = await FeedbackModel.find().sort({ createdAt: -1 });

      return res
        .status(200)
        .json({ feedbacks, totalFeedbacks: feedbacks.length });
    }

    const feedbacks = await FeedbackModel.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const totalFeedbacks = await FeedbackModel.find().count();

    return res.status(200).json({ feedbacks, totalFeedbacks });
  } catch (error) {
    console.log("error", error);
    return res.status(500).json({ message: "Feedback not found" });
  }
};
