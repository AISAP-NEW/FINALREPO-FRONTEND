import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
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

	private handleError(error: HttpErrorResponse) {
		console.error('Taxonomy service error:', error);
		let errorMessage = 'An error occurred';
		
		if (error.error instanceof ErrorEvent) {
			// Client-side error
			errorMessage = error.error.message;
		} else {
			// Server-side error
			errorMessage = error.error?.message || error.message || `Server returned ${error.status}: ${error.statusText}`;
		}
		
		return throwError(() => new Error(errorMessage));
	}

	// Categories - Fixed to use the correct backend endpoints
	getCategories(): Observable<Category[]> {
		console.log('Fetching categories from:', `${this.apiBase}/api/Category`);
		return this.http.get<Category[]>(`${this.apiBase}/api/Category`).pipe(
			tap(categories => console.log('Categories received:', categories)),
			catchError(this.handleError)
		);
	}

	createCategory(payload: { CategoryName: string; Description?: string }): Observable<Category> {
		console.log('Creating category:', payload);
		return this.http.post<Category>(`${this.apiBase}/api/Category`, payload, this.jsonHeaders).pipe(
			tap(category => console.log('Category created:', category)),
			catchError(this.handleError)
		);
	}

	updateCategory(categoryId: number, payload: { CategoryName?: string; Description?: string }): Observable<void> {
		console.log('Updating category:', categoryId, payload);
		return this.http.put<void>(`${this.apiBase}/api/Category/${categoryId}`, payload, this.jsonHeaders).pipe(
			tap(() => console.log('Category updated:', categoryId)),
			catchError(this.handleError)
		);
	}

	deleteCategory(categoryId: number): Observable<void> {
		console.log('Deleting category:', categoryId);
		return this.http.delete<void>(`${this.apiBase}/api/Category/${categoryId}`).pipe(
			tap(() => console.log('Category deleted:', categoryId)),
			catchError(this.handleError)
		);
	}

	// Topics - Fixed to use the correct backend endpoints
	getTopicsByCategory(categoryId: number): Observable<Topic[]> {
		console.log('Fetching topics for category:', categoryId, 'from:', `${this.apiBase}/api/Category/topics-by-category/${categoryId}`);
		// Use the correct endpoint that exists in your backend
		return this.http.get<Topic[]>(`${this.apiBase}/api/Category/topics-by-category/${categoryId}`).pipe(
			tap(topics => console.log('Topics received for category', categoryId, ':', topics)),
			catchError(this.handleError)
		);
	}

	createTopic(payload: { TopicName: string; Description?: string; Category_ID: number }): Observable<Topic> {
		console.log('Creating topic:', payload);
		return this.http.post<Topic>(`${this.apiBase}/api/Topic`, payload, this.jsonHeaders).pipe(
			tap(topic => console.log('Topic created:', topic)),
			catchError(this.handleError)
		);
	}

	updateTopic(topicId: number, payload: { TopicName?: string; Description?: string; Category_ID?: number }): Observable<void> {
		console.log('Updating topic:', topicId, payload);
		return this.http.put<void>(`${this.apiBase}/api/Topic/${topicId}`, payload, this.jsonHeaders).pipe(
			tap(() => console.log('Topic updated:', topicId)),
			catchError(this.handleError)
		);
	}

	deleteTopic(topicId: number): Observable<void> {
		console.log('Deleting topic:', topicId);
		return this.http.delete<void>(`${this.apiBase}/api/Topic/${topicId}`).pipe(
			tap(() => console.log('Topic deleted:', topicId)),
			catchError(this.handleError)
		);
	}

	// Subtopics - Fixed to use the correct backend endpoints
	getSubtopicsByTopic(topicId: number): Observable<Subtopic[]> {
		console.log('Fetching subtopics for topic:', topicId, 'from:', `${this.apiBase}/api/Topic/${topicId}/subtopics`);
		return this.http.get<Subtopic[]>(`${this.apiBase}/api/Topic/${topicId}/subtopics`).pipe(
			tap(subtopics => console.log('Subtopics received for topic', topicId, ':', subtopics)),
			catchError(this.handleError)
		);
	}

	createSubtopic(payload: { SubtopicName: string; Description?: string; Topic_ID: number }): Observable<Subtopic> {
		console.log('Creating subtopic:', payload);
		return this.http.post<Subtopic>(`${this.apiBase}/api/Subtopic`, payload, this.jsonHeaders).pipe(
			tap(subtopic => console.log('Subtopic created:', subtopic)),
			catchError(this.handleError)
		);
	}

	updateSubtopic(subtopicId: number, payload: { SubtopicName?: string; Description?: string; Topic_ID?: number }): Observable<void> {
		console.log('Updating subtopic:', subtopicId, payload);
		return this.http.put<void>(`${this.apiBase}/api/Subtopic/${subtopicId}`, payload, this.jsonHeaders).pipe(
			tap(() => console.log('Subtopic updated:', subtopicId)),
			catchError(this.handleError)
		);
	}

	deleteSubtopic(subtopicId: number): Observable<void> {
		console.log('Deleting subtopic:', subtopicId);
		return this.http.delete<void>(`${this.apiBase}/api/Subtopic/${subtopicId}`).pipe(
			tap(() => console.log('Subtopic deleted:', subtopicId)),
			catchError(this.handleError)
		);
	}

	// Bonus: Get full hierarchy in one call (if you want to use it)
	getFullHierarchy(): Observable<any[]> {
		console.log('Fetching full hierarchy from:', `${this.apiBase}/api/Category/hierarchy`);
		return this.http.get<any[]>(`${this.apiBase}/api/Category/hierarchy`).pipe(
			tap(hierarchy => console.log('Full hierarchy received:', hierarchy)),
			catchError(this.handleError)
		);
	}
}


