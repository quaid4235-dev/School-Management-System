# Running the Full System

You have two projects now:
- `college-backend/` — the Node.js + Express + MySQL API (auth, applications, students, marks, fees, content, notices, faculty, admission cycles, posts)
- `college-site/` — the public website + admin dashboard (HTML/CSS/JS), now wired to call the backend API instead of browser storage

## 1. Start the backend locally

```bash
cd college-backend
cp .env.example .env
# edit .env with your local MySQL credentials
mysql -u your_user -p your_database < schema.sql
npm install
npm run create-admin
npm start
```

The backend runs at `http://localhost:4000`.

## 2. Open the frontend locally

```bash
cd college-site
npx serve .
```

Then open the URL it gives you, usually `http://localhost:3000`.

## 3. Production deployment structure

This repository is designed for deployment as two separate services:

- `college-site/` → deploy on Vercel
- `college-backend/` → deploy on Render or Railway

Do not deploy the full repository as a single Vercel app unless you also split the backend into a separate service.

## 4. Frontend Vercel settings

- Import the repo in Vercel
- Set the root directory to `college-site`
- Use a static site deployment
- Set the backend URL in `college-site/js/api.js` to your live Render/Railway URL

Example:

```javascript
const API_BASE = 'https://your-render-app.onrender.com/api';
```

## 5. Backend Render settings

- Create a Render web service
- Set root directory to `college-backend`
- Build command: `npm ci`
- Start command: `npm start`
- Health check path: `/api/health`
- Add env vars for database, JWT secret, and Vercel frontend URL

## 6. Required production env variables

In Render (or Railway), set:

```text
NODE_ENV=production
JWT_SECRET=long-random-secret
DB_HOST=your-production-db-host
DB_PORT=3306
DB_USER=your-mysql-user
DB_PASSWORD=your-mysql-password
DB_NAME=college_site
FRONTEND_URL=https://your-vercel-app.vercel.app
```

Optional email/SMS values:

```text
SENDGRID_API_KEY=
FROM_EMAIL=admissions@yourcollege.edu
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=
```

## 7. Create the admin account

Once the production database is connected, run:

```bash
cd college-backend
npm run create-admin
```

Then enter the admin username/password at the prompt.

## 8. Production notes

- Use HTTPS everywhere.
- Do not use `localhost` in production.
- Use a real MySQL database provider.
- For production file uploads, move uploaded files from the local folder to cloud storage.
- Payments remain a stub until you add a real gateway integration.
