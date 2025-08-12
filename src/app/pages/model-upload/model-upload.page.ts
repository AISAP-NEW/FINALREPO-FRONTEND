import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ModelService, ModelUploadRequest } from '../../services/model.service';
import { Dataset, DatasetService } from '../../services/dataset.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ToastService } from '../../services/toast.service';
import { finalize } from 'rxjs/operators';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonSpinner,
  IonIcon,
  IonText,
  IonNote,
  IonButtons,
  IonBackButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cloudUploadOutline, trashOutline, folderOpenOutline } from 'ionicons/icons';

// Define interfaces to match API response structure
interface Category {
  Category_ID: number;
  CategoryName: string;
  Description?: string;
}

interface Topic {
  Topic_ID: number;
  TopicName: string;
  Description?: string;
}

@Component({
  selector: 'app-model-upload',
  templateUrl: './model-upload.page.html',
  styleUrls: ['./model-upload.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HttpClientModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonItem,
    IonLabel,
    IonInput,
    IonTextarea,
    IonSelect,
    IonSelectOption,
    IonButton,
    IonSpinner,
    IonIcon,
    IonText,
    IonNote,
    IonButtons,
    IonBackButton
  ]
})
export class ModelUploadPage implements OnInit {
  uploadForm: FormGroup;
  isDragging = false;
  selectedFile: File | null = null;
  isLoading = false;
  categories: Category[] = [];
  topics: Topic[] = [];
  isCategoriesLoading = false;
  isTopicsLoading = false;
  selectedTopicDescription = '';

  constructor(
    private fb: FormBuilder,
    private modelService: ModelService,
    private datasetService: DatasetService,
    private router: Router,
    private toastService: ToastService,
    private http: HttpClient
  ) {
    addIcons({ cloudUploadOutline, trashOutline, folderOpenOutline });

    this.uploadForm = this.fb.group({
      modelName: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      categoryId: ['', [Validators.required]],
      topicId: ['', [Validators.required]]
    });
  }

  ngOnInit() {
    console.log('Model upload page initialized');
    this.loadCategories();
    
    // Watch for category changes to load topics
    this.uploadForm.get('categoryId')?.valueChanges.subscribe(categoryId => {
      if (categoryId) {
        this.loadTopicsByCategory(categoryId);
      } else {
        this.topics = [];
        this.uploadForm.patchValue({ topicId: '' });
      }
    });

    // Watch for topic changes to show description
    this.uploadForm.get('topicId')?.valueChanges.subscribe(topicId => {
      const topic = this.topics.find(t => t.Topic_ID === topicId);
      this.selectedTopicDescription = topic?.Description || '';
    });
  }

  private loadCategories() {
    this.isCategoriesLoading = true;
    console.log('Fetching categories from API...');
    
    this.http.get<Category[]>('http://localhost:5183/api/Category/all').pipe(
      finalize(() => this.isCategoriesLoading = false)
    ).subscribe({
      next: (categories) => {
        console.log('Categories loaded:', categories);
        this.categories = Array.isArray(categories) ? categories : [];
        
        if (this.categories.length === 0) {
          console.warn('No categories found in the response');
          this.toastService.presentToast('warning' as any, 'No categories available');
        } else {
          console.log(`Successfully loaded ${this.categories.length} categories`);
        }
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.toastService.presentToast('error' as any, 'Failed to load categories. Please try again.');
      }
    });
  }

  private loadTopicsByCategory(categoryId: number | string) {
    // Ensure categoryId is a number
    const categoryIdNum = Number(categoryId);
    if (isNaN(categoryIdNum)) {
      console.error('Invalid category ID:', categoryId);
      this.toastService.presentToast('error' as any, 'Invalid category selected');
      return;
    }

    this.isTopicsLoading = true;
    this.uploadForm.get('topicId')?.reset();
    this.selectedTopicDescription = '';
    
    console.log('Loading topics for category ID:', categoryIdNum);
    this.http.get<Topic[]>(`http://localhost:5183/api/Category/topics-by-category/${categoryIdNum}`).pipe(
      finalize(() => this.isTopicsLoading = false)
    ).subscribe({
      next: (topics) => {
        console.log('Loaded topics:', topics);
        this.topics = Array.isArray(topics) ? topics : [];
        if (this.topics.length === 0) {
          console.warn('No topics found for category ID:', categoryIdNum);
          this.toastService.presentToast('info' as any, 'No topics available for this category');
        }
      },
      error: (error) => {
        console.error('Error loading topics:', error);
        this.toastService.presentToast('error' as any, 'Failed to load topics. Please try again.');
      }
    });
  }

  onFileSelected(event: any) {
    const file = event.target?.files?.[0];
    if (file) {
      this.handleFile(file);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
    
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      this.handleFile(file);
    }
  }

  private handleFile(file: File) {
    console.log('Handling file:', file.name, 'Size:', file.size);
    // Check file size (max 500MB)
    if (file.size > 500 * 1024 * 1024) {
      this.toastService.presentToast('error' as any, 'File is too large. Maximum size is 500MB.');
      return;
    }

    // Check file type - expanded to include script files
    const allowedTypes = ['.h5', '.pb', '.pt', '.pth', '.onnx', '.pkl', '.joblib', '.model', '.py', '.js', '.ts', '.ipynb'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!allowedTypes.includes(fileExtension)) {
      this.toastService.presentToast('warning' as any, 
        `Warning: Unrecognized file type (${fileExtension}). Supported types: ${allowedTypes.join(', ')}`);
    }

    this.selectedFile = file;
    console.log('File accepted:', file.name, 'Type:', fileExtension);
  }

  removeFile() {
    this.selectedFile = null;
  }

  onSubmit() {
    if (this.uploadForm.invalid || !this.selectedFile) {
      this.uploadForm.markAllAsTouched();
      if (!this.selectedFile) {
        this.toastService.presentToast('error' as any, 'Please select a model file to upload.');
      }
      return;
    }

    this.isLoading = true;

    const formValue = this.uploadForm.value;
    const formData = new FormData();
    formData.append('modelName', formValue.modelName);
    formData.append('description', formValue.description);
    formData.append('topicId', formValue.topicId);
    formData.append('codeFile', this.selectedFile!);

    fetch('http://localhost:5183/api/ModelFile/create-model-with-file', {
      method: 'POST',
      body: formData
    })
      .then(async response => {
        this.isLoading = false;
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to upload model.');
        }
        this.toastService.presentToast('success' as any, 'Model uploaded successfully!');
        this.router.navigate(['/models']);
      })
      .catch(error => {
        this.isLoading = false;
        this.toastService.presentToast('error' as any, error.message || 'Failed to upload model.');
      });
  }
}
