const transporter = require("../config/mailer");

/**
 * Sends an OTP email to the given address.
 * @param {string} to - recipient email
 * @param {string} otp - 6-digit code
 * @param {'register'|'login'} purpose
 */
const sendOTPEmail = async (to, otp, purpose) => {
  const subject =
    purpose === "register" ? "Your registration OTP" : "Your login OTP";

  const expiryMinutes = Number(process.env.OTP_EXPIRY_MINUTES) || 15;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #333;">${subject}</h2>
      <p>Use the code below to ${purpose === "register" ? "verify your email" : "log in"}:</p>
      <div style="
        font-size: 36px;
        font-weight: bold;
        letter-spacing: 10px;
        color: #4f46e5;
        padding: 20px;
        background: #f5f5f5;
        border-radius: 8px;
        text-align: center;
        margin: 24px 0;
      ">${otp}</div>
      <p style="color: #666;">This code expires in <strong>${expiryMinutes} minutes</strong>.</p>
      <p style="color: #999; font-size: 12px;">If you did not request this, please ignore this email.</p>
    </div>
  `;

  await transporter.sendMail({
    from: `"Auth App" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });
};

module.exports = { sendOTPEmail };
