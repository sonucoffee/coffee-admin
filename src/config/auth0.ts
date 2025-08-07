export const auth0Config = {
  domain: import.meta.env.VITE_AUTH0_DOMAIN || 'coffee-web-dev.us.auth0.com',
  clientId: import.meta.env.VITE_AUTH0_CLIENT_ID || '3Y4LyB9fxpOeaK8c8qFq7fgPS6C09kjY',
  audience: import.meta.env.VITE_AUTH0_AUDIENCE || 'https://coffee-web-dev.us.auth0.com/api/v2/',
  scope: 'openid profile email'
};