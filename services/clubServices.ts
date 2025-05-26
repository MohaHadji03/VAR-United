import { ObjectId } from "mongodb";
import { connect, client, clubCollection } from '../database';

// Define UserPreferences interface
interface UserPreferences {
  userId: ObjectId;
  favoriteClubs: number[]; // Store club IDs instead of full club objects
  blacklistedClubs: { clubId: number; reason: string }[] | number[]; // Support both old and new format
}

// Get or create userPreferences collection
const getUserPreferencesCollection = async () => {
  const db = client.db('VAR-United-db');
  return db.collection<UserPreferences>('userPreferences');
};

// Add a club to blacklist
export async function addClubToBlacklist(userId: ObjectId, clubId: string, reason: string = ""): Promise<boolean> {
  try {
    const clubIdNum = parseInt(clubId);
    if (isNaN(clubIdNum)) {
      console.error('Invalid club ID:', clubId);
      return false;
    }
    
    // Check if club exists
    const club = await clubCollection.findOne({ id: clubIdNum });
    if (!club) {
      console.error('Club not found:', clubIdNum);
      return false;
    }
    
    const userPreferences = await getUserPreferencesCollection();
    
    // Controleer het huidige format van blacklistedClubs
    const userPref = await userPreferences.findOne({ userId });
    
    // Als we het oude format gebruiken of nog geen blacklist hebben
    if (!userPref || !userPref.blacklistedClubs || 
        (userPref.blacklistedClubs.length > 0 && typeof userPref.blacklistedClubs[0] === 'number')) {
      
      // Converteer naar het nieuwe format of maak een nieuwe lijst
      const newBlacklist = userPref && userPref.blacklistedClubs 
        ? (userPref.blacklistedClubs as number[]).map((id: number) => ({ clubId: id, reason: "" }))
        : [];
      
      // Update naar het nieuwe format
      await userPreferences.updateOne(
        { userId },
        { $set: { blacklistedClubs: newBlacklist } },
        { upsert: true }
      );
    }
    
    // Verwijder club uit favorieten als die er in staat
    await userPreferences.updateOne(
      { userId },
      { $pull: { favoriteClubs: clubIdNum } }
    );
    
    // Verwijder eerst eventuele bestaande blacklist entry voor deze club
    await userPreferences.updateOne(
      { userId },
      { $pull: { blacklistedClubs: { clubId: clubIdNum } } }
    );
    
    // Voeg toe aan blacklist met reden
    await userPreferences.updateOne(
      { userId },
      { $addToSet: { blacklistedClubs: { clubId: clubIdNum, reason: reason } } }
    );
    
    return true;
  } catch (error) {
    console.error('Error adding club to blacklist:', error);
    return false;
  }
}

// Remove a club from blacklist
export async function removeClubFromBlacklist(userId: ObjectId, clubId: string): Promise<boolean> {
  try {
    const clubIdNum = parseInt(clubId);
    if (isNaN(clubIdNum)) {
      return false;
    }
    
    const userPreferences = await getUserPreferencesCollection();
    const userPref = await userPreferences.findOne({ userId });
    
    if (!userPref || !userPref.blacklistedClubs) {
      return false;
    }
    
    // Ondersteuning voor beide formaten
    if (userPref.blacklistedClubs.length > 0 && typeof userPref.blacklistedClubs[0] === 'number') {
      await userPreferences.updateOne(
        { userId },
        { $pull: { blacklistedClubs: clubIdNum } }
      );
    } else {
      await userPreferences.updateOne(
        { userId },
        { $pull: { blacklistedClubs: { clubId: clubIdNum } } }
      );
    }
    
    return true;
  } catch (error) {
    console.error('Error removing club from blacklist:', error);
    return false;
  }
}

