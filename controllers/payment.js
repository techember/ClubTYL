const CryptoJS = require("crypto-js");
const { addMoney } = require("./wallet");
const axios = require("axios");
const User = require("../models/userSchema");
const txnSchema = require("../models/txnSchema");
const Wallet = require("../models/walletSchema");
const appSetting = require("../models/appSetting");
const Service = require("../models/serviceSchema");
const Transaction = require("../models/txnSchema");
const asyncHandler = require("express-async-handler");
const UpiTenz = require("../models/newModels/UpiTenz");
const successHandler = require("../common/successHandler");
const Notification = require("../models/notificationSchema");
const sendNotification = require("../common/sendNotification");
const getIpAddress = require("../common/getIpAddress");
const CRYPTO_SECRET = process.env.CRYPTO_SECRET;

// ======================= EKQR (UPIGATEWAY) INIT =======================
const EKQR_API_KEY = process.env.EKQR_API_KEY;
const EKQR_CREATE_ORDER_URL = process.env.EKQR_CREATE_ORDER_URL;
const EKQR_CHECK_STATUS_URL = process.env.EKQR_CHECK_STATUS_URL;

// ======================= HANDLE FIRST TRANSACTION =======================
const handleFirstTransaction = async (userId, txnAmount) => {
  // Check if it's the user's first transaction over â‚¹100
  try {
    if (txnAmount >= 100) {
      const user = await User.findById(userId);

      if (user && user.referBy && !user.referBonus) {
        const referalFound = await User.findOne({ referalId: user.referBy });

        if (referalFound) {
          const GET_REFER_AMOUNT = await appSetting.findOne();

          // Credit the referral bonus
          await Wallet.updateOne(
            { userId: referalFound._id },
            { $inc: { balance: Number(GET_REFER_AMOUNT.referAmount) } }
          );

          // Save transaction recordui
          const refererTxnData = new txnSchema({
            userId: referalFound._id,
            recipientId: referalFound._id,
            txnName: "Referral Bonus",
            txnDesc: `Referral Bonus ₹${GET_REFER_AMOUNT.referAmount}.`,
            txnAmount: Number(GET_REFER_AMOUNT.referAmount),
            txnType: "credit",
            txnId: Math.floor(Math.random() * Date.now()) + "referBonus",
            orderId: Math.floor(Math.random() * Date.now()) + "referBonus",
            txnStatus: "TXN_SUCCESS",
            txnResource: "Wallet",
            ipAddress: user.ipAddress,
          });
          await refererTxnData.save();
          await User.updateOne({ _id: user._id }, { referBonus: true });
        }
      }
    } else {
    }
  } catch (error) {
    console.error("Error in handleFirstTransaction:", error);
    throw new Error("Failed to process referral bonus.");
  }
};

// ======================= HANDLE CASHBACK =======================
const handleCashback = async (
  FindUser,
  cashbackPercent,
  txnId,
  ipAddress,
  walletFound
) => {
  try {
    const addCashBack = new Transaction({
      userId: FindUser._id,
      recipientId: FindUser._id,
      txnName: "Cashback",
      txnDesc: `Cashback ₹${cashbackPercent?.toFixed(2) || 0}, TXN_ID ${txnId}`,
      txnType: "credit",
      txnStatus: "TXN_SUCCESS",
      txnResource: "Wallet",
      txnId: txnId + "cashback",
      orderId: txnId + "cashback",
      txnAmount: cashbackPercent?.toFixed(2) || 0,
      ipAddress,
    });

    await Wallet.findByIdAndUpdate(walletFound._id, {
      $inc: { balance: cashbackPercent },
    });

    await addCashBack.save();

    const notification = {
      title: "Received Cashback",
      body: `Hurray! 🎉 You got ₹${cashbackPercent.toFixed(2) || 0
        } as a cashback.`,
    };

    const newNotification = new Notification({
      ...notification,
      recipient: FindUser._id,
    });

    await newNotification.save();

    // Send notification
    if (FindUser?.deviceToken) {
      sendNotification(notification, FindUser.deviceToken);
    }
  } catch (error) {
    console.error("Cashback handling error:", error);
    throw new Error("Failed to handle cashback.");
  }
};

