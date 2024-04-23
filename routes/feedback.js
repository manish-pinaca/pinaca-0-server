const { Router } = require("express");

const { sendFeedback, getAllFeedbacks } = require("../controllers/feedback.controller");

const router = Router();

router.post("/send", sendFeedback);

router.get("/getAllFeedbacks", getAllFeedbacks);

module.exports = router;