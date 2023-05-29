"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const common_1 = require("./common");
const middleware_1 = require("./middleware");
const app = express();
app.use(cors({ origin: true }));
app.get("/", async (req, res) => {
    const { date } = req.query;
    try {
        const app = (0, common_1.getAdminApp)();
        const db = admin.firestore(app);
        const query = date
            ? db.collection("questions").where("createdAt", "==", date)
            : db.collection("questions");
        const { docs } = await query.get();
        const questions = docs.map((doc) => (Object.assign(Object.assign({}, doc.data()), { id: doc.id })));
        if (questions.length === 0) {
            return res
                .status(204)
                .json({ code: 204, message: "질문이 존재하지 않습니다." });
        }
        return res.status(200).json(questions);
    }
    catch (error) {
        return res.status(500).json(error);
    }
});
app.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const app = (0, common_1.getAdminApp)();
        const db = admin.firestore(app);
        const questionDoc = await db.doc("questions/" + id).get();
        if (questionDoc.exists) {
            const question = questionDoc.data();
            return res.status(200).json(Object.assign(Object.assign({}, question), { id: questionDoc.id }));
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
app.post("/", middleware_1.checkAdmin, async (req, res) => {
    try {
        const app = (0, common_1.getAdminApp)();
        const db = admin.firestore(app);
        const { title, createdAt, author, options } = req.body;
        if (!title || !createdAt || !options) {
            return res.status(400).json({
                code: 400,
                message: "Bad Request.",
            });
        }
        const { docs: questions } = await db
            .collection("questions")
            .orderBy("createdAt", "desc")
            .limit(1)
            .get();
        const lastOptions = questions[0].data().options;
        const lastOptionId = Object.keys(lastOptions).sort((a, b) => Number(b) - Number(a))[0];
        const newOptionId = Number(lastOptionId) + 1;
        const newOptions = options.reduce((acc, option, index) => (Object.assign(Object.assign({}, acc), { [newOptionId + index]: option })), {});
        const data = Object.assign(Object.assign({ title,
            createdAt }, (author !== "" ? { author } : {})), { options: newOptions });
        const question = await db.collection("questions").add(data);
        return res.status(200).json({ id: question.id });
    }
    catch (error) {
        return res.status(500).json(error);
    }
});
exports.default = common_1.https.onRequest(app);
//# sourceMappingURL=questions.js.map