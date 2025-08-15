import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { RbacPanelComponent } from '../../components/rbac-panel/rbac-panel.component';
import {
	IonHeader,
	IonToolbar,
	IonTitle,
	IonContent,
	IonButtons,
	IonButton,
	IonIcon,
	IonItem,
	IonLabel,
	IonInput,
	IonTextarea,
	IonSearchbar,
	IonList,
	IonAccordion,
	IonAccordionGroup,
	IonItemDivider,
	IonSelect,
	IonSelectOption,
	IonCard,
	IonCardHeader,
	IonCardTitle,
	IonCardContent
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, createOutline, trashOutline, saveOutline, closeOutline, bookOutline, swapHorizontalOutline } from 'ionicons/icons';
import { TaxonomyService, Category, Topic, Subtopic } from '../../services/taxonomy.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { environment } from '../../../environments/environment';

type AppRole = 'IT Admin' | 'Lead Developer' | 'Developer' | string;

@Component({
	selector: 'app-taxonomy-management',
	standalone: true,
	imports: [
		CommonModule,
		FormsModule,
		ReactiveFormsModule,
		RouterModule,
		IonHeader,
		IonToolbar,
		IonTitle,
		IonContent,
		IonButtons,
		IonButton,
		IonIcon,
		IonItem,
		IonLabel,
		IonInput,
		IonTextarea,
		IonSearchbar,
		IonList,
		IonAccordion,
		IonAccordionGroup,
		IonItemDivider,
		IonSelect,
		IonSelectOption,
		IonCard,
		IonCardHeader,
		IonCardTitle,
		IonCardContent
		,
		RbacPanelComponent
	],
	templateUrl: './taxonomy-management.page.html',
	styleUrls: ['./taxonomy-management.page.scss']
})
export class TaxonomyManagementPage implements OnInit {
	role: AppRole = '';
	categories = signal<Category[]>([]);
	topicsByCategory = signal<Record<number, Topic[]>>({});
	subtopicsByTopic = signal<Record<number, Subtopic[]>>({});

	search = signal<string>('');
	allTopics = computed(() => ([] as Topic[]).concat(...Object.values(this.topicsByCategory())));
	allSubtopics = computed(() => {
		const result: Array<Subtopic & { __topicId: number }> = [];
		for (const [topicIdStr, subs] of Object.entries(this.subtopicsByTopic())) {
			const topicId = Number(topicIdStr);
			for (const s of subs || []) result.push({ ...s, __topicId: topicId });
		}
		return result;
	});

	// Selection for edit panel
	selectedCategoryId = signal<number | null>(null);
	selectedTopicId = signal<number | null>(null);
	selectedSubtopicId = signal<number | null>(null);

	selectedCategory = computed(() => this.categories().find(c => c.Category_ID === this.selectedCategoryId()!) || null);
	selectedTopic = computed(() => {
		const catId = this.selectedCategoryId();
		const tid = this.selectedTopicId();
		if (catId == null || tid == null) return null;
		return (this.topicsByCategory()[catId] || []).find(t => t.Topic_ID === tid) || null;
	});
	selectedSubtopic = computed(() => {
		const tid = this.selectedTopicId();
		const sid = this.selectedSubtopicId();
		if (tid == null || sid == null) return null;
		return (this.subtopicsByTopic()[tid] || []).find(s => s.Subtopic_ID === sid) || null;
	});

	// Left nav section selection - removed dashboard and user-management
	selectedSection = signal<'categories' | 'topics' | 'subtopics'>('categories');

	// Inline edit tracking
	editingCategoryId = signal<number | null>(null);
	editingTopicId = signal<number | null>(null);
	editingSubtopicId = signal<number | null>(null);

	categoryForm: FormGroup;
	topicForm: FormGroup;
	subtopicForm: FormGroup;

	filteredCategories = computed(() => {
		const q = this.search().toLowerCase().trim();
		if (!q) return this.categories();
		return this.categories().filter(c =>
			(c.CategoryName?.toLowerCase().includes(q)) ||
			(this.topicsByCategory()[c.Category_ID]?.some(t => t.TopicName?.toLowerCase().includes(q))) ||
			(([] as Subtopic[]).concat(...Object.values(this.subtopicsByTopic())).some(s => s.SubtopicName?.toLowerCase().includes(q)))
		);
	});

	get canCreateOrUpdate(): boolean {
		return this.role === 'IT Admin' || this.role === 'Lead Developer' || this.role === 'Developer';
	}

