import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ModalController, IonicModule, IonButton, IonInput, IonSelect, IonSelectOption, IonTextarea, IonLabel, IonItem, IonHeader, IonToolbar, IonTitle, IonContent, IonSpinner, IonIcon, IonText, IonNote } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-update-model-modal',
  templateUrl: './update-model-modal.component.html',
  styleUrls: ['./update-model-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonicModule
  ]
})
export class UpdateModelModalComponent implements OnInit {
  @Input() model: any; // model to update
  updateForm: FormGroup;
  isLoading = false;
  error: string | null = null;
  categories: any[] = [];
  topics: any[] = [];

  constructor(
    private modalCtrl: ModalController,
    private fb: FormBuilder,
    private http: HttpClient
  ) {
    this.updateForm = this.fb.group({
      modelName: ['', [Validators.required, Validators.maxLength(100)]],
      categoryId: ['', Validators.required],
      topicId: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.loadCategories();
    if (this.model) {
      this.updateForm.patchValue({
        modelName: this.model.modelName,
        topicId: this.model.topicId || '',
        categoryId: this.model.categoryId || ''
      });
      this._initialDescription = this.model.description || '';
    }
  }

  private _initialDescription: string = '';

  loadCategories() {
    this.http.get<any[]>('http://localhost:5183/api/Category/all').subscribe({
      next: (categories) => {
        this.categories = categories;
        if (this.model && this.model.topicId) {
          this.loadTopicsByCategory(this.model.categoryId, true);
        }
      },
      error: () => {
        this.error = 'Failed to load categories.';
      }
    });
  }

  loadTopicsByCategory(categoryId: number, prefill = false) {
    this.topics = [];
    this.updateForm.patchValue({ topicId: '' });
    if (!categoryId) return;
    this.http.get<any[]>(`http://localhost:5183/api/Category/topics-by-category/${categoryId}`).subscribe({
      next: (topics) => {
        this.topics = topics;
        if (prefill && this.model && this.model.topicId) {
          this.updateForm.patchValue({
            categoryId: this.model.categoryId,
            topicId: this.model.topicId
          });
        }
      },
      error: () => {
        this.error = 'Failed to load topics.';
      }
    });
  }

  onCategoryChange(event: any) {
    const categoryId = event.detail.value;
    this.loadTopicsByCategory(categoryId);
  }

  onTopicChange(event: any) {
    // No need to update description in the form, just display it
  }

  close() {
    this.modalCtrl.dismiss();
  }

  onSubmit() {
    if (this.updateForm.invalid) {
      this.updateForm.markAllAsTouched();
      this.error = 'Please fill all required fields correctly.';
      return;
    }
    this.isLoading = true;
    this.error = null;
    const formValue = this.updateForm.value;
    const payload = {
      Id: this.model.modelId,
      ModelName: formValue.modelName,
      Description: this._initialDescription,
      TopicId: formValue.topicId
    };
    this.http.put(`http://localhost:5183/api/ModelFile/update-model/${this.model.modelId}`, payload).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        this.modalCtrl.dismiss({ updated: true });
        alert('Model updated successfully!');
      },
      error: (err) => {
        this.isLoading = false;
        this.error = err.error?.message || 'Failed to update model.';
      }
    });
  }

  get selectedTopicDescription(): string {
    const topicId = this.updateForm.value.topicId;
    const topic = this.topics.find(t => t.Topic_ID === topicId);
    return topic?.Description || '';
  }
}
