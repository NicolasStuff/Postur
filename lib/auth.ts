import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { emailOTP } from "better-auth/plugins";
import { prisma } from "@/lib/prisma";
import { sendResetPasswordEmail, sendOtpEmail } from "@/lib/email";

const isProduction = process.env.NODE_ENV === "production";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: process.env.TRUSTED_ORIGINS
    ? process.env.TRUSTED_ORIGINS.split(",")
    : isProduction
      ? ["https://postur.fr"]
      : ["http://localhost:3000", "https://postur.fr"],
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    sendResetPassword: async ({ user, url }) => {
      await sendResetPasswordEmail({
        to: user.email,
        url,
        name: user.name,
      });
    },
  },
  rateLimit: {
    enabled: true,
    window: 10,
    max: 100,
    customRules: {
      "/sign-in/*": { window: 60, max: 7 },
      "/sign-up/*": { window: 60, max: 5 },
      "/forget-password/*": { window: 3600, max: 3 },
      "/request-password-reset": { window: 3600, max: 3 },
      "/reset-password/*": { window: 3600, max: 5 },
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
