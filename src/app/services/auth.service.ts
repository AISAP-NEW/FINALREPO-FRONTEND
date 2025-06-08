import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface LoginDTO {
  username: string;
  password: string;
}

export interface RegisterDTO {
  username: string;
  email: string;
  password: string;
  role: string;
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
}

export interface LoginResponse {
  userId: number;
  username: string;
  email: string;
  role: string;
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
  private apiUrl = `${environment.apiUrl}/api/user`;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);

  currentUser$ = this.currentUserSubject.asObservable();
  isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };

  constructor(private http: HttpClient, private router: Router) {
    // Check for stored user data on initialization
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      this.currentUserSubject.next(user);
      this.isAuthenticatedSubject.next(true);
    }
  }

  private handleError(error: HttpErrorResponse) {
    console.error('API Error:', {
      status: error.status,
      statusText: error.statusText,
      error: error.error,
      message: error.message,
      url: error.url
    });

    if (error.status === 0) {
      return throwError(() => new Error('Unable to connect to the server. Please check your internet connection.'));
    }
    
    if (error.status === 404) {
      return throwError(() => new Error('The requested resource was not found.'));
    }
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      return throwError(() => new Error(error.error.message));
    }
    
    // Server-side error
    const message = error.error?.message || error.message || 'An unexpected error occurred';
    return throwError(() => new Error(message));
  }

  login(credentials: LoginDTO): Observable<LoginResponse> {
    console.log('Attempting login for user:', credentials.username);
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials, this.httpOptions)
      .pipe(
        tap(response => {
          console.log('Login successful:', response);
          this.currentUserSubject.next(response);
          this.isAuthenticatedSubject.next(true);
          localStorage.setItem('currentUser', JSON.stringify(response));
          this.router.navigate(['/home']);
        }),
        catchError(this.handleError)
      );
  }

  register(userData: RegisterDTO): Observable<any> {
    console.log('Attempting registration for user:', userData.username);
    return this.http.post(`${this.apiUrl}/register`, userData, this.httpOptions)
      .pipe(
        tap(response => {
          console.log('Registration successful:', response);
        }),
        catchError(this.handleError)
      );
  }

  forgotPassword(email: ForgotPasswordDTO): Observable<any> {
    console.log('Sending forgot password request for email:', email.email);
    const url = `${this.apiUrl}/forgot-password`;
    console.log('Request URL:', url);
    
    return this.http.post(url, email, this.httpOptions)
      .pipe(
        tap(response => {
          console.log('Forgot password request successful:', response);
        }),
        catchError(error => {
          console.error('Forgot password request failed:', {
            error,
            status: error.status,
            statusText: error.statusText,
            url: error.url,
            message: error.message,
            errorObject: error.error
          });
          return this.handleError(error);
        })
      );
  }

  validateResetCode(resetCode: string): Observable<any> {
    console.log('Validating reset code:', resetCode);
    // The backend expects the reset code in the request body as a JSON string
    return this.http.post(`${this.apiUrl}/validate-reset-code`, JSON.stringify(resetCode), {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    }).pipe(
      tap(response => {
        console.log('Reset code validation successful:', response);
      }),
      catchError(this.handleError)
    );
  }

  resetPassword(resetData: ResetPasswordDTO): Observable<any> {
    console.log('Attempting to reset password');
    return this.http.post(`${this.apiUrl}/reset-password`, resetData, this.httpOptions)
      .pipe(
        tap(response => {
          console.log('Password reset successful:', response);
        }),
        catchError(this.handleError)
      );
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/login']);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  isLoggedIn(): boolean {
    return this.isAuthenticated();
  }

  getCurrentUserId(): number {
    const user = this.getCurrentUser();
    if (!user) {
      throw new Error('No user logged in');
    }
    return user.userId;
  }
} 