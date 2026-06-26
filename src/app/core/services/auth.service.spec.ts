import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';
import { UserRole } from '../enums/user-role.enum';

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;
  let tokenService: TokenService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService, TokenService]
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
    tokenService = TestBed.inject(TokenService);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('saves token and current user after login', () => {
    service.login({ email: 'admin@example.com', password: 'secret' }).subscribe(res => {
      expect(res.token).toBe('jwt-token');
    });

    const req = http.expectOne('http://localhost:8069/api/auth/login');
    expect(req.request.method).toBe('POST');
    req.flush({
      token: 'jwt-token',
      id: 1,
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      role: UserRole.ADMIN
    });

    expect(tokenService.getToken()).toBe('jwt-token');
    expect(service.currentUser()?.email).toBe('admin@example.com');
  });

  it('clears token and current user on logout', () => {
    tokenService.saveToken('jwt-token');
    tokenService.saveUser({ id: 1, firstName: 'A', lastName: 'B', email: 'a@b.com', role: UserRole.STUDENT });

    service.logout();

    expect(tokenService.getToken()).toBeNull();
    expect(service.currentUser()).toBeNull();
  });

  it('calls verify email endpoint with token param', () => {
    service.verifyEmail('verify-token').subscribe();

    const req = http.expectOne(r => r.url === 'http://localhost:8069/api/auth/verify-email');
    expect(req.request.params.get('token')).toBe('verify-token');
    req.flush({ message: 'ok' });
  });

  it('calls reset password endpoint with token and new password', () => {
    service.resetPassword('reset-token', 'new-password').subscribe();

    const req = http.expectOne('http://localhost:8069/api/auth/reset-password');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ token: 'reset-token', newPassword: 'new-password' });
    req.flush({ message: 'ok' });
  });
});