	get canDelete(): boolean {
		return this.role === 'IT Admin' || this.role === 'Lead Developer';
	}

	constructor(
		private taxonomy: TaxonomyService,
		private auth: AuthService,
		private toast: ToastService,
		private fb: FormBuilder,
		private alertCtrl: AlertController
	) {
		console.log('TaxonomyManagementPage constructor called');
		addIcons({ addOutline, createOutline, trashOutline, saveOutline, closeOutline, bookOutline, swapHorizontalOutline });
		this.categoryForm = this.fb.group({
			CategoryName: ['', [Validators.required, Validators.minLength(2)]],
			Description: ['']
		});
		this.topicForm = this.fb.group({
			TopicName: ['', [Validators.required, Validators.minLength(2)]],
			Description: [''],
			Category_ID: [null, [Validators.required]]
		});
		this.subtopicForm = this.fb.group({
			SubtopicName: ['', [Validators.required, Validators.minLength(2)]],
			Description: [''],
			Topic_ID: [null, [Validators.required]]
		});
	}

	onSearchInput(event: any): void {
		const value = (event?.detail && typeof event.detail.value === 'string') ? event.detail.value : '';
		this.search.set(value);
	}

	// Selection handlers - improved with better error handling and logging
	selectCategory(c: Category): void {
		console.log('Selecting category:', c);
		this.selectedCategoryId.set(c.Category_ID);
		this.selectedTopicId.set(null);
		this.selectedSubtopicId.set(null);
		this.categoryForm.reset({ CategoryName: c.CategoryName, Description: c.Description || '' });
		// Set section to categories when selecting a category
		this.selectedSection.set('categories');
	}

	selectTopic(t: Topic, categoryId: number): void {
		console.log('Selecting topic:', t, 'from category:', categoryId);
		this.selectedCategoryId.set(categoryId);
		this.selectedTopicId.set(t.Topic_ID);
		this.selectedSubtopicId.set(null);
		this.topicForm.reset({ TopicName: t.TopicName, Description: t.Description || '', Category_ID: categoryId });
		// Set section to topics when selecting a topic
		this.selectedSection.set('topics');
	}

	selectSubtopic(s: Subtopic, topicId: number): void {
		console.log('Selecting subtopic:', s, 'from topic:', topicId);
		// Find owning category for completeness
		const catId = Number(Object.entries(this.topicsByCategory()).find(([, list]) => list.some(x => x.Topic_ID === topicId))?.[0]) || null;
		if (catId != null) this.selectedCategoryId.set(catId);
		this.selectedTopicId.set(topicId);
		this.selectedSubtopicId.set(s.Subtopic_ID);
		this.subtopicForm.reset({ SubtopicName: s.SubtopicName, Description: s.Description || '', Topic_ID: topicId });
		// Set section to subtopics when selecting a subtopic
		this.selectedSection.set('subtopics');
	}

	// Handle section changes
	changeSection(section: 'categories' | 'topics' | 'subtopics'): void {
		console.log('Changing section to:', section);
		this.selectedSection.set(section);
	}

	startCreateCategory(): void {
		this.selectedCategoryId.set(null);
		this.selectedTopicId.set(null);
		this.selectedSubtopicId.set(null);
		this.categoryForm.reset({ CategoryName: '', Description: '' });
		this.selectedSection.set('categories');
	}

	startCreateTopicForSelectedCategory(): void {
		if (this.selectedCategoryId() == null) return;
		this.selectedTopicId.set(null);
		this.selectedSubtopicId.set(null);
		this.topicForm.reset({ TopicName: '', Description: '', Category_ID: this.selectedCategoryId() });
		this.selectedSection.set('topics');
	}

	startCreateSubtopicForSelectedTopic(): void {
		if (this.selectedTopicId() == null) return;
		this.selectedSubtopicId.set(null);
		this.subtopicForm.reset({ SubtopicName: '', Description: '', Topic_ID: this.selectedTopicId() });
		this.selectedSection.set('subtopics');
	}

	ngOnInit(): void {
		console.log('TaxonomyManagementPage ngOnInit called');
		this.role = this.auth.getCurrentUser()?.role || this.auth.getCurrentUser()?.Role || '';
		console.log('User role:', this.role);
		console.log('Current user:', this.auth.getCurrentUser());
		
		// Test API connection first
		this.testApiConnection();
		
		// Then load categories
		this.loadCategories();
	}

