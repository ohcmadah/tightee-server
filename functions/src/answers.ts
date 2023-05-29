import * as admin from "firebase-admin";
import * as express from "express";
import * as cors from "cors";
import * as moment from "moment-timezone";
import { Answer } from "./@types";
import { getAdminApp, getProperty, https, toMap } from "./common";
import { checkUserIdContained } from "./middleware";

const app = express();
app.use(cors({ origin: true }));

type ReturnAnswer = {
  id: string;
  user: Answer["user"];
  question: string;
  option: Answer["option"];
  createdAt: number;
};

const convertDocToAnswer = (
  doc: admin.firestore.QueryDocumentSnapshot | admin.firestore.DocumentSnapshot
) => {
  const answer = doc.data() as Answer;
  const converted: ReturnAnswer = {
    ...answer,
    id: doc.id,
    question: answer.question.id,
  };
  return converted;
};

const convertDocsToAnswers = (
  docs: admin.firestore.QueryDocumentSnapshot<admin.firestore.DocumentData>[]
) => {
  const answers = docs.map((doc) => convertDocToAnswer(doc));
  return answers.sort((a, b) => b.createdAt - a.createdAt);
};

const calcAgeGroup = (birthdate: number) => {
  const year = moment.tz(birthdate, "Asia/Seoul").year();
  const currentYear = moment().tz("Asia/Seoul").year();
  const age = currentYear - year + 1;
  return age.toString().slice(0, 1) + "0";
};

app.get("/", checkUserIdContained, async (req, res) => {
  try {
    const app = getAdminApp();
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

      const result = (groups as string[]).reduce((acc, groupKey) => {
        const keyGetter = (answer: ReturnAnswer) => {
          const key = getProperty(answer, groupKey);
          return groupKey.match(/birthdate/) ? calcAgeGroup(key) : key;
        };
        const group = toMap(answers, keyGetter, (answer) => answer.option);
        return { ...acc, [groupKey]: Object.fromEntries(group) };
      }, {});

      return res.status(200).json(result);
    }

    return res.status(400).json({ code: 400, message: "전체 답변은 불러올 수 없습니다." });
  } catch (error) {
    return res.status(500).json(error);
  }
});

app.get("/:id", async (req, res) => {
  try {
    const { id: answerId } = req.params;

    const app = getAdminApp();
    const db = admin.firestore(app);
    const auth = admin.auth(app);

    const answerDoc = await db.doc("answers/" + answerId).get();
    if (!answerDoc.exists) {
      return res.status(204).json({});
    }

    const answer = convertDocToAnswer(answerDoc);
    const { id, nickname, region, birthdate, gender, MBTI } = answer.user;

    const token = req.headers.authorization?.split("Bearer ")[1];
    if (token) {
      try {
        const { uid } = await auth.verifyIdToken(token);
        if (uid === id) {
          return res.status(200).json({
            ...answer,
            user: { id, nickname, region, birthdate, gender, MBTI },
          });
        }
      } catch (error) {}
    }

    return res.status(200).json({
      ...answer,
      user: { nickname, region, birthdate, gender, MBTI },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json(error);
  }
});

app.post("/", async (req, res) => {
  try {
    const app = getAdminApp();
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
  } catch (error) {
    return res.status(500).json(error);
  }
});

export default https.onRequest(app);
