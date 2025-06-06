import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Project } from './project.service';

export interface Client {
  clientId: number;
  name: string;
  address: string;
  telephoneNumber: string;
  email: string;
  projects: Project[];
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

  getClients(): Observable<Client[]> {
    return this.http.get<Client[]>(this.apiUrl);
  }

  getClient(id: number): Observable<Client> {
    return this.http.get<Client>(`${this.apiUrl}/${id}`);
  }

  createClient(client: CreateClientDTO): Observable<Client> {
    return this.http.post<Client>(this.apiUrl, client);
  }

  updateClient(id: number, client: UpdateClientDTO): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, client);
  }

  deleteClient(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  assignProjectToClient(clientId: number, projectId: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${clientId}/project/${projectId}`, {});
  }

  removeProjectFromClient(clientId: number, projectId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${clientId}/project/${projectId}`);
  }
} 