// services/clubService.ts

import { ObjectId } from "mongodb";
import { connect, client, clubCollection } from '../database';

// Define UserPreferences interface
interface UserPreferences {
  userId: ObjectId;
  favoriteClubs: number[]; // Store club IDs instead of full club objects
  blacklistedClubs: number[];
}

// Get or create userPreferences collection
const getUserPreferencesCollection = async () => {
  const db = client.db('VAR-United-db');
  return db.collection<UserPreferences>('userPreferences');
};

// Add a club to blacklist
export async function addClubToBlacklist(userId: ObjectId, clubId: string): Promise<boolean> {
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
    
    // Add to blacklist and remove from favorites if present
    const result = await userPreferences.updateOne(
      { userId },
      { 
        $addToSet: { blacklistedClubs: clubIdNum },
        $pull: { favoriteClubs: clubIdNum }
      },
      { upsert: true }
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
    
    const result = await userPreferences.updateOne(
      { userId },
      { $pull: { blacklistedClubs: clubIdNum } }
    );
    
    return result.modifiedCount > 0;
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
    
    // Get full club details for all blacklisted club IDs
    const blacklistedClubs = await clubCollection.find({
      id: { $in: preferences.blacklistedClubs }
    }).toArray();
    
    return blacklistedClubs;
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
    const preferences = await userPreferences.findOne({
      userId,
      blacklistedClubs: clubIdNum
    });
    
    if (preferences) {
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
    
    const preferences = await userPreferences.findOne({
      userId,
      blacklistedClubs: clubId
    });
    
    return !!preferences;
  } catch (error) {
    console.error('Error checking if club is blacklisted:', error);
    return false;
  }
}

// Check if a club is favorited by a user
export async function isClubFavorited(userId: ObjectId, clubId: number): Promise<boolean> {
  try {
    const userPreferences = await getUserPreferencesCollection();
    
    const preferences = await userPreferences.findOne({
      userId,
      favoriteClubs: clubId
    });
    
    return !!preferences;
  } catch (error) {
    console.error('Error checking if club is favorited:', error);
    return false;
  }
}