import { MongoClient, Collection } from 'mongodb';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { Club, League, Player, UserModel } from './interface'; // your future user model interface

dotenv.config();

const MONGODB_URI = process.env.MONGO_URI!;
export const client = new MongoClient(MONGODB_URI);

export const userCollection: Collection<UserModel> = client.db('VAR-United-db').collection<UserModel>('users');
export const clubCollection: Collection<Club> = client.db('VAR-United-db').collection<Club>('clubs');
export const leagueCollection: Collection<League> = client.db('VAR-United-db').collection<League>('league');
export const playerCollection: Collection<Player> = client.db('VAR-United-db').collection<Player>('player');

const saltRounds: number = 10;

export async function loadClubData() {
    try {
        const totalPages = 3; 
        const allClubs: Club[] = [];

        for (let page = 1; page <= totalPages; page++) {
            const response = await fetch(`https://api.futdatabase.com/api/clubs?page=${page}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'X-AUTH-TOKEN': process.env.FUTDB_API_TOKEN!
                },
            });

            if (!response.ok) {
                throw new Error(`API call failed on page ${page} with status ${response.status}`);
            }

            const data = await response.json();
            const clubs: Club[] = data.items;

            allClubs.push(...clubs);
        }

        if (allClubs.length > 0) {
           // await clubCollection.deleteMany({}); 
            await clubCollection.insertMany(allClubs);
            console.log(`✅ ${allClubs.length} clubs inserted successfully from ${totalPages} pages`);
        } else {
            console.log("⚠️ No club data to load.");
        }

    } catch (error) {
        console.error('❌ Error fetching clubs:', error);
    }
}

export async function loadLeagueData(){
    try {
        const totalPages = 3; 
        const allLeagues: League[] = [];

        for (let page = 1; page <= totalPages; page++) {
            const response = await fetch(`https://api.futdatabase.com/api/leagues?page=${page}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'X-AUTH-TOKEN': process.env.FUTDB_API_TOKEN!
                },
            });

            if (!response.ok) {
                throw new Error(`API call failed on page ${page} with status ${response.status}`);
            }

            const data = await response.json();
            const leagues: League[] = data.items;

            allLeagues.push(...leagues);
        }

        if (allLeagues.length > 0) {
           //  await clubCollection.deleteMany({}); 
            await leagueCollection.insertMany(allLeagues);
            console.log(`✅ ${allLeagues.length} leagues inserted successfully from ${totalPages} pages`);
        } else {
            console.log("⚠️ No league data to load.");
        }

    } catch (error) {
        console.error('❌ Error fetching leagues:', error);
    }
}

export async function loadPlayerData() {
    try {
        const totalPages = 3; // of meer als je later uitbreidt
        const allPlayers: Player[] = [];

        for (let page = 1; page <= totalPages; page++) {
            const response = await fetch(`https://api.futdatabase.com/api/players?page=${page}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'X-AUTH-TOKEN': process.env.FUTDB_API_TOKEN!
                },
            });

            if (!response.ok) {
                throw new Error(`API call failed on page ${page} with status ${response.status}`);
            }

            const data = await response.json();
            const players: Player[] = data.items;

            allPlayers.push(...players);
        }

       //  await playerCollection.deleteMany({});
        await playerCollection.insertMany(allPlayers);
        console.log(`✅ ${allPlayers.length} players inserted successfully`);
     } catch (error) {
        console.error('❌ Error fetching clubs:', error);
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

export async function connect() {
    try {
        await client.connect();
        console.log('Connected to MongoDB');
        await loadClubData();
        await loadLeagueData();
        await loadPlayerData();
        process.on('SIGINT', async () => {
            await client.close();
            console.log('Disconnected from MongoDB');
            process.exit(0);
        });
    } catch (error) {
        console.error('Failed to connect to MongoDB', error);
    }
}