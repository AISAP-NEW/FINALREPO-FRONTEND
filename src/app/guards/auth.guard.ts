import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    // First check local storage
    const storedUser = localStorage.getItem('currentUser');
    if (!storedUser) {
      console.log('No user found in local storage');
      return this.router.createUrlTree(['/login']);
    }

    // Then check the auth service state
    return this.authService.isAuthenticated$.pipe(
      take(1),
      map(isAuthenticated => {
        if (isAuthenticated) {
          const currentUser = this.authService.getCurrentUser();
          if (!currentUser) {
            console.log('No current user in auth service');
            // Clear local storage and redirect to login
            localStorage.removeItem('currentUser');
            return this.router.createUrlTree(['/login']);
          }
          return true;
        }
        
        console.log('Not authenticated');
        // Clear local storage and redirect to login
        localStorage.removeItem('currentUser');
        return this.router.createUrlTree(['/login']);
      })
    );
  }
} 