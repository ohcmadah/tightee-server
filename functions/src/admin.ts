import * as express from "express";
import * as cors from "cors";
import { config } from "dotenv";
import { https } from "./common";

config();

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
  } catch (error: any) {
    return res.status(500).json({});
  }
});

export default https.onRequest(app);
