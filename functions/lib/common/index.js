"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toMap = exports.getProperty = exports.getAdminApp = exports.https = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const constants_1 = require("../constants");
exports.https = functions
    .runWith({ secrets: ["SERVICE_ACCOUNT_KEY"] })
    .region(constants_1.SEOUL_CODE).https;
const getAdminApp = () => {
    if (!admin.apps.length) {
        const serviceAccountKey = JSON.parse(process.env.SERVICE_ACCOUNT_KEY || "");
        return admin.initializeApp({
            credential: admin.credential.cert(serviceAccountKey),
        });
    }
    return admin.app();
};
exports.getAdminApp = getAdminApp;
const getProperty = (obj, path) => {
    return path
        .split(".")
        .reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
};
exports.getProperty = getProperty;
const toMap = (arr, keyGetter, valueGetter) => {
    const map = new Map();
    arr.forEach((item) => {
        const key = keyGetter(item);
        const value = valueGetter(item);
        const collection = map.get(key);
        if (!collection) {
            map.set(key, [value]);
        }
        else {
            collection.push(value);
        }
    });
    return map;
};
exports.toMap = toMap;
//# sourceMappingURL=index.js.map