// Get all blacklisted clubs for a user
export async function getBlacklistedClubs(userId: ObjectId): Promise<any[]> {
  try {
    const userPreferences = await getUserPreferencesCollection();
    
    const preferences = await userPreferences.findOne({ userId });
    
    if (!preferences || !preferences.blacklistedClubs || preferences.blacklistedClubs.length === 0) {
      return [];
    }
    
    // Handle beide formaten (backward compatibility)
    let clubIds: number[] = [];
    let reasonsMap: Map<number, string> = new Map();
    
    if (preferences.blacklistedClubs.length > 0 && typeof preferences.blacklistedClubs[0] === 'number') {
      // Oud format
      clubIds = preferences.blacklistedClubs as number[];
    } else {
      // Nieuw format
      const typedBlacklist = preferences.blacklistedClubs as { clubId: number; reason: string }[];
      clubIds = typedBlacklist.map(item => item.clubId);
      
      // Bouw een map van clubId naar reason
      typedBlacklist.forEach(item => {
        reasonsMap.set(item.clubId, item.reason);
      });
    }
    
    // Haal club details op
    const blacklistedClubs = await clubCollection.find({
      id: { $in: clubIds }
    }).toArray();
    
    // Voeg de reden toe aan elk club object
    return blacklistedClubs.map(club => ({
      ...club,
      reason: reasonsMap.get(club.id) || ""
    }));
  } catch (error) {
    console.error('Error getting blacklisted clubs:', error);
    return [];
  }
}

// Add a club to favorites
export async function addClubToFavorites(userId: ObjectId, clubId: string): Promise<boolean> {
  try {
    const clubIdNum = parseInt(clubId);
    if (isNaN(clubIdNum)) {
      return false;
    }
    
    // Check if club exists
    const club = await clubCollection.findOne({ id: clubIdNum });
    if (!club) {
      return false;
    }
    
    const userPreferences = await getUserPreferencesCollection();
    
    // Check if the club is blacklisted
    const isBlacklisted = await isClubBlacklisted(userId, clubIdNum);
    
    if (isBlacklisted) {
      // Can't add to favorites if it's blacklisted
      return false;
    }
    
    // Add to favorites
    const result = await userPreferences.updateOne(
      { userId },
      { $addToSet: { favoriteClubs: clubIdNum } },
      { upsert: true }
    );
    
    return true;
  } catch (error) {
    console.error('Error adding club to favorites:', error);
    return false;
  }
}

// Remove a club from favorites
export async function removeClubFromFavorites(userId: ObjectId, clubId: string): Promise<boolean> {
  try {
    const clubIdNum = parseInt(clubId);
    if (isNaN(clubIdNum)) {
      return false;
    }
    
    const userPreferences = await getUserPreferencesCollection();
    
    const result = await userPreferences.updateOne(
      { userId },
      { $pull: { favoriteClubs: clubIdNum } }
    );
    
    return result.modifiedCount > 0;
  } catch (error) {
    console.error('Error removing club from favorites:', error);
    return false;
  }
}

// Get all favorite clubs for a user
export async function getFavoriteClubs(userId: ObjectId): Promise<any[]> {
  try {
    const userPreferences = await getUserPreferencesCollection();
    
    const preferences = await userPreferences.findOne({ userId });
    
    if (!preferences || !preferences.favoriteClubs || preferences.favoriteClubs.length === 0) {
      return [];
    }
    
    // Get full club details for all favorite club IDs
    const favoriteClubs = await clubCollection.find({
      id: { $in: preferences.favoriteClubs }
    }).toArray();
    
    return favoriteClubs;
  } catch (error) {
    console.error('Error getting favorite clubs:', error);
    return [];
  }
}

// Check if a club is blacklisted by a user
export async function isClubBlacklisted(userId: ObjectId, clubId: number): Promise<boolean> {
  try {
    const userPreferences = await getUserPreferencesCollection();
    
    const preferences = await userPreferences.findOne({ userId });
    
    if (!preferences || !preferences.blacklistedClubs || preferences.blacklistedClubs.length === 0) {
      return false;
    }
    
    // Check beide formaten
    if (typeof preferences.blacklistedClubs[0] === 'number') {
      return (preferences.blacklistedClubs as number[]).includes(clubId);
    } else {
      return (preferences.blacklistedClubs as { clubId: number; reason: string }[])
        .some(item => item.clubId === clubId);
    }
  } catch (error) {
    console.error('Error checking if club is blacklisted:', error);
    return false;
  }
}

// Check if a club is favorited by a user
export async function isClubFavorited(userId: ObjectId, clubId: number): Promise<boolean> {
  try {
    const userPreferences = await getUserPreferencesCollection();
    
    const preferences = await userPreferences.findOne({ userId });
    
    if (!preferences || !preferences.favoriteClubs) {
      return false;
    }
    
    return preferences.favoriteClubs.includes(clubId);
  } catch (error) {
    console.error('Error checking if club is favorited:', error);
    return false;
  }
}