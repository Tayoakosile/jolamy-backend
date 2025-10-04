import { Document, model, Schema, Types } from "mongoose";
import { generateRandom } from "../utils/util";
import { Counter } from "./counter";

export interface IBonus extends Document {
  bonus_id: string; // Unique bonus reference
  user_id: Types.ObjectId; // Distributor or sales agent
  role: "distributor" | "sales_agent";
  bonus_type: "sales_target" | "referral" | "performance";
  internal_sequence: number;
  payment_status: {
    distributor: "unpaid" | "paid" | "failed" | "reversed";
    sales_agent: "unpaid" | "paid" | "failed" | "reversed";
  };
  status: "pending" | "processing" | "completed" | ""; // Status of the bonus
  total_bonus_earned: {
    sales_agent_bonus_per_box: number;
    distributor_bonus_per_box: number;
  };
  payment_account_details: {
    distributor: {
      bank_name: string;
      account_number: string;
      account_name: string;
      payment_reference: string;
      paystack_payment_reference: string;
    };
    sales_agent: {
      bank_name: string;
      account_number: string;
      account_name: string;
      payment_reference: string;
      paystack_payment_reference: string;
    };
  };
  total_amount: {
    distributor: number;
    sales_agent: number;
  };
  payment_receipt?: string; // URL or path to payment receipt
  payment_reference?: string; // URL or path to payment receipt
  payment_confirmed?: {
    distributor: boolean;
    sales_agent: boolean;
  };
  no_of_boxes_sold: number;
  bonus_per_box: number;
  order: string;
  description?: string;
  amount: number; // In lowest currency unit (e.g., kobo, cents)
  is_paid: {
    distributor: boolean;
    sales_agent: boolean;
  };
  recipients: {
    distributor: String;
    sales_agent: String;
  };
  paid_at?: Date;
  confirmed_at?: Date;
  related_orders?: Types.ObjectId[]; // Orders that contributed to the bonus
  period: {
    start_date: Date;
    end_date: Date;
  };
  created_at: Date;
  updated_at: Date;
}

const BonusSchema = new Schema<IBonus>(
  {
    recipients: {
      distributor: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      sales_agent: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    },

    internal_sequence: { type: Number, immutable: true },
    payment_account_details: {
      distributor: {
        bank_name: { type: String, required: true },
        bank_code: { type: String, required: true },
        account_number: { type: String, required: true },
        // account_name: { type: String, required: true },
        paystack_payment_reference: { type: String },
      },
      sales_agent: {
        bank_name: { type: String, required: true },
        bank_code: { type: String, required: true },
        account_number: { type: String, required: true },
        // account_name: { type: String, required: true },
        paystack_payment_reference: { type: String },
      },
    },
    bonus_type: {
      type: String,
      enum: ["sales_target", "referral", "performance"],
      required: true,
    },
    // status: {
    //   type: String,
    //   enum: ["pending", "processing", "completed", "reversed"],
    //   default: "pending",
    // },
    description: { type: String },
    no_of_boxes_sold: { type: Number, required: true },
    order: { type: String, ref: "Order" },
    bonus_per_box: { distributor: Number, sales_agent: Number },
    payment_receipt: { type: String },
    payment_reference: { distributor: String, sales_agent: String },
    total_bonus_earned: {
      sales_agent_bonus_per_box: { type: Number, required: 0 },
      distributor_bonus_per_box: { type: Number, required: 0 },
    },
    total_amount: {
      distributor: {
        type: Number,
        required: true,
        default: 0,
      },
      sales_agent: {
        type: Number,
        required: true,
        default: 0,
      },
    },
    is_paid: {
      distributor: { type: Boolean, default: false },
      sales_agent: { type: Boolean, default: false },
    },
    paid_at: {
      distributor_at: Date,
      sales_agent_at: Date,
    },
    payment_confirmed: {
      distributor: { type: Boolean, default: false },
      sales_agent: { type: Boolean, default: false },
    },
    confirmed_at: {
      distributor: { type: Date },
      sales_agent: { type: Date },
    },
    payment_status: {
      distributor: {
        type: String,
        enum: ["unpaid", "processing", "paid", "failed", "reversed"],
        default: "unpaid",
      },
      sales_agent: {
        type: String,
        enum: ["unpaid", "processing", "paid", "failed", "reversed"],
        default: "unpaid",
      },
    },
    bonus_id: { type: String },
    period: {
      start_date: { type: Date, required: true },
      end_date: { type: Date, required: true },
    },
  },

  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);
BonusSchema.pre(
  "save",
  async function (this: import("mongoose").Document & IBonus, next) {
    if (this.isNew) {
      const today = new Date().toISOString().split("T")[0];

      // Increment sequence for today
      const counter = await Counter.findOneAndUpdate(
        { name: "bonus", date: today },
        { $inc: { sequence: 1 } },
        { new: true, upsert: true }
      );

      const seq = counter.sequence;
      this.internal_sequence = seq;
      // Random 5-character alphanumeric
      const randomPart = generateRandom(8, "00").toUpperCase();
      const datePart = today.replace(/-/g, "");
      const bonus_number = `BNS-${datePart}-${randomPart}-${String(
        seq
      ).padStart(4, "0")}`;
      this.bonus_id = bonus_number;
    }
    next();
  }
);
export default model<IBonus>("Bonus", BonusSchema);
