import { MongoClient, Collection } from 'mongodb';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { Club, League, Player, UserModel } from './interface';

import fs from 'fs';
import path from 'path';

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
        const existingCount = await clubCollection.countDocuments();
        if (existingCount > 0) {
            console.log("📦 Club data already exists, skipping fetch.");
            return;
        }

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
            allClubs.push(...data.items);
        }

        await clubCollection.insertMany(allClubs);
        console.log(`✅ ${allClubs.length} clubs inserted successfully`);

    } catch (error) {
        console.error('❌ Error fetching clubs:', error);
    }
}

export async function loadLeagueData() {
    try {
        const existingCount = await leagueCollection.countDocuments();
        if (existingCount > 0) {
            console.log("📦 League data already exists, skipping fetch.");
            return;
        }

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
            allLeagues.push(...data.items);
        }

        await leagueCollection.insertMany(allLeagues);
        console.log(`✅ ${allLeagues.length} leagues inserted successfully`);

    } catch (error) {
        console.error('❌ Error fetching leagues:', error);
    }
}

export async function loadPlayerData() {
    try {
        const existingCount = await playerCollection.countDocuments();
        if (existingCount > 0) {
            console.log("📦 Player data already exists, skipping fetch.");
            return;
        }

        const totalPages = 3;
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
            allPlayers.push(...data.items);
        }

        await playerCollection.insertMany(allPlayers);
        console.log(`✅ ${allPlayers.length} players inserted successfully`);

    } catch (error) {
        console.error('❌ Error fetching players:', error);
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

export async function syncLocalClubImages() {
  try {
    console.log("🖼️ Automatisch synchroniseren van lokale clublogo's gestart");
    
    // Pad waar de logo's zijn opgeslagen
    const clubLogoPath = path.join(process.cwd(), 'public', 'assets', 'clubs');
    
    // Controleer of de map bestaat
    if (!fs.existsSync(clubLogoPath)) {
      console.error(`❌ Map niet gevonden: ${clubLogoPath}`);
      return;
    }
    
    // Haal alle bestandsnamen op uit de map
    const logoFiles = fs.readdirSync(clubLogoPath)
      .filter(file => file.endsWith('.png')); // Alleen PNG-bestanden
    
    console.log(`🔍 ${logoFiles.length} logo-bestanden gevonden`);
    
    let updatedCount = 0;
    let notFoundCount = 0;
    
    // Loop door elk bestand en update de bijbehorende club
    for (const logoFile of logoFiles) {
      // Verwijder de extensie (.png) van de bestandsnaam om de clubnaam te krijgen
      const clubName = logoFile.replace('.png', '');
      
      // De URL voor front-end gebruik
      const imageUrl = `/assets/clubs/${logoFile}`;
      
      // Start met een exacte overeenkomst
      let result = await clubCollection.updateOne(
        { name: clubName },
        { $set: { imageUrl: imageUrl } }
      );
      
      // Als geen exacte match, probeer case-insensitive match
      if (result.matchedCount === 0) {
        result = await clubCollection.updateOne(
          { name: { $regex: new RegExp(`^${clubName}$`, 'i') } },
          { $set: { imageUrl: imageUrl } }
        );
      }
      
      // Als nog steeds geen match, probeer een meer flexibele match
      if (result.matchedCount === 0) {
        // Maak een flexibele regex die woorden zoekt in willekeurige volgorde
        const words = clubName
          .split(/[^a-zA-Z0-9]+/) // Split op niet-alfanumerieke tekens
          .filter(word => word.length > 2) // Filter korte woorden (zoals 'FC', 'AC', etc.)
          .map(word => `(?=.*${word})`) // Maak lookahead assertions voor elk woord
          .join('');
        
        if (words.length > 0) {
          const flexibleRegex = new RegExp(words, 'i');
          
          result = await clubCollection.updateOne(
            { name: { $regex: flexibleRegex } },
            { $set: { imageUrl: imageUrl } }
          );
        }
      }
      
      if (result.matchedCount > 0) {
        updatedCount++;
        console.log(`✅ Match gevonden voor "${clubName}"`);
      } else {
        notFoundCount++;
        console.log(`⚠️ Geen overeenkomende club gevonden voor: "${clubName}"`);
      }
    }
    
    console.log(`🔄 Synchronisatie voltooid: ${updatedCount} logo's bijgewerkt, ${notFoundCount} zonder match`);
    
    // Als er clubs zijn zonder logo, geef dit aan
    const unassignedCount = await clubCollection.countDocuments({ imageUrl: { $exists: false } });
    if (unassignedCount > 0) {
      console.log(`ℹ️ ${unassignedCount} clubs hebben nog geen logo toegewezen gekregen`);
    }
    
  } catch (error) {
    console.error('❌ Fout bij synchroniseren van clublogo\'s:', error);
  }
}

export async function syncLocalLeagueImages() {
  try {
    console.log("🖼️ Automatisch synchroniseren van lokale league-logo's gestart");

    // Pad waar de logo's zijn opgeslagen
    const leagueLogoPath = path.join(process.cwd(), 'public', 'assets', 'leagues');

    // Controleer of de map bestaat
    if (!fs.existsSync(leagueLogoPath)) {
      console.error(`❌ Map niet gevonden: ${leagueLogoPath}`);
      return;
    }

    // Haal alle PNG-bestanden op
    const logoFiles = fs.readdirSync(leagueLogoPath).filter(file => file.endsWith('.png'));

    console.log(`🔍 ${logoFiles.length} logo-bestanden gevonden`);

    let updatedCount = 0;
    let notFoundCount = 0;

    for (const logoFile of logoFiles) {
      const leagueName = logoFile.replace('.png', '');
      const imageUrl = `/assets/leagues/${logoFile}`;

      // 1. Exacte match
      let result = await leagueCollection.updateOne(
        { name: leagueName },
        { $set: { imageUrl } }
      );

      // 2. Case-insensitive match
      if (result.matchedCount === 0) {
        result = await leagueCollection.updateOne(
          { name: { $regex: new RegExp(`^${leagueName}$`, 'i') } },
          { $set: { imageUrl } }
        );
      }

      // 3. Flexibele regex (woorden in willekeurige volgorde)
      if (result.matchedCount === 0) {
        const words = leagueName
          .split(/[^a-zA-Z0-9]+/)
          .filter(word => word.length > 2)
          .map(word => `(?=.*${word})`)
          .join('');

        if (words.length > 0) {
          const flexibleRegex = new RegExp(words, 'i');
          result = await leagueCollection.updateOne(
            { name: { $regex: flexibleRegex } },
            { $set: { imageUrl } }
          );
        }
      }

      if (result.matchedCount > 0) {
        updatedCount++;
        console.log(`✅ Match gevonden voor "${leagueName}"`);
      } else {
        notFoundCount++;
        console.warn(`⚠️ Geen match gevonden voor "${leagueName}"`);
      }
    }

    console.log(`🔄 Synchronisatie voltooid: ${updatedCount} logo's bijgewerkt, ${notFoundCount} geen match`);

    // Controleer of er nog leagues zonder logo zijn
    const unassignedCount = await leagueCollection.countDocuments({ imageUrl: { $exists: false } });
    if (unassignedCount > 0) {
      console.log(`ℹ️ ${unassignedCount} leagues hebben nog geen logo toegewezen gekregen`);
    }

  } catch (error) {
    console.error('❌ Fout bij synchroniseren van league-logo\'s:', error);
  }
}

//Logo's verwijderen uit database
export async function clearAllImages() {
  try {
    const leagueResult = await leagueCollection.updateMany(
      { imageUrl: { $exists: true } },
      { $unset: { imageUrl: "" } }
    );

    const clubResult = await clubCollection.updateMany(
      { imageUrl: { $exists: true } },
      { $unset: { imageUrl: "" } }
    );

    console.log(`🧹 Verwijderd uit leagues: ${leagueResult.modifiedCount}`);
    console.log(`🧹 Verwijderd uit clubs: ${clubResult.modifiedCount}`);
  } catch (error) {
    console.error("❌ Fout bij verwijderen van afbeeldingen:", error);
  }
}

export async function wipeDatabase() {
    try {
        await clubCollection.deleteMany({});
        await leagueCollection.deleteMany({});
        await playerCollection.deleteMany({});
        await userCollection.deleteMany({});
        console.log('🗑️ Alle data succesvol verwijderd uit de database.');
    } catch (error) {
        console.error('❌ Fout bij verwijderen van data:', error);
    }
}

export async function connect() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    //await wipeDatabase();
    //await clearAllImages();
    await loadClubData();
    await loadLeagueData();
    await loadPlayerData();
    
    // Voeg hier de aanroep van de synchronisatiefunctie toe
    await syncLocalClubImages();
    await syncLocalLeagueImages();
    
    process.on('SIGINT', async () => {
      await client.close();
      console.log('Disconnected from MongoDB');
      process.exit(0);
    });
  } catch (error) {
    console.error('Failed to connect to MongoDB', error);
  }
}


