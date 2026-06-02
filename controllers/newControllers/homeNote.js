const HomeNote = require("../../models/newModels/homeNote");
const asyncHandler = require("express-async-handler");
const successHandler = require("../../common/successHandler");

// ========================== GET NOTE ==========================
const getHomeNote = asyncHandler(async (req, res) => {
  let note = await HomeNote.findOne();
  if (!note) {
    note = await HomeNote.create({ text: "Welcome to ClubTYL!", isActive: true });
  }

  successHandler(req, res, {
    Remarks: "Home note fetched successfully",
    Data: note,
  });
});

// =========================== UPDATE NOTE ==========================
const updateHomeNote = asyncHandler(async (req, res) => {
  const { text, isActive } = req.body;

  let note = await HomeNote.findOne();
  if (!note) {
    note = await HomeNote.create({ text: text || "Welcome to ClubTYL!", isActive: isActive ?? true });
  } else {
    note.text = text !== undefined ? text : note.text;
    note.isActive = isActive !== undefined ? isActive : note.isActive;
    await note.save();
  }

  successHandler(req, res, {
    Remarks: "Home note updated successfully",
    Data: note,
  });
});

module.exports = {
  getHomeNote,
  updateHomeNote,
};
