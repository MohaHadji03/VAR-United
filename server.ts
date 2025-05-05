import express from 'express';
import path from 'path';
import { title } from 'process';

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
    try {
        const response = await fetch('https://api.futdatabase.com/api/clubs?page=1', {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'X-AUTH-TOKEN': '935cf4ae-9fa8-f4b1-7a80-357dc7c947ea',
            },
        });

        if (!response.ok) {
            throw new Error(`API call failed with status ${response.status}`);
        }

        const clubs = await response.json();

        // Option 1: Return JSON directly
        res.json(clubs);

        // Option 2: To render a view
        // res.render('clubs', { title: 'Clubs', clubs: clubs });

    } catch (error) {
        console.error('Error fetching clubs:', error);
        res.status(500).send('Error fetching clubs');
    }
});

// Start server
app.set('port', 3000);
app.listen(app.get('port'), () => {
    console.log('[server] http://localhost:' + app.get('port'));
});
