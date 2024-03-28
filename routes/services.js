const { Router } = require("express");

const { getAll } = require("../controllers/service.controller");

const router = Router();

router.get("/get/all", getAll);

module.exports = router;
