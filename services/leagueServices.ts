import { ObjectId } from "mongodb";
import { connect, client, leagueCollection } from '../database';

// Define UserLeaguePreferences interface
interface UserLeaguePreferences {
  userId: ObjectId;
  favoriteLeagues: number[]; // Store league IDs 
  blacklistedLeagues: { leagueId: number; reason: string }[] | number[]; // Support both old and new format
}

// Get or create userLeaguePreferences collection
const getUserLeaguePreferencesCollection = async () => {
  const db = client.db('VAR-United-db');
  return db.collection<UserLeaguePreferences>('userLeaguePreferences');
};

// Add a league to blacklist
export async function addLeagueToBlacklist(userId: ObjectId, leagueId: string, reason: string = ""): Promise<boolean> {
  try {
    const leagueIdNum = parseInt(leagueId);
    if (isNaN(leagueIdNum)) {
      console.error('Invalid league ID:', leagueId);
      return false;
    }
    
    // Check if league exists
    const league = await leagueCollection.findOne({ id: leagueIdNum });
    if (!league) {
      console.error('League not found:', leagueIdNum);
      return false;
    }
    
    const userLeaguePreferences = await getUserLeaguePreferencesCollection();
    
    // Controleer het huidige format van blacklistedLeagues
    const userPref = await userLeaguePreferences.findOne({ userId });
    
    // Als we het oude format gebruiken of nog geen blacklist hebben
    if (!userPref || !userPref.blacklistedLeagues || 
        (userPref.blacklistedLeagues.length > 0 && typeof userPref.blacklistedLeagues[0] === 'number')) {
      
      // Converteer naar het nieuwe format of maak een nieuwe lijst
      const newBlacklist = userPref && userPref.blacklistedLeagues 
        ? (userPref.blacklistedLeagues as number[]).map((id: number) => ({ leagueId: id, reason: "" }))
        : [];
      
      // Update naar het nieuwe format
      await userLeaguePreferences.updateOne(
        { userId },
        { $set: { blacklistedLeagues: newBlacklist } },
        { upsert: true }
      );
    }
    
    // Verwijder league uit favorieten als die er in staat
    await userLeaguePreferences.updateOne(
      { userId },
      { $pull: { favoriteLeagues: leagueIdNum } }
    );
    
    // Verwijder eerst eventuele bestaande blacklist entry voor deze league
    await userLeaguePreferences.updateOne(
      { userId },
      { $pull: { blacklistedLeagues: { leagueId: leagueIdNum } } }
    );
    
    // Voeg toe aan blacklist met reden
    await userLeaguePreferences.updateOne(
      { userId },
      { $addToSet: { blacklistedLeagues: { leagueId: leagueIdNum, reason: reason } } }
    );
    
    return true;
  } catch (error) {
    console.error('Error adding league to blacklist:', error);
    return false;
  }
}

// removeLeagueFromBlacklist
export async function removeLeagueFromBlacklist(userId: ObjectId, leagueId: string): Promise<boolean> {
  try {
    const leagueIdNum = parseInt(leagueId);
    if (isNaN(leagueIdNum)) {
      return false;
    }
    
    const userLeaguePreferences = await getUserLeaguePreferencesCollection();
    const userPref = await userLeaguePreferences.findOne({ userId });
    
    if (!userPref || !userPref.blacklistedLeagues) {
      return false;
    }
    
    // Ondersteuning voor beide formaten
    if (userPref.blacklistedLeagues.length > 0 && typeof userPref.blacklistedLeagues[0] === 'number') {
      await userLeaguePreferences.updateOne(
        { userId },
        { $pull: { blacklistedLeagues: leagueIdNum } }
      );
    } else {
      await userLeaguePreferences.updateOne(
        { userId },
        { $pull: { blacklistedLeagues: { leagueId: leagueIdNum } } }
      );
    }
    
    return true;
  } catch (error) {
    console.error('Error removing leagues from blacklist:', error);
    return false;
  }
}

