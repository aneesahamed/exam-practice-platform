import { Amplify } from 'aws-amplify';

/**
 * Cognito configuration
 *
 * Values are injected at build time via Vite environment variables.
 * In CI/CD, these come from Terraform outputs (no hardcoding, no secrets).
 * For local development, set them in .env.local
 */
Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId:       import.meta.env.VITE_COGNITO_USER_POOL_ID,
      userPoolClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
      loginWith: {
        email: true,
      },
    },
  },
});
