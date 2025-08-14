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
  isAvailable?: boolean;
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
  profilePicture?: string | null;
}

export interface PendingAccessRequestWithProject extends PendingAccessRequest {
  projectName: string;
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
      isAvailable: typeof apiProject.IsAvailable === 'boolean' ? apiProject.IsAvailable : false,
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
    console.log(`Calling: ${this.API_URL}/ProjectMember/pendingRequests?projectId=${projectId}&leadDeveloperId=${leadDeveloperId}`);
    return this.http.get<any[]>(`${this.API_URL}/ProjectMember/pendingRequests?projectId=${projectId}&leadDeveloperId=${leadDeveloperId}`).pipe(
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
    const url = `${this.API_URL}/Project/review-access-request`;
    const body = {
      RequestId: approvalDto.userId, // This should be requestId, but we're using userId as identifier for now
      ReviewedBy: approvalDto.leadDeveloperId,
      IsApproved: true,
      AssignedRole: 'Developer',
      ReviewerComments: 'Approved via access request management'
    };
    console.log('Approving access with URL:', url, 'Body:', body);
    return this.http.put(url, body).pipe(
      tap(response => console.log('Approve access response:', response)),
      catchError(error => {
        console.error('Approve access error:', error);
        // If it's a 200/204, consider it a success
        if (error.status === 200 || error.status === 204) {
          return of({ message: 'Access approved successfully' });
        }
        return this.handleError(error);
      })
    );
  }

  denyAccess(approvalDto: AccessApprovalDTO): Observable<any> {
    const url = `${this.API_URL}/Project/review-access-request`;
    const body = {
      RequestId: approvalDto.userId, // This should be requestId, but we're using userId as identifier for now
      ReviewedBy: approvalDto.leadDeveloperId,
      IsApproved: false,
      RejectionReason: 'Denied via access request management',
      ReviewerComments: 'Denied via access request management'
    };
    console.log('Denying access with URL:', url, 'Body:', body);
    return this.http.put(url, body).pipe(
      tap(response => console.log('Deny access response:', response)),
      catchError(error => {
        console.error('Deny access error:', error);
        // If it's a 200/204, consider it a success
        if (error.status === 200 || error.status === 204) {
          return of({ message: 'Access denied successfully' });
        }
        return this.handleError(error);
      })
    );
  }

  requestAccess(projectId: number, message?: string): Observable<any> {
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
      UserId: userId,
      Message: message || ''
    };

