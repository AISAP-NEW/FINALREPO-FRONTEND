import { Component, Input, Output, EventEmitter, OnInit, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { 
  IonButton, IonContent, IonHeader, IonInput, IonItem, IonLabel, 
  IonList, IonModal, IonSelect, IonSelectOption, IonTextarea, IonTitle, 
  IonToolbar, IonIcon, IonButtons, IonText, IonFooter, IonChip, IonNote, IonBadge
} from '@ionic/angular/standalone';

export type Mode = 'create' | 'edit' | 'view';

export interface Dataset {
  id: number;
  name: string;
  description?: string;
  // Add other dataset properties as needed
}

export interface Experiment {
  ExperimentId?: number;
  Name: string;
  Description: string;
  Status: string;
  ModelFileName?: string;
  ModelFileSize?: number;
  ModelFileType?: string;
  CreatedAt?: Date | string;
  LastModified?: Date | string;
  [key: string]: unknown;
}

export interface ModelFile {
  name: string;
  size: number;
  type: string;
  lastModified?: number;
}

@Component({
  selector: 'app-experiment-modal',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonContent, 
    IonList, 
    IonItem, 
    IonLabel, 
    IonInput, 
    IonButton, 
    IonModal, 
    IonTextarea, 
    IonSelect, 
    IonSelectOption, 
    IonIcon,
    IonButtons,
    IonText,
    IonFooter,
    IonChip,
    IonNote
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ mode === 'create' ? 'Create' : mode === 'edit' ? 'Edit' : 'View' }} Experiment</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="dismiss.emit()" class="close-button">
            <span aria-hidden="true">&times;</span>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    
    <ion-content class="ion-padding">
      <form #experimentForm="ngForm" (ngSubmit)="onSubmit(experimentForm)">
        <ion-list>
          <ion-item>
            <ion-label position="stacked">
              Name <ion-text color="danger">*</ion-text>
              <ion-text color="medium" class="hint-text">Required, max 50 characters</ion-text>
            </ion-label>
            <ion-input 
              type="text" 
              [(ngModel)]="experiment.Name" 
              name="name" 
              required
              maxlength="50"
              aria-required="true"
              [disabled]="mode === 'view'"
              (ionInput)="updateFormValidity()"
              placeholder="Enter experiment name"
              [attr.aria-invalid]="hasMissingField('Name')">
            </ion-input>
            <ion-note slot="error" *ngIf="hasMissingField('Name')" color="danger">
              {{ getMissingFieldMessage('Name') }}
            </ion-note>
          </ion-item>
          
          <ion-item>
            <ion-label position="stacked">
              Description
              <ion-text color="medium" class="hint-text">Optional, describe your experiment</ion-text>
            </ion-label>
            <ion-textarea 
              [(ngModel)]="experiment.Description" 
              name="description" 
              [disabled]="mode === 'view'"
              rows="3"
              placeholder="Enter a brief description of your experiment"
              maxlength="500"
              autoGrow="true">
            </ion-textarea>
          </ion-item>
          
          <ion-item *ngIf="mode === 'create' || mode === 'edit'" lines="full">
            <ion-label position="stacked">
              Model File <ion-text color="danger">*</ion-text>
              <ion-text color="medium" class="hint-text">
                Accepted formats: .py, .ipynb, .pkl, .h5, .pt, .pth, .onnx (max 100MB)
              </ion-text>
            </ion-label>
            
            <!-- Custom styled file input button -->
            <div class="file-upload-container">
              <ion-button 
                fill="outline" 
                (click)="fileInput.click()" 
                expand="block" 
                class="file-input-button"
                [attr.aria-label]="'Select model file. ' + (existingModelFile ? 'Current file: ' + existingModelFile.name : '')"
                [attr.aria-describedby]="'fileTypesHelp' + (modelFileError ? ' fileError' : '')"
                [color]="modelFileError ? 'danger' : 'medium'"
                [class.file-selected]="!!existingModelFile">
                <ion-icon name="cloud-upload" slot="start"></ion-icon>
                {{ existingModelFile ? 'Change File' : 'Choose File' }}
              </ion-button>
              
              <input 
                #fileInput
                type="file" 
                (change)="onModelFileChange($event); updateFormValidity()"
                id="modelFile"
                accept=".py,.ipynb,.pkl,.h5,.pt,.pth,.onnx"
                style="display: none;"
                aria-describedby="fileTypesHelp fileError"
                [attr.aria-invalid]="!!modelFileError">
                
              <!-- Selected file info -->
              <div *ngIf="existingModelFile" class="file-info">
                <ion-icon name="document" color="primary"></ion-icon>
                <div class="file-details">
                  <div class="file-name">{{ existingModelFile.name }}</div>
                  <div class="file-size" *ngIf="existingModelFile.size">
                    {{ formatFileSize(existingModelFile.size) }}
                  </div>
                </div>
                <ion-button 
                  fill="clear" 
                  size="small" 
                  color="danger" 
                  (click)="clearFileInput($event)"
                  aria-label="Remove file">
                  <ion-icon name="close-circle" slot="icon-only"></ion-icon>
                </ion-button>
              </div>
              
              <!-- Error message -->
              <ion-note *ngIf="modelFileError" color="danger" id="fileError">
                {{ modelFileError }}
              </ion-note>
            </div>
            <div *ngIf="existingModelFile" class="ion-margin-top">
              <ion-chip color="primary">
                <ion-icon name="document" class="ion-margin-end"></ion-icon>
                <ion-label>{{ existingModelFile.name }} ({{ formatFileSize(existingModelFile.size) }})</ion-label>
              </ion-chip>
            </div>
          </ion-item>
          
          <ion-item *ngIf="modelFileError" lines="none">
            <ion-text color="danger">{{ modelFileError }}</ion-text>
          </ion-item>
          
          <ion-item *ngIf="missingFields.length > 0">
            <ion-text color="danger">
              Please fill in all required fields: {{ missingFields.join(', ') }}
            </ion-text>
          </ion-item>
        </ion-list>
      </form>
    </ion-content>
    
    <ion-footer *ngIf="mode !== 'view'">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button (click)="dismiss.emit()" color="medium" fill="clear">
            <ion-icon name="close-circle" slot="start"></ion-icon>
            Cancel
          </ion-button>
        </ion-buttons>
        <ion-buttons slot="end">
          <ion-button 
            (click)="onSubmit(experimentForm)" 
            [disabled]="!isFormValid"
            [color]="isFormValid ? 'primary' : 'medium'"
            [strong]="isFormValid"
            fill="solid"
            class="save-button">
            <ion-icon name="save" slot="start" *ngIf="mode === 'edit'"></ion-icon>
            <ion-icon name="add-circle" slot="start" *ngIf="mode === 'create'"></ion-icon>
            {{ mode === 'create' ? 'Create' : 'Save Changes' }}
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-footer>
  `,
  styles: [
    `
    :host {
      --ion-background-color: #f8f9fa;
      --ion-toolbar-background: #ffffff;
      --ion-item-background: #ffffff;
    }
    
    ion-content {
      --background: #f8f9fa;
    }
    
    ion-list {
      background: transparent;
      padding: 0 16px;
    }
    
    ion-item {
      --border-radius: 8px;
      --padding-start: 0;
      --inner-padding-end: 0;
      margin-bottom: 16px;
      --background: #ffffff;
      --border-color: #e9ecef;
    }
    
    ion-label[position="stacked"] {
      font-weight: 500;
      margin-bottom: 8px;
      color: #495057;
    }
    
    .file-input-button {
      --background: #f8f9fa;
      --background-hover: #e9ecef;
      --color: #495057;
      --border-style: dashed;
      --border-width: 1px;
      --border-color: #ced4da;
      --border-radius: 8px;
      --padding-top: 14px;
      --padding-bottom: 14px;
      margin: 8px 0 0 0;
      width: 100%;
      --box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      transition: all 0.2s ease-in-out;
    }
    
    .file-input-button:hover {
      --background: #e9ecef;
      --border-color: #adb5bd;
      transform: translateY(-1px);
    }
    
    .file-input-button:active {
      transform: translateY(0);
    }
    
    .file-input-button ion-icon {
      font-size: 1.5em;
      margin-right: 8px;
      color: var(--ion-color-primary);
    }
    
    .save-button {
      --padding-start: 24px;
      --padding-end: 24px;
      --padding-top: 12px;
      --padding-bottom: 12px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      --box-shadow: 0 2px 8px rgba(var(--ion-color-primary-rgb), 0.2);
      transition: all 0.2s ease-in-out;
    }
    
    .save-button:hover {
      --box-shadow: 0 4px 12px rgba(var(--ion-color-primary-rgb), 0.3);
      transform: translateY(-1px);
    }
    
    .save-button:active {
      transform: translateY(0);
    }
    
    ion-footer {
      background: #ffffff;
      box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
    }
    
    ion-footer ion-toolbar {
      --background: transparent;
      --border-width: 0;
      padding: 8px 0;
    }
    
    ion-footer ion-button {
      margin: 0 4px;
    }
    
    /* Error message styling */
    ion-text[color="danger"] {
      display: block;
      margin-top: 8px;
      font-size: 0.85em;
    }
    
    /* File upload container */
    .file-upload-container {
      width: 100%;
      margin-top: 8px;
    }
    
    /* File info display */
    .file-info {
      display: flex;
      align-items: center;
      background: #f8f9fa;
      border-radius: 8px;
      padding: 12px;
      margin-top: 12px;
      border: 1px dashed #dee2e6;
      transition: all 0.2s ease;
    }
    
    .file-info:hover {
      background: #f1f3f5;
      border-color: #adb5bd;
    }
    
    .file-info ion-icon {
      font-size: 24px;
      margin-right: 12px;
      color: var(--ion-color-primary);
    }
    
    .file-details {
      flex: 1;
      min-width: 0;
    }
    
    .file-name {
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-bottom: 4px;
    }
    
    .file-size {
      font-size: 0.85em;
      color: #6c757d;
    }
    
    /* Hint text */
    .hint-text {
      display: block;
      font-size: 0.85em;
      font-weight: normal;
      margin-top: 2px;
      opacity: 0.8;
    }
    
    /* Error states */
    .file-input-button[color="danger"] {
      --border-color: var(--ion-color-danger);
      --color: var(--ion-color-danger);
    }
    
    /* Remove the old chip styles */
    ion-chip {
      display: none;
    }
    
    .close-button {
      font-size: 24px;
      --padding-start: 8px;
      --padding-end: 8px;
      --padding-top: 0;
      --padding-bottom: 0;
      --ripple-color: transparent;
      --background: transparent;
      --background-hover: rgba(0, 0, 0, 0.1);
      --background-activated: rgba(0, 0, 0, 0.2);
      height: 48px;
      width: 48px;
      margin: 0;
    }
    
    .close-button span {
      font-size: 32px;
      line-height: 1;
      display: inline-block;
      transform: translateY(-2px);
    }
    
    ion-item {
      --padding-start: 0;
      --inner-padding-end: 0;
      --background: transparent;
      --background-hover: transparent;
    }
    
    ion-input, ion-textarea, ion-select {
      --background: var(--ion-color-light);
      --padding-start: 12px;
      --padding-end: 12px;
      border-radius: 8px;
      margin-top: 8px;
    }
    
    ion-label {
      font-weight: 500;
    }
    
    ion-footer {
      ion-toolbar {
        --background: var(--ion-background-color);
        --border-width: 0;
        --padding-start: 16px;
        --padding-end: 16px;
        --padding-top: 8px;
        --padding-bottom: 8px;
      }
    }
    `
  ]
})
export class ExperimentModalComponent implements OnInit {
  @Input() mode: Mode = 'create';
  @Input() isOpen = false;
  @Input() set experiment(value: Partial<Experiment> | null) {
    this._experiment = { 
      Name: '', 
      Description: '', 
      Status: 'Draft',
      ...value 
    } as Experiment;
    if (value?.ModelFileName) {
      this.existingModelFile = {
        name: value.ModelFileName,
        size: value.ModelFileSize || 0,
        type: value.ModelFileType || 'unknown',
      };
    }
    this.updateFormValidity();
  }
  
  get experiment(): Experiment {
    return this._experiment;
  }
  
  private _experiment: Experiment = { Name: '', Description: '', Status: 'Draft' };
  
  @Output() save = new EventEmitter<{ 
    experiment: Experiment; 
    file?: File; 
    formData: FormData;
    onComplete: () => void;
  }>();
  
  // Helper method to safely get file extension
  
  @Output() dismiss = new EventEmitter<void>();

  @ViewChild('fileInput') fileInputRef?: ElementRef<HTMLInputElement>;
  
  modelFile: File | null = null;
  existingModelFile: ModelFile | null = null;
  modelFileError: string | null = null;
  missingFields: string[] = [];
  isSubmitting = false;
  isFormValid = false;
  
  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.initializeForm();
  }

  private initializeForm() {
    console.log('Initializing form in', this.mode, 'mode');
    
    if (this.mode === 'create') {
      // Create a new experiment object with default status if not exists
      const { Status, ...rest } = this.experiment;
      this.experiment = { ...rest, Status: Status || 'Draft' };
      this.modelFile = null;
      this.existingModelFile = null;
    } else if (this.mode === 'edit' || this.mode === 'view') {
      console.log('Initializing edit/view mode with experiment:', this.experiment);
      
      // Initialize existing file info if available
      if (this.experiment.ModelFileName) {
        this.existingModelFile = {
          name: this.experiment.ModelFileName,
          size: this.experiment.ModelFileSize || 0,
          type: this.experiment.ModelFileType || 'unknown'
        };
        console.log('Set existing model file:', this.existingModelFile);
      } else {
        this.existingModelFile = null;
      }
      
      this.modelFile = null; // Reset any previously selected file
    }
    
    this.updateFormValidity();
    this.cdr.detectChanges();
  }

  checkFormValidity(): boolean {
    this.missingFields = [];
    
    if (!this.experiment.Name?.trim()) {
      this.missingFields.push('Name');
    }
    
    if (!this.experiment.Description?.trim()) {
      this.missingFields.push('Description');
    }
    
    if (this.mode === 'create' && !this.modelFile) {
      this.missingFields.push('ModelFile');
    }
    
    this.isFormValid = this.missingFields.length === 0;
    this.cdr.detectChanges();
    return this.isFormValid;
  }

  updateFormValidity(): void {
    this.checkFormValidity();
  }

  onModelFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    console.log('File input changed:', file);
    this.modelFileError = '';
    
    if (!file) {
      console.log('No file selected or file selection cancelled');
      this.modelFile = null;
      this.existingModelFile = null;
      this.updateFormValidity();
      this.cdr.detectChanges();
      return;
    }
    
    console.log('Processing file:', file.name, file.size, file.type);
    
    const allowedTypes = ['.py', '.ipynb', '.pkl', '.h5', '.pt', '.pth', '.onnx'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!allowedTypes.includes(fileExtension)) {
      this.modelFileError = 'Only .py, .ipynb, .pkl, .h5, .pt, .pth, .onnx files are allowed.';
      console.error('Invalid file type:', fileExtension);
      this.modelFile = null;
      this.existingModelFile = null;
      if (input) input.value = ''; // Clear the file input
      this.updateFormValidity();
      this.cdr.detectChanges();
      return;
    }
    
    if (file.size > 100 * 1024 * 1024) {
      this.modelFileError = 'File size must be less than 100MB.';
      console.error('File too large:', file.size);
      this.modelFile = null;
      this.existingModelFile = null;
      input.value = ''; // Clear the file input
      this.updateFormValidity();
      this.cdr.detectChanges();
      return;
    }
    
    this.modelFile = file;
    this.existingModelFile = {
      name: file.name,
      size: file.size,
      type: file.type || 'unknown',
      lastModified: file.lastModified
    };
    
    console.log('File selected successfully:', {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified
    });
    
    // Force update the form validity and trigger change detection
    this.updateFormValidity();
    this.cdr.detectChanges();
  }


  async onSubmit(form: NgForm) {
    console.log('Form submitted:', form.valid, form.value);
    
    // Re-validate form
    this.checkFormValidity();
    
    if (!this.isFormValid || this.isSubmitting) {
      console.log('Form is not valid or already submitting');
      if (!this.isFormValid) {
        console.log('Missing required fields:', this.missingFields);
      }
      return;
    }
    
    this.isSubmitting = true;
    console.log('Form submission started, disabling form');
    
    try {
      const formData = new FormData();
      
      // Use PascalCase to match backend DTO
      formData.append('Name', this.experiment.Name.trim());
      formData.append('Description', (this.experiment.Description || '').trim());
      formData.append('Status', (this.experiment.Status || 'Draft').trim());
      
      // Handle file upload
      if (this.modelFile) {
        console.log('Adding file to form data:', this.modelFile.name);
        formData.append('ModelFile', this.modelFile, this.modelFile.name);
        
        // Get file extension and set ModelFileType (PascalCase to match DTO)
        const fileExtension = this.getFileExtension(this.modelFile.name);
        if (fileExtension) {
          formData.append('ModelFileType', fileExtension);
        }
      } else if (this.existingModelFile && this.mode === 'edit') {
        // Only include existing file info if we're in edit mode and no new file was uploaded
        formData.append('ModelFileName', this.existingModelFile.name);
        formData.append('ModelFileSize', this.existingModelFile.size.toString());
        formData.append('ModelFileType', this.existingModelFile.type);
      }
      
      // For edit mode, include ExperimentId (PascalCase)
      if (this.mode === 'edit' && this.experiment.ExperimentId) {
        formData.append('ExperimentId', this.experiment.ExperimentId.toString());
      }
      
      // Create a safe experiment object for the output
      const outputExperiment: Experiment = {
        ...this.experiment,
        Name: this.experiment.Name.trim(),
        Description: (this.experiment.Description || '').trim(),
        Status: (this.experiment.Status || 'Draft').trim(),
        ModelFileName: this.modelFile?.name || this.existingModelFile?.name || '',
        ModelFileSize: this.modelFile?.size || this.existingModelFile?.size || 0,
        ModelFileType: this.modelFile?.type || this.existingModelFile?.type || ''
      };
      
      // For debugging - log the form data
      const formDataObj: {[key: string]: any} = {};
      formData.forEach((value, key) => {
        formDataObj[key] = value;
      });
      
      console.log('Saving experiment with data:', {
        formData: formDataObj,
        mode: this.mode,
        experiment: outputExperiment
      });
      
      // Emit the save event with all necessary data
      this.save.emit({
        experiment: outputExperiment,
        file: this.modelFile || undefined,
        formData,
        onComplete: () => {
          this.isSubmitting = false;
          console.log('Form submission complete, re-enabling form');
          this.cdr.detectChanges();
        }
      });
    } catch (error) {
      console.error('Error preparing form data:', error);
      this.isSubmitting = false;
      this.cdr.detectChanges();
    }
  }

  clearFileInput(event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    this.modelFile = null;
    this.existingModelFile = null;
    this.modelFileError = null;
    
    if (this.fileInputRef?.nativeElement) {
      this.fileInputRef.nativeElement.value = '';
    }
    
    this.updateFormValidity();
    this.cdr.detectChanges();
  }

  getFileExtension(filename: string): string {
    if (!filename) return '';
    const lastDot = filename.lastIndexOf('.');
    return lastDot === -1 ? '' : filename.substring(lastDot).toLowerCase();
  }

  getMissingFieldMessage(fieldName: string): string {
    if (!this.missingFields || !Array.isArray(this.missingFields)) {
      return '';
    }
    
    const field = this.missingFields.find(f => f === fieldName);
    if (!field) {
      return '';
    }
    
    switch (field) {
      case 'Name':
        return 'Name is required and must be 1-50 characters';
      case 'ModelFile':
        return 'A model file is required';
      default:
        return `${field} is required`;
    }
  }

  getStatusColor(status: string | undefined): string {
    if (!status) return 'medium';
    
    switch (status.toLowerCase()) {
      case 'running':
        return 'primary';
      case 'completed':
        return 'success';
      case 'failed':
        return 'danger';
      case 'draft':
        return 'warning';
      default:
        return 'medium';
    }
  }

  formatFileSize(bytes: number | undefined): string {
    if (bytes === undefined || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const size = parseFloat((bytes / Math.pow(k, i)).toFixed(2));
    return `${size} ${sizes[i]}`;
  }

// ...

  hasMissingField(fieldName: string): boolean {
    if (!this.missingFields || !Array.isArray(this.missingFields)) {
      return false;
    }
    return this.missingFields.some(field => field === fieldName);
  }

}