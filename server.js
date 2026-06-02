//  ====================== Import all required modules ======================
const path = require("path");
require("dotenv/config");
const bodyParser = require("body-parser");
const express = require("express");
const app = express();
const cors = require("cors");
const PORT = process.env.PORT || 5000;
const connection = require("./database");
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const { Recharge_CallBack_Handler } = require("./controllers/services/recharge");
const { dashboardApi } = require("./controllers/admin");
const getIpAddress = require("./common/getIpAddress");

// ========================= Connection to Database ==========================
connection();


// ======================== Middlewares ==========================
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again after 15 minutes"
});
app.use("/api/", limiter);

app.use(compression());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(cors());
app.use(helmet());
app.use(
  express.json({
    limit: "1mb",
    verify: (req, res, buf) => {
      req.rawBody = buf.toString();
    },
  })
);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


// =========================  API Routes ==========================
app.use("/api/txn", require("./routes/txnRoute"));
app.use("/api/auth", require("./routes/authRoute"));
app.use("/api/admin", require("./routes/adminRoute"));
app.use("/api/user", require("./routes/userRoute"));
app.use("/api/wallet", require("./routes/walletRoute"));
app.use("/api/commission", require("./routes/newRoutes/commission.js"));
app.all("/api/webhook/callback", Recharge_CallBack_Handler);
// app.use("/api/setting", require("./routes/appSetting"));
// app.use("/api/banner", require("./routes/bannerRoute"));

app.use("/api/home-banner", require("./routes/newRoutes/homeBanner.js"));
app.use("/api/bottom-banner", require("./routes/newRoutes/bottomBanner.js"));
app.use("/api/home-note", require("./routes/newRoutes/homeNote.js"));
app.use("/api/pop-image", require("./routes/newRoutes/homePopImage.js"));
app.use("/api/service", require("./routes/serviceRoute"));
app.use("/api/affiliate-banner", require("./routes/affiliateBannerRoute"));
app.use("/api/notification", require("./routes/notificationRoute"));
app.use("/api/payment", require("./routes/paymentRoutes"));
app.use("/api/cyrus", require("./routes/services"));
app.use("/api/affiliate", require("./routes/affiliateRoute"));
app.use("/api/news", require("./routes/newsRoutes"));
app.get("/api/dashboard", dashboardApi);
app.get("/api", (req, res) => {
  res.send(getIpAddress(req));
});

app.post("/send-notification", require("./controllers/notification.js").sendNotificationToUser);

// error handler
app.use(require("./common/errorHandler"));

app.listen(PORT, () => {
  console.log(`🚀 Server started on http://localhost:${PORT}`);
});
