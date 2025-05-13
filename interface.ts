import { ObjectId } from "mongodb";

export interface UserModel {
    _id?: string;
    username: string;
    email: string;
    password: string;
    image?: string;
}

export interface FlashMessage {
    type: "error" | "success"
    message: string;
}

export interface Club {
  id: number;
  name: string;
  league: number;
}

export interface League {
  id: number;
  name: string;
  nationId: number;
}

export interface Nations {
    id: number;
    name: string;
}

export interface Player {
  id: number;
  name: string;
  firstName: string;
  lastName: string;
  position: string;
  rating: number;
  club: number;
  league: number;
  nation: number;
}
