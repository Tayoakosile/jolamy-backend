import { Document, Types } from "mongoose";

export interface ProductVariant {
  id: Types.ObjectId;
  quantity: number;
}

export interface ProductItem {
  variants: ProductVariant[];
}

export interface ShippingLocation {
  address: string;
  city: string;
  state: string;
  country: string;
  phoneNumber: string;
  estimatedDate: Date;
}

type OrderRole = "distributor" | "sales_agent";
type PaymentStatus = "pending" | "paid" | "cancelled" | "initiated";
type DeliveryStatus = "not_assigned" | "in_transit" | "delivered" | "pending";
type RefundStatus = "none" | "pending" | "processed";
type PaymentMethod =
  | "bank_transfer"
  | "cash"
  | "pos"
  | "mobile_money"
  | "paystack"
  | null;

export interface IShippingDetails {
  recipient_name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postal_code?: string;
  delivery_type: "pickup" | "delivery"; // pickup at office or deliver to address
  notes?: string; // optional delivery notes
}

export interface IOrder extends Document {
  user_id: { type: Types.ObjectId; ref: "User"; required: true };
  assigned_to?: {
    office: Types.ObjectId;
    office_worker: Types.ObjectId;
  };
  order_number?: string;
  date?: Date;
  shipping: IShippingDetails;
  delivery_fee?: number;
  role: OrderRole;
  products: ProductItem[];
  shipping_location?: ShippingLocation;
  payment_status?: PaymentStatus;
  delivery_status?: DeliveryStatus;
  internal_notes?: string;
  internal_sequence?: number;
  transaction_id?: Types.ObjectId;
  total_amount?: number;
  grand_total?: number;

  total_quantity?: number;
  estimated_delivery_date?: Date;
  actual_delivery_date?: Date;
  priority_level:"normal" | "urgent";
  discount_amount?: number;
  tax_amount?: number;
  tracking_number?: string;
  courier_service?: string;
  admin_notes_to_office: String;
  admin_notes_to_customer: String;
  cancelled_at?: Date;
  refund_status?: RefundStatus;
  fulfillment_type?: string;
  status: string;
  payment_method?: PaymentMethod;
  payment_reference?: string;
  logs?: any[];
  createdAt?: Date;
  updatedAt?: Date;
}