// getBlacklistedLeagues
export async function getBlacklistedLeagues(userId: ObjectId): Promise<any[]> {
  try {
    const userLeaguePreferences = await getUserLeaguePreferencesCollection();
    
    const preferences = await userLeaguePreferences.findOne({ userId });
    
    if (!preferences || !preferences.blacklistedLeagues || preferences.blacklistedLeagues.length === 0) {
      return [];
    }
    
    // Handle beide formaten (backward compatibility)
    let leagueIds: number[] = [];
    let reasonsMap: Map<number, string> = new Map();
    
    if (preferences.blacklistedLeagues.length > 0 && typeof preferences.blacklistedLeagues[0] === 'number') {
      // Oud format
      leagueIds = preferences.blacklistedLeagues as number[];
    } else {
      // Nieuw format
      const typedBlacklist = preferences.blacklistedLeagues as { leagueId: number; reason: string }[];
      leagueIds = typedBlacklist.map(item => item.leagueId);
      
      // Bouw een map van leagueId naar reason
      typedBlacklist.forEach(item => {
        reasonsMap.set(item.leagueId, item.reason);
      });
    }
    
    // Haal league details op
    const blacklistedLeagues = await leagueCollection.find({
      id: { $in: leagueIds }
    }).toArray();
    
    // Voeg de reden toe aan elk league object
    return blacklistedLeagues.map(league => ({
      ...league,
      reason: reasonsMap.get(league.id) || ""
    }));
  } catch (error) {
    console.error('Error getting blacklisted leagues:', error);
    return [];
  }
}

// addLeagueToFavorites
export async function addLeagueToFavorites(userId: ObjectId, leagueId: string): Promise<boolean> {
  try {
    const leagueIdNum = parseInt(leagueId);
    if (isNaN(leagueIdNum)) {
      return false;
    }
    
    // Check if leagues exists
    const league = await leagueCollection.findOne({ id: leagueIdNum });
    if (!league) {
      return false;
    }
    
    const userLeaguePreferences = await getUserLeaguePreferencesCollection();
    
    // Check if the league is blacklisted
    const isBlacklisted = await isLeagueBlacklisted(userId, leagueIdNum);
    
    if (isBlacklisted) {
      // Can't add to favorites if it's blacklisted
      return false;
    }
    
    // Add to favorites
    const result = await userLeaguePreferences.updateOne(
      { userId },
      { $addToSet: { favoriteLeagues: leagueIdNum } },
      { upsert: true }
    );
    
    return true;
  } catch (error) {
    console.error('Error adding league to favorites:', error);
    return false;
  }
}

// removeLeagueFromFavorites
export async function removeLeagueFromFavorites(userId: ObjectId, leagueId: string): Promise<boolean> {
  try {
    const leagueIdNum = parseInt(leagueId);
    if (isNaN(leagueIdNum)) {
      return false;
    }
    
    const userLeaguePreferences = await getUserLeaguePreferencesCollection();
    
    const result = await userLeaguePreferences.updateOne(
      { userId },
      { $pull: { favoriteLeagues: leagueIdNum } }
    );
    
    return result.modifiedCount > 0;
  } catch (error) {
    console.error('Error removing leagues from favorites:', error);
    return false;
  }
}

// getFavoriteLeagues
export async function getFavoriteLeagues(userId: ObjectId): Promise<any[]> {
  try {
    const userLeaguePreferences = await getUserLeaguePreferencesCollection();
    
    const preferences = await userLeaguePreferences.findOne({ userId });
    
    if (!preferences || !preferences.favoriteLeagues || preferences.favoriteLeagues.length === 0) {
      return [];
    }
    
    // Get full league details for all favorite league IDs
    const favoriteLeagues = await leagueCollection.find({
      id: { $in: preferences.favoriteLeagues }
    }).toArray();
    
    return favoriteLeagues;
  } catch (error) {
    console.error('Error getting favorite leagues:', error);
    return [];
  }
}

// isLeagueBlacklisted
export async function isLeagueBlacklisted(userId: ObjectId, leagueId: number): Promise<boolean> {
  try {
    const userLeaguePreferences = await getUserLeaguePreferencesCollection();
    
    const preferences = await userLeaguePreferences.findOne({ userId });
    
    if (!preferences || !preferences.blacklistedLeagues || preferences.blacklistedLeagues.length === 0) {
      return false;
    }
    
    // Check beide formaten
    if (typeof preferences.blacklistedLeagues[0] === 'number') {
      return (preferences.blacklistedLeagues as number[]).includes(leagueId);
    } else {
      return (preferences.blacklistedLeagues as { leagueId: number; reason: string }[])
        .some(item => item.leagueId === leagueId);
    }
  } catch (error) {
    console.error('Error checking if league is blacklisted:', error);
    return false;
  }
}

// isLeagueFavorited
export async function isLeagueFavorited(userId: ObjectId, leagueId: number): Promise<boolean> {
  try {
    const userLeaguePreferences = await getUserLeaguePreferencesCollection();
    
    const preferences = await userLeaguePreferences.findOne({ userId });
    
    if (!preferences || !preferences.favoriteLeagues) {
      return false;
    }
    
    return preferences.favoriteLeagues.includes(leagueId);
  } catch (error) {
    console.error('Error checking if league is favorited:', error);
    return false;
  }
}