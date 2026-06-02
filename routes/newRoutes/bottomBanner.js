const router = require("express").Router();
const { homeBannerImages } = require("../../common/fileUpload");
const {
  getBottomBanners,
  getBottomBannersAdmin,
  createBottomBanner,
  updateBottomBanner,
  deleteBottomBanner,
} = require("../../controllers/newControllers/bottomBanner");
const { adminTokenVerify, tokenVerify } = require("../../common/tokenVerify");

// ========================= Bottom Banner Routes ==========================
router.get("/list", tokenVerify, getBottomBanners);
router.get("/admin/list", adminTokenVerify, getBottomBannersAdmin);
router.post("/create", adminTokenVerify, homeBannerImages.single("image"), createBottomBanner);
router.put("/:bannerId", adminTokenVerify, homeBannerImages.single("image"), updateBottomBanner);
router.delete("/:bannerId", adminTokenVerify, deleteBottomBanner);

module.exports = router;
