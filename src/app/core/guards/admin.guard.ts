import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../enums/user-role.enum';

export const adminGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  const user = auth.currentUser();
  if (auth.isLoggedIn() && user?.role === UserRole.ADMIN) {
    return true;
  }

  // Redirect students back to their dashboard, unauthenticated to login
  router.navigate([auth.isLoggedIn() ? '/dashboard' : '/login']);
  return false;
};
