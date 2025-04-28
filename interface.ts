import { ObjectId } from "mongodb";

export interface UserModel {
    _id?: string;
    username: string;
    email: string;
    password: string;
}

export interface FlashMessage {
    type: "error" | "success"
    message: string;
}