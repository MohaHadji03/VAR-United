import express, { Request, Response, NextFunction } from "express";

export function pageRoutes() {
    const router = express.Router();

    router.get('/', (req, res) => {
        res.render('')
    })
}