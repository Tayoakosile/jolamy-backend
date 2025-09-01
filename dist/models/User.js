"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const bcrypt_util_1 = require("../utils/bcrypt.util");
const util_1 = require("../utils/util");
const counter_1 = require("./counter");
// Optional: enums for role and approval status
const userSchema = new mongoose_1.Schema({
    first_name: { type: String, required: true },
    last_name: { type: String, required: true },
    user_id: { type: String, unique: true },
    username: String,
    date_joined: { type: Date, default: Date.now() },
    last_login: { type: Date, default: null },
    is_verified: { type: Boolean, default: false },
    approved_at: { type: Date, default: null },
    rejected_at: { type: Date, default: null },
    approved_by: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    rejected_by: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    change_requests: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "ChangeRequest" }],
    phone_number: String,
    gender: String,
    dob: { type: Date, default: null },
    total_boxes_ordered: { type: Number, default: 0 },
    total_boxes_sold: { type: Number, default: 0 },
    disabled_reason: String,
    is_first_login: { type: Boolean, default: true },
    email: { type: String, required: true, unique: true },
    cart: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "Cart" }],
    warehouse_location: { type: String },
    warehouse_verified: { type: Boolean, default: false },
    inventory_obligations_accepted: { type: Boolean, default: false },
    status: {
        type: String,
        default: "pending_for_documents",
    },
    files: {
        proof_of_identity: {
            id_type: { type: String },
            id_number: { type: String },
            files: { type: [] },
        },
        warehouse_photos: {
            internal: [],
            external: [],
        },
    },
    password: { type: String },
    internal_sequence: { type: Number, default: 0 },
    forgot_password_expires: { type: String },
    has_accepted_distributor_terms: { type: Boolean, default: false },
    forgot_password_token: { type: String },
    last_order_date: Date,
    user_role: {
        type: String,
        enum: ["admin", "distributor", "sales_agent", "worker", "factory_worker"],
    },
    teams: mongoose_1.Schema.Types.Mixed,
    stats: mongoose_1.Schema.Types.Mixed,
    outstanding_boxes: { type: Number, default: 0 },
    total_boxes_in_stock: { type: Number, default: 0 },
    orders: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "Order" }],
    products: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "Product" }],
    bonus: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "Bonus" }],
    transaction_history: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "Transaction" }],
    change_request: { type: mongoose_1.Schema.Types.ObjectId, ref: "ChangeRequest" },
    account_details: {
        bank_name: { type: String },
        account_number: { type: String },
        account_name: { type: String },
    },
    paid_registration_fee: { type: Boolean, default: false },
    documents: mongoose_1.Schema.Types.Mixed,
    admin_notes: String,
    years_in_operation: Number,
    registration_number: Number,
    address: {
        distributors_address: {
            country: { type: String },
            state: { type: String },
            city: { type: String },
            postal_code: { type: String },
            address: { type: String },
        },
        business_address: {
            address: { type: String },
            country: { type: String },
            state: { type: String },
            city: { type: String },
            postal_code: { type: String },
        },
    },
    logs: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "Log" }],
}, {
    timestamps: {
        ...util_1.timestamp,
    },
});
userSchema.virtual("full_name").get(function () {
    return `${this.first_name} ${this.last_name}`;
});
userSchema.virtual("is_admin").get(function () {
    return (this.is_admin = this.user_role === "admin");
});
userSchema.virtual("is_distributor").get(function () {
    return (this.is_distributor = this.user_role === "distributor");
});
userSchema.virtual("is_sales_agent").get(function () {
    return (this.is_sales_agent = this.user_role === "sales_agent");
});
userSchema.virtual("is_worker").get(function () {
    return (this.is_worker = this.user_role === "worker");
});
userSchema.virtual("is_factory_worker").get(function () {
    return (this.is_factory_worker = this.user_role === "factory_worker");
});
userSchema.pre("save", async function (next) {
    if (!this.isModified("password"))
        return next();
    this.password = await (0, bcrypt_util_1.encrypt)(this.password);
    next();
});
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await (0, bcrypt_util_1.isMatch)(candidatePassword, this.password);
};
userSchema.pre("save", async function (next) {
    if (this.isNew) {
        const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
        // Increment sequence for today
        const counter = await counter_1.Counter.findOneAndUpdate({ name: "user", date: today }, { $inc: { sequence: 1 } }, { new: true, upsert: true });
        const seq = counter.sequence;
        this.internal_sequence = seq;
        // Random 5-character alphanumeric
        const randomPart = (0, util_1.generateRandom)(8, "0A").toUpperCase();
        const datePart = today.replace(/-/g, "");
        const user_id = `USR-${datePart}-${randomPart}-${String(seq).padStart(4, "0")}`;
        this.user_id = user_id;
    }
    next();
});
userSchema.pre("save", function (next) {
    if (this.email) {
        this.email = this.email.trim().toLowerCase();
    }
    if (this.username) {
        this.username = this.username.trim().toLowerCase();
    }
    next();
});
exports.default = (0, mongoose_1.model)("User", userSchema);
