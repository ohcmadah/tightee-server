"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const moment = require("moment-timezone");
const common_1 = require("./common");
const middleware_1 = require("./middleware");
const app = express();
app.use(cors({ origin: true }));
const convertDocToAnswer = (doc) => {
    const answer = doc.data();
    const converted = Object.assign(Object.assign({}, answer), { id: doc.id, question: answer.question.id });
    return converted;
};
const convertDocsToAnswers = (docs) => {
    const answers = docs.map((doc) => convertDocToAnswer(doc));
    return answers.sort((a, b) => b.createdAt - a.createdAt);
};
const calcAgeGroup = (birthdate) => {
    const year = moment.tz(birthdate, "Asia/Seoul").year();
    const currentYear = moment().tz("Asia/Seoul").year();
    const age = currentYear - year + 1;
    return age.toString().slice(0, 1) + "0";
};
app.get("/", middleware_1.checkUserIdContained, async (req, res) => {
    try {
        const app = (0, common_1.getAdminApp)();
        const db = admin.firestore(app);
        const { user: userId, question: questionId, groups } = req.query;
        if (userId) {
            if (userId === req.body.uid) {
                const { empty, docs } = await db.collection("answers").where("user.id", "==", userId).get();
                const answers = convertDocsToAnswers(docs);
                if (empty) {
                    return res.status(204).json();
                }
                return res.status(200).json(answers);
            }
            return res.status(403).json({ code: 403, message: "사용자 인증에 실패하였습니다." });
        }
        if (groups && Array.isArray(groups)) {
            const coll = db.collection("answers");
            const query = questionId
                ? coll.where("question", "==", db.doc("questions/" + questionId))
                : coll;
            const { empty, docs } = await query.get();
            if (empty) {
                return res.status(204).json();
            }
            const answers = convertDocsToAnswers(docs);
            const result = groups.reduce((acc, groupKey) => {
                const keyGetter = (answer) => {
                    const key = (0, common_1.getProperty)(answer, groupKey);
                    return groupKey.match(/birthdate/) ? calcAgeGroup(key) : key;
                };
                const group = (0, common_1.toMap)(answers, keyGetter, (answer) => answer.option);
                return Object.assign(Object.assign({}, acc), { [groupKey]: Object.fromEntries(group) });
            }, {});
            return res.status(200).json(result);
        }
        return res.status(400).json({ code: 400, message: "전체 답변은 불러올 수 없습니다." });
    }
    catch (error) {
        return res.status(500).json(error);
    }
});
app.get("/:id", async (req, res) => {
    var _a;
    try {
        const { id: answerId } = req.params;
        const app = (0, common_1.getAdminApp)();
        const db = admin.firestore(app);
        const auth = admin.auth(app);
        const answerDoc = await db.doc("answers/" + answerId).get();
        if (!answerDoc.exists) {
            return res.status(204).json({});
        }
        const answer = convertDocToAnswer(answerDoc);
        const { id, nickname, region, birthdate, gender, MBTI } = answer.user;
        const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split("Bearer ")[1];
        if (token) {
            try {
                const { uid } = await auth.verifyIdToken(token);
                if (uid === id) {
                    return res.status(200).json(Object.assign(Object.assign({}, answer), { user: { id, nickname, region, birthdate, gender, MBTI } }));
                }
            }
            catch (error) { }
        }
        return res.status(200).json(Object.assign(Object.assign({}, answer), { user: { nickname, region, birthdate, gender, MBTI } }));
    }
    catch (error) {
        console.log(error);
        return res.status(500).json(error);
    }
});
app.post("/", async (req, res) => {
    try {
        const app = (0, common_1.getAdminApp)();
        const db = admin.firestore(app);
        const { question: questionId, option: optionId, user: userId } = req.body;
        if (!questionId || !optionId || !userId) {
            return res.status(400).json({
                code: 400,
                message: "Bad Request.",
            });
        }
        const { docs: answers } = await db.collection("answers").where("user.id", "==", userId).get();
        const isAlreadyAnswered = answers.find((answer) => answer.get("question").id === questionId);
        if (isAlreadyAnswered) {
            return res.status(400).json({ code: 400, message: "You have already answered." });
        }
        const question = db.doc("questions/" + questionId);
        const user = await db.doc("users/" + userId).get();
        const data = {
            option: optionId,
            question,
            user: user.data(),
            createdAt: admin.firestore.Timestamp.now(),
        };
        const answer = await db.collection("answers").add(data);
        return res.status(200).json({ id: answer.id });
    }
    catch (error) {
        return res.status(500).json(error);
    }
});
exports.default = common_1.https.onRequest(app);
//# sourceMappingURL=answers.js.map