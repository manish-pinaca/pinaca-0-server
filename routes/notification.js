const { Router } = require("express");

const { fetchNotifications, markAsRead } = require("../controllers/notification.controller");

const router = Router();

router.get("/get/:userId", fetchNotifications);

router.put("/markAsRed/:notificationId/:receiverId", markAsRead);

module.exports = router;