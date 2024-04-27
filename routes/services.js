const { Router } = require("express");

const {
  getAll,
  saveAll,
  getService,
  addService,
  getAllServicesFilterByCustomerId,
  getAllServicesFilterByStatus,
  changeServiceStatus,
} = require("../controllers/service.controller");

const router = Router();

router.post("/save/all", saveAll);

router.get("/get/all", getAll);

router.get("/getAllServices/:status", getAllServicesFilterByStatus);

router.get("/get/:serviceId", getService);

router.post("/add", addService);

router.get("/getAllServicesFilterByCustomerId/:customerId", getAllServicesFilterByCustomerId);

router.patch("/changeServiceStatus/:serviceId/:status", changeServiceStatus);

module.exports = router;
