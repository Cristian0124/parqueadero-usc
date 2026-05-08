const express = require("express");
const router  = express.Router();
const auth    = require("../controllers/authController");

router.post("/register", auth.register);
router.post("/login",    auth.login);
router.post("/recover",  auth.recover);   // ruta de recuperación implementada

module.exports = router;
