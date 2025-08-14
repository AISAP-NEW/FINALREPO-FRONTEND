import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { Project } from './project.service';
import { environment } from '../../environments/environment';

export interface User {
  userId: number;
  username: string;
  email: string;
  role: string;
  profilePictureUrl?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  bio?: string;
  dateOfBirth?: string;
  businessEmail?: string;
  createdAt?: string;
  updatedAt?: string;
  isFirstLogin?: boolean;
  // Add these for API response compatibility
  UserId?: number;
  Username?: string;
  Email?: string;
  Role?: string;
  FirstName?: string;
  LastName?: string;
  PhoneNumber?: string;
  Bio?: string;
  DateOfBirth?: string;
  BusinessEmail?: string;
  CreatedAt?: string;
  UpdatedAt?: string;
  IsFirstLogin?: boolean;
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
      } else if (error.status === 201) {
        // 201 Created is a successful response
        console.log('Received 201 Created - this is a successful response');
        errorMessage = 'Operation completed successfully';
      } else if (error.status === 204) {
        // 204 No Content is often a successful response
        console.log('Received 204 No Content - this is a successful response');
        errorMessage = 'Operation completed successfully';
      } else if (error.status >= 200 && error.status < 300) {
        // Any 2xx status code is successful
        console.log(`Received ${error.status} status - this is a successful response`);
        errorMessage = 'Operation completed successfully';
      } else if (error.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.status >= 400) {
        errorMessage = error.error?.message || error.error || 'Bad request.';
      }
    }
    
    // Don't throw errors for successful status codes
    if (error.status >= 200 && error.status < 300) {
      console.log('Not throwing error for successful status code');
      // Return a success error that will be handled by the component
      return throwError(() => new Error('SUCCESS'));
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

    console.log('Direct assigning user to project:', { projectId, userId, leadDeveloperId, role });
    console.log('API URL:', url);
    console.log('Request body:', body);

    return this.http.post<any>(url, body, { params }).pipe(
      tap(response => {
        console.log('=== DIRECT ASSIGN SUCCESS RESPONSE ===');
        console.log('Direct assign response:', response);
        console.log('Response type:', typeof response);
        console.log('Response keys:', response ? Object.keys(response) : 'null/undefined');
        console.log('Response is null?', response === null);
        console.log('Response is undefined?', response === undefined);
        console.log('Response stringified:', JSON.stringify(response));
        console.log('=== END SUCCESS RESPONSE ===');
      }),
      map(response => {
        // If we get a 204 No Content or empty response, consider it success
        if (!response) {
          console.log('No response body - treating as success');
          return { message: 'Member added successfully' };
        }
        // Handle string response
        if (typeof response === 'string') {
          console.log('String response - treating as success:', response);
          return { message: response };
        }
        // Handle error in response
        if (response?.error) {
          console.log('Response contains error:', response.error);
          throw new Error(response.error);
        }
        // Return the response as is
        console.log('Returning response as success:', response);
        return response;
      }),
      catchError((error: HttpErrorResponse) => {
        console.log('=== DIRECT ASSIGN ERROR RESPONSE ===');
        console.error('Direct assign error:', error);
        console.error('Error status:', error.status);
        console.error('Error statusText:', error.statusText);
        console.error('Error message:', error.message);
        console.error('Error error:', error.error);
        console.error('Error name:', error.name);
        console.error('Error url:', error.url);
        console.error('Error type:', typeof error);
        console.error('Error stringified:', JSON.stringify(error));
        console.log('=== END ERROR RESPONSE ===');
        
        // Handle 204 No Content as success
        if (error.status === 204) {
          console.log('Received 204 No Content - treating as success');
          return of({ message: 'Member added successfully' });
        }
        
        // Handle 201 Created as success
        if (error.status === 201) {
          console.log('Received 201 Created - treating as success');
          return of({ message: 'Member added successfully' });
        }
        
        // More aggressive approach: treat any 2xx status as success, regardless of error
        if (error.status >= 200 && error.status < 300) {
          console.log('Received successful status code but Angular treated as error - treating as success');
          return of({ message: 'Member added successfully' });
        }
        
        // Check if the error message indicates success (some backends return success messages as errors)
        if (error.error && typeof error.error === 'string' && 
            (error.error.toLowerCase().includes('success') || 
             error.error.toLowerCase().includes('added') ||
             error.error.toLowerCase().includes('assigned'))) {
          console.log('Error message indicates success:', error.error);
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

  // Profile Management Methods
  getUserProfile(userId: number): Observable<any> {
    const url = `${this.API_URL}/User/profile/${userId}`;
    return this.http.get<any>(url).pipe(
      catchError(this.handleError)
    );
  }

  updateUserProfile(profileData: any): Observable<any> {
    const url = `${this.API_URL}/User/profile`;
    return this.http.put<any>(url, profileData).pipe(
      catchError(this.handleError)
    );
  }

  uploadProfilePicture(formData: FormData): Observable<any> {
    const url = `${this.API_URL}/User/upload-profile-picture`;
    return this.http.post<any>(url, formData).pipe(
      tap(response => {
        console.log('Upload profile picture response:', response);
      }),
      catchError((error: HttpErrorResponse) => {
        console.log('Upload profile picture error status:', error.status);
        console.log('Upload profile picture error response:', error.error);
        
        // Handle successful upload that returns 204 No Content or similar
        if (error.status >= 200 && error.status < 300) {
          console.log('Upload was successful despite error status');
          // Return empty success response
          return of({ success: true });
        }
        
        return this.handleError(error);
      })
    );
  }

  deleteProfilePicture(userId: number): Observable<any> {
    const url = `${this.API_URL}/User/delete-profile-picture/${userId}`;
    return this.http.delete<any>(url).pipe(
      catchError(this.handleError)
    );
  }

  changePassword(passwordData: any): Observable<any> {
    const url = `${this.API_URL}/User/change-password`;
    return this.http.post<any>(url, passwordData).pipe(
      catchError(this.handleError)
    );
  }

  updateUsername(usernameData: any): Observable<any> {
    const url = `${this.API_URL}/User/username`;
    return this.http.put<any>(url, usernameData).pipe(
      catchError(this.handleError)
    );
  }

  updateEmail(emailData: any): Observable<any> {
    const url = `${this.API_URL}/User/email`;
    return this.http.put<any>(url, emailData).pipe(
      catchError(this.handleError)
    );
  }

  updatePhoneNumber(phoneData: any): Observable<any> {
    const url = `${this.API_URL}/User/phone`;
    return this.http.put<any>(url, phoneData).pipe(
      catchError(this.handleError)
    );
  }

  // Utility method to process profile picture URL
  processProfilePictureUrl(profilePictureUrl: string | undefined | null, userId?: number): string {
    console.log('ProcessProfilePictureUrl input:', profilePictureUrl, 'userId:', userId);
    
    // If we have a userId, always try the backend endpoint first for profile pictures
    if (userId) {
      // Use the new backend endpoint for serving profile pictures
      const endpointUrl = `${environment.apiUrl}/api/User/profile-picture-image/${userId}`;
      console.log('Using backend endpoint for profile picture:', endpointUrl);
      return endpointUrl;
    }
    
    // Fallback to old logic if no userId provided
    if (!profilePictureUrl || 
        profilePictureUrl === '/assets/default-avatar.png' ||
        profilePictureUrl.trim() === '') {
      console.log('Using default avatar (no userId)');
      return '/assets/default-avatar.png';
    }
    
    // Check if the URL is a relative path and convert to absolute if needed
    if (profilePictureUrl.startsWith('/') && !profilePictureUrl.startsWith('//')) {
      // If it's a relative path, make it absolute to the backend server
      const fullUrl = `${environment.apiUrl}${profilePictureUrl}`;
      console.log('Converted relative URL to absolute:', fullUrl);
      return fullUrl;
    }
    
    console.log('Using URL as-is:', profilePictureUrl);
    return profilePictureUrl;
  }

  // Get profile picture URL by username (for access requests)
  getProfilePictureUrlByUsername(username: string): string {
    // For now, we'll use a default avatar since we don't have userId
    // TODO: Backend needs to include UserId in ProjectAccessRequestSummaryDTO
    console.log('Getting profile picture for username:', username);
    return '/assets/default-avatar.png';
  }
} 