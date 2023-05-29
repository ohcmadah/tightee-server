"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const cors = require("cors");
const dotenv_1 = require("dotenv");
const common_1 = require("./common");
(0, dotenv_1.config)();
const app = express();
app.use(cors({ origin: true }));
app.post("/", async (req, res) => {
    try {
        const { id, password } = req.body;
        if (id === process.env.ADMIN_ID) {
            if (password === process.env.ADMIN_PASSWORD) {
                return res.status(200).json({ key: process.env.ADMIN_KEY });
            }
        }
        return res.status(400).json({ message: "인증에 실패했습니다." });
    }
    catch (error) {
        return res.status(500).json({});
    }
});
exports.default = common_1.https.onRequest(app);
//# sourceMappingURL=admin.js.map