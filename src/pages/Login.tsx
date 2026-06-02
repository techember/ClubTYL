import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { UserIcon, LockClosedIcon } from "@heroicons/react/24/outline";
import { PinInput } from "@/components/ui/pin-input";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
export const Login = () => {
  const { loginWithToken } = useAuth();
  const navigate = useNavigate();

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [screen, setScreen] = useState<"phone" | "otp">("phone");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // ===============================
  // SEND OTP
  // ===============================
  const handleSendOtp = async () => {
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:5005/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });

      const data = await res.json();
      console.log("OTP Sent Response =", data);

      if (data?.Otp) {
        console.log("OTP SENT =", data.Otp);
        setScreen("otp");
      } else {
        setError("Failed to send OTP");
      }
    } catch (err) {
      console.log("SEND OTP ERROR =", err);
      setError("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  // ===============================
  // VERIFY OTP
  // ===============================
  const handleVerifyOtp = async () => {
    setIsLoading(true);
    setError("");

    try {
      console.log("Verifying OTP...");

      const res = await fetch("http://localhost:5005/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp }),
      });

      const data = await res.json();

      console.log("LOGIN RESPONSE =", data);

      if (data?.AccessToken) {
        console.log("TOKEN SAVED =", data.AccessToken);

        localStorage.setItem("token", data.AccessToken);
        loginWithToken(data.AccessToken);

        // FINAL REDIRECT
        navigate("/", { replace: true });

      } else {
        setError("Invalid OTP. Try again.");
        setOtp("");
      }
    } catch (error) {
      console.log("VERIFY OTP ERROR =", error);
      setError("Something went wrong");
      setOtp("");
    } finally {
      setIsLoading(false);
    }
  };

  // ===============================
  // PHONE SCREEN
  // ===============================
  if (screen === "phone") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-background">
        <div className="admin-card w-full max-w-sm sm:max-w-md p-6 sm:p-8">

          <h1 className="text-2xl sm:text-3xl font-bold text-center mb-6">
            Sign In
          </h1>

          <label className="text-sm font-medium mb-2 block">Phone Number</label>

          <div className="relative">
            <UserIcon className="h-5 w-5 absolute left-3 top-3 text-muted-foreground" />

            <input
              type="tel"
              inputMode="numeric"
              className="w-full pl-10 pr-4 py-3 border rounded-lg bg-card"
              placeholder="Enter your phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
              maxLength={10}
            />
          </div>

          {error && <p className="text-destructive text-sm mt-3">{error}</p>}

          <button
            onClick={handleSendOtp}
            disabled={phone.length < 10 || isLoading}
            className="btn-primary w-full py-3 mt-6 disabled:opacity-50"
          >
            {isLoading ? "Sending..." : "Send OTP"}
          </button>
        </div>
      </div>
    );
  }

  // ===============================
  // OTP SCREEN
  // ===============================
  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-background">
      <div className="admin-card w-full max-w-sm sm:max-w-md p-6 sm:p-8 text-center">

        <LockClosedIcon className="h-8 w-8 mx-auto mb-4 text-primary" />

        <h2 className="text-xl sm:text-2xl font-semibold mb-2">Enter OTP</h2>

        <p className="text-sm text-muted-foreground mb-6 break-all">
          OTP sent to <strong>{phone}</strong>
        </p>

        <div className="flex justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex justify-center"
          >
            <PinInput
              length={6}
              type="number"
              onChange={setOtp}
              className="
      flex gap-2 sm:gap-3
      [&_input]:w-11
      [&_input]:h-12
      sm:[&_input]:w-12
      sm:[&_input]:h-14
      [&_input]:text-center
      [&_input]:text-lg
      sm:[&_input]:text-xl
      [&_input]:font-semibold
      [&_input]:rounded-xl
      [&_input]:border
      [&_input]:bg-card
      [&_input]:transition-all
      [&_input]:focus:outline-none
      [&_input]:focus:ring-2
      [&_input]:focus:ring-primary
      [&_input]:focus:scale-105
    "
            />
          </motion.div>
        </div>

        {error && <p className="text-destructive text-sm mt-4">{error}</p>}

        <button
          onClick={handleVerifyOtp}
          disabled={otp.length !== 6 || isLoading}
          className="btn-primary w-full mt-6"
        >
          {isLoading ? "Verifying..." : "Verify OTP"}
        </button>

        <button
          onClick={handleSendOtp}
          className="text-primary text-sm mt-4 underline"
        >
          Resend OTP
        </button>

      </div>
    </div>
  );
};
