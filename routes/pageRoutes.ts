import express, { Request, Response, NextFunction } from "express";
import { ObjectId } from "mongodb";
import { isAuthenticated } from "../middleware/secureMiddleware";
import { connect} from '../database';


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
    
            res.render("homepage", {
                currentPage: 'home',
                user: req.session.user ?? null
            });
        } catch (error) {
            console.error('Error fetching home data:', error);
            res.status(500).send('Internal Server Error');
        }
    });
    return router;
}