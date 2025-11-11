import baseUrl from "@/constants/baseUrl";
import transporter from "./config";

export interface SendRecoveryEmailParams {
  toEmail: string;
  userName: string;
  verificationToken: string;
}

const sendRecoveryEmail = async ({
  toEmail,
  userName,
  verificationToken,
}: SendRecoveryEmailParams) => {
  if (!verificationToken) throw new Error("Verification token required");

  const recoveryUrl = `${baseUrl}/auth/recover-password?token=${verificationToken}`;

  const htmlTemplate = `<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Recover Password</title>
  </head>
  <body
    style="
      margin: 0;
      padding: 0;
      font-family:
        system-ui,
        -apple-system,
        BlinkMacSystemFont,
        &quot;Segoe UI&quot;,
        Roboto,
        Oxygen,
        Ubuntu,
        Cantarell,
        &quot;Open Sans&quot;,
        &quot;Helvetica Neue&quot;,
        sans-serif;
      background-color: #f5f5f5;
    "
  >
    <table role="presentation" style="width: 100%; border-collapse: collapse">
      <tr>
        <td style="padding: 40px 20px">
          <table
            role="presentation"
            style="
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
              border-radius: 8px;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            "
          >
            <!-- Header -->
            <tr>
              <td
                style="
                  padding: 40px 40px 20px;
                  text-align: center;
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  border-radius: 8px 8px 0 0;
                "
              >
                <h1
                  style="
                    margin: 0;
                    color: #ffffff;
                    font-size: 28px;
                    font-weight: 600;
                  "
                >
                  Recover Password
                </h1>
              </td>
            </tr>

            <!-- Content -->
            <tr>
              <td style="padding: 40px">
                <table
                  role="presentation"
                  style="width: 100%; border-collapse: collapse"
                >
                  <tr>
                    <td style="padding-bottom: 20px">
                      <p style="margin: 0; font-size: 16px; line-height: 24px">
                        Hello ${userName},<br /><br />
                        We have received a request to reset your password for
                        your account. Please click the link below to reset your
                        password:<br /><br />

                        <a
                          href="${recoveryUrl}"
                          style="
                            display: inline-block;
                            padding: 20px;
                            text-decoration: none;
                            color: #ffffff;
                            background-color: #667eea;
                            border-radius: 4px;
                          "
                        >
                          Reset Password
                        </a>
                      </p>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding-bottom: 20px">
                      <p>
                        If the button does not work, please copy and paste the
                        following link into your browser:
                      </p>
                      <p><a href="${recoveryUrl}">${recoveryUrl}</a></p>
                    </td>
                  </tr>

                  <tr>
                    <td class="">
                      <p style="line-height: 22px; margin: 0">
                        If did not request to reset your password, please ignore
                        this email.<br />
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td
                style="
                  padding: 40px 40px 20px;
                  text-align: center;
                  border-radius: 0 0 8px 8px;
                  background-color: #f8f9fa;
                "
              >
                <p
                  style="
                    margin: 0 0 10px;
                    color: #999999;
                    font-size: 12px;
                    line-height: 1.5;
                  "
                >
                  ⏰ This recover link will expire in 5 minutes for your
                  security.
                </p>
                <p
                  style="
                    margin: 0;
                    font-size: 14px;
                    line-height: 20px;
                    color: #999999;
                  "
                >
                  &copy; ${new Date().getFullYear()} Your Company. All rights reserved.
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
    from: `Convofy <${process.env.NODEMAILER_EMAIL}>`,
    to: toEmail,
    subject: "Recover Password",
    html: htmlTemplate,
    text: `Hello ${userName}, \n\nPassword Recovery \n\nPlease click the link below to reset your password: \n\n${recoveryUrl} \n\nIf did not request to reset your password, please ignore this email. \nThis recovery will last only for 5 minutes`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.messageId);
  } catch (error) {
    console.error("Error sending recovery email:", error);
    throw error;
  }
};

export default sendRecoveryEmail;
