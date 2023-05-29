"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const axios_1 = require("axios");
const dotenv_1 = require("dotenv");
const constants_1 = require("./constants");
const common_1 = require("./common");
(0, dotenv_1.config)();
const app = express();
app.use(cors({ origin: true }));
const updateOrCreateUser = async (auth, normalizedUser) => {
    const properties = {
        uid: normalizedUser.id,
        provider: normalizedUser.provider,
        displayName: normalizedUser.nickname,
        email: normalizedUser.email,
    };
    try {
        const user = await auth.updateUser(normalizedUser.id, properties);
        return user;
    }
    catch (error) {
        if (error.code === "auth/user-not-found") {
            const user = await auth.createUser(properties);
            return user;
        }
        console.error(error);
        throw error;
    }
};
const normalizeGender = (gender) => {
    const map = {
        [constants_1.KAKAO_GENDER_MALE]: constants_1.GENDER_MALE,
        [constants_1.KAKAO_GENDER_FEMALE]: constants_1.GENDER_FEMALE,
    };
    return map[gender];
};
const normalizeKakaoUser = (user) => {
    var _a;
    const kakaoAccount = user.kakao_account;
    const normalizedUser = {
        id: `kakao:${user.id}`,
        provider: constants_1.KAKAO_PROVIDER,
        nickname: (_a = kakaoAccount === null || kakaoAccount === void 0 ? void 0 : kakaoAccount.profile) === null || _a === void 0 ? void 0 : _a.nickname,
        email: kakaoAccount === null || kakaoAccount === void 0 ? void 0 : kakaoAccount.email,
        birthday: kakaoAccount === null || kakaoAccount === void 0 ? void 0 : kakaoAccount.birthday,
        gender: (kakaoAccount === null || kakaoAccount === void 0 ? void 0 : kakaoAccount.gender) && normalizeGender(kakaoAccount.gender),
    };
    return normalizedUser;
};
const getKakaoUser = async (token) => {
    const res = await axios_1.default.get(constants_1.KAKAO_GET_USER_INFO_URL, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
};
const getToken = async (code, url) => {
    const redirectURI = url ? url + "/callback/kakaotalk" : process.env.KAKAO_REDIRECT_URI || "";
    const body = {
        grant_type: "authorization_code",
        client_id: process.env.KAKAO_REST_API_KEY || "",
        redirect_uri: redirectURI,
        code,
    };
    const res = await axios_1.default.post(constants_1.KAKAO_GET_TOKEN_URL, new URLSearchParams(body));
    return res.data;
};
app.post("/kakao", async (req, res) => {
    const { code } = req.body;
    if (!code) {
        return res.status(400).json({
            code: 400,
            message: "code is a required parameter.",
        });
    }
    try {
        const response = await getToken(code, req.headers.origin);
        const token = response.access_token;
        const kakaoUser = await getKakaoUser(token);
        const normalizedUser = normalizeKakaoUser(kakaoUser);
        const app = (0, common_1.getAdminApp)();
        const auth = admin.auth(app);
        const authUser = await updateOrCreateUser(auth, normalizedUser);
        const firebaseToken = await auth.createCustomToken(authUser.uid, {
            KAKAO_PROVIDER: constants_1.KAKAO_PROVIDER,
        });
        const db = admin.firestore(app);
        const userDoc = db.doc("users/" + authUser.uid);
        const isJoined = (await userDoc.get()).exists;
        if (isJoined) {
            await userDoc.update({ email: normalizedUser.email });
        }
        return res.status(200).json({
            kakaoUser: normalizedUser,
            firebaseToken,
            isJoined,
        });
    }
    catch (error) {
        console.error(error.response);
        const err = error.response;
        return res.status(err.status).json({
            code: err.status,
            message: err.statusText,
        });
    }
});
exports.default = common_1.https.onRequest(app);
//# sourceMappingURL=auth.js.map