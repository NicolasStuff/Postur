import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { emailOTP } from "better-auth/plugins";
import { prisma } from "@/lib/prisma";
import { sendResetPasswordEmail, sendOtpEmail } from "@/lib/email";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: process.env.TRUSTED_ORIGINS
    ? process.env.TRUSTED_ORIGINS.split(",")
    : ["http://localhost:3000", "https://postur.fr"],
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      await sendResetPasswordEmail({
        to: user.email,
        url,
        name: user.name,
      });
    },
  },
  plugins: [
    emailOTP({
      async sendVerificationOTP({ email, otp }) {
        await sendOtpEmail({ to: email, otp });
      },
      otpLength: 6,
      expiresIn: 600,
    }),
  ],
  user: {
    additionalFields: {
      practitionerType: {
        type: "string",
        required: false,
      },
    },
  },
});
