import mongoose, { Schema, Document } from "mongoose";

export interface IOtp extends Document {
  email: string;
  code: string;
  created_at: Date;
  expires_at: Date;
  type: string;
}

const OtpSchema: Schema = new Schema<IOtp>({
  email: { type: String, required: true, lowercase: true, trim: true },
  code: { type: String, required: true },
  type: {
    type: String,
    enum: ["email_verification", "forgot_password"],
    default: "email",
  },
  created_at: { type: Date, default: Date.now, expires: 600 }, // expires after 10 minutes
  expires_at: { type: Date, required: true },
});

export default mongoose.model<IOtp>("Otp", OtpSchema);
