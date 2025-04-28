import { MongoClient, Collection } from 'mongodb';
import dotenv from 'dotenv';
import { UserModel } from './interface'; // your future user model interface

dotenv.config();

const MONGODB_URI = process.env.MONGO_URI ?? 'mongodb://localhost:27017';
export const client = new MongoClient(MONGODB_URI);

export const userCollection: Collection<UserModel> = client.db('VAR-United-db').collection<UserModel>('users');

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