// ======================= HANDLE REFUND =======================
const handleRefund = async (
  FindUser,
  TxnAmount,
  transactionId,
  ipAddress,
  walletFound
) => {
  try {
    const refundAmount = new Transaction({
      userId: FindUser._id,
      recipientId: FindUser._id,
      txnName: "Refund",
      txnDesc: `Refund ₹${TxnAmount}, TXN_ID ${transactionId} .`,
      txnType: "credit",
      txnStatus: "TXN_SUCCESS",
      txnResource: "Wallet",
      txnId: transactionId + "refund",
      orderId: transactionId + "refund",
      txnAmount: TxnAmount,
      ipAddress: ipAddress,
    });

    await Wallet.findByIdAndUpdate(walletFound._id, {
      $inc: {
        balance: TxnAmount,
      },
    });

    await refundAmount.save();
  } catch (error) {
    console.error("Refund handling error:", error);
    throw new Error("Failed to handle refund.");
  }
};

// ======================= HANDLE DISTRIBUTOR COMMISSION =======================
const handleDistributorCommission = async (
  distributorUser,
  commissionAmount,
  txnId,
  ipAddress,
  operatorName
) => {
  try {
    const commissionTxn = new Transaction({
      userId: distributorUser._id,
      recipientId: distributorUser._id,
      txnName: "Distributor Commission",
      txnDesc: `Commission ₹${commissionAmount} for ${operatorName} recharge.`,
      txnType: "credit",
      txnStatus: "TXN_SUCCESS",
      txnResource: "Wallet",
      txnId: txnId + "comm",
      orderId: txnId + "comm",
      txnAmount: commissionAmount,
      ipAddress: ipAddress,
    });

    await Wallet.updateOne(
      { userId: distributorUser._id },
      {
        $inc: {
          balance: Number(commissionAmount),
        },
      }
    );

    await commissionTxn.save();

    // Send Notification
    const notification = {
      title: "Commission Received",
      body: `You received ₹${commissionAmount} commission for a recharge.`,
    };

    const newNotification = new Notification({
      ...notification,
      recipient: distributorUser._id,
    });

    await newNotification.save();

    if (distributorUser.deviceToken) {
      sendNotification(notification, distributorUser.deviceToken);
    }

  } catch (error) {
    console.error("Distributor Commission handling error:", error);
    // Silent fail to not disrupt main flow, but log error
  }
};

// ======================= HANDLE DISPUTE REFUND =======================
const handleDisputeRefund = async (
  userFound,
  findTxn,
  findCashbackTxn,
  TransID,
  ipAddress,
  walletFound
) => {
  try {
    const ActualAmount = findCashbackTxn
      ? findTxn.txnAmount - findCashbackTxn.txnAmount
      : findTxn.txnAmount;

    const refundAmount = new Transaction({
      userId: userFound._id,
      recipientId: userFound._id,
      txnName: "Refund",
      txnDesc: `Your ₹${ActualAmount} is Refunded.`,
      txnType: "credit",
      txnStatus: "TXN_SUCCESS",
      txnResource: "Wallet",
      txnId: TransID + "refund",
      orderId: TransID + "refund",
      txnAmount: ActualAmount,
      ipAddress: ipAddress,
    });

    await Wallet.findByIdAndUpdate(walletFound._id, {
      $inc: {
        balance: Number(ActualAmount),
      },
    });

    await refundAmount.save();
  } catch (error) {
    console.error("Refund handling error:", error);
    throw new Error("Failed to handle refund.");
  }
};

