import { DebugLogger } from '@affine/debug';
import { initializeApp } from 'firebase/app';
import type { AuthProvider } from 'firebase/auth';
import {
  type Auth as FirebaseAuth,
  connectAuthEmulator,
  getAuth as getFirebaseAuth,
  GithubAuthProvider,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { decode } from 'js-base64';
import { z } from 'zod';
// Connect emulators based on env vars
const envConnectEmulators = process.env.REACT_APP_FIREBASE_EMULATORS === 'true';

export type AccessTokenMessage = {
  created_at: number;
  exp: number;
  email: string;
  id: string;
  name: string;
  avatar_url: string;
};

export type LoginParams = {
  type: 'Google' | 'Refresh';
  token: string;
};

export const loginResponseSchema = z.object({
  token: z.string(),
  refresh: z.string(),
});

export type LoginResponse = z.infer<typeof loginResponseSchema>;

const logger = new DebugLogger('token');

export const STORAGE_KEY = 'affine-login-v2';

export function parseIdToken(token: string): AccessTokenMessage {
  return JSON.parse(decode(token.split('.')[1]));
}

export const isExpired = (token: AccessTokenMessage): boolean => {
  const now = Math.floor(Date.now() / 1000);
  return token.exp < now;
};

export const setLoginStorage = (login: LoginResponse) => {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      token: login.token,
      refresh: login.refresh,
    })
  );
};

export const clearLoginStorage = () => {
  localStorage.removeItem(STORAGE_KEY);
};

export const getLoginStorage = (): LoginResponse | null => {
  const login = localStorage.getItem(STORAGE_KEY);
  if (login) {
    try {
      return JSON.parse(login);
    } catch (error) {
      logger.error('Failed to parse login', error);
    }
  }
  return null;
};

export const enum SignMethod {
  Google = 'Google',
  GitHub = 'GitHub',
  // Twitter = 'Twitter',
}

declare global {
  // eslint-disable-next-line no-var
  var firebaseAuthEmulatorStarted: boolean | undefined;
}

export function createAffineAuth(prefix = '/') {
  let _firebaseAuth: FirebaseAuth | null = null;
  const getAuth = (): FirebaseAuth | null => {
    try {
      if (!_firebaseAuth) {
        const app = initializeApp({
          apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
          authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
          messagingSenderId:
            process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
          appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
          measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
        });
        _firebaseAuth = getFirebaseAuth(app);
      }
      if (envConnectEmulators && !globalThis.firebaseAuthEmulatorStarted) {
        connectAuthEmulator(_firebaseAuth, 'http://localhost:9099', {
          disableWarnings: true,
        });
        globalThis.firebaseAuthEmulatorStarted = true;
      }
      return _firebaseAuth;
    } catch (error) {
      logger.error('Failed to initialize firebase', error);
      return null;
    }
  };

  return {
    generateToken: async (
      method: SignMethod
    ): Promise<LoginResponse | null> => {
      const auth = getAuth();
      if (!auth) {
        throw new Error('Failed to initialize firebase');
      }
      let provider: AuthProvider;
      switch (method) {
        case SignMethod.Google:
          provider = new GoogleAuthProvider();
          break;
        case SignMethod.GitHub:
          provider = new GithubAuthProvider();
          break;
        default:
          throw new Error('Unsupported sign method');
      }
      try {
        const response = await signInWithPopup(auth, provider);
        const idToken = await response.user.getIdToken();
        logger.debug(idToken);
        return fetch(prefix + 'api/user/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'Google',
            token: idToken,
          }),
        }).then(r => r.json()) as Promise<LoginResponse>;
      } catch (error) {
        if (error instanceof Error && 'code' in error) {
          if (error.code === 'auth/popup-closed-by-user') {
            return null;
          }
        }
        logger.error('Failed to sign in', error);
      }
      return null;
    },
    refreshToken: async (
      loginResponse: LoginResponse
    ): Promise<LoginResponse | null> => {
      return fetch(prefix + 'api/user/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'Refresh',
          token: loginResponse.refresh,
        }),
      }).then(r => r.json()) as Promise<LoginResponse>;
    },
  } as const;
}
