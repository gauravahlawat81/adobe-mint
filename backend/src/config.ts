import 'dotenv/config';

function require_env(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

function optional_env(key: string, fallback = ''): string {
  return process.env[key] ?? fallback;
}

export const config = {
  port: parseInt(process.env.PORT ?? '3000', 10),
  google: {
    clientId:     require_env('GOOGLE_CLIENT_ID'),
    clientSecret: require_env('GOOGLE_CLIENT_SECRET'),
    redirectUri:  require_env('GOOGLE_REDIRECT_URI'),
    authUrl:      'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl:     'https://oauth2.googleapis.com/token',
    userInfoUrl:  'https://www.googleapis.com/oauth2/v2/userinfo',
    scopes:       'openid email profile',
  },
  jwt: {
    secret:    require_env('JWT_SECRET'),
    expiresIn: '30d' as const,
  },
  appDeepLink: process.env.APP_DEEP_LINK ?? 'com.adobe.mint://auth',
  corsOrigins: (process.env.CORS_ORIGINS ?? '').split(',').filter(Boolean),
};
