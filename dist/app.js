"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const db_1 = __importDefault(require("./config/db"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const upload_routes_1 = __importDefault(require("./routes/upload.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
// Middleware
app.use(express_1.default.json());
app.use("/api/upload", upload_routes_1.default);
app.use("/api/users", user_routes_1.default);
app.use("/api/auth", auth_routes_1.default);
const PORT = process.env.PORT || 5000;
(0, db_1.default)(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
});
// Connect DB here
exports.default = app;
