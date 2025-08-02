"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const db_1 = __importDefault(require("./config/db"));
const errorHandler_1 = require("./middlewares/errorHandler");
dotenv_1.default.config();
const app = (0, express_1.default)();
// Middleware
app.use(express_1.default.json());
app.use("/api/users", user_routes_1.default);
app.use("/api/auth", auth_routes_1.default);
app.use(errorHandler_1.errorHandler);
const PORT = process.env.PORT || 5000;
(0, db_1.default)(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
});
// Connect DB here
exports.default = app;