// ======================= PAY WITH WALLET =======================
const paywithWallet = asyncHandler(async (req, res) => {
  const { mPin, txnAmount, txnId, serviceId, userId, ipAddress } = req.body;

  const userFound = await User.findById(userId);
  if (!userFound.status) {
    res.status(400);
    throw new Error("User is Blocked");
  }
  const walletFound = await Wallet.findOne({ userId: userFound._id });

  if (txnAmount <= 0) {
    res.status(400);
    throw new Error("TxnAmount Should be positive");
  }

  if (!userFound.mPin) {
    res.status(400);
    throw new Error("Please set mpin");
  }

  // Decrypt mpin
  const decryptMpin = CryptoJS.AES.decrypt(
    userFound.mPin,
    CRYPTO_SECRET
  ).toString(CryptoJS.enc.Utf8);

  if (mPin.toString() !== decryptMpin) {
    res.status(400);
    throw new Error("Please enter a valid mPin");
  }

  const serviceData = serviceId ? await Service.findById(serviceId) : null;

  if (serviceId && !serviceData) {
    res.status(400);
    throw new Error("Please enter a valid ServiceId");
  }

  if (walletFound.balance < txnAmount) {
    res.status(400);
    throw new Error("Wallet balance is low");
  }

  const payAmount = txnAmount;

  // ----------- Create Txn History ------------- //
  const subtractBalance = new Transaction({
    userId: userFound._id,
    recipientId: userFound._id,
    txnName: serviceData?.name || "Service",
    txnDesc: `${serviceData?.name} service.`,
    txnAmount: payAmount,
    txnType: "debit",
    txnStatus: "TXN_SUCCESS",
    txnResource: "Wallet",
    serviceId,
    txnId,
    orderId: txnId,
    ipAddress,
  });

  await subtractBalance.save();

  // Update Wallet Balance
  const updatedWallet = await Wallet.findOneAndUpdate(
    { _id: walletFound._id, balance: { $gte: payAmount } }, // Balance check included
    { $inc: { balance: -payAmount } },
    { new: true }
  );

  if (!updatedWallet) {
    res.status(400);
    throw new Error("Wallet balance is low or deduction failed");
  }

  // Handle First Transaction
  // await handleFirstTransaction(userFound._id, txnAmount);

  // Success Response
  return { ResponseStatus: 1 };
});

// ======================= UPIGATEWAY (EKQR) =======================
const createUpiOrder = asyncHandler(async (req, res) => {
  try {
    const { _id } = req.data;
    const { amount, orderId, redirectUrl, note } = req.body;
    console.log("Create UPI Order Request:", req.body);
    // Basic validations
    if (!amount || Number(amount) < 1) {
      res.status(400);
      throw new Error("Minimum amount of 1 rupee is required");
    }

    if (!orderId || !redirectUrl) {
      res.status(400);
      throw new Error("orderId and redirectUrl are required");
    }

    // Service check
    const findService = await Service.findOne({ name: "ADD_MONEY" });
    if (!findService || !findService.status) {
      res.status(400);
      throw new Error("This service is temporarily down");
    }

    // User check
    const user = await User.findById(_id);
    if (!user || !user.status) {
      res.status(400);
      throw new Error("User is blocked");
    }

    if (!user.addMoney) {
      res.status(400);
      throw new Error("Add-money service is temporarily down");
    }

    const wallet = await Wallet.findOne({ userId: user._id });
    if (!wallet) {
      res.status(400);
      throw new Error("Wallet not found for user");
    }

    // Save locally BEFORE hitting payment gateway
    console.log("Creating local UPI order record");
    const localOrder = await UpiTenz.create({
      userId: user._id,
      orderId: orderId,
      amount,
      note,
      firstName: user.firstName || "Unknown",
      phone: user.phone,
      status: "PENDING",
    });
    console.log("Local UPI order created:", localOrder);

    const plyd = {
      key: EKQR_API_KEY,
      client_txn_id: orderId,
      amount: amount.toString(),
      p_info: note || "Add Money",
      customer_name: (user.firstName + (user.lastName ? " " + user.lastName : "")) || "Unknown",
      customer_email: user.email || "customer@example.com",
      customer_mobile: user.phone,
      redirect_url: redirectUrl,
      udf1: "user defined field 1",
      udf2: "user defined field 2",
      udf3: "user defined field 3",
    };
    console.log("EKQR Payload:", plyd);

    let response = null;
    try {
      const ekqrRes = await axios.post(EKQR_CREATE_ORDER_URL, plyd);
      response = ekqrRes.data;
    } catch (error) {
      console.error("EKQR Order Creation Error:", error.response?.data || error.message);
      res.status(500);
      throw new Error("Failed to create EKQR order");
    }

    console.log("EKQR Order Response:", response);

    if (response && response.status === true) {
      // Update local order with gateway order ID if available
      localOrder.upiOrderId = response.data?.order_id || null;
      await localOrder.save();

      const finalData = {
        orderId: localOrder.orderId,
        payment_url: response.data?.payment_url || null,
      };

      return successHandler(req, res, {
        status: true,
        statusCode: 200,
        Remark: "UPI Order created",
        Data: finalData,
      });
    } else {
      res.status(400);
      throw new Error(response?.msg || "Failed to create UPI order from gateway");
    }

  }

  catch (error) {
    res.status(500);
    throw new Error("Error creating UPI order: " + (error.response?.data || error.message));
  }
});

