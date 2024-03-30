const { Router } = require("express");

const {
  register,
  login,
  getUserData,
} = require("../controllers/auth.controller");

const authRouter = Router();

authRouter.post("/signup", register);

authRouter.post("/login", login);

authRouter.get("/:role/:userId", getUserData);

module.exports = authRouter;
