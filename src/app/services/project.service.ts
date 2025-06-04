import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { tap } from 'rxjs/operators';

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
}

export interface ProjectAccessRequestDTO {
  projectId: number;
  userId: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private readonly API_URL = 'http://localhost:5183/api';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  getProjects(): Observable<Project[]> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('No user logged in');
    }
    console.log('Getting projects for user:', currentUser); // Debug log
    return this.http.get<Project[]>(`${this.API_URL}/Project?userId=${currentUser.userId}`).pipe(
      tap(projects => {
        console.log('Projects received:', projects); // Debug log
        // Ensure members array exists for each project
        return projects.map(project => ({
          ...project,
          members: project.members || []
        }));
      })
    );
  }

  getProject(id: number): Observable<Project> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('No user logged in');
    }
    return this.http.get<Project>(`${this.API_URL}/Project/${id}?userId=${currentUser.userId}`);
  }

  createProject(project: CreateProjectDTO): Observable<Project> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('No user logged in');
    }
    return this.http.post<Project>(`${this.API_URL}/Project?userId=${currentUser.userId}`, project);
  }

  updateProject(id: number, project: CreateProjectDTO): Observable<Project> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('No user logged in');
    }
    return this.http.put<Project>(`${this.API_URL}/Project/${id}?userId=${currentUser.userId}`, project);
  }

  deleteProject(id: number): Observable<void> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('No user logged in');
    }
    return this.http.delete<void>(`${this.API_URL}/Project/${id}?userId=${currentUser.userId}`);
  }

  getPendingRequests(projectId: number): Observable<any[]> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('No user logged in');
    }
    return this.http.get<any[]>(`${this.API_URL}/ProjectMember/pending/${projectId}?userId=${currentUser.userId}`);
  }

  approveAccess(projectId: number, userId: number, approverUserId: number): Observable<any> {
    return this.http.post(`${this.API_URL}/ProjectMember/approve`, {
      projectId,
      userId,
      approverUserId
    });
  }

  denyAccess(projectId: number, userId: number, approverUserId: number): Observable<any> {
    return this.http.post(`${this.API_URL}/ProjectMember/deny`, {
      projectId,
      userId,
      approverUserId
    });
  }

  requestAccess(projectId: number): Observable<any> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('No user logged in');
    }
    const request: ProjectAccessRequestDTO = {
      projectId,
      userId: currentUser.userId
    };
    return this.http.post(`${this.API_URL}/ProjectMember/requestAccess`, request);
  }

  getAllProjects(): Observable<Project[]> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('No user logged in');
    }
    return this.http.get<Project[]>(`${this.API_URL}/Project/All?userId=${currentUser.userId}`);
  }
} 