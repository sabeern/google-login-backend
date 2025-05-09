const express = require("express");
const { updateMobileNumber } = require("../controllers/profileController");
const verifyJWT = require("../middleware/jwtVerify");
const router = express.Router();

router.post("/update-mobile", verifyJWT, updateMobileNumber);

module.exports = router;
