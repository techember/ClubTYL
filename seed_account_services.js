const mongoose = require("mongoose");
require("dotenv/config");
const Service = require("./models/serviceSchema");

const MONGO_URI = process.env.MONGO_URI;

const servicesToAdd = [
  {
    name: "Change MPIN",
    section: "account",
    route: "ForgetPassword",
    icon: "uploads/icon_mpin.png",
    type: "Discount",
    status: true,
    isShow: true,
  },
  {
    name: "Password",
    section: "account",
    route: "ResetPassword",
    icon: "uploads/icon_password.png",
    type: "Discount",
    status: true,
    isShow: true,
  },
  {
    name: "Add Account",
    section: "account",
    route: "AddAccount",
    icon: "uploads/icon_add_account.png",
    type: "Discount",
    status: true,
    isShow: true,
  },
  {
    name: "Commission",
    section: "account",
    route: "CommissionChart",
    icon: "uploads/icon_commission.png",
    type: "Discount",
    status: true,
    isShow: true,
  },
  {
    name: "User List",
    section: "account",
    route: "UserListScreen",
    icon: "uploads/icon_user_list.png",
    type: "Discount",
    status: true,
    isShow: true,
  },
];

mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log("Database connected successfully");
    try {
      for (let s of servicesToAdd) {
        // Upsert by name
        await Service.findOneAndUpdate({ name: s.name }, s, {
          upsert: true,
          new: true,
        });
        console.log(`Added/Updated: ${s.name}`);
      }
      console.log("All services added successfully!");
    } catch (err) {
      console.error(err);
    } finally {
      process.exit(0);
    }
  })
  .catch((err) => {
    console.error("Database connection error: ", err);
    process.exit(1);
  });
