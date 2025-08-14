import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class RolesGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean | UrlTree {
    const allowed: string[] = route.data?.['roles'] || [];
    const user = this.auth.getCurrentUser();
    const role = (user?.role || (user as any)?.Role || '').toString();

    // Normalize roles: lowercase and strip non-alphanumeric to handle variants like "Lead Developer" vs "LeadDeveloper"
    const normalize = (r: string) => r.toLowerCase().replace(/[^a-z0-9]/g, '');
    const normalizedAllowed = allowed.map(normalize);
    const normalizedRole = normalize(role);

    if (!allowed.length) return true;
    if (normalizedAllowed.includes(normalizedRole)) return true;
    return this.router.createUrlTree(['/home']);
  }
}


