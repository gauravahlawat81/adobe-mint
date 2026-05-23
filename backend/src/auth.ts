import { Router, Request, Response } from 'express';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from './config';
import { upsertUser } from './db';

export const authRouter = Router();

// In-memory state store (use Redis in prod for multi-instance)
const pendingStates = new Map<string, number>();

// GET /auth/google — kick off the Google OAuth flow
authRouter.get('/google', (_req: Request, res: Response) => {
  const state = crypto.randomBytes(16).toString('hex');
  pendingStates.set(state, Date.now() + 10 * 60 * 1000); // 10-min expiry

  const params = new URLSearchParams({
    client_id:     config.google.clientId,
    redirect_uri:  config.google.redirectUri,
    scope:         config.google.scopes,
    response_type: 'code',
    access_type:   'offline',
    prompt:        'select_account',
    state,
  });

  res.redirect(`${config.google.authUrl}?${params}`);
});

// GET /auth/callback — Google redirects here with ?code=&state=
authRouter.get('/callback', async (req: Request, res: Response) => {
  const { code, state, error } = req.query as Record<string, string>;

  if (error) {
    return res.redirect(`${config.appDeepLink}?error=${encodeURIComponent(error)}`);
  }

  const expiry = pendingStates.get(state);
  if (!expiry || Date.now() > expiry) {
    return res.redirect(`${config.appDeepLink}?error=invalid_state`);
  }
  pendingStates.delete(state);

  try {
    // Exchange auth code for tokens
    const tokenRes = await axios.post(
      config.google.tokenUrl,
      new URLSearchParams({
        grant_type:    'authorization_code',
        client_id:     config.google.clientId,
        client_secret: config.google.clientSecret,
        code,
        redirect_uri:  config.google.redirectUri,
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const { access_token, refresh_token, expires_in } = tokenRes.data;

    // Fetch user profile from Google
    const profileRes = await axios.get(config.google.userInfoUrl, {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const profile = profileRes.data;

    // Persist user to database (Google ID is the stable user ID)
    await upsertUser({
      id:     profile.id,
      email:  profile.email,
      name:   profile.name,
      avatar: profile.picture ?? null,
    });

    // Issue our own session JWT
    const sessionToken = jwt.sign(
      {
        sub:    profile.id,
        email:  profile.email,
        name:   profile.name,
        avatar: profile.picture ?? null,
        googleTokens: {
          accessToken:  access_token,
          refreshToken: refresh_token ?? null,
          expiresAt:    Date.now() + expires_in * 1000,
        },
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    // Deep-link back to the app with the session token
    res.redirect(`${config.appDeepLink}?session=${encodeURIComponent(sessionToken)}`);
  } catch (err: any) {
    console.error('OAuth callback error:', err?.response?.data ?? err.message);
    res.redirect(`${config.appDeepLink}?error=token_exchange_failed`);
  }
});

// GET /auth/me — validate session, return user profile
authRouter.get('/me', (req: Request, res: Response) => {
  const bearer = req.headers.authorization?.replace('Bearer ', '');
  if (!bearer) return res.status(401).json({ error: 'No token' });

  try {
    const payload = jwt.verify(bearer, config.jwt.secret) as any;
    res.json({
      id:     payload.sub,
      email:  payload.email,
      name:   payload.name,
      avatar: payload.avatar,
    });
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

// POST /auth/logout — stateless JWT, just instruct client to discard token
authRouter.post('/logout', (_req: Request, res: Response) => {
  res.json({ ok: true });
});
