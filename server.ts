import express from 'express';
import path from 'path';
import { connect } from './database';

// Create express app
const app = express();

// Set up EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Basic test routes
app.get('/', (req, res) => {
    res.render('landingspagina', { title: 'Landingspagina' });
});

app.get('/home', (req, res) => {
    res.render('fifahomepage', { title: 'Homepage' });
});

app.get('/login', (req, res) => {
    res.render('login', { title: 'login' });
});

app.get('/register', (req, res) => {
    res.render('register', { title: 'register' });
});

//quiz routes

app.get('/quizpagina', (req, res)=> {
    res.render('quizpagina', {title: 'Quiz'});
});

app.get('/playersquiz',(req, res)=> {
    res.render('player-quiz', {title: 'Speler Quiz'})
})

// New API call route (with fetch)
app.get('/clubs', async (req, res) => {
    
});

// Start server
app.set('port', 3000);
app.listen(app.get('port'), async () => {
    await connect();
    console.log('[server] http://localhost:' + app.get('port'));
});
