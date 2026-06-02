const BottomBanner = require("../../models/newModels/bottomBanner");
const asyncHandler = require("express-async-handler");
const successHandler = require("../../common/successHandler");
const deletePreviousImage = require("../../common/deletePreviousImage");

//========================== GET ALL BANNERS ==========================
const getBottomBanners = asyncHandler(async (req, res) => {
  const all = await BottomBanner.find({status:true}).sort({ createdAt: -1 }).lean();
  successHandler(req, res, {
    Remarks: "Bottom banners fetched successfully",
    Data: all,
  });
});

// ========================== GET ALL BANNERS FOR ADMIN ==========================
const getBottomBannersAdmin = asyncHandler(async (req, res) => {
  const all = await BottomBanner.find().sort({ createdAt: -1 });

  successHandler(req, res, {
    Remarks: "Bottom banners fetched successfully",
    Data: all,
  });
});

// ========================== CREATE BANNER ==========================
const createBottomBanner = asyncHandler(async (req, res) => {
  const { name, link } = req.body;

  const newBanner = new BottomBanner({
    name,
    link,
    image: req?.file?.path,
    status: true,
  });

  const saved = await BottomBanner.create(newBanner);

  successHandler(req, res, {
    Remarks: "Bottom banner created successfully",
    Data: saved,
  });
});

// =========================== UPDATE BANNER ==========================
const updateBottomBanner = asyncHandler(async (req, res) => {
  const { bannerId } = req.params;

  const found = await BottomBanner.findById(bannerId);
  if (!found) {
    res.status(400);
    throw new Error("Invalid banner id");
  }

  if (req.file) {
    deletePreviousImage(found.image);
  }

  const updated = await BottomBanner.findByIdAndUpdate(
    bannerId,
    {
      ...req.body,
      image: req.file ? req.file.path : found.image,
    },
    { new: true }
  );

  successHandler(req, res, {
    Remarks: "Bottom banner updated successfully",
    Data: updated,
  });
});

//  ========================= DELETE BANNER ==========================
const deleteBottomBanner = asyncHandler(async (req, res) => {
  const { bannerId } = req.params;

  const found = await BottomBanner.findById(bannerId);
  if (!found) {
    res.status(400);
    throw new Error("Invalid banner id");
  }
  if(found.image) deletePreviousImage(found.image);
  const removed = await BottomBanner.findByIdAndDelete(bannerId);

  successHandler(req, res, {
    Remarks: "Bottom banner deleted successfully",
    Data: removed,
  });
});

module.exports = {
  getBottomBanners,
  getBottomBannersAdmin,
  createBottomBanner,
  updateBottomBanner,
  deleteBottomBanner,
};