	private testApiConnection(): void {
		console.log('Testing API connection...');
		console.log('Environment API URL:', environment.apiUrl);
		
		// Test if we can reach the API
		fetch(`${environment.apiUrl}/api/Category`)
			.then(response => {
				console.log('API connection test response:', {
					status: response.status,
					statusText: response.statusText,
					ok: response.ok,
					contentType: response.headers.get('content-type'),
					server: response.headers.get('server')
				});
				if (response.ok) {
					console.log('✅ API is reachable');
				} else {
					console.log('❌ API returned error status:', response.status);
				}
			})
			.catch(error => {
				console.error('❌ API connection test failed:', error);
				console.error('This usually means:');
				console.error('1. Backend is not running');
				console.error('2. Backend is running on a different port');
				console.error('3. CORS is not configured properly');
				console.error('4. Network issue');
				
				// Try a different approach - test with a simple ping
				console.log('Trying alternative connection test...');
				fetch(`${environment.apiUrl}/api/Category`, { 
					method: 'HEAD',
					mode: 'cors'
				}).then(res => {
					console.log('Alternative test result:', res.status);
				}).catch(err => {
					console.error('Alternative test also failed:', err);
				});
			});
	}

	private loadCategories(): void {
		console.log('Loading categories...');
		console.log('API URL:', environment.apiUrl);
		console.log('Full categories URL:', `${environment.apiUrl}/api/Category`);
		
		this.taxonomy.getCategories().subscribe({
			next: cats => {
				console.log('Categories loaded successfully:', cats);
				this.categories.set(cats || []);
				console.log('Categories set in component:', this.categories());
				
				// Preload topics for each category
				if (cats && cats.length > 0) {
					console.log('Preloading topics for', cats.length, 'categories');
					for (const c of this.categories()) {
						console.log('Loading topics for category:', c.CategoryName, 'ID:', c.Category_ID);
						this.loadTopics(c.Category_ID);
					}
				} else {
					console.log('No categories found, skipping topic loading');
				}
			},
			error: (error) => {
				console.error('Error loading categories:', error);
				console.error('Error details:', {
					message: error.message,
					status: error.status,
					statusText: error.statusText,
					url: error.url
				});
				this.toast.showError('Failed to load categories');
			}
		});
	}

	private loadTopics(categoryId: number): void {
		console.log('Loading topics for category:', categoryId);
		console.log('Full topics URL:', `${environment.apiUrl}/api/Category/topics-by-category/${categoryId}`);
		
		this.taxonomy.getTopicsByCategory(categoryId).subscribe({
			next: tops => {
				console.log('Topics loaded successfully for category', categoryId, ':', tops);
				this.topicsByCategory.update(map => ({ ...map, [categoryId]: tops || [] }));
				console.log('Updated topicsByCategory:', this.topicsByCategory());
				
				if (tops && tops.length > 0) {
					console.log('Preloading subtopics for', tops.length, 'topics in category', categoryId);
					for (const t of tops || []) {
						console.log('Loading subtopics for topic:', t.TopicName, 'ID:', t.Topic_ID);
						this.loadSubtopics(t.Topic_ID);
					}
				} else {
					console.log('No topics found for category', categoryId, ', skipping subtopic loading');
				}
			},
			error: (error) => {
				console.error('Error loading topics for category', categoryId, ':', error);
				console.error('Error details:', {
					message: error.message,
					status: error.status,
					statusText: error.statusText,
					url: error.url
				});
				this.toast.showError('Failed to load topics');
			}
		});
	}

	private loadSubtopics(topicId: number): void {
		console.log('Loading subtopics for topic:', topicId);
		console.log('Full subtopics URL:', `${environment.apiUrl}/api/Topic/${topicId}/subtopics`);
		
		this.taxonomy.getSubtopicsByTopic(topicId).subscribe({
			next: subs => {
				console.log('Subtopics loaded successfully for topic', topicId, ':', subs);
				this.subtopicsByTopic.update(map => ({ ...map, [topicId]: subs || [] }));
				console.log('Updated subtopicsByTopic:', this.subtopicsByTopic());
			},
			error: (error) => {
				console.error('Error loading subtopics for topic', topicId, ':', error);
				console.error('Error details:', {
					message: error.message,
					status: error.status,
					statusText: error.statusText,
					url: error.url
				});
				this.toast.showError('Failed to load subtopics');
			}
		});
	}

