const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;
const asyncHandler = require("express-async-handler");
const Otp = require("../models/otpSchema");
const User = require("../models/userSchema");
const sendSMS = require("../common/sendSMS");
const Service = require("../models/serviceSchema");
const Wallet = require("../models/walletSchema");
const generateOTP = require("../common/generateOtp");
const getIpAddress = require("../common/getIpAddress");
const uniqueIdGenerator = require("../common/uniqueIdGenerator");
const successHandler = require("../common/successHandler");

// ==================== USER SIGNUP / LOGIN CONTROLLER ====================
const userSignUp = asyncHandler(async (req, res) => {
  const tlog = (...args) => console.log(new Date().toISOString(), ...args);

  tlog("[ENTRY] userSignUp called");
  tlog("[REQ_HEADERS]", req.headers ? { token: req.headers.token } : "no-headers");
  tlog("[REQ_PATH]", req.path || req.originalUrl);
  tlog("[REQ_PARAMS]", req.params);
  tlog("[REQ_BODY_RAW]", req.body);

  const findSIGNUPService = await Service.findOne({ name: "SIGNUP" });
  tlog("[DB] findSIGNUPService result:", !!findSIGNUPService, findSIGNUPService?.status);

  const findLOGINService = await Service.findOne({ name: "LOGIN" });
  tlog("[DB] findLOGINService result:", !!findLOGINService, findLOGINService?.status);

  const {
    firstName,
    lastName,
    phone,
    email,
    referalId,
    otp,
    ResponseStatus,
    deviceToken
  } = req.body || {};

  tlog("[PARSED_INPUT]", { firstName, lastName, phone, email, referalId, otp, ResponseStatus, deviceToken });

  // ===== REGISTER FLOW =====
  if (ResponseStatus == 1) {
    tlog("[FLOW] ResponseStatus == 1 (registration flow)");

    if (!findSIGNUPService?.status) {
      tlog("[ERROR] Registration service disabled");
      return res.status(400).json({
        Error: true,
        Status: false,
        ResponseStatus: 0,
        StatusCode: "Ex400",
        Remarks: "Registration is Temporarely Closed 😞",
      });
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail && existingEmail.phone !== phone) {
      tlog("[ERROR] Email already used:", email);
      return res.status(400).json({
        Error: true,
        Status: false,
        ResponseStatus: 0,
        StatusCode: "Ex400",
        Remarks: "Email is already used.",
      });
    }

    const existingPhone = await User.findOne({ phone });
    if (existingPhone && !existingPhone.isStub) {
      tlog("[ERROR] Phone already registered:", phone);
      return res.status(400).json({
        Error: true,
        Status: false,
        ResponseStatus: 0,
        StatusCode: "Ex400",
        Remarks: "Phone number is already registered.",
      });
    }

    if (!firstName || !lastName || !email) {
      tlog("[ERROR] Missing required fields:", { firstName, lastName, email });
      return res.status(400).json({
        Error: true,
        Status: false,
        ResponseStatus: 0,
        StatusCode: "Ex400",
        Remarks: "(firstName, lastName, email) fields are mandatory.",
      });
    }

    // Validate referral
    const referalFound = referalId ? await User.findOne({ referalId }) : null;
    if (referalId && referalId?.length !== 0 && !referalFound) {
      tlog("[ERROR] Invalid referalId:", referalId);
      return res.status(400).json({
        Error: true,
        Status: false,
        ResponseStatus: 0,
        StatusCode: "Ex400",
        Remarks: "Please enter valid referalId.",
      });
    }

    // If the user already exists but is a stub, update them
    let token;
    if (existingPhone && existingPhone.isStub) {
      existingPhone.firstName = firstName;
      existingPhone.lastName = lastName;
      existingPhone.email = email;
      existingPhone.ipAddress = getIpAddress(req);
      existingPhone.deviceToken = deviceToken;
      existingPhone.isStub = false;
      await existingPhone.save();
      tlog("[DB] Stub user updated:", existingPhone._id);
      token = jwt.sign({ _id: existingPhone._id }, JWT_SECRET);
    } else {
      const createReferId = uniqueIdGenerator("referalId");
      const checkExistReferId = await User.findOne({ referalId: createReferId });

      const newUser = new User({
        firstName,
        lastName,
        email,
        phone: phone?.toString(),
        referBy: referalId,
        referalId: checkExistReferId
          ? uniqueIdGenerator("referalId")
          : createReferId,
        ipAddress: getIpAddress(req),
        deviceToken
      });

      await newUser.save();
      tlog("[DB] newUser saved:", newUser._id);

      const newWallet = new Wallet({ userId: newUser._id });
      await newWallet.save();
      newUser.wallet = newWallet._id;
      await newUser.save();
      tlog("[DB] wallet created:", newWallet._id);

      token = jwt.sign({ _id: newUser._id }, JWT_SECRET);
    }
    
    tlog("[RESPONSE] Registration successful");

    return res.status(200).json({
      Error: false,
      Status: true,
      Remarks: "Register success.",
      AccessToken: token,
    });
  }

  // ===== OTP / LOGIN FLOW =====
  else {
    tlog("[FLOW] ResponseStatus != 1 (OTP/Login flow)");

    // ---- OTP Send Flow ----
    if (!otp) {
      tlog("[ACTION] Sending OTP for phone:", phone);

      const recentOtp = await Otp.findOne({
        phone,
        created_at: { $gte: new Date(Date.now() - 30000) },
      });

      if (recentOtp) {
        tlog("[ERROR] OTP requested too soon:", phone);
        return res.status(400).json({
          Error: true,
          Status: false,
          ResponseStatus: 0,
          StatusCode: "Ex400",
          Remarks: "Wait for 30 seconds before requesting a new OTP.",
        });
      }

      await Otp.deleteMany({ phone });
      const generatedOtp = generateOTP({ phone });
      await Otp.create({ phone, otp: generatedOtp });

      sendSMS(phone, generatedOtp);
      tlog("[ACTION] OTP sent successfully:", phone);

      return res.status(200).json({
        Error: false,
        Status: true,
        Remarks: "OTP Sent",
        ResponseStatus: 3,
        // Otp: generatedOtp,
      });
    }

    // ---- OTP Verify / Login ----
    if (!findLOGINService?.status) {
      tlog("[ERROR] Login service disabled");
      return res.status(400).json({
        Error: true,
        Status: false,
        ResponseStatus: 0,
        StatusCode: "Ex400",
        Remarks: "Login is Temporarely Closed 😞",
      });
    }
    console.log("phone, otp", phone, otp);
    const foundOTP = await Otp.findOne({ phone, otp });
    if (!foundOTP) {
      tlog("[ERROR] Invalid OTP:", phone);
      return res.status(400).json({
        Error: true,
        Status: false,
        ResponseStatus: 0,
        StatusCode: "Ex400",
        Remarks: "Invalid OTP.",
      });
    }

    // Check OTP expiry (5 mins)
    if (foundOTP.created_at < new Date(Date.now() - 300000)) {
      await Otp.deleteOne({ _id: foundOTP._id });
      tlog("[ERROR] OTP expired:", phone);
      return res.status(400).json({
        Error: true,
        Status: false,
        ResponseStatus: 0,
        StatusCode: "Ex400",
        Remarks: "OTP has expired.",
      });
    }

    await Otp.deleteOne({ _id: foundOTP._id });
    const findUser = await User.findOne({ phone });
    console.log("deviceToken", deviceToken);
    // console.log("findUser before update", findUser);
    if (findUser) {

      findUser.deviceToken = deviceToken;
      await findUser.save();
    }
    // User login
    if (findUser) {
      if (findUser.isStub) {
        tlog("[INFO] User is a stub, prompt to complete registration");
        return res.status(200).json({
          Error: false,
          Status: true,
          Remarks: "Otp Verify Success",
          ResponseStatus: 1, // 1 directs to Register Screen
        });
      }

      if (!findUser.status) {
        tlog("[ERROR] User is blocked:", findUser._id);
        return res.status(400).json({
          Error: true,
          Status: false,
          ResponseStatus: 0,
          StatusCode: "Ex400",
          Remarks: "You are blocked.",
        });
      }

      const token = jwt.sign({ _id: findUser._id }, JWT_SECRET);
      tlog("[RESPONSE] Login success");

      return res.status(200).json({
        Error: false,
        Status: true,
        message: "Login Success",
        ResponseStatus: 2,
        AccessToken: token,
      });
    }

    // Only OTP verified
    tlog("[INFO] OTP verified successfully, proceed to registration");
    return res.status(200).json({
      Error: false,
      Status: true,
      Remarks: "Otp Verify Success",
      ResponseStatus: 1,
    });
  }
});

