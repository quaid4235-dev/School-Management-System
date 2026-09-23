# School Management Backend (Node.js + Express + MySQL)

This is the foundation of your school system: authentication with roles,
the database schema, and the full application (admissions) workflow —
public submission with file uploads, admin review, bulk actions, CSV
export, and converting an approved application into a student record.

## What's included in this stage

- **Auth**: login/logout with JWT, three roles (`admin`, `teacher`, `frontdesk`)
- **Database schema** (`schema.sql`): users, applications, students, fee_vouchers,
  marks, notices, site_content, faculty, admission_cycles, posts
- **Applications**: public submit (with file uploads under 1MB each — photo + document),
  admin/frontdesk review, approve/reject/waitlist, bulk status update, CSV export,
  convert-to-student
- **Notifications**: email (SendGrid) + SMS (Twilio) hooks — safe no-ops until you add API keys
- **File uploads**: capped strictly under 1MB per file, JPG/PNG/WEBP/PDF only

## What's NOT built yet (next stages)

Student records CRUD beyond conversion, marks entry (teacher portal), fee vouchers,
payment integration, notices/news API, site content editor API, faculty/admission-cycle
management API, blog/events — these follow the same pattern as `applications.js` and
will be added next.

## Setup

### 1. Install MySQL and create a database
```bash
mysql -u root -p
CREATE DATABASE college_site;
exit
```

### 2. Load the schema
```bash
mysql -u root -p college_site < schema.sql
```

### 3. Configure environment
```bash
cp .env.example .env
```
Edit `.env` with your real database credentials and a long random `JWT_SECRET`.
Leave the email/SMS/payment keys blank for now if you don't have them yet —
the app runs fine without them (it just logs what it *would* have sent).

### 4. Install dependencies
```bash
npm install
```

### 5. Create your first admin account
```bash
npm run create-admin
```
This prompts for a username and password and stores a properly hashed
password — never edit `schema.sql` to insert a password by hand.

### 6. Run the server
```bash
npm start
```
The API runs at `http://localhost:4000`. Test it:
```bash
curl http://localhost:4000/api/health
```

## Connecting the front-end site

Your existing static site (`college-site.zip` from earlier) needs a few small
changes to talk to this backend instead of `localStorage`:
- The Apply Online form should `fetch('http://localhost:4000/api/applications', { method: 'POST', body: formData })`
  using `FormData` (so file uploads work) instead of `SiteData.addApplication(...)`
- The admin dashboard should call `/api/auth/login`, `/api/applications`, etc.
  instead of the `SiteData` localStorage functions

I can wire this up for you as the next step once you confirm the backend
setup works on your end (or if you'd rather I just do it now, say so).

## Key files

```
college-backend/
├── server.js              — app entry point
├── schema.sql             — run once to set up your database
├── .env.example           — copy to .env and fill in
├── config/db.js           — MySQL connection pool
├── middleware/auth.js     — JWT verification + role checks
├── middleware/upload.js   — file upload handling (<1MB limit)
├── routes/auth.js         — login/logout/me
├── routes/applications.js — the full admissions workflow
├── services/notify.js     — email/SMS sending (needs your API keys)
└── scripts/create-admin.js — safely create the first admin login
```

## Security notes before going live

- Change `JWT_SECRET` to a long random value — never use the example one
- Put this behind HTTPS (SSL) once hosted — never run auth over plain HTTP
- Keep `.env` out of version control (already covered by `.gitignore`)
- MySQL user for this app should have limited privileges (not root) in production
