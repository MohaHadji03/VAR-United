import express from "express";
import { UserModel } from "../interface";
import { login, register } from "../database";
import { isAuthenticated } from "../middleware/secureMiddleware";
import { title } from "process";

export function loginRouter() {
    const router = express.Router();
    router.get("/login", async (req, res) => {
        if(req.session.loggedIn) {
            res.redirect("/home");
        } else {
            res.render('login', { currentPage: 'login',title: 'login',  user: req.session.user });
        }
    });

    router.post("/login", async (req, res) => {
        const username: string = req.body.username;
        const password: string = req.body.password;
        try {
            let user: UserModel = await login(username, password);
            //delete user.password;
            req.session.user = user;
            req.session.loggedIn = true;
    
            req.session.message = { type: "success", message: "Login successful" };
            res.redirect("/home")
        } catch (e: any) {
            req.session.message = { type: "error", message: e.message };
            res.redirect("/login");
        }
    });
    

    router.post("/logout", isAuthenticated, async (req, res) => {
        req.session.destroy((err) => {
            res.redirect("/");
        });
    });

    router.get("/register", async (req, res) => {
        res.render('register', { currentPage: 'register',title: 'register',  user: req.session.user });

    });

    router.post("/register", async (req, res) => {
        const username: string = req.body.username;
        const email: string = req.body.email;
        const password: string = req.body.password;
        try {
            await register(username, email, password);

            req.session.message = {type: "success", message: "Registration successful"};
            res.redirect("/login");
        } catch (e: any) {
            req.session.message = {type: "error", message: e.message};
            res.redirect("/register");
        }
    });

    return router;

}