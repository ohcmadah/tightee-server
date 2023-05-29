import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { SEOUL_CODE } from "../constants";

export const https = functions
  .runWith({ secrets: ["SERVICE_ACCOUNT_KEY"] })
  .region(SEOUL_CODE).https;

export const getAdminApp = () => {
  if (!admin.apps.length) {
    const serviceAccountKey = JSON.parse(process.env.SERVICE_ACCOUNT_KEY || "");
    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccountKey),
    });
  }

  return admin.app();
};

export const getProperty = <T extends Record<string, any>>(obj: T, path: string): any => {
  return path
    .split(".")
    .reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
};

export const toMap = <K, V>(
  arr: Array<V>,
  keyGetter: (item: V) => K,
  valueGetter: (item: V) => any
) => {
  const map = new Map<K, any>();
  arr.forEach((item) => {
    const key = keyGetter(item);
    const value = valueGetter(item);
    const collection = map.get(key);
    if (!collection) {
      map.set(key, [value]);
    } else {
      collection.push(value);
    }
  });
  return map;
};