	// Create
	addCategory(): void {
		if (!this.canCreateOrUpdate || this.categoryForm.invalid) return;
		this.taxonomy.createCategory(this.categoryForm.value).subscribe({
			next: cat => {
				this.toast.showSuccess('Category created');
				this.categoryForm.reset();
				this.categories.set([...(this.categories()), cat]);
			},
			error: () => this.toast.showError('Failed to create category')
		});
	}

	addTopic(category: Category): void {
		if (!this.canCreateOrUpdate || this.topicForm.invalid) return;
		const payload = { ...this.topicForm.value, Category_ID: category.Category_ID };
		this.taxonomy.createTopic(payload).subscribe({
			next: topic => {
				this.toast.showSuccess('Topic created');
				this.topicForm.reset();
				const current = this.topicsByCategory()[category.Category_ID] || [];
				this.topicsByCategory.update(map => ({ ...map, [category.Category_ID]: [...current, topic] }));
			},
			error: () => this.toast.showError('Failed to create topic')
		});
	}

	addSubtopic(topic: Topic): void {
		if (!this.canCreateOrUpdate || this.subtopicForm.invalid) return;
		const payload = { ...this.subtopicForm.value, Topic_ID: topic.Topic_ID };
		this.taxonomy.createSubtopic(payload).subscribe({
			next: sub => {
				this.toast.showSuccess('Subtopic created');
				this.subtopicForm.reset();
				const current = this.subtopicsByTopic()[topic.Topic_ID] || [];
				this.subtopicsByTopic.update(map => ({ ...map, [topic.Topic_ID]: [...current, sub] }));
			},
			error: () => this.toast.showError('Failed to create subtopic')
		});
	}

	// Edit toggles
	startEditCategory(c: Category): void { if (!this.canCreateOrUpdate) return; this.editingCategoryId.set(c.Category_ID); this.categoryForm.patchValue({ CategoryName: c.CategoryName, Description: c.Description || '' }); }
	cancelEditCategory(): void { this.editingCategoryId.set(null); this.categoryForm.reset(); }

	saveCategory(c: Category): void {
		if (!this.canCreateOrUpdate || this.categoryForm.invalid) return;
		this.taxonomy.updateCategory(c.Category_ID, this.categoryForm.value).subscribe({
			next: () => {
				this.toast.showSuccess('Category updated');
				this.categories.set(this.categories().map(x => x.Category_ID === c.Category_ID ? { ...x, ...this.categoryForm.value } : x));
				this.cancelEditCategory();
			},
			error: () => this.toast.showError('Failed to update category')
		});
	}

	startEditTopic(t: Topic, categoryId: number): void {
		if (!this.canCreateOrUpdate) return;
		this.editingTopicId.set(t.Topic_ID);
		this.topicForm.patchValue({ TopicName: t.TopicName, Description: t.Description || '', Category_ID: categoryId });
	}
	cancelEditTopic(): void { this.editingTopicId.set(null); this.topicForm.reset(); }

	saveTopic(t: Topic): void {
		if (!this.canCreateOrUpdate || this.topicForm.invalid) return;
		this.taxonomy.updateTopic(t.Topic_ID, this.topicForm.value).subscribe({
			next: () => {
				this.toast.showSuccess('Topic updated');
				const newCatId = this.topicForm.value.Category_ID;
				const oldCatId = Object.entries(this.topicsByCategory()).find(([, list]) => list.some(x => x.Topic_ID === t.Topic_ID))?.[0];
				if (oldCatId) {
					const oldIdNum = Number(oldCatId);
					// Remove from old
					const oldList = (this.topicsByCategory()[oldIdNum] || []).filter(x => x.Topic_ID !== t.Topic_ID);
					// Add to new
					const newList = [...(this.topicsByCategory()[newCatId] || []), { ...t, ...this.topicForm.value }];
					this.topicsByCategory.update(map => ({ ...map, [oldIdNum]: oldList, [newCatId]: newList }));
				}
				this.cancelEditTopic();
			},
			error: () => this.toast.showError('Failed to update topic')
		});
	}

	startEditSubtopic(s: Subtopic, topicId: number): void {
		if (!this.canCreateOrUpdate) return;
		this.editingSubtopicId.set(s.Subtopic_ID);
		this.subtopicForm.patchValue({ SubtopicName: s.SubtopicName, Description: s.Description || '', Topic_ID: topicId });
	}
	cancelEditSubtopic(): void { this.editingSubtopicId.set(null); this.subtopicForm.reset(); }

