import { baseUrl } from "@/constants/base";
import transporter from "@/lib/nodemailer/config";

interface SendVerificationEmailParams {
  toEmail: string;
  userName: string;
  verificationToken?: string; // Optional - only for verification email
  newEmail?: string; // Optional - only for notification email
  emailType: "verification" | "notification";
}

export const sendEmailChangeVerification = async ({
  toEmail,
  userName,
  verificationToken,
  newEmail,
  emailType,
}: SendVerificationEmailParams) => {
  if (emailType === "verification") {
    // Send verification email TO the NEW email address
    if (!verificationToken) {
      throw new Error("Verification token required for verification emails");
    }

    const verificationUrl = `${baseUrl}/auth/verify-email-change?token=${verificationToken}`;

    const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Email Change</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">Verify Email Change</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Hello <strong>${userName}</strong>,
              </p>
              
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                We received a request to change your email address to:
              </p>
              
              <div style="background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 15px 20px; margin: 0 0 30px; border-radius: 4px;">
                <p style="margin: 0; color: #667eea; font-size: 16px; font-weight: 600;">
                  ${toEmail}
                </p>
              </div>
              
              <p style="margin: 0 0 30px; color: #333333; font-size: 16px; line-height: 1.6;">
                To complete this change and verify your new email address, please click the button below:
              </p>
              
              <!-- Button -->
              <table role="presentation" style="margin: 0 auto 30px;">
                <tr>
                  <td style="border-radius: 6px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                    <a href="${verificationUrl}" style="display: inline-block; padding: 16px 40px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 6px;">
                      Verify Email Change
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0 0 20px; color: #666666; font-size: 14px; line-height: 1.6;">
                Or copy and paste this link into your browser:
              </p>
              
              <div style="background-color: #f8f9fa; padding: 15px; margin: 0 0 30px; border-radius: 4px; word-break: break-all;">
                <a href="${verificationUrl}" style="color: #667eea; text-decoration: none; font-size: 14px;">
                  ${verificationUrl}
                </a>
              </div>
              
              <div style="border-top: 1px solid #e5e5e5; padding-top: 20px; margin-top: 30px;">
                <p style="margin: 0 0 10px; color: #999999; font-size: 14px; line-height: 1.6;">
                  <strong>Didn't request this change?</strong>
                </p>
                <p style="margin: 0; color: #999999; font-size: 14px; line-height: 1.6;">
                  If you didn't request to change your email address, please ignore this email or contact our support team immediately. Your current email address will remain unchanged.
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0 0 10px; color: #999999; font-size: 12px; line-height: 1.5;">
                ⏰ This verification link will expire in 15 minutes for your security.
              </p>
              <p style="margin: 0; color: #999999; font-size: 12px; line-height: 1.5;">
                © ${new Date().getFullYear()} Convofy. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const mailOptions = {
      from: `"Convofy" <${process.env.NODEMAILER_EMAIL}>`,
      to: toEmail,
      subject: "Verify Your Email Change",
      html: htmlTemplate,
      text: `Hello ${userName},\n\nWe received a request to change your email address to: ${toEmail}\n\nTo complete this change, please click the following link:\n${verificationUrl}\n\nIf you didn't request this change, please ignore this email.\n\nThis link will expire in 15 minutes.`,
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log("Verification email sent successfully:", info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error("Error sending verification email:", error);
      throw error;
    }
  } else if (emailType === "notification") {
    // Send notification email TO the CURRENT/OLD email address
    if (!newEmail) {
      throw new Error("New email required for notification emails");
    }

    const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Change Request - Security Alert</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">⚠️ Email Change Request</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Hello <strong>${userName}</strong>,
              </p>
              
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                <strong>A request was made to change your email address.</strong>
              </p>
              
              <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; margin: 0 0 30px; border-radius: 4px;">
                <p style="margin: 0 0 10px; color: #856404; font-size: 14px; font-weight: 600;">
                  📧 Current email: ${toEmail}
                </p>
                <p style="margin: 0; color: #856404; font-size: 14px; font-weight: 600;">
                  ➡️ Requested new email: ${newEmail}
                </p>
              </div>
              
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                If you made this request, a verification email has been sent to <strong>${newEmail}</strong>. Please check that inbox and click the confirmation link to complete the change.
              </p>
              
              <!-- Warning Box -->
              <div style="background-color: #f8d7da; border-left: 4px solid #dc3545; padding: 20px; margin: 0 0 30px; border-radius: 4px;">
                <p style="margin: 0 0 15px; color: #721c24; font-size: 16px; font-weight: 600;">
                  🚨 If you DID NOT request this change:
                </p>
                <ul style="margin: 0; padding-left: 20px; color: #721c24; font-size: 14px; line-height: 1.8;">
                  <li>Your account may be compromised</li>
                  <li><strong>Change your password immediately</strong></li>
                  <li>Enable two-factor authentication if available</li>
                  <li>Review recent account activity</li>
                  <li>Contact our support team right away</li>
                </ul>
              </div>
              
              <div style="background-color: #d1ecf1; border-left: 4px solid #17a2b8; padding: 20px; margin: 0 0 30px; border-radius: 4px;">
                <p style="margin: 0; color: #0c5460; font-size: 14px; line-height: 1.6;">
                  <strong>Important:</strong> Your email will <strong>NOT</strong> change until the new address is verified. If no verification occurs within 15 minutes, this request will expire and your email will remain <strong>${toEmail}</strong>.
                </p>
              </div>
              
              <div style="border-top: 1px solid #e5e5e5; padding-top: 20px; margin-top: 30px;">
                <p style="margin: 0; color: #999999; font-size: 14px; line-height: 1.6;">
                  This is an automated security notification. If you have any concerns about your account security, please contact our support team immediately.
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0 0 10px; color: #999999; font-size: 12px; line-height: 1.5;">
                For your security, please do not share this notification with anyone.
              </p>
              <p style="margin: 0; color: #999999; font-size: 12px; line-height: 1.5;">
                © ${new Date().getFullYear()} Convofy. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const mailOptions = {
      from: `"Convofy" <${process.env.NODEMAILER_EMAIL}>`,
      to: toEmail,
      subject: "⚠️ Email Change Request - Security Alert",
      html: htmlTemplate,
      text: `Hello ${userName},\n\n⚠️ SECURITY ALERT\n\nA request was made to change your email address from ${toEmail} to ${newEmail}.\n\nIf you made this request, please check ${newEmail} for a verification email.\n\nIf you DID NOT request this:\n- Your account may be compromised\n- Change your password immediately\n- Contact support\n\nYour email will NOT change until the new address is verified.`,
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log("Notification email sent successfully:", info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error("Error sending notification email:", error);
      throw error;
    }
  }
};
