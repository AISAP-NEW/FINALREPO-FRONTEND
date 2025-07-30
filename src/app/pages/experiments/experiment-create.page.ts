import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { IonButton, IonContent, IonHeader, IonInput, IonItem, IonLabel, IonList, IonTitle, IonToolbar, IonSelect, IonSelectOption, IonTextarea, IonIcon, IonSpinner } from '@ionic/angular/standalone';

@Component({
  selector: 'app-experiment-create',
  standalone: true,
  imports: [CommonModule, FormsModule, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonInput, IonButton, IonSelect, IonSelectOption, IonTextarea, IonIcon, IonSpinner],
  templateUrl: './experiment-create.page.html'
})
export class ExperimentCreatePage implements OnInit {
  experiment: any = { Name: '', Description: '', Status: 'Draft', ModelFileType: '' };
  modelFile: File | null = null;
  modelFileError = '';
  showToast = false;
  toastMessage = '';
  missingFields: string[] = [];
  submitting = false;

  constructor(private http: HttpClient, public router: Router) {}

  ngOnInit() {
    this.loadDatasets();
  }

  loadDatasets() {
    // No longer needed as we're not showing datasets in the simplified form
  }

  onModelFileChange(event: any) {
    this.modelFileError = '';
    const file = event.target.files[0];
    if (file) {
      // Get file extension and validate
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      const allowedTypes = ['.py', '.ipynb', '.pkl', '.h5', '.pt', '.pth', '.onnx'];
      
      if (!allowedTypes.includes(fileExtension)) {
        this.modelFileError = 'Only .py, .ipynb, .pkl, .h5, .pt, .pth, .onnx files are allowed.';
        return;
      }
      
      // Validate file size (100MB limit)
      if (file.size > 100 * 1024 * 1024) {
        this.modelFileError = 'File size must be less than 100MB.';
        return;
      }
      
      this.modelFile = file;
      // Set the file type based on extension
      this.experiment.ModelFileType = fileExtension.substring(1); // Remove the dot
    }
  }

  // File upload method removed - files handled during experiment execution

  formInvalid() {
    return !this.experiment.Name || this.experiment.Name.length > 50 ||
      !!this.modelFileError || this.submitting;
  }

  async onSubmit(form: NgForm) {
    console.log('onSubmit called', this.experiment);
    this.missingFields = [];
    
    // Validate required fields
    if (!this.experiment.Name || this.experiment.Name.length > 50) this.missingFields.push('Name');
    
    if (form.invalid || this.modelFileError || this.missingFields.length) {
      this.showError('Please fix errors before submitting.' + (this.missingFields.length ? ' Missing or invalid: ' + this.missingFields.join(', ') : ''));
      return;
    }
    
    this.submitting = true;

    console.log('Submitting form with data:', {
      Name: this.experiment.Name,
      Description: this.experiment.Description,
      Status: this.experiment.Status,
      ModelFile: this.modelFile ? this.modelFile.name : 'none',
      ModelFileType: this.experiment.ModelFileType || 'none'
    });

    // Create form data
    const formData = new FormData();
    formData.append('Name', this.experiment.Name);
    formData.append('Description', this.experiment.Description);
    formData.append('Status', this.experiment.Status || 'Draft');
    
    if (this.modelFile) {
      formData.append('ModelFile', this.modelFile);
      formData.append('ModelFileType', this.experiment.ModelFileType || '');
    }

    // Ensure the URL is correct
    const url = `${environment.apiUrl}/api/Experiment`;
    console.log('Sending request to:', url);
    
    this.http.post(url, formData, {
      reportProgress: true,
      observe: 'response'
    }).subscribe({
      next: (response) => {
        console.log('Full response:', response);
        console.log('Experiment created successfully:', response.body);
        this.submitting = false;
        this.router.navigate(['/experiments']);
      },
      error: (error) => {
        console.error('Error creating experiment:', error);
        console.error('Error details:', {
          status: error.status,
          message: error.message,
          error: error.error,
          url: error.url,
          headers: error.headers
        });
        this.showError(error.error?.message || 'Failed to create experiment. Please check the console for details.');
        this.submitting = false;
      }
    });
  }

  showError(message: string) {
    this.toastMessage = message;
    this.showToast = true;
    setTimeout(() => this.showToast = false, 2500);
  }
}