import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Category {
	Category_ID: number;
	CategoryName: string;
	Description?: string;
}

export interface Topic {
	Topic_ID: number;
	TopicName: string;
	Description?: string;
	Category_ID?: number;
}

export interface Subtopic {
	Subtopic_ID: number;
	SubtopicName: string;
	Description?: string;
	Topic_ID?: number;
}

@Injectable({ providedIn: 'root' })
export class TaxonomyService {
	private apiBase = environment.apiUrl;
	private jsonHeaders = { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) };

	constructor(private http: HttpClient) {}

	// Categories
	getCategories(): Observable<Category[]> {
		return this.http.get<Category[]>(`${this.apiBase}/api/Category/all`);
	}

	createCategory(payload: { CategoryName: string; Description?: string }): Observable<Category> {
		return this.http.post<Category>(`${this.apiBase}/api/Category`, payload, this.jsonHeaders);
	}

	updateCategory(categoryId: number, payload: { CategoryName?: string; Description?: string }): Observable<void> {
		return this.http.put<void>(`${this.apiBase}/api/Category/${categoryId}`, payload, this.jsonHeaders);
	}

	deleteCategory(categoryId: number): Observable<void> {
		return this.http.delete<void>(`${this.apiBase}/api/Category/${categoryId}`);
	}

	// Topics
	getTopicsByCategory(categoryId: number): Observable<Topic[]> {
		return this.http.get<Topic[]>(`${this.apiBase}/api/Category/topics-by-category/${categoryId}`);
	}

	createTopic(payload: { TopicName: string; Description?: string; Category_ID: number }): Observable<Topic> {
		return this.http.post<Topic>(`${this.apiBase}/api/Topic`, payload, this.jsonHeaders);
	}

	updateTopic(topicId: number, payload: { TopicName?: string; Description?: string; Category_ID?: number }): Observable<void> {
		return this.http.put<void>(`${this.apiBase}/api/Topic/${topicId}`, payload, this.jsonHeaders);
	}

	deleteTopic(topicId: number): Observable<void> {
		return this.http.delete<void>(`${this.apiBase}/api/Topic/${topicId}`);
	}

	// Subtopics
	getSubtopicsByTopic(topicId: number): Observable<Subtopic[]> {
		return this.http.get<Subtopic[]>(`${this.apiBase}/api/Topic/${topicId}/subtopics`);
	}

	createSubtopic(payload: { SubtopicName: string; Description?: string; Topic_ID: number }): Observable<Subtopic> {
		return this.http.post<Subtopic>(`${this.apiBase}/api/Subtopic`, payload, this.jsonHeaders);
	}

	updateSubtopic(subtopicId: number, payload: { SubtopicName?: string; Description?: string; Topic_ID?: number }): Observable<void> {
		return this.http.put<void>(`${this.apiBase}/api/Subtopic/${subtopicId}`, payload, this.jsonHeaders);
	}

	deleteSubtopic(subtopicId: number): Observable<void> {
		return this.http.delete<void>(`${this.apiBase}/api/Subtopic/${subtopicId}`);
	}
}


