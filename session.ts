import dotenv from "dotenv";
dotenv.config();

import session from "express-session";
import connectMongo from "connect-mongodb-session";
import { ObjectId } from "mongodb";
import { FlashMessage, UserModel } from "./interface";
const MongoDBStore = connectMongo(session);

const mongoStore = new MongoDBStore({
    uri: process.env.MONGO_URI ?? "mongodb://localhost:27017/VAR-United-db",
    collection: "sessions",
    databaseName: "VAR-United-db",
});

mongoStore.on("error", (error) => {
    console.error(error);
});

export const sessionMiddleware = session({
    secret: process.env.SESSION_SECRET ?? "your_secret_key",
    resave: true,
    saveUninitialized: true,
    store: mongoStore,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24,
    },
});

declare module 'express-session' {
    interface SessionData {
        loggedIn: boolean;
        message?: FlashMessage;
        user?: UserModel;
    }
}