    return this.http.post(`${this.API_URL}/Project/request-access`, request).pipe(
      tap(response => {
        console.log('Request access response:', response);
      }),
      catchError(error => {
        console.error('Request access error:', error);
        // If it's a 200/204, consider it a success
        if (error.status === 200 || error.status === 204) {
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

  // Get available projects for developers to request access
  getAvailableProjects(): Observable<Project[]> {
    return this.http.get<any[]>(`${this.API_URL}/Project/available`).pipe(
      tap(response => {
        console.log('Available projects API response:', response);
      }),
      map(apiProjects => {
        if (!Array.isArray(apiProjects)) {
          console.error('Invalid available projects response:', apiProjects);
          throw new Error('Invalid response format from server');
        }
        return apiProjects.map(apiProject => this.convertProject(apiProject));
      }),
      catchError(this.handleError)
    );
  }

  // Get all pending requests for all projects that the user manages (Lead Developer only)
  getAllPendingRequestsForUser(leadDeveloperId: number): Observable<PendingAccessRequestWithProject[]> {
    console.log('🔍 SERVICE DEBUG: Getting all pending requests for lead developer:', leadDeveloperId);
    
    // First get all projects for the user
    return this.getProjects().pipe(
      switchMap(projects => {
        console.log('🔍 SERVICE DEBUG: Projects loaded for pending requests:', projects);
        
        const leadProjects = projects.filter(project => 
          project.members.some(member => {
            console.log(`🔍 SERVICE DEBUG: Checking member - userId: ${member.userId}, role: ${member.role}, leadDevId: ${leadDeveloperId}`);
            const isLeadDev = member.role === 'LeadDeveloper' || member.role === 'Lead Developer' || member.role === 'leaddeveloper';
            const isMatchingUser = member.userId === leadDeveloperId;
            console.log(`🔍 SERVICE DEBUG: isLeadDev: ${isLeadDev}, isMatchingUser: ${isMatchingUser}`);
            return isMatchingUser && isLeadDev;
          })
        );
        
        console.log('🔍 SERVICE DEBUG: Lead developer projects:', leadProjects);

        if (leadProjects.length === 0) {
          console.log('🔍 SERVICE DEBUG: No projects found for lead developer');
          console.log('🔍 SERVICE DEBUG: Trying to get ALL projects to debug...');
          
          // Let's try getting requests from ALL projects as a fallback for debugging
          const allProjectObservables = projects.map(project => {
            console.log(`🔍 SERVICE DEBUG: Testing project: ${project.name} (${project.projectId})`);
            return this.getProjectAccessRequests(project.projectId, leadDeveloperId).pipe(
              map(requests => {
                console.log(`🔍 SERVICE DEBUG: Requests for ANY project ${project.name}:`, requests);
                return requests.map(request => ({
                  // Map ProjectAccessRequestSummaryDTO fields
                  projectMemberId: request.requestId || request.RequestId,
                  projectId: project.projectId,
                  userId: request.userId || request.UserId, // Now available from backend
                  username: request.username || request.Username,
                  email: request.userEmail || request.UserEmail,
                  requestDate: new Date(request.requestDate || request.RequestDate),
                  projectName: request.projectName || project.name,
                  message: request.message || request.Message,
                  status: request.status || request.Status,
                  // Profile picture will be fetched using userId via UserService
                  profilePicture: null
                }));
              }),
              catchError(error => {
                console.warn(`🔍 SERVICE DEBUG: Error loading requests for ANY project ${project.name}:`, error);
                return of([]);
              })
            );
          });

          if (allProjectObservables.length === 0) {
            return of([]);
          }

          // Combine all the observables and flatten the results
          return allProjectObservables.reduce((acc, current) => {
            return acc.pipe(
              switchMap(accRequests => 
                current.pipe(
                  map(currentRequests => [...accRequests, ...currentRequests])
                )
              )
            );
          }, of([] as PendingAccessRequestWithProject[]));
        }

        // Get pending requests for each project using new API
        const requestObservables = leadProjects.map(project => {
          console.log(`🔍 SERVICE DEBUG: Getting pending requests for project: ${project.name} (${project.projectId})`);
          return this.getProjectAccessRequests(project.projectId, leadDeveloperId).pipe(
            map(requests => {
              console.log(`🔍 SERVICE DEBUG: Requests for project ${project.name}:`, requests);
              return requests.map(request => ({
                // Map ProjectAccessRequestSummaryDTO fields
                projectMemberId: request.requestId || request.RequestId,
                projectId: project.projectId,
                userId: request.userId || request.UserId, // Now available from backend
                username: request.username || request.Username,
                email: request.userEmail || request.UserEmail,
                requestDate: new Date(request.requestDate || request.RequestDate),
                projectName: request.projectName || project.name,
                message: request.message || request.Message,
                status: request.status || request.Status,
                // Profile picture will be fetched using userId via UserService
                profilePicture: null
              }));
            }),
            catchError(error => {
              console.warn(`🔍 SERVICE DEBUG: Error loading requests for project ${project.name}:`, error);
              return of([]);
            })
          );
        });

        // Use forkJoin to combine all observables
        if (requestObservables.length === 0) {
          return of([]);
        }

        // Combine all the observables and flatten the results
        return requestObservables.reduce((acc, current) => {
          return acc.pipe(
            switchMap(accRequests => 
              current.pipe(
                map(currentRequests => [...accRequests, ...currentRequests])
              )
            )
          );
        }, of([] as PendingAccessRequestWithProject[]));
      }),
      tap(allRequests => console.log('All pending requests combined:', allRequests)),
      catchError(error => {
        console.error('Error in getAllPendingRequestsForUser:', error);
        return this.handleError(error);
      })
    );
  }

  // Get access requests for a specific project using new API
  getProjectAccessRequests(projectId: number, requesterId: number): Observable<any[]> {
    // Based on your backend: GET api/Project/access-requests/{projectId}?requesterId={requesterId}
    const url = `${this.API_URL}/Project/access-requests/${projectId}?requesterId=${requesterId}`;
    console.log('🔍 SERVICE DEBUG: Calling API:', url);
    
    return this.http.get<any[]>(url).pipe(
      tap(response => {
        console.log('🔍 SERVICE DEBUG: Project access requests response:', response);
      }),
      map(requests => {
        if (!Array.isArray(requests)) {
          console.error('🔍 SERVICE DEBUG: Invalid project access requests response:', requests);
          throw new Error('Invalid response format from server');
        }
        // Filter for pending requests - backend returns ProjectAccessRequestSummaryDTO
        // ProjectAccessRequestStatus enum: Pending = 0, Approved = 1, Denied = 2
        const pendingRequests = requests.filter(request => {
          const status = request.status || request.Status;
          const isPending = status === 'Pending' || status === 0 || status === 'pending';
          console.log('🔍 SERVICE DEBUG: Request status check - status:', status, 'isPending:', isPending);
          return isPending;
        });
        console.log('🔍 SERVICE DEBUG: Filtered pending requests:', pendingRequests);
        return pendingRequests;
      }),
      catchError(error => {
        console.error('🔍 SERVICE DEBUG: API Error:', error);
        return this.handleError(error);
      })
    );
  }

  // Review access request using new API
  reviewAccessRequest(reviewDto: any): Observable<any> {
    const url = `${this.API_URL}/Project/review-access-request`;
    console.log('Reviewing access request with URL:', url, 'Body:', reviewDto);
    return this.http.put(url, reviewDto).pipe(
      tap(response => console.log('Review access request response:', response)),
      catchError(error => {
        console.error('Review access request error:', error);
        // If it's a 200/204, consider it a success
        if (error.status === 200 || error.status === 204) {
          return of({ message: 'Access request reviewed successfully' });
        }
        return this.handleError(error);
      })
    );
  }

  // Update project availability (Lead Developer only)
  updateProjectAvailability(projectId: number, isAvailable: boolean, updatedBy: number): Observable<any> {
    const url = `${this.API_URL}/Project/availability`;
    const body = {
      ProjectId: projectId,
      IsAvailable: isAvailable,
      UpdatedBy: updatedBy
    };
    console.log('Updating project availability with URL:', url, 'Body:', body);
    return this.http.put(url, body).pipe(
      tap(response => console.log('Update project availability response:', response)),
      catchError(error => {
        console.error('Update project availability error:', error);
        // If it's a 200/204, consider it a success
        if (error.status === 200 || error.status === 204) {
          return of({ message: 'Project availability updated successfully' });
        }
        return this.handleError(error);
      })
    );
  }
} 