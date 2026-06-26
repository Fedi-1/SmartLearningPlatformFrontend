import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { NavigationError, provideRouter, withNavigationErrorHandler } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';

const CHUNK_RELOAD_KEY = 'learnai:chunk-reload';
const CHUNK_RELOAD_COOLDOWN_MS = 10000;

function recoverFromStaleChunk(error: NavigationError): void {
  const message = `${error.error?.message ?? error.error ?? error}`;
  const isChunkLoadError =
    message.includes('Failed to fetch dynamically imported module') ||
    message.includes('Importing a module script failed') ||
    message.includes('Loading chunk') ||
    message.includes('chunk-');

  if (!isChunkLoadError || typeof window === 'undefined') {
    throw error;
  }

  const now = Date.now();
  const lastReload = Number(window.sessionStorage.getItem(CHUNK_RELOAD_KEY) ?? 0);

  if (now - lastReload > CHUNK_RELOAD_COOLDOWN_MS) {
    window.sessionStorage.setItem(CHUNK_RELOAD_KEY, String(now));
    window.location.reload();
    return;
  }

  throw error;
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withNavigationErrorHandler(recoverFromStaleChunk)),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAnimations()
  ]
};
