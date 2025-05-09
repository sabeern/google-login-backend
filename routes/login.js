const express = require("express");
const {
  login,
  handleRefreshToken,
  logOut,
} = require("../controllers/loginController");
const router = express.Router();

router.post("/login", login);
router.get("/refresh", handleRefreshToken);
router.get("/logout", logOut);

module.exports = router;
