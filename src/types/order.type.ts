import { Document, Types } from "mongoose";
import { IUser } from "./type";

export interface ProductVariant {
  id: Types.ObjectId;
  quantity: number;
  name: string;
}

export interface ProductItem {
  product_id:string;
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
type DeliverySteps =
  | "order_placed"
  | "order_paid_for"
  | "order_processing"
  | "on_the_way"
  | "order_delivered"
  | "order_on_hold"
  | "order_cancelled"
  | "order_failed";
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
  note_from_user?: string; // optional delivery notes
}
export interface IDeliveryDetails {
  label: DeliverySteps;
  is_confirmed: boolean;
  date: Date;
  description: string;
  updated_by: {
    type: "system" | "worker" | "admin";
    user_id: Types.ObjectId;
  };
}
interface Pickup {
  distributor_id: Types.ObjectId; // Distributor chosen
  location_name: string; // e.g., "Glorious Mart Warehouse"
  address: string; // full address
  city: string;
  state: string;
  country: string;
  coordinates?: {
    // optional for map-based pickup
    lat: number;
    lng: number;
  };
  date?: Date; // when agent is expected to pick up
}

export interface IOrder extends Document {
  sales_agent_id: Types.ObjectId; // who placed the order
  distributor_id: Types.ObjectId; // distributor supplying
  order_total: number; // total order cost
  pickup: Pickup; // embedded pickup schema
  notes?: string;
  user_id: IUser;
  assigned_to?: {
    office: Types.ObjectId;
    office_worker: Types.ObjectId;
    worker_handling_order: Types.ObjectId;
  };
  confirmation: {
    is_confirmed: Boolean;
    confirmed_at: Date;
    auto_confirmed_at?: Date;
    method: "user" | "auto";
  };
  order_number?: string;
  date?: Date;
  shipping: IShippingDetails;
  delivery_steps: IDeliveryDetails[];
  delivery_steps_logs: IDeliveryDetails[];
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
  estimated_delivery_date: {
    start: Date;
    end: Date;
  };
  actual_delivery_date?: Date;
  priority_level: "normal" | "urgent";
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
