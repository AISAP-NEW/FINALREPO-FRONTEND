import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface GitHubUserInfo {
  id: string;
  login: string;
  name: string;
  email: string;
  avatarUrl: string;
  bio: string;
  company: string;
  location: string;
  createdAt: string;
  publicRepos: number;
  followers: number;
  following: number;
}

export interface GitHubAuthResponse {
  authorizationUrl: string;
}

export interface GitHubCallbackResponse {
  UserId: number;        // Changed from userId
  Username: string;      // Changed from username
  Email: string;         // Changed from email
  Role: string;          // Changed from role
  Token: string;         // Changed from token
  FirstName?: string;    // Changed from firstName
  LastName?: string;     // Changed from lastName
  PhoneNumber?: string;  // Changed from phoneNumber
  ProfilePictureUrl?: string;  // Changed from profilePictureUrl
  BusinessEmail?: string;      // Changed from businessEmail
  IsFirstLogin: boolean;       // Changed from isFirstLogin
  GitHubId?: string;           // Changed from githubId
  GitHubUsername?: string;     // Changed from githubUsername
  AuthenticationMethod: string; // Changed from authenticationMethod
}

export interface LinkGitHubAccountDTO {
  userId: number;
  githubId: string;
  githubUsername: string;
}

export interface UnlinkGitHubAccountDTO {
  userId: number;
}

@Injectable({
  providedIn: 'root'
})
export class GitHubAuthService {
  private readonly API_URL = `${environment.apiUrl}/api/auth/GitHubAuth`;

  constructor(private http: HttpClient) {}

  private handleError(error: any) {
    console.error('GitHub Auth Service Error:', error);
    let errorMessage = 'An error occurred during GitHub authentication. Please try again later.';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else {
      // Server-side error
      if (error.status === 401) {
        errorMessage = 'GitHub authentication failed. Please try again.';
      } else if (error.status === 403) {
        errorMessage = 'Access denied. Please check your permissions.';
      } else if (error.status === 404) {
        errorMessage = 'GitHub authentication service not found.';
      } else if (error.status >= 500) {
        errorMessage = 'GitHub authentication service is temporarily unavailable. Please try again later.';
      } else if (error.status >= 400) {
        errorMessage = error.error?.message || error.error || 'GitHub authentication request failed.';
      }
    }
    
    return throwError(() => new Error(errorMessage));
  }

  /**
   * Initiates GitHub OAuth flow by getting the authorization URL
   */
  getGitHubAuthorizationUrl(): Observable<GitHubAuthResponse> {
    return this.http.get<GitHubAuthResponse>(`${this.API_URL}/login`).pipe(
      tap(response => console.log('GitHub authorization URL received:', response)),
      catchError(this.handleError)
    );
  }

  /**
   * Handles GitHub OAuth callback and authenticates the user
   */
  handleGitHubCallback(code: string, state?: string): Observable<GitHubCallbackResponse> {
    const params = state ? `?code=${code}&state=${state}` : `?code=${code}`;
    return this.http.get<GitHubCallbackResponse>(`${this.API_URL}/callback${params}`).pipe(
      tap(response => console.log('GitHub callback successful:', response)),
      catchError(this.handleError)
    );
  }

  /**
   * Links an existing user account to a GitHub account
   */
  linkGitHubAccount(linkDto: LinkGitHubAccountDTO): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/link-account`, linkDto).pipe(
      tap(response => console.log('GitHub account linked successfully:', response)),
      catchError(this.handleError)
    );
  }

  /**
   * Unlinks a GitHub account from a user
   */
  unlinkGitHubAccount(unlinkDto: UnlinkGitHubAccountDTO): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/unlink-account`, unlinkDto).pipe(
      tap(response => console.log('GitHub account unlinked successfully:', response)),
      catchError(this.handleError)
    );
  }

  /**
   * Gets GitHub profile information for the authenticated user
   */
  getGitHubProfile(githubId: string): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/profile/${githubId}`).pipe(
      tap(response => console.log('GitHub profile retrieved:', response)),
      catchError(this.handleError)
    );
  }

  /**
   * Initiates GitHub OAuth flow by redirecting the user
   */
  initiateGitHubLogin(): void {
    this.getGitHubAuthorizationUrl().subscribe({
      next: (response) => {
        // Store the current URL to return to after GitHub OAuth
        const returnUrl = window.location.href;
        localStorage.setItem('githubReturnUrl', returnUrl);
        
        // Redirect to GitHub authorization
        window.location.href = response.authorizationUrl;
      },
      error: (error) => {
        console.error('Failed to get GitHub authorization URL:', error);
        // Handle error - could show a toast or alert
      }
    });
  }

  /**
   * Handles the return from GitHub OAuth
   * This should be called when the user returns from GitHub
   */
  handleGitHubReturn(): Observable<GitHubCallbackResponse> {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');

    if (!code) {
      return throwError(() => new Error('No authorization code received from GitHub'));
    }

    return this.handleGitHubCallback(code, state || undefined);
  }

  /**
   * Checks if the current URL contains GitHub OAuth parameters
   */
  isGitHubCallback(): boolean {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.has('code');
  }

  /**
   * Clears GitHub OAuth parameters from the URL
   */
  clearGitHubParams(): void {
    const url = new URL(window.location.href);
    url.searchParams.delete('code');
    url.searchParams.delete('state');
    window.history.replaceState({}, document.title, url.toString());
  }
}
