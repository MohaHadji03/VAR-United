import { MongoClient, Collection } from 'mongodb';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { UserModel } from './interface'; // your future user model interface

dotenv.config();

const MONGODB_URI = process.env.MONGO_URI!;
export const client = new MongoClient(MONGODB_URI);

export const userCollection: Collection<UserModel> = client.db('VAR-United-db').collection<UserModel>('users');

const saltRounds: number = 10;

export async function connect() {
    try {
        await client.connect();
        console.log('Connected to MongoDB');
        process.on('SIGINT', async () => {
            await client.close();
            console.log('Disconnected from MongoDB');
            process.exit(0);
        });
    } catch (error) {
        console.error('Failed to connect to MongoDB', error);
    }
}

export async function login(username: string, password: string) {
    if (username === "" || password === "") {
        throw new Error("Email and password required");
    }

    let user: UserModel | null = await userCollection.findOne<UserModel>({ username: username });

    if (user) {
        if (await bcrypt.compare(password, user.password!)) {
            return user;
        } else {
            throw new Error("Password incorrect");
        }
    } else {
        throw new Error("User not found");
    }
}

export async function register(username: string, email: string, password: string) {
    if (email === "" || password === "") {
        throw new Error("Email en wachtwoord vereist!");
    }

    let emailUser: UserModel | null = await userCollection.findOne<UserModel>({ email: email });
    let userName: UserModel | null = await userCollection.findOne<UserModel>({ username: username });

    if (emailUser) {
        throw new Error("Email bestaat al! gebruik een andere mail");
    }
    if (userName) {
        throw new Error("Username bestaat al! kies een andere username");
    }

    await userCollection.insertOne({
        username: username,
        email: email,
        password: await bcrypt.hash(password, saltRounds)
    });

    return;
}
