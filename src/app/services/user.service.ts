import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Project } from './project.service';

export interface User {
  userId: number;
  username: string;
  email: string;
  role: string;
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
  private readonly API_URL = 'http://localhost:5183/api';

  constructor(private http: HttpClient) {}

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.API_URL}/User`);
  }

  getUserWithProjects(userId: number): Observable<UserWithProjects> {
    return this.http.get<UserWithProjects>(`${this.API_URL}/User/${userId}`);
  }

  directAssignToProject(projectId: number, userId: number, leadDeveloperId: number, role: string = 'Developer'): Observable<DirectAssignResponse> {
    const url = `${this.API_URL}/User/directAssign`;
    const params = { leadDeveloperId: leadDeveloperId.toString() };
    const body = {
      projectId,
      userId,
      role
    };

    return this.http.post<DirectAssignResponse>(url, body, { params }).pipe(
      map(response => {
        // If the response is a string, wrap it in an object
        if (typeof response === 'string') {
          return { message: response };
        }
        return response;
      })
    );
  }

  deleteUser(userId: number): Observable<void> {
    const url = `${this.API_URL}/User/${userId}`;
    return this.http.delete<void>(url);
  }
} 