// ======================= UPIGATEWAY WEBHOOK =======================
const upiTenzWebhook = asyncHandler(async (req, res) => {
  try {
    console.log("webhook called with body:", req.body);
    const payload = req.body; // EKQR sends application/x-www-form-urlencoded

    const orderId = payload.client_txn_id;
    const txnStatus = payload.status;
    const utr = payload.upi_txn_id;

    console.log("Webhook data extracted:", { orderId, txnStatus, utr });

    if (!orderId) {
      console.warn("Webhook missing orderId:", payload);
      return res.status(400).json({ success: false });
    }

    // ---------------- FIND ORDER ----------------
    let order =
      (await UpiTenz.findOne({ orderId })) ||
      (await UpiTenz.findOne({ upiOrderId: orderId }));

    if (!order) {
      console.warn("Order not found for webhook:", orderId);
      return res.status(404).json({ success: false });
    }
    console.log("Webhook found order:", order.orderId);
    // ---------------- STORE PREVIOUS STATUS ----------------
    const previousStatus = order.status;

    // ---------------- NORMALIZE STATUS ----------------
    let mappedStatus = "FAIL";
    const t = String(txnStatus || "").toUpperCase();
    console.log("Normalized txnStatus for mapping:", t);
    if (t === "SUCCESS") mappedStatus = "SUCCESS";
    else if (t === "FAILURE") mappedStatus = "FAIL";
    else mappedStatus = "PENDING";
    console.log("Mapped status:", mappedStatus);
    // ---------------- UPDATE ORDER ----------------
    order.status = mappedStatus;
    if (utr) order.utr = utr;
    await order.save();

    // ---------------- WALLET TOP-UP FLOW ----------------
    console.log("order note ->", order.note);

    if (order.note === "Add money to wallet using PG") {
      const isFirstSuccess =
        previousStatus !== "SUCCESS" && mappedStatus === "SUCCESS";
      console.log("Is first successful payment:", isFirstSuccess);
      if (isFirstSuccess) {
        console.log("Adding money to wallet once for:", order.orderId);

        await addMoney(req, res, {
          amount: order.amount,
          userId: order.userId,
          txr: "Wallet",
          gatewayName: "UPIGATEWAY",
          txnid: order.orderId,
        });
      } else {
        console.log("Wallet already credited or payment not successful");
      }
    } else {
      // ---------------- CREATE TRANSACTION (ONLINE PAYMENT) ----------------
      console.log("skip add money, creating transaction");

      const service = await Service.findOne({ name: "UPI_MONEY" });

      const transaction = new Transaction({
        userId: order.userId,
        recipientId: order.userId,
        gatewayName: "UPIGATEWAY",
        txnName: "Recharge",
        txnDesc: "UPI Payment",
        txnAmount: order.amount,
        txnType: "debit",
        txnId: order.orderId,
        serviceId: service?._id,
        mid: order?.mid,
        orderId: order.orderId,
        txnStatus: mappedStatus === "SUCCESS" ? "TXN_SUCCESS" : "TXN_FAILURE",
        txnResource: "Online",
        ipAddress: req.ip || "0.0.0.0",
      });

      await transaction.save();
    }

    // ---------------- NOTIFICATION ----------------
    const user = await User.findById(order.userId);
    if (user?.deviceToken) {
      const dta = {
        title: `₹ ${order.amount} - Payment Successful!`,
        body: `Payment order Id ${order.orderId}`,
      };
      await sendNotification(dta, user.deviceToken);
    }

    console.log("Webhook processed successfully for order:", orderId);
    return res.status(200).json({ success: true });

  } catch (err) {
    console.error("Webhook error:", err);
    return res.status(500).json({ success: false });
  }
});


