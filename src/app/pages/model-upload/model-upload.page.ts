import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ModelService, ModelUploadRequest } from '../../services/model.service';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ToastService } from '../../services/toast.service';
import { finalize } from 'rxjs/operators';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader, 
  IonCardTitle, IonCardContent, IonItem, IonLabel, IonInput, IonTextarea,
  IonSelect, IonSelectOption, IonButton, IonSpinner, IonIcon, IonText,
  IonNote, IonButtons, IonBackButton, IonRippleEffect
} from '@ionic/angular/standalone';
// Icons will be added in the component constructor

// Define interfaces to match API response structure
interface Category {
  Category_ID: number;
  CategoryName: string;
  Description?: string;
}

interface Topic {
  Topic_ID: number;
  TopicName: string;
  Description: string;
  Category_ID?: number;
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
    RouterModule,
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
    IonBackButton,
    IonRippleEffect
  ]
})

export class ModelUploadPage implements OnInit {
  uploadForm: FormGroup;
  isDragging = false;
  selectedFile: File | null = null;
  thumbnailFile: File | null = null;
  thumbnailPreview: string | ArrayBuffer | null = null;
  uploadProgress = 0;
  uploadInProgress = false;
  isLoading = false;
  categories: Category[] = [];
  topics: Topic[] = [];
  isCategoriesLoading = false;
  isTopicsLoading = false;
  selectedTopicDescription = '';

  constructor(
    private formBuilder: FormBuilder,
    private modelService: ModelService,
    private router: Router,
    private toastService: ToastService,
    private http: HttpClient
  ) {
    // Initialize form with validation
    this.uploadForm = this.formBuilder.group({
      modelName: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      categoryId: ['', Validators.required],
      topicId: ['', Validators.required]
    });

    // Load categories when component initializes
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

  ngOnInit() {
    console.log('Model upload page initialized');
    this.loadCategories();
    
    // Watch for form status changes
    this.uploadForm.statusChanges.subscribe(status => {
      console.log('Form status:', status);
      console.log('Form errors:', this.uploadForm.errors);
      console.log('Form controls status:', {
        modelName: this.uploadForm.get('modelName')?.status,
        categoryId: this.uploadForm.get('categoryId')?.status,
        topicId: this.uploadForm.get('topicId')?.status
      });
      console.log('Selected file:', this.selectedFile);
    });
    
    // Watch for category changes to load topics
    this.uploadForm.get('categoryId')?.valueChanges.subscribe(categoryId => {
      console.log('Category changed:', categoryId);
      if (categoryId) {
        this.loadTopicsByCategory(categoryId);
      } else {
        this.topics = [];
        this.uploadForm.get('topicId')?.reset();
        this.selectedTopicDescription = '';
      }
    });
    
    // Watch for topic changes to update description
    this.uploadForm.get('topicId')?.valueChanges.subscribe(topicId => {
      console.log('Topic changed:', topicId);
      const topic = this.topics.find(t => t.Topic_ID === topicId);
      this.selectedTopicDescription = topic?.Description || '';
    });
  }

  private loadCategories() {
    this.isCategoriesLoading = true;
    console.log('Fetching categories from API...');
    
    this.http.get<Category[]>('http://localhost:5183/api/Category/all', { observe: 'response' }).pipe(
      finalize(() => this.isCategoriesLoading = false)
    ).subscribe({
      next: (response) => {
        console.log('Categories API Response:', {
          status: response.status,
          statusText: response.statusText,
          body: response.body
        });
        
        const categories = response.body || [];
        this.categories = Array.isArray(categories) ? categories : [];
        console.log('Processed categories:', this.categories);
        
        if (this.categories.length === 0) {
          console.warn('No categories found in the response');
          this.toastService.presentToast('warning' as any, 'No categories available');
        } else {
          console.log(`Successfully loaded ${this.categories.length} categories`);
        }
      },
      error: (error) => {
        console.error('Error loading categories:', {
          name: error.name,
          message: error.message,
          status: error.status,
          error: error.error,
          url: error.url
        });
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
      this.validateAndSetFile(file);
    }
  }

  onThumbnailSelected(event: any) {
    const file = event.target?.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.match('image.*')) {
        this.toastService.presentToast('error', 'Please select a valid image file');
        return;
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        this.toastService.presentToast('error', 'Thumbnail size should be less than 5MB');
        return;
      }

      this.thumbnailFile = file;
      
      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        this.thumbnailPreview = reader.result;
      };
      reader.readAsDataURL(file);
    }
  }