// ==================== PASSWORD LOGIN CONTROLLER ====================
const loginWithPassword = asyncHandler(async (req, res) => {
  const { phone, password, deviceToken } = req.body;

  if (!phone || !password) {
    return res.status(400).json({
      Error: true,
      Status: false,
      ResponseStatus: 0,
      StatusCode: "Ex400",
      Remarks: "Phone and password are required.",
    });
  }

  const findUser = await User.findOne({ phone });

  if (!findUser) {
    return res.status(400).json({
      Error: true,
      Status: false,
      ResponseStatus: 0,
      StatusCode: "Ex400",
      Remarks: "User not found.",
    });
  }

  if (findUser.password !== password) {
    return res.status(400).json({
      Error: true,
      Status: false,
      ResponseStatus: 0,
      StatusCode: "Ex400",
      Remarks: "Invalid Password.",
    });
  }

  if (!findUser.status) {
    return res.status(400).json({
      Error: true,
      Status: false,
      ResponseStatus: 0,
      StatusCode: "Ex400",
      Remarks: "You are blocked.",
    });
  }

  if (deviceToken) {
    findUser.deviceToken = deviceToken;
    await findUser.save();
  }

  const token = jwt.sign({ _id: findUser._id }, JWT_SECRET);

  return res.status(200).json({
    Error: false,
    Status: true,
    message: "Login Success",
    ResponseStatus: 2,
    AccessToken: token,
  });
});

