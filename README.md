# DailyShop Backend (Render-Ready)

## Quick Start

1. **Install dependencies:**

   ```sh
   npm install
   ```

2. **Set up your environment variables:**

   - Copy `.env.example` to `.env` and fill in your MongoDB Atlas URI.

### Using MongoDB Atlas

To use MongoDB Atlas instead of a local MongoDB instance:

- Create an Atlas cluster and a database user.
- Copy the Atlas connection string ("Connect your application") and set it as `MONGO_URI` in your `.env`.
- Example (replace placeholders):

   mongodb+srv://<username>:<password>@cluster0.abcd.mongodb.net/dailyshop?retryWrites=true&w=majority

Make sure your Atlas Network Access allows connections from your IP (or add 0.0.0.0/0 temporarily while testing).

3. **Run locally:**

   ```sh
   npm start
   ```

4. **Test your backend:**

   Visit your running server's /api/test endpoint (for example, http://localhost:10000/api/test when running locally) to check if the backend and MongoDB Atlas are connected.

## Deploy to Render

1. **Push this folder to GitHub.**
2. **Create a new Web Service on [Render](https://render.com):**
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Add environment variables:
     - `MONGO_URI` = your MongoDB Atlas connection string
     - `PORT` = 10000
     - `NODE_ENV` = production
3. **Deploy!**

## MongoDB Atlas Data Migration

1. **Export your local MongoDB data using Compass:**
   - Export each collection as JSON.
2. **Connect Compass to your Atlas cluster and import the JSON files.**

### Recommended (CLI) - Full database copy using mongodump/mongorestore

Prerequisites:
- Install MongoDB Database Tools: https://www.mongodb.com/docs/database-tools/installation/

Steps (PowerShell):

```powershell
# Run from project root or where mongodump is available
.
# 1) Dump local DB (default example uses `dailyshop`)
mongodump --db dailyshop --out ./dump_dailyshop

# 2) Restore to Atlas (use your Atlas URI with URL-encoded password)
mongorestore --uri "mongodb+srv://USERNAME:URL_ENCODED_PASSWORD@cluster0.mongodb.net" --nsInclude dailyshop.* ./dump_dailyshop/dailyshop --drop
```

Notes:
- `--drop` removes existing collections in the target before restore. Remove if you want to merge.
- Ensure your Atlas Network Access allows your IP (or 0.0.0.0/0 temporarily).

### GUI (MongoDB Compass) - per-collection export/import

1. If you still have a local MongoDB copy you want to migrate, export collections from your local instance using Compass or mongodump, then import into Atlas. Prefer using the CLI tools (`mongodump` / `mongorestore`) for full-database copies; the GUI per-collection export/import is fine for small datasets.

2. Connect Compass to your Atlas cluster (use the connection string from Atlas, URL-encode the password) and import the JSON files or use `mongorestore` to push the dump to Atlas.

### After migration

1. Update your deployed application's environment variable `MONGO_URI` to the Atlas connection string (do NOT commit it in code).
2. Restart your app and visit `/api/test` — you should see `{"message":"Backend working fine!","dbStatus":"connected"}`.

### Run the provided PowerShell helper

From the project root you can run the interactive migration helper (requires MongoDB tools installed):

```powershell
cd .\scripts
.\migrate-to-atlas.ps1
```

This script defaults to `dailyshop` if you press Enter at the DB name prompt.


## Health Check

- After deployment, visit `/api/test` on your Render URL to verify everything is working.

## Environment variables (required)

This project requires a couple of environment variables for production deployments (Render, Heroku, etc.). Locally you can create a `.env` file in the project root with these values.

- `MONGO_URI` (recommended): MongoDB connection string (Atlas or other). Example:

   `mongodb+srv://<username>:<password>@cluster0.abcd.mongodb.net/dailyshop?retryWrites=true&w=majority`

- `SESSION_SECRET` (recommended): A strong secret string used to sign session cookies.

On Render: open your service settings → Environment → Environment Variables and add both `MONGO_URI` and `SESSION_SECRET`. The app will attempt to connect to the DB on startup and will use a persistent session store if the DB is reachable. If `MONGO_URI` is not provided the app will log a warning and run with the in-memory session store (not suitable for production).

## Switching to MongoDB Atlas and removing local data

If you've been running a local MongoDB and want to switch the app to use Atlas and remove the old local data, follow these steps.

1. Add your Atlas connection string to `MONGO_URI` (either in `.env` locally or as an environment variable on Render).
2. Verify the app connects to Atlas by running locally (or checking Render logs). You should see a message like `Connected to MongoDB Atlas`.
3. Once you're confident data is on Atlas, you can remove the local `dailyshop` database.

Locally (interactive):

```powershell
# From project root — this will ask you to confirm before dropping the DB
npm run drop-local-db
```

Locally (no prompt):

```powershell
npm run drop-local-db -- -y
```

PowerShell wrapper: `.	ools
emove-local-db.ps1 -Yes` (or use the `scripts/drop-local-db.ps1` included in this repo).

Warning: This will irreversibly delete the local `dailyshop` database. Ensure you have backups or exported JSON if needed.

---

**This backend is ready for production deployment on Render with MongoDB Atlas!**

**git commands**
git remote add origin https://github.com/nikhilbontha/daily_shop.git
git branch -M main
git push -u origin main


**new**
✅ 1. Check the status of your changes

git status


✅ 2. Add the changes

To stage all the changed files:

git add .


✅ 3. Commit the changes
git commit -m "Describe what you changed"



✅ 4. Push the changes to the remote repository
git push