// ======================= UPIGATEWAY STATUS CHECK =======================
const upiTenzStatus = asyncHandler(async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      res.status(400);
      throw new Error("orderId is required");
    }
    const order = await UpiTenz.findOne({ orderId });
    if (!order) {
      res.status(404);
      throw new Error("Order not found");
    }
    const statusPayload = {
      key: EKQR_API_KEY,
      client_txn_id: orderId,
      txn_date: new Date().toLocaleDateString('en-GB').replace(/\//g, '-') // DD-MM-YYYY format normally required by some gateways, check if needed
    };

    // Note: The screenshot shows txn_date: "27-02-2022". We might need the date when the order was created.
    const orderDate = new Date(order.createdAt).toLocaleDateString('en-GB').replace(/\//g, '-');
    statusPayload.txn_date = orderDate;

    console.log("EKQR Status Check Payload:", statusPayload);
    const ekqrRes = await axios.post(EKQR_CHECK_STATUS_URL, statusPayload);
    const response = ekqrRes.data;

    console.log("EKQR Status Check Response:", response);
    if (!response || response.status === undefined) {
      res.status(500);
      throw new Error("Invalid response from EKQR");
    }

    console.log("UPI Status Response:", response);

    const gatewayStatus = (response.data?.status || "").toUpperCase();
    const previousStatus = order.status;

    if (order.status !== gatewayStatus) {
      order.status = gatewayStatus;
      if (response.data?.upi_txn_id) order.utr = response.data.upi_txn_id;
      await order.save();
    }

    // ---------------- WALLET TOP-UP FLOW (SYNC) ----------------
    // If webhook was missed, update wallet here
    if (gatewayStatus === "SUCCESS" && previousStatus !== "SUCCESS") {
      if (order.note === "Add money to wallet using PG") {
        console.log("Webhook missed, updating wallet via Status Check for:", order.orderId);
        await addMoney(req, res, {
          amount: order.amount,
          userId: order.userId,
          txr: "Wallet",
          gatewayName: "UPIGATEWAY",
          txnid: order.orderId,
        });
      }
    }

    const Data = {
      txnStatus: order.status,
      orderId: order.orderId,
      amount: order.amount,
      utr: order.utr || response.data?.upi_txn_id
    };

    successHandler(req, res, {
      Remarks: "UPI Order Status Fetched",
      Data,
    });
  }
  catch (error) {
    res.status(500);
    throw new Error("Error fetching UPI order status: " + (error.response?.data || error.message));
  }
});

// ======================= UPIGATEWAY FINAL STATUS CHECK =======================
const checkStatus = asyncHandler(async (req, res) => {
  // EKQR doesn't explicitly show 'autoVerify' in the basic docs provided, 
  // but we can use the existing status check logic.
  res.status(501);
  throw new Error("AutoVerify not implemented for EKQR yet");
});


module.exports = {
  createUpiOrder,
  upiTenzWebhook,
  upiTenzStatus,
  checkStatus,
  handleFirstTransaction,
  handleCashback,
  handleRefund,
  handleDisputeRefund,
  paywithWallet,
  handleDistributorCommission
};
