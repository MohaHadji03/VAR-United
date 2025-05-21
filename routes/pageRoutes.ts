import express, { Request, Response, NextFunction } from "express";
import { ObjectId } from "mongodb";
import { isAuthenticated } from "../middleware/secureMiddleware";
import { connect, leagueCollection, clubCollection } from '../database';
import { title } from "process";
import { homedir } from "os";
import { render } from "ejs";
import { Club, League } from "../interface";


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

    router.get('/clubs', async (req, res) => {
        try {
            const [clubs, leagues] = await Promise.all([
                clubCollection.find<Club>({}).limit(50).toArray(),
                leagueCollection
                    .find<League>({}, { projection: { _id: 0, id: 1, name: 1 } })
                    .toArray()
            ]);

            // maak een map: leagueId → leagueName
            const leagueMap = new Map(leagues.map(l => [l.id, l.name]));

            // voeg leagueName‑veld toe aan elke club
            const clubsWithLeague = clubs.map(c => ({
                ...c,
                leagueName: leagueMap.get(c.league) || null
            }));

            res.render('clubs', {
                title: 'Clubs',
                currentPage: 'clubs',
                clubs: clubsWithLeague,
                user: req.session.user
            });
        } catch (err) {
            console.error('❌ Error fetching players:', err);;
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
            console.error('❌ Error fetching players:', err);;
        }
    });

    router.get('/teams', (req, res) => {
        res.render('teams', { currentPage: 'teams', title: 'Teams', user: req.session.user });
    });

    router.get('/blacklist', (req, res) => {
        res.render('tussenpaginablacklist', { currentPage: 'tussenpaginablacklist', title: 'Blacklist tussenpagina', user: req.session.user });
    });

    router.get('/blacklist-clubs', (req, res) => {
        res.render('blacklist-clubs', { currentPage: 'blacklist-clubs', title: 'Blacklist Clubs', user: req.session.user });
    });

    router.get('/404', (req, res) => {
        res.render('404', { currentPage: '404', title: '404', user: req.session.user })
    })

    router.get('/blacklist-competities', (req, res) => {
        res.render('blacklist-competities', { currentPage: 'blacklist-competities', title: 'Blacklist Competities', user: req.session.user });
    });

    router.get('/favoriet', (req, res) => {
        res.render('tussenpaginafavoriet', { currentPage: 'tussenpaginafavoriet', title: 'Favoriet tussenpagina', user: req.session.user });
    });

    router.get('/favoriet-clubs', (req, res) => {
        res.render('favoriet-clubs', { currentPage: 'favoriet-clubs', title: 'Favoriete Clubs', user: req.session.user });
    });

    router.get('/favoriet-competities', (req, res) => {
        res.render('favoriet-competities', { currentPage: 'favoriet-competities', title: 'Favoriete Competities', user: req.session.user });
    });

    router.get('/quizpagina', (req, res) => {
        res.render('quizpagina', { currentPage: 'quizpagina', title: 'Quiz', user: req.session.user });
    });

    router.get('/playerquiz', (req, res) => {
        res.render('player-quiz', { currentPage: 'player-quiz', title: 'Speler Quiz', user: req.session.user });
    });

    router.get('/clubquiz', async (req, res) => {
        const clubs = await clubCollection.find().toArray();

        res.render('clubs-quiz', {
            currentPage: 'club-quiz',
            title: 'Club Quiz',
            user: req.session.user,
            clubs
        });
    });

    router.get('/competitiesquiz', (req, res) => {
        res.render('competities-quiz', { currentPage: 'competities-quiz', title: 'Speler Quiz', user: req.session.user });
    });

    return router;
}