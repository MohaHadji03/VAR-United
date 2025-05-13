import express from 'express';
import path from 'path';
import { connect } from './database';
import { sessionMiddleware } from './session';
import { flashMiddleware } from './middleware/flashMiddleware';
import { loginRouter } from './routes/loginRoutes';
import { pageRoutes } from  './routes/pageRoutes';


// Create express app

const app = express();

app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.set('port', 3000);
app.use(sessionMiddleware);
app.use(flashMiddleware);


app.use(loginRouter());
app.use(pageRoutes());



app.listen(app.get('port'), async () => {
    await connect();
    console.log('[server] http://localhost:' + app.get('port'));
});
