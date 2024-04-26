const { model, Schema } = require("mongoose");

const notificationSchema = new Schema(
  {
    message: { type: String, required: true },
    type: { type: String, required: true },
    sendBy: { type: String, required: true },
    sendTo: [
      {
        _id: false,
        receiverId: { type: String, required: true },
        seen: { type: Boolean },
      },
    ],
  },
  { timestamps: true }
);

const NotificationModel = model("notification", notificationSchema);

module.exports = NotificationModel;
