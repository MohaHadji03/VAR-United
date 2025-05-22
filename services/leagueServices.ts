import { ObjectId } from "mongodb";
import { connect, client, leagueCollection } from '../database';

// Define UserLeaguePreferences interface
interface UserLeaguePreferences {
  userId: ObjectId;
  favoriteLeagues: number[]; // Store league IDs 
  blacklistedLeagues: number[];
}

// Get or create userLeaguePreferences collection
const getUserLeaguePreferencesCollection = async () => {
  const db = client.db('VAR-United-db');
  return db.collection<UserLeaguePreferences>('userLeaguePreferences');
};

// Add a league to blacklist
export async function addLeagueToBlacklist(userId: ObjectId, leagueId: string): Promise<boolean> {
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
    
    // Add to blacklist and remove from favorites if present
    const result = await userLeaguePreferences.updateOne(
      { userId },
      { 
        $addToSet: { blacklistedLeagues: leagueIdNum },
        $pull: { favoriteLeagues: leagueIdNum }
      },
      { upsert: true }
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
    
    const result = await userLeaguePreferences.updateOne(
      { userId },
      { $pull: { blacklistedLeagues: leagueIdNum } }
    );
    
    return result.modifiedCount > 0;
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
    
    // Get full leagues details for all blacklisted league IDs
    const blacklistedLeagues = await leagueCollection.find({
      id: { $in: preferences.blacklistedLeagues }
    }).toArray();
    
    return blacklistedLeagues;
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
    
    // Check if the leagues is blacklisted
    const preferences = await userLeaguePreferences.findOne({
      userId,
      blacklistedLeagues: leagueIdNum
    });
    
    if (preferences) {
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
    
    const preferences = await userLeaguePreferences.findOne({
      userId,
      blacklistedLeagues: leagueId
    });
    
    return !!preferences;
  } catch (error) {
    console.error('Error checking if league is blacklisted:', error);
    return false;
  }
}

// isLeagueFavorited
export async function isLeagueFavorited(userId: ObjectId, leagueId: number): Promise<boolean> {
  try {
    const userLeaguePreferences = await getUserLeaguePreferencesCollection();
    
    const preferences = await userLeaguePreferences.findOne({
      userId,
      favoriteLeagues: leagueId
    });
    
    return !!preferences;
  } catch (error) {
    console.error('Error checking if league is favorited:', error);
    return false;
  }
}