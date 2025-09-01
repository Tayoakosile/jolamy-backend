import { Request } from "express";
import { Document, Types } from "mongoose";
import { IOfficeWorker } from "../models/Admin/OfficeWorker";
import { IOrder } from "./order.type";

export type ApprovalStatus =
  | "inactive"
  | "pending"
  | "pending_for_documents"
  | "awaiting_registration_fee_payment"
  | "submitted_for_review"
  | "pending_for_approval"
  | "approved"
  | "rejected"
  | "disabled";
export type UserRole =
  | "admin"
  | "distributor"
  | "sales_agent"
  | "worker"
  | "factory_worker";

export type UserDocument = IUser & IOfficeWorker & Document;
export interface IUser extends IOfficeWorker {
  _id: Types.ObjectId;
  total_boxes_ordered: number;
  total_boxes_sold: number;
  name: string;
  user_id: string;
  internal_sequence: number;
  first_name: string;
  full_name: string;
  last_name: string;
  approved_by: Types.ObjectId;
  approved_at: Date;
  rejected_by: Types.ObjectId;
  rejected_at: Date;
  rejected_reason?: string;
  email: string;
  username: string;
  date_joined: Date;
  phone_number: string;
  gender: string;
  dob: Date;
  business_address: string;
  has_accepted_distributor_terms: boolean;
  is_factory_worker: boolean;
  is_verified: boolean;
  disabled_reason?: string;
  change_requests?: [];
  cart?: [];
  is_admin: boolean;
  is_distributor: boolean;
  is_sales_agent: boolean;
  is_worker: boolean;
  is_first_login: boolean;
  address: {
    distributors_address: {
      country: string;
      state: string;
      city: string;
      postal_code: string;
      address: string;
    };
    business_address: {
      address: string;
      country: string;
      state: string;
      city: string;
      postal_code: string;
    };
  };
  last_login: Date;
  distribution_address?: string;
  status: ApprovalStatus;
  password: string;
  last_order_date?: Date;
  user_role: UserRole;
  teams: any;
  stats: any;
  outstanding_boxes: number;
  total_boxes_in_stock: number;
  orders: Types.ObjectId[]; // refs to Order model
  products: { type: Types.ObjectId[]; ref: "Products" }; // refs to Product model
  bonus: { type: Types.ObjectId[]; ref: "Bonus" }; // refs to Bonus model
  transaction_history: { type: Types.ObjectId[]; ref: "TransactionHistory" }; // refs to Transaction model
  change_request: { type: Types.ObjectId; ref: "ChangeRequest" }; // refs to ChangeRequest model
  warehouse_location: string;
  inventory_obligations_accepted: boolean;
  warehouse_photos: {
    internal: string[];
    external: string[];
  };
  warehouse_verified: boolean;
  account_details: {
    type: Object;
  };
  paid_registration_fee: boolean;
  documents: [
    {
      id_type: string;
      id_number: string;
      id_image_url: string;
    }
  ];
  forgot_password_token?: string;
  forgot_password_expires?: Date;
  referees: [{ name: string; type: "Business" | "Character"; contact: string }];
  admin_notes: string;
  years_in_operation: number;
  registration_number: number;
  // logs: { type: Types.ObjectId[]; ref: "Logs" }; // refs to Log model
}

export interface AuthRequest extends Request {
  user?: IUser & {
    _id: string;
    is_admin: boolean;
    email: string;
  };
  worker?: IOfficeWorker & {
    _id: string;
    is_admin: boolean;
    email: string;
  };
  order?: IOrder;
  isWorker: boolean;
  isUserAdmin: boolean;
  isOtherUser: boolean;
}
