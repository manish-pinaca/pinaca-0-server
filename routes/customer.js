const { Router } = require("express");

const {
  saveAll,
  getAll,
} = require("../controllers/customer.controller");

const router = Router();

router.post("/save/all", saveAll);

router.get("/get/all", getAll);

module.exports = router;
