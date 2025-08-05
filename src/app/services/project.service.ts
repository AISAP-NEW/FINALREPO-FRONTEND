import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { AuthService } from './auth.service';
import { tap, catchError, map, switchMap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface Project {
  projectId: number;
  name: string;
  objectives: string;
  scope: string;
  technologies: string;
  estimatedTimeline: string;
  createdDate: string;
  isActive: boolean;
  createdByUserId: number;
  createdByUsername: string;
  members: ProjectMember[];
}

export interface ProjectMember {
  userId: number;
  username: string;
  email: string;
  role: string;
  hasAccess: boolean;
}

export interface CreateProjectDTO {
  name: string;
  objectives: string;
  scope: string;
  technologies: string;
  estimatedTimeline: Date;
  teamMemberIds: number[];
  isActive?: boolean; // Added for updateProject
}

export interface ProjectAccessRequestDTO {
  projectId: number;
  userId: number;
}

export interface PendingAccessRequest {
  projectMemberId: number;
  projectId: number;
  userId: number;
  username: string;
  email: string;
  requestDate: Date;
}

export interface AccessApprovalDTO {
  userId: number;
  projectId: number;
  leadDeveloperId: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private readonly API_URL = `${environment.apiUrl}/api`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

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
        errorMessage = 'Project created successfully';
      } else if (error.status === 204) {
        // 204 No Content is often a successful response
        console.log('Received 204 No Content - this is a successful response');
        errorMessage = 'Operation completed successfully';
      } else if (error.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.status >= 400) {
        errorMessage = error.error?.message || error.error || 'Bad request.';
      }
    }
    
    return throwError(() => new Error(errorMessage));
  }

  private convertProject(apiProject: any): Project {
    // Convert PascalCase to camelCase
    return {
      projectId: apiProject.ProjectId,
      name: apiProject.Name,
      objectives: apiProject.Objectives || 'No objectives specified',
      scope: apiProject.Scope || 'No scope specified',
      technologies: apiProject.Technologies || 'No technologies specified',
      estimatedTimeline: apiProject.EstimatedTimeline,
      createdDate: apiProject.CreatedDate,
      isActive: typeof apiProject.IsActive === 'boolean' ? apiProject.IsActive : true,
      createdByUserId: apiProject.CreatedByUserId,
      createdByUsername: apiProject.CreatedByUsername || 'Unknown User',
      members: (apiProject.Members || []).map((member: any) => ({
        userId: member.UserId,
        username: member.Username,
        email: member.Email,
        role: member.Role,
        hasAccess: member.HasAccess
      }))
    };
  }

  getProjects(): Observable<Project[]> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      return throwError(() => new Error('No user logged in'));
    }

    const userId = currentUser.userId || currentUser.UserId;
    if (!userId) {
      return throwError(() => new Error('Invalid user ID'));
    }

    return this.http.get<any[]>(`${this.API_URL}/Project?userId=${userId}`).pipe(
      tap(response => {
        console.log('API Response:', response);
      }),
      map(apiProjects => {
        if (!Array.isArray(apiProjects)) {
          console.error('Invalid projects response:', apiProjects);
          throw new Error('Invalid response format from server');
        }
        return apiProjects.map(apiProject => this.convertProject(apiProject));
      }),
      catchError(this.handleError)
    );
  }

  getProject(id: number): Observable<Project> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      return throwError(() => new Error('No user logged in'));
    }

    const userId = currentUser.userId || currentUser.UserId;
    if (!userId) {
      return throwError(() => new Error('Invalid user ID'));
    }

    return this.http.get<any>(`${this.API_URL}/Project/${id}?userId=${userId}`).pipe(
      map(apiProject => this.convertProject(apiProject)),
      catchError(this.handleError)
    );
  }

  createProject(project: CreateProjectDTO): Observable<Project> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      return throwError(() => new Error('No user logged in'));
    }

    const userId = currentUser.userId || currentUser.UserId;
    if (!userId) {
      return throwError(() => new Error('Invalid user ID'));
    }

    // Convert to PascalCase for API
    const apiProject = {
      Name: project.name,
      Objectives: project.objectives,
      Scope: project.scope,
      Technologies: project.technologies,
      EstimatedTimeline: project.estimatedTimeline,
      TeamMemberIds: project.teamMemberIds
    };

    console.log('Creating project with data:', apiProject);
    console.log('API URL:', `${this.API_URL}/Project?userId=${userId}`);

    return this.http.post<any>(`${this.API_URL}/Project?userId=${userId}`, apiProject).pipe(
      tap(response => {
        console.log('=== CREATE PROJECT SUCCESS RESPONSE ===');
        console.log('Create project response:', response);
        console.log('Response type:', typeof response);
        console.log('Response keys:', response ? Object.keys(response) : 'null/undefined');
        console.log('Response is null?', response === null);
        console.log('Response is undefined?', response === undefined);
        console.log('Response stringified:', JSON.stringify(response));
        console.log('=== END SUCCESS RESPONSE ===');
      }),
      map(response => {
        // Handle different response formats
        if (response) {
          console.log('Converting response to project:', response);
          return this.convertProject(response);
        } else {
          console.log('No response body (null/undefined) - this is expected for CreatedAtAction');
          // If no response body, create a mock project object
          // This handles cases where the backend returns 201 Created with null body
          return {
            projectId: 0, // Will be set by backend
            name: project.name,
            objectives: project.objectives,
            scope: project.scope,
            technologies: project.technologies,
            estimatedTimeline: project.estimatedTimeline.toISOString(),
            createdDate: new Date().toISOString(),
            isActive: true,
            createdByUserId: userId,
            createdByUsername: currentUser.username || currentUser.Username || 'Current User',
            members: []
          } as Project;
        }
      }),
      catchError(error => {
        console.log('=== CREATE PROJECT ERROR RESPONSE ===');
        console.error('Create project error:', error);
        console.error('Error status:', error.status);
        console.error('Error statusText:', error.statusText);
        console.error('Error message:', error.message);
        console.error('Error error:', error.error);
        console.error('Error name:', error.name);
        console.error('Error url:', error.url);
        console.error('Error type:', typeof error);
        console.error('Error stringified:', JSON.stringify(error));
        console.log('=== END ERROR RESPONSE ===');
        
        // The backend returns 201 Created with null body, which Angular treats as an error
        // We need to handle this specific case
        if (error.status === 201) {
          console.log('Received 201 Created - treating as success despite null response body');
          return of({
            projectId: 0, // Will be set by backend
            name: project.name,
            objectives: project.objectives,
            scope: project.scope,
            technologies: project.technologies,
            estimatedTimeline: project.estimatedTimeline.toISOString(),
            createdDate: new Date().toISOString(),
            isActive: true,
            createdByUserId: userId,
            createdByUsername: currentUser.username || currentUser.Username || 'Current User',
            members: []
          } as Project);
        }
        
        // More aggressive approach: treat any 2xx status as success, regardless of error
        if (error.status >= 200 && error.status < 300) {
          console.log('Received successful status code but Angular treated as error - treating as success');
          return of({
            projectId: 0, // Will be set by backend
            name: project.name,
            objectives: project.objectives,
            scope: project.scope,
            technologies: project.technologies,
            estimatedTimeline: project.estimatedTimeline.toISOString(),
            createdDate: new Date().toISOString(),
            isActive: true,
            createdByUserId: userId,
            createdByUsername: currentUser.username || currentUser.Username || 'Current User',
            members: []
          } as Project);
        }
        
        // If it's a 204 No Content, consider it a success
        if (error.status === 204) {
          console.log('Received 204 No Content - treating as success');
          return of({
            projectId: 0, // Will be set by backend
            name: project.name,
            objectives: project.objectives,
            scope: project.scope,
            technologies: project.technologies,
            estimatedTimeline: project.estimatedTimeline.toISOString(),
            createdDate: new Date().toISOString(),
            isActive: true,
            createdByUserId: userId,
            createdByUsername: currentUser.username || currentUser.Username || 'Current User',
            members: []
          } as Project);
        }
        
        // Check if the error message indicates success (some backends return success messages as errors)
        if (error.error && typeof error.error === 'string' && 
            (error.error.toLowerCase().includes('success') || 
             error.error.toLowerCase().includes('created') ||
             error.error.toLowerCase().includes('saved'))) {
          console.log('Error message indicates success:', error.error);
          return of({
            projectId: 0, // Will be set by backend
            name: project.name,
            objectives: project.objectives,
            scope: project.scope,
            technologies: project.technologies,
            estimatedTimeline: project.estimatedTimeline.toISOString(),
            createdDate: new Date().toISOString(),
            isActive: true,
            createdByUserId: userId,
            createdByUsername: currentUser.username || currentUser.Username || 'Current User',
            members: []
          } as Project);
        }
        
        // For other errors, use the standard error handling
        return this.handleError(error);
      })
    );
  }

  updateProject(id: number, project: CreateProjectDTO): Observable<Project> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      return throwError(() => new Error('No user logged in'));
    }

    const userId = currentUser.userId || currentUser.UserId;
    if (!userId) {
      return throwError(() => new Error('Invalid user ID'));
    }

    // Convert to PascalCase for API
    const apiProject = {
      Name: project.name,
      Objectives: project.objectives,
      Scope: project.scope,
      Technologies: project.technologies,
      EstimatedTimeline: project.estimatedTimeline,
      TeamMemberIds: project.teamMemberIds,
      IsActive: project.isActive
    };

    // First get the current project to preserve its data
    return this.getProject(id).pipe(
      switchMap(currentProject => 
        this.http.put<void>(`${this.API_URL}/Project/${id}?userId=${userId}`, apiProject).pipe(
          map(() => ({
            ...currentProject,
            name: project.name,
            objectives: project.objectives,
            scope: project.scope,
            technologies: project.technologies,
            estimatedTimeline: project.estimatedTimeline.toISOString(),
            isActive: project.isActive ?? currentProject.isActive
          }))
        )
      ),
      catchError(error => {
        // If it's a 204 No Content, consider it a success
        if (error.status === 204) {
          return of({
            projectId: id,
            name: project.name,
            objectives: project.objectives,
            scope: project.scope,
            technologies: project.technologies,
            estimatedTimeline: project.estimatedTimeline.toISOString(),
            createdDate: new Date().toISOString(),
            isActive: project.isActive ?? true,
            createdByUserId: userId,
            createdByUsername: currentUser.username || currentUser.Username || '',
            members: [] // Will be refreshed on next load
          } as Project);
        }
        return this.handleError(error);
      })
    );
  }

  deleteProject(id: number): Observable<void> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      return throwError(() => new Error('No user logged in'));
    }

    const userId = currentUser.userId || currentUser.UserId;
    if (!userId) {
      return throwError(() => new Error('Invalid user ID'));
    }

    return this.http.delete<void>(`${this.API_URL}/Project/${id}?userId=${userId}`).pipe(
      catchError(this.handleError)
    );
  }

  getPendingRequests(projectId: number, leadDeveloperId: number): Observable<PendingAccessRequest[]> {
    return this.http.get<any[]>(`${this.API_URL}/ProjectMember/pendingRequests/${projectId}?leadDeveloperId=${leadDeveloperId}`).pipe(
      map(requests => {
        if (!Array.isArray(requests)) {
          console.error('Invalid requests response:', requests);
          throw new Error('Invalid response format from server');
        }
        return requests.map(request => ({
          projectMemberId: request.ProjectMemberId || request.projectMemberId,
          projectId: request.ProjectId || request.projectId,
          userId: request.UserId || request.userId,
          username: request.Username || request.username,
          email: request.Email || request.email,
          requestDate: new Date(request.RequestDate || request.requestDate)
        }));
      }),
      catchError(this.handleError)
    );
  }

  approveAccess(approvalDto: AccessApprovalDTO): Observable<any> {
    const url = `${this.API_URL}/ProjectMember/approveAccess`;
    const body = {
      UserId: approvalDto.userId,
      ProjectId: approvalDto.projectId,
      LeadDeveloperId: approvalDto.leadDeveloperId
    };
    return this.http.post(url, body).pipe(
      catchError(error => {
        // If it's a 204 No Content, consider it a success
        if (error.status === 204) {
          return of({ message: 'Access approved successfully' });
        }
        return this.handleError(error);
      })
    );
  }

  denyAccess(approvalDto: AccessApprovalDTO): Observable<any> {
    const url = `${this.API_URL}/ProjectMember/denyAccess`;
    const body = {
      UserId: approvalDto.userId,
      ProjectId: approvalDto.projectId,
      LeadDeveloperId: approvalDto.leadDeveloperId
    };
    return this.http.post(url, body).pipe(
      catchError(error => {
        // If it's a 204 No Content, consider it a success
        if (error.status === 204) {
          return of({ message: 'Access denied successfully' });
        }
        return this.handleError(error);
      })
    );
  }

  requestAccess(projectId: number): Observable<any> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      return throwError(() => new Error('No user logged in'));
    }

    const userId = currentUser.userId || currentUser.UserId;
    if (!userId) {
      return throwError(() => new Error('Invalid user ID'));
    }

    const request = {
      ProjectId: projectId,
      UserId: userId
    };

    return this.http.post(`${this.API_URL}/ProjectMember/requestAccess`, request).pipe(
      catchError(error => {
        // If it's a 204 No Content, consider it a success
        if (error.status === 204) {
          return of({ message: 'Access request submitted successfully' });
        }
        return this.handleError(error);
      })
    );
  }

  getAllProjects(): Observable<Project[]> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      return throwError(() => new Error('No user logged in'));
    }

    const userId = currentUser.userId || currentUser.UserId;
    if (!userId) {
      return throwError(() => new Error('Invalid user ID'));
    }

    return this.http.get<any[]>(`${this.API_URL}/Project/All?userId=${userId}`).pipe(
      map(apiProjects => apiProjects.map(apiProject => this.convertProject(apiProject))),
      catchError(this.handleError)
    );
  }
} 