"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const common_1 = require("./common");
const middleware_1 = require("./middleware");
const app = express();
app.use(cors({ origin: true }));
const createQuery = (db, queryParams) => {
    const coll = db.collection("users");
    const { fields } = queryParams;
    if (Array.isArray(fields)) {
        return coll.select(...fields);
    }
    return coll;
};
app.get("/", middleware_1.checkFields, async (req, res) => {
    try {
        const app = (0, common_1.getAdminApp)();
        const db = admin.firestore(app);
        const { id } = req.query;
        if (req.body.uid && req.body.uid !== id) {
            return res
                .status(403)
                .json({ code: 403, message: "사용자 인증에 실패하였습니다." });
        }
        const query = createQuery(db, req.query);
        const { empty, docs } = await query.get();
        if (empty) {
            return res.status(204).json([]);
        }
        const users = docs.map((doc) => {
            return doc.data();
        });
        return res.status(200).json(users);
    }
    catch (error) {
        return res.status(500).json(error);
    }
});
app.post("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const { nickname, region, birthdate, gender } = data;
        if (!nickname || !region || !birthdate || !gender) {
            return res.status(400).json({
                code: 400,
                message: "Bad Request.",
            });
        }
        const app = (0, common_1.getAdminApp)();
        const db = admin.firestore(app);
        await db.collection("users").doc(id).set(data);
        return res.status(200).json({});
    }
    catch (error) {
        console.error(error);
        return res.status(500).json(error);
    }
});
app.get("/:id", middleware_1.checkToken, async (req, res) => {
    try {
        const { id } = req.params;
        if (req.body.uid !== id) {
            return res
                .status(403)
                .json({ code: 403, message: "사용자 인증에 실패하였습니다." });
        }
        const app = (0, common_1.getAdminApp)();
        const db = admin.firestore(app);
        const userDoc = await db.doc("users/" + id).get();
        if (userDoc.exists) {
            return res.status(200).json(Object.assign({}, userDoc.data()));
        }
        else {
            return res.status(204).json({});
        }
    }
    catch (error) {
        console.error(error);
        return res.status(500).json(error);
    }
});
app.patch("/:id", middleware_1.checkToken, async (req, res) => {
    try {
        const { id } = req.params;
        if (req.body.uid !== id) {
            return res
                .status(403)
                .json({ code: 403, message: "사용자 인증에 실패하였습니다." });
        }
        const data = req.body;
        const app = (0, common_1.getAdminApp)();
        const db = admin.firestore(app);
        await db.doc("users/" + id).update(data);
        return res.status(200).json({});
    }
    catch (error) {
        console.error(error);
        return res.status(500).json(error);
    }
});
app.delete("/:id", middleware_1.checkToken, async (req, res) => {
    try {
        const { id } = req.params;
        if (req.body.uid !== id) {
            return res
                .status(403)
                .json({ code: 403, message: "사용자 인증에 실패하였습니다." });
        }
        const app = (0, common_1.getAdminApp)();
        const db = admin.firestore(app);
        const auth = admin.auth(app);
        try {
            await auth.deleteUser(id);
        }
        catch (error) {
            if (error.code == "auth/requires-recent-login") {
                return res.status(400).json({
                    code: 400,
                    message: "Please sign in again to delete your account.",
                });
            }
            throw error;
        }
        const batch = db.batch();
        const answers = await db
            .collection("answers")
            .where("user.id", "==", id)
            .get();
        answers.forEach((answer) => batch.update(answer.ref, { "user.id": null }));
        batch.delete(db.doc("users/" + id));
        await batch.commit();
        return res.status(200).json({});
    }
    catch (error) {
        console.error(error);
        return res.status(500).json(error);
    }
});
exports.default = common_1.https.onRequest(app);
//# sourceMappingURL=users.js.map