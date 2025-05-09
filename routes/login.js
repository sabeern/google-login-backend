const express = require("express");
const { login, handleRefreshToken } = require("../controllers/loginController");
const router = express.Router();

router.post("/login", login);
router.get("/refresh", handleRefreshToken);

module.exports = router;
