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
  // Use PascalCase for all properties to match backend DTO
  experiment: any = { 
    Name: '', 
    Description: '', 
    Status: 'Draft',
    ModelFileType: '' 
  };
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
      this.experiment.ModelFileType = fileExtension.substring(1); // Remove the dot
    }
  }

  // File upload method removed - files handled during experiment execution

  formInvalid() {
    return !this.experiment.Name || this.experiment.Name.length > 50 ||
      !!this.modelFileError || this.submitting;
  }

  async onSubmit(form: NgForm) {
    console.log('Form submitted', form);
    console.log('Experiment object:', this.experiment);
    console.log('Model file:', this.modelFile);
    
    this.missingFields = [];
    
    // Validate required fields
    if (!this.experiment.Name || this.experiment.Name.length > 50) {
      this.missingFields.push('Name');
    }
    
    if (form.invalid || this.modelFileError || this.missingFields.length) {
      const errorMsg = 'Please fix errors before submitting.' + 
        (this.missingFields.length ? ' Missing or invalid: ' + this.missingFields.join(', ') : '');
      console.error('Form validation failed:', errorMsg);
      this.showError(errorMsg);
      return;
    }
    
    this.submitting = true;

    try {
      // Create form data
      const formData = new FormData();
      
      // Add required fields - using camelCase to match backend
      formData.append('Name', this.experiment.Name);
      formData.append('Description', this.experiment.Description || '');
      formData.append('Status', this.experiment.Status || 'Draft');
      
      // Add file if it exists
      if (this.modelFile) {
        console.log('Adding file to form data:', this.modelFile.name);
        formData.append('modelFile', this.modelFile, this.modelFile.name);
        
        // Get file extension and set modelFileType (without dot)
        const fileExt = this.modelFile.name.split('.').pop()?.toLowerCase() || '';
        formData.append('ModelFileType', fileExt);
      }

      // Log form data for debugging
      console.log('Form data entries:');
      for (let [key, value] of (formData as any).entries()) {
        console.log(key, value);
      }

      const url = `${environment.apiUrl}/api/Experiment`;
      console.log('Sending POST request to:', url);
      
      const response = await this.http.post(url, formData, {
        withCredentials: true,
        reportProgress: true,
        observe: 'response'
      }).toPromise();

      console.log('Response status:', response?.status);
      console.log('Response headers:', response?.headers);
      console.log('Response body:', response?.body);
      
      if (response?.status === 201) {
        console.log('Experiment created successfully');
        this.router.navigate(['/experiments']);
      } else {
        throw new Error(`Unexpected response status: ${response?.status}`);
      }
    } catch (error: any) {
      console.error('Error creating experiment:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        status: error.status,
        statusText: error.statusText,
        error: error.error,
        url: error.url,
        headers: error.headers
      });
      
      let errorMessage = 'Failed to create experiment. ';
      if (error.status === 400) {
        errorMessage += 'Bad request. ';
        if (error.error) {
          console.error('Error details:', error.error);
          if (typeof error.error === 'object') {
            errorMessage += JSON.stringify(error.error);
          } else {
            errorMessage += error.error;
          }
        }
      } else if (error.status === 500) {
        errorMessage += 'Server error. Please try again later.';
      } else if (error.message) {
        errorMessage += error.message;
      }
      
      this.showError(errorMessage);
    } finally {
      this.submitting = false;
    }
  }

  showError(message: string) {
    this.toastMessage = message;
    this.showToast = true;
    setTimeout(() => this.showToast = false, 2500);
  }
}