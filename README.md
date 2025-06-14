# VAR United

[🌐 Live demo](https://var-united.onrender.com/)

## Overzicht

**VAR United** is een webplatform voor voetbalfans waar je clubs en competities kunt ontdekken, quizzen kunt spelen, en je eigen favorieten en blacklists kunt beheren. Het platform combineert gamification met voetbaldata voor een interactieve ervaring.

## Functionaliteiten

- **Quizzen:** Speel quizzen over clubs, competities en spelers.
- **Favorieten:** Voeg clubs en competities toe aan je favorieten.
- **Blacklist:** Plaats clubs of competities op je blacklist met een reden.
- **Paginatie:** Blader eenvoudig door grote lijsten van clubs en competities.
- **Authenticatie:** Registreer en log in om persoonlijke functies te gebruiken.
- **Responsief ontwerp:** Geschikt voor desktop en mobiel.

## Technologieën

- **Frontend:** EJS, HTML, CSS, JavaScript
- **Backend:** Node.js, Express
- **Database:** MongoDB
- **Overig:** dotenv, express-session, bcrypt, connect-mongodb-session

## Installatie en lokaal uitvoeren

### Vereisten

- [Node.js](https://nodejs.org/) (v18 of hoger aanbevolen)
- [MongoDB](https://www.mongodb.com/) (lokaal of in de cloud)
- Een [FUTDB API token](https://futdatabase.com/)

## Installatie

1. **Clone de repository:**
   ```bash
   git clone https://github.com/jouw-gebruikersnaam/VAR-United.git
   cd VAR-United
   ```

2. **Installeer afhankelijkheden:**
   ```bash
   npm install
   ```

3. **Maak een `.env` bestand aan in de root van het project:**
   ```env
   MONGO_URI=mongodb://localhost:27017/VAR-United-db
   SESSION_SECRET=een_geheime_waarde
   FUTDB_API_TOKEN=je_futdb_api_token
   ```

4. **Start de applicatie:**
   ```bash
   npm start
   ```

5. **Open in je browser:**
   ```
   http://localhost:3000
   ```