import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AppUser {
	userId: number;
	username: string;
	email: string;
	role: string;
}

export type RoleName = 'IT Admin' | 'Lead Developer' | 'Developer' | string;

export interface RolePermission {
	resource: 'users' | 'roles' | 'categories' | 'topics' | 'subtopics' | string;
	create: boolean;
	read: boolean;
	update: boolean;
	delete: boolean;
}

@Injectable({ providedIn: 'root' })
export class RbacService {
	private base = environment.apiUrl;

	constructor(private http: HttpClient) {}

	// Users
	getUsers(): Observable<AppUser[]> { return this.http.get<AppUser[]>(`${this.base}/api/User`); }
	createUser(payload: Partial<AppUser> & { password?: string }): Observable<AppUser> { return this.http.post<AppUser>(`${this.base}/api/User/admin/create`, payload); }
	updateUser(userId: number, payload: Partial<AppUser>): Observable<void> { return this.http.put<void>(`${this.base}/api/User/admin/${userId}`, payload); }
	deleteUser(userId: number): Observable<void> { return this.http.delete<void>(`${this.base}/api/User/${userId}`); }
	assignRole(userId: number, role: RoleName): Observable<void> { return this.http.put<void>(`${this.base}/api/User/${userId}/role`, { role }); }

	// Roles & permissions
	getRoles(): Observable<RoleName[]> { return this.http.get<RoleName[]>(`${this.base}/api/Role`); }
	getRolePermissions(role: RoleName): Observable<RolePermission[]> { return this.http.get<RolePermission[]>(`${this.base}/api/Role/${encodeURIComponent(role)}/permissions`); }
	updateRolePermissions(role: RoleName, permissions: RolePermission[]): Observable<void> { return this.http.put<void>(`${this.base}/api/Role/${encodeURIComponent(role)}/permissions`, permissions); }
}


