const { Router } = require("express");
const uploadMiddleware = require("../middlewares/upload");

const {
  saveAll,
  getAll,
  getAllActiveCustomers,
  getCustomerName,
  uploadReport,
  downloadReport,
  getAllCustomersFilterByServiceId,
} = require("../controllers/customer.controller");

const router = Router();

router.post("/save/all", saveAll);

router.get("/get/all", getAll);

router.get("/get/all/activeCustomers", getAllActiveCustomers);

router.get("/getCustomerName/:customerId", getCustomerName);

router.patch("/uploadReport/:customerId", uploadMiddleware, uploadReport);

router.get("/reports/download/:filename", downloadReport);

router.get("/getAllCustomersFilterByServiceId/:serviceId", getAllCustomersFilterByServiceId);

module.exports = router;
