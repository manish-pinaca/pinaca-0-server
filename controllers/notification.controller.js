const NotificationModel = require("../models/Notification.model");

module.exports.fetchNotifications = async (req, res) => {
  try {
    const { userId } = req.params;

    const notifications = await NotificationModel.find({
      "sendTo.receiverId": userId,
      "sendTo.seen": false,
    }).sort({ createdAt: -1 });

    console.log("Notifications:", notifications);

    return res.status(200).json({ notifications });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error getting notifications" });
  }
};

module.exports.markAsRead = async (req, res) => {
  const { notificationId, receiverId } = req.params;

  try {
    const notification = await NotificationModel.findById(notificationId);

    notification.sendTo.forEach((receiver) => {
      if (receiver.receiverId === receiverId) receiver.seen = true;
    });

    await NotificationModel.findByIdAndUpdate(notificationId, notification);

    return res.status(200).json({ message: "Notification marked as read" });
  } catch (error) {
    return res.status(500).json({ message: "Error while marking as read" });
  }
};
