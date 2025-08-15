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

    // Debug logging
    console.log('RolesGuard Debug:', {
      route: route.routeConfig?.path,
      allowedRoles: allowed,
      userRole: role,
      user: user
    });

    // Normalize roles: lowercase and strip non-alphanumeric to handle variants like "Lead Developer" vs "LeadDeveloper"
    const normalize = (r: string) => r.toLowerCase().replace(/[^a-z0-9]/g, '');
    const normalizedAllowed = allowed.map(normalize);
    const normalizedRole = normalize(role);

    console.log('Normalized roles:', {
      normalizedAllowed,
      normalizedRole,
      isAllowed: normalizedAllowed.includes(normalizedRole)
    });

    if (!allowed.length) return true;
    if (normalizedAllowed.includes(normalizedRole)) return true;
    
    console.log('Access denied - redirecting to home');
    return this.router.createUrlTree(['/home']);
  }
}


