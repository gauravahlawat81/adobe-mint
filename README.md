# Adobe Mint

Turn your camera roll into a money-minting machine on Adobe Stock.

## What it does

Adobe Mint uses GPT-4o Vision to scan your camera roll, identify stock-worthy photos, auto-generate professional metadata (titles, descriptions, keywords), and lets you swipe right to publish directly to Adobe Stock.

## Stack

- **Mobile**: React Native 0.76 + Expo SDK 52 (TypeScript)
- **Backend**: Node.js + Express + PostgreSQL (deployed on Railway)
- **AI**: GPT-4o Vision API for stock-worthiness scoring + metadata generation
- **Auth**: Google OAuth 2.0 (backend-mediated flow)

## Project Structure

```
├── Adobe Mint/     # React Native mobile app
└── backend/        # Express API server
```

## Getting Started

### Backend
```bash
cd backend
cp .env.example .env   # fill in your credentials
npm install
npm run dev
```

### Mobile App
```bash
cd "Adobe Mint"
npm install
npx expo start
```

## Environment Variables

See `backend/.env.example` for required variables:
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`
- `JWT_SECRET`
- `DATABASE_URL` (PostgreSQL)