	saveSubtopic(s: Subtopic): void {
		if (!this.canCreateOrUpdate || this.subtopicForm.invalid) return;
		this.taxonomy.updateSubtopic(s.Subtopic_ID, this.subtopicForm.value).subscribe({
			next: () => {
				this.toast.showSuccess('Subtopic updated');
				const newTopicId = this.subtopicForm.value.Topic_ID;
				const oldTopicId = Object.entries(this.subtopicsByTopic()).find(([, list]) => list.some(x => x.Subtopic_ID === s.Subtopic_ID))?.[0];
				if (oldTopicId) {
					const oldIdNum = Number(oldTopicId);
					const oldList = (this.subtopicsByTopic()[oldIdNum] || []).filter(x => x.Subtopic_ID !== s.Subtopic_ID);
					const newList = [...(this.subtopicsByTopic()[newTopicId] || []), { ...s, ...this.subtopicForm.value }];
					this.subtopicsByTopic.update(map => ({ ...map, [oldIdNum]: oldList, [newTopicId]: newList }));
				}
				this.cancelEditSubtopic();
			},
			error: () => this.toast.showError('Failed to update subtopic')
		});
	}

	// Delete with confirmation
	async confirmDeleteCategory(c: Category): Promise<void> {
		if (!this.canDelete) return;
		const alert = await this.alertCtrl.create({
			header: 'Delete Category',
			message: `Are you sure you want to delete "${c.CategoryName}"?`,
			buttons: [
				{ text: 'Cancel', role: 'cancel' },
				{ text: 'Delete', role: 'destructive', handler: () => this.deleteCategory(c) }
			]
		});
		await alert.present();
	}

	private deleteCategory(c: Category): void {
		this.taxonomy.deleteCategory(c.Category_ID).subscribe({
			next: () => {
				this.toast.showSuccess('Category deleted');
				this.categories.set(this.categories().filter(x => x.Category_ID !== c.Category_ID));
				const topics = this.topicsByCategory()[c.Category_ID] || [];
				for (const t of topics) this.subtopicsByTopic.update(map => { const { [t.Topic_ID]: _, ...rest } = map; return rest; });
				this.topicsByCategory.update(map => { const { [c.Category_ID]: _, ...rest } = map; return rest; });
			},
			error: () => this.toast.showError('Failed to delete category')
		});
	}

	async confirmDeleteTopic(t: Topic, categoryId: number): Promise<void> {
		if (!this.canDelete) return;
		const alert = await this.alertCtrl.create({
			header: 'Delete Topic',
			message: `Delete topic "${t.TopicName}"?`,
			buttons: [ { text: 'Cancel', role: 'cancel' }, { text: 'Delete', role: 'destructive', handler: () => this.deleteTopic(t, categoryId) } ]
		});
		await alert.present();
	}

	private deleteTopic(t: Topic, categoryId: number): void {
		this.taxonomy.deleteTopic(t.Topic_ID).subscribe({
			next: () => {
				this.toast.showSuccess('Topic deleted');
				this.topicsByCategory.update(map => ({ ...map, [categoryId]: (map[categoryId] || []).filter(x => x.Topic_ID !== t.Topic_ID) }));
				this.subtopicsByTopic.update(map => { const { [t.Topic_ID]: _, ...rest } = map; return rest; });
			},
			error: () => this.toast.showError('Failed to delete topic')
		});
	}

	async confirmDeleteSubtopic(s: Subtopic, topicId: number): Promise<void> {
		if (!this.canDelete) return;
		const alert = await this.alertCtrl.create({
			header: 'Delete Subtopic',
			message: `Delete subtopic "${s.SubtopicName}"?`,
			buttons: [ { text: 'Cancel', role: 'cancel' }, { text: 'Delete', role: 'destructive', handler: () => this.deleteSubtopic(s, topicId) } ]
		});
		await alert.present();
	}

	private deleteSubtopic(s: Subtopic, topicId: number): void {
		this.taxonomy.deleteSubtopic(s.Subtopic_ID).subscribe({
			next: () => {
				this.toast.showSuccess('Subtopic deleted');
				this.subtopicsByTopic.update(map => ({ ...map, [topicId]: (map[topicId] || []).filter(x => x.Subtopic_ID !== s.Subtopic_ID) }));
			},
			error: () => this.toast.showError('Failed to delete subtopic')
		});
	}
}


