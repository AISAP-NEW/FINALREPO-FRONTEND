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

	// Left nav section selection
	selectedSection = signal<'dashboard' | 'categories' | 'topics' | 'subtopics' | 'user-management'>('categories');

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

	// Selection handlers
	selectCategory(c: Category): void {
		this.selectedCategoryId.set(c.Category_ID);
		this.selectedTopicId.set(null);
		this.selectedSubtopicId.set(null);
		this.categoryForm.reset({ CategoryName: c.CategoryName, Description: c.Description || '' });
	}

	selectTopic(t: Topic, categoryId: number): void {
		this.selectedCategoryId.set(categoryId);
		this.selectedTopicId.set(t.Topic_ID);
		this.selectedSubtopicId.set(null);
		this.topicForm.reset({ TopicName: t.TopicName, Description: t.Description || '', Category_ID: categoryId });
	}

	selectSubtopic(s: Subtopic, topicId: number): void {
		// Find owning category for completeness
		const catId = Number(Object.entries(this.topicsByCategory()).find(([, list]) => list.some(x => x.Topic_ID === topicId))?.[0]) || null;
		if (catId != null) this.selectedCategoryId.set(catId);
		this.selectedTopicId.set(topicId);
		this.selectedSubtopicId.set(s.Subtopic_ID);
		this.subtopicForm.reset({ SubtopicName: s.SubtopicName, Description: s.Description || '', Topic_ID: topicId });
	}

	startCreateCategory(): void {
		this.selectedCategoryId.set(null);
		this.selectedTopicId.set(null);
		this.selectedSubtopicId.set(null);
		this.categoryForm.reset({ CategoryName: '', Description: '' });
	}

	startCreateTopicForSelectedCategory(): void {
		if (this.selectedCategoryId() == null) return;
		this.selectedTopicId.set(null);
		this.selectedSubtopicId.set(null);
		this.topicForm.reset({ TopicName: '', Description: '', Category_ID: this.selectedCategoryId() });
	}

	startCreateSubtopicForSelectedTopic(): void {
		if (this.selectedTopicId() == null) return;
		this.selectedSubtopicId.set(null);
		this.subtopicForm.reset({ SubtopicName: '', Description: '', Topic_ID: this.selectedTopicId() });
	}

	ngOnInit(): void {
		this.role = this.auth.getCurrentUser()?.role || this.auth.getCurrentUser()?.Role || '';
		this.loadCategories();
	}

	private loadCategories(): void {
		this.taxonomy.getCategories().subscribe({
			next: cats => {
				this.categories.set(cats || []);
				// Preload topics for each category
				for (const c of this.categories()) {
					this.loadTopics(c.Category_ID);
				}
			},
			error: () => this.toast.showError('Failed to load categories')
		});
	}

	private loadTopics(categoryId: number): void {
		this.taxonomy.getTopicsByCategory(categoryId).subscribe({
			next: tops => {
				this.topicsByCategory.update(map => ({ ...map, [categoryId]: tops || [] }));
				for (const t of tops || []) this.loadSubtopics(t.Topic_ID);
			},
			error: () => this.toast.showError('Failed to load topics')
		});
	}

	private loadSubtopics(topicId: number): void {
		this.taxonomy.getSubtopicsByTopic(topicId).subscribe({
			next: subs => this.subtopicsByTopic.update(map => ({ ...map, [topicId]: subs || [] })),
			error: () => this.toast.showError('Failed to load subtopics')
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


