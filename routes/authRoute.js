const router = require("express").Router();
const { tokenVerify} = require("../common/tokenVerify");
const { userSignUp,logout, loginWithPassword, addSubUser } = require("../controllers/auth");

// ========================= Auth Routes ==========================
router.post("/user-register", userSignUp); 
router.post("/send-otp", userSignUp);
router.post("/add-sub-user", tokenVerify, addSubUser);
router.post("/login-password", loginWithPassword);
router.post("/logout", tokenVerify, logout); 

module.exports = router;
