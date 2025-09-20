import mongoose, { Schema, Document, Types } from "mongoose";

export interface IOtp extends Document {
  email: string;
  code: string;
  created_at: Date;
  user: Types.ObjectId;
  expires_at: Date;
  type: string;
}

const OtpSchema: Schema = new Schema<IOtp>({
  email: { type: String, required: true, lowercase: true, trim: true },
  user: { type: Schema.Types.ObjectId, ref: "User" },
  code: { type: String, required: true },

  type: {
    type: String,
    enum: ["email_verification", "forgot_password", "order_collection"],
    default: "email",
  },
  created_at: { type: Date, default: Date.now, expires: 600 }, // expires after 10 minutes
  expires_at: { type: Date, required: true },
});

export default mongoose.model<IOtp>("Otp", OtpSchema);
