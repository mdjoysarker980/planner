# Planner

A Bengali-first personal planner built with React, Vite and Supabase.

## Features
- Google sign-in with Supabase Auth
- Personal task dashboard
- Add tasks with category and due date
- Mark tasks complete and delete tasks
- Search and filter tasks
- Row Level Security: users can only access their own tasks

## Requirements
- Node.js 18+
- A Supabase project
- Google OAuth credentials from Google Cloud Console

## 1. Install
```bash
npm install
```

## 2. Configure Supabase
1. Create a project at https://supabase.com.
2. Open SQL Editor and run the complete script in `supabase/schema.sql`.
3. In Project Settings -> API, copy the Project URL and publishable/anon key.
4. Copy `.env.example` to a new file named `.env` and fill in:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

Never put a Supabase service-role key in a browser app or commit your real `.env` file.

## 3. Enable Google login
1. In Google Cloud Console, create an OAuth 2.0 Client ID (Web application).
2. Add the Supabase callback URL shown in Supabase -> Authentication -> Providers -> Google to Google's Authorized redirect URIs.
3. Enable Google provider in Supabase and paste the Google Client ID and Client Secret there.
4. In Supabase -> Authentication -> URL Configuration, set your local Site URL to `http://localhost:5173`.
5. Add your deployed website URL to the allowed redirect URLs when you deploy.

## 4. Run locally
```bash
npm run dev
```
Open the local URL printed by Vite (normally http://localhost:5173).

## Authentication and data flow
- The browser starts a Google OAuth sign-in through Supabase Auth.
- Google redirects back to Supabase, which completes the OAuth exchange and returns the user session.
- The Supabase client keeps the session in browser storage and sends the user's access token with database requests.
- PostgreSQL Row Level Security checks `auth.uid() = user_id` for every task operation.
- The frontend never receives or uses the Supabase service-role secret.

## Build
```bash
npm run build
```
