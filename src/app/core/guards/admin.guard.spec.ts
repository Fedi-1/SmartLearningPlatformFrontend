import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { adminGuard } from './admin.guard';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../enums/user-role.enum';

describe('adminGuard', () => {
  let authService: jasmine.SpyObj<any>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    authService = jasmine.createSpyObj('AuthService', ['isLoggedIn', 'currentUser']);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router }
      ]
    });
  });

  it('allows logged-in admins', () => {
    authService.isLoggedIn.and.returnValue(true);
    authService.currentUser.and.returnValue({ id: 1, firstName: 'A', lastName: 'B', email: 'admin@example.com', role: UserRole.ADMIN });

    const result = TestBed.runInInjectionContext(() => adminGuard({} as any, {} as any));

    expect(result).toBeTrue();
  });

  it('redirects logged-in non-admins to dashboard', () => {
    authService.isLoggedIn.and.returnValue(true);
    authService.currentUser.and.returnValue({ id: 2, firstName: 'S', lastName: 'T', email: 'student@example.com', role: UserRole.STUDENT });

    const result = TestBed.runInInjectionContext(() => adminGuard({} as any, {} as any));

    expect(result).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('redirects anonymous users to login', () => {
    authService.isLoggedIn.and.returnValue(false);
    authService.currentUser.and.returnValue(null);

    const result = TestBed.runInInjectionContext(() => adminGuard({} as any, {} as any));

    expect(result).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });
});
