# Running the Full System

You have two projects now:
- `college-backend/` — the Node.js + Express + MySQL API (auth, applications, students, marks, fees, content, notices, faculty, admission cycles, posts)
- `college-site/` — the public website + admin dashboard (HTML/CSS/JS), now wired to call the backend's API instead of browser storage

## 1. Start the backend first

```bash
cd college-backend
cp .env.example .env    # then edit .env with your MySQL credentials
mysql -u your_user -p your_database < schema.sql
npm install
npm run create-admin    # set your real admin username/password
npm start                # runs at http://localhost:4000
```

## 2. Open the front-end site

The site expects the backend at `http://localhost:4000/api` by default
(set in `college-site/js/api.js`). Two ways to run the site:

**Simplest — open the files directly:**
Open `college-site/index.html` in your browser. As long as the backend
is running on port 4000, everything (applications, admin login, content
editing) will work.

**Or serve it properly** (recommended, avoids some browser file:// quirks):
```bash
cd college-site
npx serve .
```
Then visit the URL it gives you (usually `http://localhost:3000`).

## 3. Log in as admin

Go to `admin-login.html`, sign in with the username/password you set via
`npm run create-admin`, and you'll land in the dashboard where you can:
- Edit homepage content (hero text, mission, stats)
- Add/remove news items (shown on the homepage)
- Review, approve/reject/waitlist applications (individually or in bulk)
- Convert an approved application into a student record
- Export all applications as CSV

## 4. Deploying for real use

When you're ready to put this online for real:
1. Host the backend somewhere that supports Node.js + MySQL (a VPS, Railway, Render, or a Pakistani host that supports Node apps)
2. Update `API_BASE` in `college-site/js/api.js` to your live backend URL (e.g. `https://api.yourcollege.edu/api`)
3. Host the front-end files (`college-site/`) on any static host, or serve them directly from the backend's `public/` folder (copy the site files there — `server.js` already serves that folder)
4. Add your real SendGrid/Twilio/payment gateway keys to the backend's `.env`
5. Put everything behind HTTPS

## What's still a stub, on purpose

- **Payments**: `services/payment.js` has the structure but no real gateway wired in — you need to pick JazzCash/EasyPaisa/etc., get merchant credentials, and drop in their actual API calls
- **Email/SMS**: works once you add real SendGrid/Twilio keys to `.env` — until then it just logs to the console
- **Teacher portal UI**: the marks API (`/api/marks`) is fully built, but there's no dedicated front-end page for teachers yet — only the API. Say the word if you want that page built next.
- **Fee voucher / report card front-end pages**: same situation — APIs exist (`/api/fees`, student marks), but no dedicated admin UI pages yet for creating vouchers or viewing report cards. Currently only reachable via API calls directly.
