import express from 'express';
import path from 'path';

// Create express app
const app = express();

// Set up EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Basic test route
app.get('/', (req, res) => {
    res.render('landingspagina', { title: 'Landingspagina' }); // Make sure views/index.ejs exists
});

app.get('/home', (req, res) => {
    res.render('fifahomepage', { title: 'Homepage'})
})

// Start server
app.set('port', 3000);
app.listen(app.get('port'), () => {
    console.log('[server] http://localhost:' + app.get('port'));
});
