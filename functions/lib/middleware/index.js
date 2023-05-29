"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkUserIdContained = exports.checkFields = exports.checkAdmin = exports.checkToken = void 0;
const admin = require("firebase-admin");
const dotenv_1 = require("dotenv");
const common_1 = require("../common");
(0, dotenv_1.config)();
const checkToken = async (req, res, next) => {
    var _a;
    try {
        const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split("Bearer ")[1];
        if (!token) {
            return res
                .status(403)
                .json({ code: 403, message: "No credentials sent!" });
        }
        const app = (0, common_1.getAdminApp)();
        const auth = admin.auth(app);
        const { uid } = await auth.verifyIdToken(token);
        req.body.uid = uid;
        return next();
    }
    catch (error) {
        return res
            .status(403)
            .json({ code: 403, message: "사용자 인증에 실패하였습니다." });
    }
};
exports.checkToken = checkToken;
const checkAdmin = async (req, res, next) => {
    var _a;
    try {
        const key = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split("Bearer ")[1];
        if (!key) {
            return res
                .status(403)
                .json({ code: 403, message: "No credentials sent!" });
        }
        if (key !== process.env.ADMIN_KEY) {
            return res
                .status(403)
                .json({ code: 403, message: "어드민 인증에 실패하였습니다." });
        }
        return next();
    }
    catch (error) {
        return res
            .status(500)
            .json({ code: 500, message: "어드민 인증에 실패하였습니다." });
    }
};
exports.checkAdmin = checkAdmin;
const checkFields = (req, res, next) => {
    try {
        const { fields } = req.query;
        if (!fields) {
            return (0, exports.checkToken)(req, res, next);
        }
        if (Array.isArray(fields)) {
            const fieldStringList = fields;
            const isAuthRequired = fieldStringList.includes("id") || fieldStringList.includes("email");
            if (isAuthRequired) {
                return (0, exports.checkToken)(req, res, next);
            }
        }
        return next();
    }
    catch (error) {
        console.log(error);
        return res.status(500).json(error);
    }
};
exports.checkFields = checkFields;
const checkUserIdContained = (req, res, next) => {
    try {
        const userId = req.query.user;
        if (typeof userId === "string") {
            return (0, exports.checkToken)(req, res, next);
        }
        return next();
    }
    catch (error) {
        return res.status(500).json(error);
    }
};
exports.checkUserIdContained = checkUserIdContained;
//# sourceMappingURL=index.js.map