const { Router } = require("express");

const { getAll, saveAll } = require("../controllers/service.controller");

const router = Router();

router.post("/save/all", saveAll)

router.get("/get/all", getAll);

module.exports = router;
