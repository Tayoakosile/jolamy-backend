"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const db_1 = __importDefault(require("./config/db"));
const rate_limiter_1 = require("./middlewares/rate-limiter");
const admin_routes_1 = __importDefault(require("./routes/Admin/admin.routes"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const finance_routes_1 = __importDefault(require("./routes/finance.routes"));
const order_routes_1 = __importDefault(require("./routes/order.routes"));
const transactions_routes_1 = __importDefault(require("./routes/transactions.routes"));
const products_route_1 = __importDefault(require("./routes/products.route"));
const upload_routes_1 = __importDefault(require("./routes/upload.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const app = (0, express_1.default)();
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
dotenv_1.default.config();
app.use("/api/auth", auth_routes_1.default);
app.use(rate_limiter_1.apiLimiter);
app.use("/api/users", user_routes_1.default);
app.use("/api/upload", upload_routes_1.default);
app.use("/api/admin", admin_routes_1.default);
app.use("/api/finances", finance_routes_1.default);
app.use("/api/orders", order_routes_1.default);
app.use("/api/transactions", transactions_routes_1.default);
app.use("/api/products", products_route_1.default);
const PORT = process.env.PORT || 5000;
(0, db_1.default)(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
});
// Connect DB here
exports.default = app;
