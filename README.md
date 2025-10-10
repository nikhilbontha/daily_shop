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

   Visit [http://localhost:10000/api/test](http://localhost:10000/api/test) to check if the backend and MongoDB are connected.

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

1. Open MongoDB Compass and connect to your local instance (mongodb://localhost:27017).
2. For each collection:
   - Click the collection → `Export Collection` → select `JSON` and save.
3. Connect Compass to your Atlas cluster (use the connection string from Atlas, URL-encode the password).
4. In Compass, create the target database name (if needed), then `Add Data` → `Import File` and pick the JSON file.

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

---

**This backend is ready for production deployment on Render with MongoDB Atlas!**

