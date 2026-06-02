const router = require("express").Router();
const {
  getHomeNote,
  updateHomeNote,
} = require("../../controllers/newControllers/homeNote");
const { adminTokenVerify } = require("../../common/tokenVerify");

// ========================= Home Note Routes ==========================
router.get("/", getHomeNote); // Public
router.put("/", adminTokenVerify, updateHomeNote); // Admin only

module.exports = router;
