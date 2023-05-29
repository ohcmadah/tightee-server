import { DocumentReference } from "firebase-admin/firestore";
import { Question } from "./question";
import { TighteeUser } from "./user";

export interface Answer {
  user: TighteeUser;
  question: DocumentReference<Question>;
  option: string;
  createdAt: number;
}
