import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Project } from './project.service';
import { environment } from '../../environments/environment';

export interface User {
  userId: number;
  username: string;
  email: string;
  role: string;
  // Add these for API response compatibility
  UserId?: number;
  Username?: string;
  Email?: string;
  Role?: string;
}

export interface DirectAssignResponse {
  message?: string;
  error?: string;
  details?: string;
}

export interface UserWithProjects extends User {
  projects: (Project & { role: string })[];
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly API_URL = `${environment.apiUrl}/api`;

  constructor(private http: HttpClient) {}

  private handleError(error: HttpErrorResponse) {
    console.error('API Error:', error);
    let errorMessage = 'An error occurred. Please try again later.';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else {
      // Server-side error
      if (error.status === 401) {
        errorMessage = 'Unauthorized. Please log in again.';
      } else if (error.status === 403) {
        errorMessage = 'You do not have permission to perform this action.';
      } else if (error.status === 404) {
        errorMessage = 'Resource not found.';
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      }
    }
    
    return throwError(() => new Error(errorMessage));
  }

  private normalizeUser(apiUser: any): User {
    return {
      userId: apiUser.UserId || apiUser.userId || 0,
      username: apiUser.Username || apiUser.username || '',
      email: apiUser.Email || apiUser.email || '',
      role: apiUser.Role || apiUser.role || 'Developer',
      // Keep original properties for API compatibility
      UserId: apiUser.UserId || apiUser.userId || 0,
      Username: apiUser.Username || apiUser.username || '',
      Email: apiUser.Email || apiUser.email || '',
      Role: apiUser.Role || apiUser.role || 'Developer'
    };
  }

  getUsers(): Observable<User[]> {
    return this.http.get<any[]>(`${this.API_URL}/User`).pipe(
      map(users => {
        if (!Array.isArray(users)) {
          console.error('Invalid users response:', users);
          throw new Error('Invalid response format from server');
        }
        return users.map(user => this.normalizeUser(user));
      }),
      catchError(this.handleError)
    );
  }

  getUserWithProjects(userId: number): Observable<UserWithProjects> {
    return this.http.get<any>(`${this.API_URL}/User/${userId}`).pipe(
      map(response => ({
        ...this.normalizeUser(response),
        projects: response.projects || []
      })),
      catchError(this.handleError)
    );
  }

  directAssignToProject(projectId: number, userId: number, leadDeveloperId: number, role: string = 'Developer'): Observable<DirectAssignResponse> {
    const url = `${this.API_URL}/User/directAssign`;
    const params = { leadDeveloperId: leadDeveloperId.toString() };
    const body = {
      ProjectId: projectId,
      UserId: userId,
      Role: role
    };

    return this.http.post<any>(url, body, { params }).pipe(
      map(response => {
        // If we get a 204 No Content or empty response, consider it success
        if (!response) {
          return { message: 'Member added successfully' };
        }
        // Handle string response
        if (typeof response === 'string') {
          return { message: response };
        }
        // Handle error in response
        if (response?.error) {
          throw new Error(response.error);
        }
        // Return the response as is
        return response;
      }),
      catchError((error: HttpErrorResponse) => {
        // Handle 204 No Content as success
        if (error.status === 204) {
          return of({ message: 'Member added successfully' });
        }
        return this.handleError(error);
      })
    );
  }

  deleteUser(userId: number): Observable<void> {
    const url = `${this.API_URL}/User/${userId}`;
    return this.http.delete<void>(url).pipe(
      catchError(this.handleError)
    );
  }
} 