// ==================== USER LOGOUT CONTROLLER ====================
const logout = asyncHandler(async (req, res) => {
  const userId = req.data?._id;

  if (userId) {
    const user = await User.findById(userId);

    if (user) {
      user.deviceToken = null;
      await user.save();
      console.log("User logged out successfully:", user.firstName);
    } else {
      console.log("Logout called but user not found");
    }
  } else {
    console.log("Logout called without userId");
  }

  // ✅ ALWAYS return success
  return successHandler(req, res, {
    Remarks: "Logout Successfully",
  });
});

// ==================== ADD SUB-USER (NO OTP) ====================
const addSubUser = asyncHandler(async (req, res) => {
  const { firstName, lastName, phone, email, deviceToken } = req.body;

  if (!phone) {
    return res.status(400).json({
      Error: true,
      Status: false,
      ResponseStatus: 0,
      Remarks: "Phone number is required.",
    });
  }

  const existingPhone = await User.findOne({ phone });
  if (existingPhone) {
    return res.status(400).json({
      Error: true,
      Status: false,
      ResponseStatus: 0,
      Remarks: "Phone number is already registered.",
    });
  }

  const existingEmail = email ? await User.findOne({ email }) : null;
  if (existingEmail) {
    return res.status(400).json({
      Error: true,
      Status: false,
      ResponseStatus: 0,
      Remarks: "Email is already used.",
    });
  }

  const createReferId = uniqueIdGenerator("referalId");
  const checkExistReferId = await User.findOne({ referalId: createReferId });

  const parentReferralId = req.data ? req.data.referalId : null; 
  
  const newUser = new User({
    firstName: firstName || "",
    lastName: lastName || "",
    email: email || "",
    phone: phone?.toString(),
    referBy: parentReferralId,
    referalId: checkExistReferId ? uniqueIdGenerator("referalId") : createReferId,
    ipAddress: getIpAddress(req),
    deviceToken,
    isStub: true, // Key property
  });

  await newUser.save();
  
  const newWallet = new Wallet({ userId: newUser._id });
  await newWallet.save();
  newUser.wallet = newWallet._id;
  await newUser.save();

  return res.status(200).json({
    Error: false,
    Status: true,
    Remarks: "User added successfully. They can login and complete registration.",
  });
});

module.exports = {
  userSignUp,
  loginWithPassword,
  logout,
  addSubUser,
};
