import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { SessionTimeoutService } from './session-timeout.service';

export interface LoginDTO {
  Username: string;
  Password: string;
}

export interface RegisterDTO {
  Username: string;
  Email: string;
  Password: string;
  ConfirmPassword: string;
  Role: string;
  FirstName?: string;
  LastName?: string;
  PhoneNumber?: string;
  Bio?: string;
  DateOfBirth?: string;
}

export interface ForgotPasswordDTO {
  email: string;
}

export interface ResetPasswordDTO {
  token: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface UserResponseDTO {
  userId: number;
  username: string;
  email: string;
  role: string;
}

export interface User {
  userId: number;
  username: string;
  email: string;
  role: string;
  profilePictureUrl?: string;
  // Add these for API response compatibility
  UserId?: number;
  Username?: string;
  Email?: string;
  Role?: string;
  Token?: string;
  token?: string;
}

export interface LoginResponse {
  UserId: number;
  Username: string;
  Email: string;
  Role: string;
  Token?: string;
  // Add these for backward compatibility
  userId?: number;
  username?: string;
  email?: string;
  role?: string;
}

export interface RegisterResponse {
  userId: number;
  username: string;
  email: string;
  role: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/api/User`;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);

  currentUser$ = this.currentUserSubject.asObservable();
  isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  private httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  };

  constructor(private http: HttpClient, private router: Router) {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      const user = this.normalizeUser(JSON.parse(storedUser));
      this.currentUserSubject.next(user);
      this.isAuthenticatedSubject.next(true);
    }
  }

  private normalizeUser(user: any): User {
    return {
      userId: user.userId || user.UserId || 0,
      username: user.username || user.Username || '',
      email: user.email || user.Email || '',
      role: user.role || user.Role || 'user',
      // Preserve token if present
      Token: user.Token || user.token,
      token: user.Token || user.token,
      // Keep original properties
      UserId: user.userId || user.UserId || 0,
      Username: user.username || user.Username || '',
      Email: user.email || user.Email || '',
      Role: user.role || user.Role || 'user'
    };
  }

  private handleError(error: HttpErrorResponse) {
    console.error('API Error:', { status: error.status, statusText: error.statusText, error: error.error, message: error.message, url: error.url, headers: error.headers, name: error.name });
    if (error.status === 0) return throwError(() => new Error('Unable to connect to the server.'));
    if (error.status === 401) return throwError(() => new Error(`Authentication failed: ${error.error?.message || 'Invalid credentials'}`));
    if (error.status === 404) return throwError(() => new Error('The requested resource was not found.'));
    if (error.error instanceof ErrorEvent) return throwError(() => new Error(`Client error: ${error.error.message}`));
    return throwError(() => new Error(error.error?.message || error.message || 'An unexpected error occurred'));
  }

  login(credentials: LoginDTO): Observable<LoginResponse> {
    console.log('Attempting login for user:', credentials.Username);
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials, this.httpOptions).pipe(
      tap((response: LoginResponse) => {
        console.log('Login successful:', response);
        // Persist token for downstream services
        const token = (response as any)?.Token || (response as any)?.token;
        if (token) {
          try { localStorage.setItem('token', token); } catch {}
        }
        const user = this.normalizeUser(response);
        this.currentUserSubject.next(user);
        this.isAuthenticatedSubject.next(true);
        localStorage.setItem('currentUser', JSON.stringify(user));
        this.router.navigate(['/home']);
      }),
      catchError(this.handleError)
    );
  }

  register(userData: RegisterDTO): Observable<any> {
    console.log('Attempting registration for user:', userData.Username);
    return this.http.post(`${this.apiUrl}/register`, userData, this.httpOptions).pipe(
      tap(response => { console.log('Registration successful:', response); }),
      catchError(this.handleError)
    );
  }

  forgotPassword(email: ForgotPasswordDTO): Observable<any> {
    console.log('Sending forgot password request for email:', email.email);
    const url = `${this.apiUrl}/forgot-password`;
    return this.http.post(url, email, this.httpOptions).pipe(
      tap(response => { console.log('Forgot password request successful:', response); }),
      catchError(error => this.handleError(error))
    );
  }

  validateResetCode(resetCode: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/validate-reset-code`, JSON.stringify(resetCode), { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) }).pipe(
      tap(response => { console.log('Reset code validation successful:', response); }),
      catchError(this.handleError)
    );
  }

  resetPassword(resetData: ResetPasswordDTO): Observable<any> {
    return this.http.post(`${this.apiUrl}/reset-password`, resetData, this.httpOptions).pipe(
      tap(response => { console.log('Password reset successful:', response); }),
      catchError(this.handleError)
    );
  }

  logout(): void {
    try { localStorage.removeItem('token'); } catch {}
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    if (typeof window !== 'undefined') {
      window.location.replace('/login');
    } else {
      this.router.navigate(['/login']);
    }
  }

  startSessionMonitoring(): void { console.log('Session monitoring should be started by main layout'); }
  getCurrentUser(): User | null { const user = this.currentUserSubject.value; return user ? this.normalizeUser(user) : null; }
  isAuthenticated(): boolean { return this.isAuthenticatedSubject.value; }
  isLoggedIn(): boolean { return this.isAuthenticated(); }
  getCurrentUserId(): number { const user = this.getCurrentUser(); if (!user) throw new Error('No user logged in'); return user.userId || user.UserId || 0; }
} 