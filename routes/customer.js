const { Router } = require("express");

const {
  saveAll,
  getAll,
  getAllActiveCustomers
} = require("../controllers/customer.controller");

const router = Router();

router.post("/save/all", saveAll);

router.get("/get/all", getAll);

router.get("/get/all/activeCustomers", getAllActiveCustomers)

module.exports = router;
