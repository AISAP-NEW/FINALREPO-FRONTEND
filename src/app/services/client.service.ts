import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Project } from './project.service';

export interface Client {
  clientId: number;
  name: string;
  address: string;
  telephoneNumber: string;
  email: string;
  projects: Project[];
  // Add these for API response compatibility
  ClientId?: number;
  Name?: string;
  Address?: string;
  TelephoneNumber?: string;
  Email?: string;
  Projects?: Project[];
}

export interface CreateClientDTO {
  name: string;
  address: string;
  telephoneNumber: string;
  email: string;
}

export interface UpdateClientDTO {
  name: string;
  address: string;
  telephoneNumber: string;
  email: string;
}

@Injectable({
  providedIn: 'root'
})
export class ClientService {
  private apiUrl = `${environment.apiUrl}/api/client`;

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
        errorMessage = 'Client not found.';
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      }
    }
    
    return throwError(() => new Error(errorMessage));
  }

  private normalizeClient(apiClient: any): Client {
    console.log('Normalizing client data:', apiClient);
    console.log('Client projects from API:', apiClient.Projects || apiClient.projects);
    
    const normalizedClient = {
      clientId: apiClient.ClientId || apiClient.clientId || 0,
      name: apiClient.Name || apiClient.name || '',
      address: apiClient.Address || apiClient.address || '',
      telephoneNumber: apiClient.TelephoneNumber || apiClient.telephoneNumber || '',
      email: apiClient.Email || apiClient.email || '',
      projects: apiClient.Projects || apiClient.projects || [],
      // Keep original properties for API compatibility
      ClientId: apiClient.ClientId || apiClient.clientId || 0,
      Name: apiClient.Name || apiClient.name || '',
      Address: apiClient.Address || apiClient.address || '',
      TelephoneNumber: apiClient.TelephoneNumber || apiClient.telephoneNumber || '',
      Email: apiClient.Email || apiClient.email || '',
      Projects: apiClient.Projects || apiClient.projects || []
    };
    
    console.log('Normalized client:', normalizedClient);
    console.log('Normalized projects:', normalizedClient.projects);
    normalizedClient.projects.forEach((project: any, index: number) => {
      console.log(`Project ${index + 1} normalized:`, {
        name: project.name || project.Name,
        isActive: project.isActive || project.IsActive,
        projectId: project.projectId || project.ProjectId,
        createdDate: project.createdDate || project.CreatedDate
      });
    });
    
    return normalizedClient;
  }

  getClients(): Observable<Client[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(
      map(clients => {
        if (!Array.isArray(clients)) {
          console.error('Invalid clients response:', clients);
          throw new Error('Invalid response format from server');
        }
        return clients.map(client => this.normalizeClient(client));
      }),
      catchError(this.handleError)
    );
  }

  getClient(id: number): Observable<Client> {
    console.log('Fetching client with ID:', id);
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      tap(response => {
        console.log('=== GET CLIENT API RESPONSE ===');
        console.log('Raw API response:', response);
        console.log('Client projects from API:', response.Projects || response.projects);
        if (response.Projects || response.projects) {
          (response.Projects || response.projects).forEach((project: any, index: number) => {
            console.log(`Project ${index + 1} from API:`, {
              name: project.name || project.Name,
              isActive: project.isActive || project.IsActive,
              projectId: project.projectId || project.ProjectId,
              createdDate: project.createdDate || project.CreatedDate
            });
          });
        }
        console.log('=== END GET CLIENT API RESPONSE ===');
      }),
      map(client => this.normalizeClient(client)),
      catchError(error => {
        console.error('Error fetching client:', error);
        return this.handleError(error);
      })
    );
  }

  createClient(client: CreateClientDTO): Observable<Client> {
    // Convert to PascalCase for API
    const apiClient = {
      Name: client.name,
      Address: client.address,
      TelephoneNumber: client.telephoneNumber,
      Email: client.email
    };

    return this.http.post<any>(this.apiUrl, apiClient).pipe(
      map(response => this.normalizeClient(response)),
      catchError(this.handleError)
    );
  }

  updateClient(id: number, client: UpdateClientDTO): Observable<void> {
    // Convert to PascalCase for API
    const apiClient = {
      Name: client.name,
      Address: client.address,
      TelephoneNumber: client.telephoneNumber,
      Email: client.email
    };

    return this.http.put<void>(`${this.apiUrl}/${id}`, apiClient).pipe(
      catchError(error => {
        // If it's a 204 No Content, consider it a success
        if (error.status === 204) {
          return of(undefined);
        }
        return this.handleError(error);
      })
    );
  }

  deleteClient(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      map(response => {
        // Handle successful deletion
        console.log('Client deleted successfully');
        return response;
      }),
      catchError(this.handleError)
    );
  }

  assignProjectToClient(clientId: number, projectId: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${clientId}/project/${projectId}`, {}).pipe(
      catchError(error => {
        // If it's a 204 No Content or 200 OK with no body, consider it a success
        if (error.status === 204 || (error.status === 200 && !error.error)) {
          return of(undefined);
        }
        return this.handleError(error);
      })
    );
  }

  removeProjectFromClient(clientId: number, projectId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${clientId}/project/${projectId}`).pipe(
      catchError(error => {
        // If it's a 204 No Content or 200 OK with no body, consider it a success
        if (error.status === 204 || (error.status === 200 && !error.error)) {
          return of(undefined);
        }
        return this.handleError(error);
      })
    );
  }
} 