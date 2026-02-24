import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { AuthResponse, LoginRequest, RegisterRequest, User } from '../models/user.model';
import { TokenService } from './token.service';

const API = 'http://localhost:8069/api/auth';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private _currentUser = signal<User | null>(null);
  readonly currentUser = this._currentUser.asReadonly();

  constructor(
    private http: HttpClient,
    private tokenService: TokenService
  ) {
    const stored = this.tokenService.getUser<User>();
    if (stored) this._currentUser.set(stored);
  }

  register(payload: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API}/register`, payload).pipe(
      tap(res => this.handleAuth(res))
    );
  }

  login(payload: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API}/login`, payload).pipe(
      tap(res => this.handleAuth(res))
    );
  }

  logout(): void {
    this.tokenService.clear();
    this._currentUser.set(null);
  }

  isLoggedIn(): boolean {
    return this.tokenService.isTokenPresent();
  }

  private handleAuth(res: AuthResponse): void {
    this.tokenService.saveToken(res.token);
    const user: User = {
      id: res.id,
      firstName: res.firstName,
      lastName: res.lastName,
      email: res.email,
      role: res.role
    };
    this.tokenService.saveUser(user);
    this._currentUser.set(user);
  }
}
