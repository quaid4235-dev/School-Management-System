# Production deployment overview

This project is split into two deployable services:

1. `college-site/` → deploy on Vercel as a static website
2. `college-backend/` → deploy on Render or Railway as a Node.js API

## Frontend deployment on Vercel

- Import the repository in Vercel
- Set the root directory to `college-site`
- Use the project as a static site
- Set the frontend API URL in `college-site/js/api.js` to your live backend domain

Example:

```javascript
const API_BASE = 'https://your-render-app.onrender.com/api';
```

## Backend deployment on Render

- Create a Render web service
- Set root directory to `college-backend`
- Use build command: `npm ci`
- Use start command: `npm start`
- Set health check path: `/api/health`
- Add all database and secret variables in Render environment settings

## Required environment variables for production

Set these in Render:

```text
NODE_ENV=production
JWT_SECRET=long-random-secret
DB_HOST=your-mysql-host
DB_PORT=3306
DB_USER=your-mysql-user
DB_PASSWORD=your-mysql-password
DB_NAME=college_site
FRONTEND_URL=https://your-vercel-domain.vercel.app
```

Optional email/SMS values can be left empty until you set real credentials.

## Database setup

Run the schema once against your external MySQL database:

```bash
mysql -h your-db-host -P 3306 -u your-db-user -p your-db-name < college-backend/schema.sql
```

Then create the admin user:

```bash
cd college-backend
npm install
npm run create-admin
```

## Production notes

- Use HTTPS everywhere.
- Do not use `localhost` in production.
- Use a hosted MySQL service, not a local machine.
- For serious production use, store uploaded files in Object Storage (S3, Cloudinary, or R2) instead of the server local folder.