  removeThumbnail() {
    this.thumbnailFile = null;
    this.thumbnailPreview = null;
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
      this.validateAndSetFile(file);
    }
  }

  private validateAndSetFile(file: File) {
    console.log('Handling file:', file.name, 'Type:', file.type, 'Size:', file.size);
    
    // Check file size (max 500MB)
    if (file.size > 500 * 1024 * 1024) {
      this.toastService.presentToast('error', 'File is too large. Maximum size is 500MB.');
      return;
    }

    // Check file extension
    const allowedExtensions = ['h5', 'pb', 'pt', 'pth', 'onnx', 'pkl', 'joblib', 'model', 'py'];
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
    const isExtensionValid = fileExtension && allowedExtensions.includes(fileExtension);
    
    console.log('File validation:', {
      fileName: file.name,
      fileExtension,
      allowedExtensions,
      isExtensionValid,
      fileType: file.type
    });

    if (!isExtensionValid) {
      this.toastService.presentToast('warning', 
        `Warning: Unsupported file type (.${fileExtension}). ` +
        'Supported types: ' + allowedExtensions.map(ext => `.${ext}`).join(', ')
      );
      return;
    }

    // If we got here, the file is valid
    this.selectedFile = file;
    console.log('File accepted:', file.name);
    
    // Trigger form validation update
    this.uploadForm.updateValueAndValidity();
  }

  removeFile() {
    this.selectedFile = null;
    this.uploadForm.get('file')?.setValue(null);
  }

  // Helper methods for select comparison
  compareWithCategory(c1: any, c2: any): boolean {
    return c1 && c2 ? c1.Category_ID === c2.Category_ID : c1 === c2;
  }

  compareWithTopic(t1: any, t2: any): boolean {
    return t1 && t2 ? t1.Topic_ID === t2.Topic_ID : t1 === t2;
  }

  // Check if the form is valid and ready for submission
  isFormValid(): boolean {
    // Log detailed form state
    const formState = {
      formValid: this.uploadForm.valid,
      formStatus: this.uploadForm.status,
      formErrors: this.uploadForm.errors,
      controls: {
        modelName: {
          value: this.uploadForm.get('modelName')?.value,
          valid: this.uploadForm.get('modelName')?.valid,
          errors: this.uploadForm.get('modelName')?.errors,
          touched: this.uploadForm.get('modelName')?.touched,
          dirty: this.uploadForm.get('modelName')?.dirty
        },
        categoryId: {
          value: this.uploadForm.get('categoryId')?.value,
          valid: this.uploadForm.get('categoryId')?.valid,
          errors: this.uploadForm.get('categoryId')?.errors,
          touched: this.uploadForm.get('categoryId')?.touched,
          dirty: this.uploadForm.get('categoryId')?.dirty
        },
        topicId: {
          value: this.uploadForm.get('topicId')?.value,
          valid: this.uploadForm.get('topicId')?.valid,
          errors: this.uploadForm.get('topicId')?.errors,
          touched: this.uploadForm.get('topicId')?.touched,
          dirty: this.uploadForm.get('topicId')?.dirty
        }
      },
      hasSelectedFile: !!this.selectedFile,
      isLoading: this.isLoading
    };

    // Log which controls are invalid
    const invalidControls: string[] = [];
    Object.entries(this.uploadForm.controls).forEach(([key, control]) => {
      if (control.invalid) {
        invalidControls.push(key);
      }
    });
    
    console.log('Form validation check:', {
      ...formState,
      invalidControls,
      finalResult: this.uploadForm.valid && !!this.selectedFile && !this.isLoading
    });
    
    return this.uploadForm.valid && !!this.selectedFile && !this.isLoading;
  }

  onSubmit() {
    if (this.uploadForm.invalid) {
      console.log('Form is invalid');
      console.log('Form errors:', this.uploadForm.errors);
      console.log('Form controls with errors:');
      Object.keys(this.uploadForm.controls).forEach(key => {
        const control = this.uploadForm.get(key);
        if (control?.errors) {
          console.log(`Control '${key}' has errors:`, control.errors);
        }
      });
      this.uploadForm.markAllAsTouched();
      return;
    }

    if (!this.selectedFile) {
      this.toastService.presentToast('error', 'Please select a model file to upload.');
      return;
    }

    const formValue = this.uploadForm.value;
    
    // Prepare the model data
    const modelData: ModelUploadRequest = {
      modelName: formValue.modelName,
      description: formValue.description || '',
      topicId: formValue.topicId,
      file: this.selectedFile as File
    };

    this.isLoading = true;
    this.uploadInProgress = true;

    console.log('Submitting model with values:', {
      modelName: formValue.modelName,
      description: formValue.description,
      topicId: formValue.topicId,
      hasFile: !!this.selectedFile,
      hasThumbnail: !!this.thumbnailFile
    });

    // Call the model service to upload the model and thumbnail
    this.modelService.uploadModel(modelData, this.thumbnailFile || undefined)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.uploadInProgress = false;
        })
      )
      .subscribe({
        next: (event: any) => {
          if (event.type === 1) {
            // Upload progress event
            this.uploadProgress = Math.round((event.loaded / (event.total || 1)) * 100);
          } else if (event.type === 4) {
            // Response event
            console.log('Upload successful:', event.body);
            this.toastService.presentToast('success', 'Model uploaded successfully!');
            this.router.navigate(['/models']);
          }
        },
        error: (error) => {
          console.error('Upload error:', error);
          const errorMessage = error.error?.message || 'Failed to upload model';
          this.toastService.presentToast('error', errorMessage);
        }
      });
  }
}
