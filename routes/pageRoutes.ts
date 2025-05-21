import express, { Request, Response, NextFunction } from "express";
import { ObjectId } from "mongodb";
import { isAuthenticated } from "../middleware/secureMiddleware";
import { connect, leagueCollection, clubCollection} from '../database';
import { title } from "process";
import { homedir } from "os";
import { render } from "ejs";
import { Club, League } from "../interface";

import { 
  addClubToBlacklist, 
  removeClubFromBlacklist, 
  getBlacklistedClubs,
  addClubToFavorites,
  removeClubFromFavorites,
  getFavoriteClubs
} from '../services/clubService';

export function pageRoutes() {
    const router = express.Router();

    router.get('/', async (req, res) => {
        res.render('landingspagina', { currentPage: 'project', user: req.session.user });
    });

    router.get("/home", isAuthenticated, async (req: Request, res: Response) => {
        try {
            const userIdString = req.session.user?._id;

            if (!userIdString) {
                res.status(401).send("User not authenticated");
                return;
            }

            const userId = new ObjectId(userIdString);

            res.render("fifahomepage", {
                currentPage: 'fifahomepage',
                title: 'home',
                user: req.session.user ?? null
            });
        } catch (error) {
            console.error('Error fetching home data:', error);
            res.status(500).send('Internal Server Error');
        }
    });

    router.get('/aboutus', (req, res) => {
        res.render('aboutus', { currentPage: 'aboutus', title: 'Over ons', user: req.session.user });
    });

    router.get('/clubs', async(req, res) => {
        try {
            const userIdString = req.session.user?._id;
            const userId = userIdString ? new ObjectId(userIdString) : null;
            
            const [clubs, leagues] = await Promise.all([
                clubCollection.find<Club>({}).limit(60).toArray(),
                leagueCollection
                    .find<League>({}, { projection: { _id: 0, id: 1, name: 1 } })
                    .toArray()
            ]);

            // Create league map
            const leagueMap = new Map(leagues.map(l => [l.id, l.name]));

            // Get user-specific data if user is logged in
            let clubsToDisplay = [...clubs];
            let favoriteClubIds = new Set<number>();
            let blacklistedClubIds = new Set<number>();
            
            if (userId) {
                // Get blacklisted clubs to filter them out
                const blacklistedClubs = await getBlacklistedClubs(userId);
                blacklistedClubIds = new Set(blacklistedClubs.map(c => c.id));
                
                // Get favorite clubs to mark them
                const favoriteClubs = await getFavoriteClubs(userId);
                favoriteClubIds = new Set(favoriteClubs.map(c => c.id));
                
                // Filter out blacklisted clubs
                clubsToDisplay = clubs.filter(club => !blacklistedClubIds.has(club.id));
            }

            // Add league names and user preferences to clubs
            const clubsWithUserData = clubsToDisplay.map(c => ({
                ...c,
                leagueName: leagueMap.get(c.league) || null,
                isFavorite: favoriteClubIds.has(c.id),
                isBlacklisted: false // These clubs are not blacklisted (we filtered them out)
            }));

            res.render('clubs', {
                title: 'Clubs',
                currentPage: 'clubs',
                clubs: clubsWithUserData,
                user: req.session.user
            });
        } catch (err) {
            console.error('❌ Error fetching clubs:', err);
            res.status(500).send('Internal Server Error');
        }
    });

    router.get('/competities', async (req, res) => {
        try {
            const leagues = await leagueCollection
                .find({}, { projection: { _id: 0, name: 1, id: 1 } })
                .toArray();

            res.render("competities", {
                currentPage: "competities",
                title: "Competities",
                user: req.session.user,
                leagues,                      
            });
        } catch (err) {
            console.error('❌ Error fetching leagues:', err);
            res.status(500).send('Internal Server Error');
        }
    });

    router.get('/teams', (req, res) => {
        res.render('teams', { currentPage: 'teams', title: 'Teams', user: req.session.user });
    });

    router.get('/blacklist', (req, res) => {
        res.render('tussenpaginablacklist', { currentPage: 'tussenpaginablacklist', title: 'Blacklist tussenpagina', user: req.session.user });
    });

    router.get('/favoriet', (req, res) => {
    res.render('tussenpaginafavoriet', { 
        currentPage: 'tussenpaginafavoriet', 
        title: 'Favoriet tussenpagina', 
        user: req.session.user 
    });
});

    router.get('/blacklist-clubs', isAuthenticated, async (req, res) => {
        try {
            const userIdString = req.session.user?._id;

            if (!userIdString) {
                throw new Error('User not authenticated');
            }

            const userId = new ObjectId(userIdString);
            const blacklistedClubs = await getBlacklistedClubs(userId);

        
            const leagues = await leagueCollection
                .find<League>({}, { projection: { _id: 0, id: 1, name: 1 } })
                .toArray();
            
            const leagueMap = new Map(leagues.map(l => [l.id, l.name]));
            
            const clubsWithLeague = blacklistedClubs.map(c => ({
                ...c,
                leagueName: leagueMap.get(c.league) || null,
                isBlacklisted: true
            }));

            res.render('blacklist-clubs', { 
                currentPage: 'blacklist-clubs', 
                title: 'Blacklist Clubs', 
                user: req.session.user,
                clubs: clubsWithLeague
            });
        } catch (error) {
            console.error('Failed to fetch blacklisted clubs:', error);
            res.status(500).send('Error fetching blacklisted clubs');
        }
    });

    router.get('/favoriet-clubs', isAuthenticated, async (req, res) => {
        try {
            const userIdString = req.session.user?._id;

            if (!userIdString) {
                throw new Error('User not authenticated');
            }

            const userId = new ObjectId(userIdString);
            const favoriteClubs = await getFavoriteClubs(userId);

            // Get league names for each favorite club
            const leagues = await leagueCollection
                .find<League>({}, { projection: { _id: 0, id: 1, name: 1 } })
                .toArray();
            
            const leagueMap = new Map(leagues.map(l => [l.id, l.name]));
            
            const clubsWithLeague = favoriteClubs.map(c => ({
                ...c,
                leagueName: leagueMap.get(c.league) || null,
                isFavorite: true
            }));

            res.render('favoriet-clubs', { 
                currentPage: 'favoriet-clubs', 
                title: 'Favoriete Clubs', 
                user: req.session.user,
                clubs: clubsWithLeague
            });
        } catch (error) {
            console.error('Failed to fetch favorite clubs:', error);
            res.status(500).send('Error fetching favorite clubs');
        }
    });

    // Blacklist routes
  router.post('/blacklist-club/:clubId', isAuthenticated, async (req, res) => {
  try {
    if (!req.session.user || !req.session.user._id) {
      throw new Error('User not authenticated');
    }

    const { clubId } = req.params;
    const { reason } = req.body;
    const userId = new ObjectId(req.session.user._id);

    // Log de reden of sla op in DB als je dat wilt
    console.log(`Reden voor blacklist: ${reason}`);

    const success = await addClubToBlacklist(userId, clubId);

    const referer = req.get('Referer') || '/clubs';
    res.redirect(referer);
  } catch (error) {
    console.error('Failed to add to blacklist:', error);
    res.status(500).send('Error adding to blacklist');
  }
});


    router.post('/unblacklist-club/:clubId', isAuthenticated, async (req, res) => {
        try {
            if (!req.session.user || !req.session.user._id) {
                throw new Error('User not authenticated');
            }
            const { clubId } = req.params;
            const userId = new ObjectId(req.session.user._id);

            const success = await removeClubFromBlacklist(userId, clubId);
            
            // Redirect based on the referrer URL
            const referer = req.get('Referer') || '/blacklist-clubs';
            res.redirect(referer);
        } catch (error) {
            console.error('Failed to remove from blacklist:', error);
            res.status(500).send('Error removing from blacklist');
        }
    });

    // Favorite routes
    router.post('/favorite-club/:clubId', isAuthenticated, async (req, res) => {
        try {
            if (!req.session.user || !req.session.user._id) {
                throw new Error('User not authenticated');
            }
            const { clubId } = req.params;
            const userId = new ObjectId(req.session.user._id);

            const success = await addClubToFavorites(userId, clubId);
            
            // Redirect based on the referrer URL
            const referer = req.get('Referer') || '/clubs';
            res.redirect(referer);
        } catch (error) {
            console.error('Failed to add to favorites:', error);
            res.status(500).send('Error adding to favorites');
        }
    });

    router.post('/unfavorite-club/:clubId', isAuthenticated, async (req, res) => {
        try {
            if (!req.session.user || !req.session.user._id) {
                throw new Error('User not authenticated');
            }
            const { clubId } = req.params;
            const userId = new ObjectId(req.session.user._id);

            const success = await removeClubFromFavorites(userId, clubId);
            
            // Redirect based on the referrer URL
            const referer = req.get('Referer') || '/favoriet-clubs';
            res.redirect(referer);
        } catch (error) {
            console.error('Failed to remove from favorites:', error);
            res.status(500).send('Error removing from favorites');
        }
    });

    return router;
}