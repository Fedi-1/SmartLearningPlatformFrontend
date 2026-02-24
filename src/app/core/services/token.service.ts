import { Injectable } from '@angular/core';

const TOKEN_KEY = 'learnai_token';
const USER_KEY  = 'learnai_user';

@Injectable({ providedIn: 'root' })
export class TokenService {

  saveToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  removeToken(): void {
    localStorage.removeItem(TOKEN_KEY);
  }

  saveUser(user: object): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  getUser<T>(): T | null {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) as T : null;
  }

  removeUser(): void {
    localStorage.removeItem(USER_KEY);
  }

  isTokenPresent(): boolean {
    return !!this.getToken();
  }

  clear(): void {
    this.removeToken();
    this.removeUser();
  }
}
