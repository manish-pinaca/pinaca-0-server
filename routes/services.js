const { Router } = require("express");

const {
  getAll,
  saveAll,
  getService,
} = require("../controllers/service.controller");

const router = Router();

router.post("/save/all", saveAll);

router.get("/get/all", getAll);

router.get("/get/:serviceId", getService);

module.exports = router;
