# FinGuard 100% Free Production Deployment Guide
### Neon Tech (Postgres) + Upstash (Redis) + Render (Backend) + Vercel (Frontend)

This guide walks you through deploying FinGuard completely **free of cost ($0/month)** using the modern serverless cloud stack:
- **Database**: [Neon Tech](https://neon.tech) (Serverless PostgreSQL)
- **Cache & Pub/Sub**: [Upstash](https://upstash.com) (Serverless Redis)
- **Backend API & WebSockets**: [Render](https://render.com) (Node.js & Express 5)
- **Frontend User Interface**: [Vercel](https://vercel.com) (React 19 & Vite 8)

---

## 🛠️ Step 1: Create Free PostgreSQL Database on Neon Tech

1. Go to [neon.tech](https://neon.tech) and sign up / sign in (via GitHub or Google).
2. Click **Create Project**:
   - **Project Name**: `finguard-db`
   - **Postgres Version**: 16 (default)
   - **Region**: Pick the region closest to you (e.g., US East or Frankfurt).
3. Once created, copy the **Connection string** (Direct or Pooled) from the Neon dashboard:
   ```text
   postgresql://neondb_owner:npg_xxxxxx@ep-xxxxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
   *(Keep this string handy for Step 3)*.

---

## ⚡ Step 2: Create Free Redis Database on Upstash

1. Go to [upstash.com](https://upstash.com) and sign up / sign in.
2. Under the **Redis** tab, click **Create Database**:
   - **Name**: `finguard-redis`
   - **Region**: Select the same or closest region to your Neon DB.
   - **Type**: Serverless (Free 10,000 commands/day).
3. Scroll down to the **Node.js / ioredis** or **Connect** section and copy the `rediss://` URL:
   ```text
   rediss://default:xxxxxxxxxxxxxxxx@xxxxxxxx.upstash.io:6379
   ```
   *(Keep this string handy for Step 3. Note: If you skip this, FinGuard automatically activates its zero-dependency in-memory cache fallback).*

---

## 🚀 Step 3: Deploy Backend on Render

1. Go to [render.com](https://render.com) and sign in.
2. Click **New +** -> **Web Service**.
3. Connect your GitHub repository: `ramanrishi076/FinGuard`.
4. Configure the Web Service settings:
   - **Name**: `finguard-backend`
   - **Region**: Match your database region.
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**:
     ```bash
     npm install && npx prisma generate && npx prisma db push
     ```
   - **Start Command**:
     ```bash
     npm start
     ```
   - **Instance Type**: `Free`
5. Click **Environment Variables** (Advanced) and add the following:
   | Key | Value / Instructions |
   | :--- | :--- |
   | `NODE_ENV` | `production` |
   | `DATABASE_URL` | *Your Neon PostgreSQL connection string from Step 1* |
   | `REDIS_URL` | *Your Upstash Redis connection string from Step 2* |
   | `JWT_SECRET` | *Any long random secret string (e.g. 64 random characters)* |
   | `JWT_ACCESS_SECRET` | *Any long random secret string* |
   | `JWT_REFRESH_SECRET` | *Any long random secret string* |
   | `CLIENT_URL` | `http://localhost:5173` *(We will update this with the real Vercel URL in Step 5)* |
6. Click **Deploy Web Service**.
7. Wait 2–3 minutes for the build to finish. Once live, copy your backend URL at the top:
   ```text
   https://finguard-backend.onrender.com
   ```

---

## 🌐 Step 4: Deploy Frontend on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub.
2. Click **Add New...** -> **Project**.
3. Select your `FinGuard` repository and click **Import**.
4. Configure Project:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click **Edit** and choose `client`
5. Expand **Environment Variables** and add:
   | Key | Value |
   | :--- | :--- |
   | `VITE_API_URL` | `https://finguard-backend.onrender.com/api` *(Append `/api` to your Render URL)* |
   | `VITE_SOCKET_URL` | `https://finguard-backend.onrender.com` *(Your Render URL without `/api`)* |
6. Click **Deploy**.
7. Vercel will build the project in ~30 seconds and provide your live production domain:
   ```text
   https://finguard-xxxx.vercel.app
   ```

---

## 🔄 Step 5: Final Handshake (Update CORS in Render)

1. Copy your live Vercel domain from Step 4 (e.g., `https://finguard-xxxx.vercel.app`).
2. Go back to your **Render** dashboard -> `finguard-backend` -> **Environment**.
3. Update `CLIENT_URL` to your Vercel domain:
   ```text
   CLIENT_URL=https://finguard-xxxx.vercel.app
   ```
4. Click **Save Changes**. Render will automatically perform a fast zero-downtime redeploy.

---

## ✅ Deployment Verification Checklist

- [ ] **Open Vercel App**: Verify the Google Pay interface loads with dark/light mode toggle.
- [ ] **Create an Account**: Register a new user (`test@finguard.com`). Check that Neon PostgreSQL stores the user and wallet.
- [ ] **Test Real-Time Sockets**: Open two different browser tabs/windows with the same or different accounts. Transfer money and check that live balance notifications and `FRAUD_ALERT` events trigger immediately via Socket.IO.
- [ ] **Inspect Redis & Cache**: Check the Upstash console to see cache keys (`finguard:realtime_events`, `idempotency:`) populate in real time.
