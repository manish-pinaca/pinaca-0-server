const { Router } = require("express");

const {
  register,
  login,
  getUserData,
  downloadReport,
} = require("../controllers/auth.controller");

const authRouter = Router();

authRouter.post("/signup", register);

authRouter.post("/login", login);

authRouter.get("/:role/:userId", getUserData);

authRouter.get("/reports/download/:customerId/:serviceId", downloadReport);

module.exports = authRouter;
