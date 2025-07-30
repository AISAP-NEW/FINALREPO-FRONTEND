import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { IonItemDivider } from '@ionic/angular/standalone';
import { environment } from '../../../environments/environment';
import { IonButton, IonContent, IonHeader, IonInput, IonItem, IonLabel, IonList, IonTitle, IonToolbar, IonSelect, IonSelectOption, IonIcon, IonSpinner } from '@ionic/angular/standalone';

@Component({
  selector: 'app-cloudstorage',
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
    IonSelect,
    IonSelectOption,
    IonIcon,
    IonSpinner,
    IonItemDivider
  ],
  templateUrl: './cloudstorage.page.html'
})

export class CloudStoragePage implements OnInit {
  projects: any[] = [];
  selectedProjectId: number | null = null;
  files: any[] = [];
  loadingFiles = false;
  loadingProjects = false;
  uploading = false;
  showToast = false;
  toastMessage = '';
  toastColor: 'success' | 'danger' = 'success';
  uploadFile: File | null = null;
  uploadError = '';
  versions: any[] = [];
  loadingVersions = false;
  selectedFileId: number | null = null;
  selectedFileName: string = '';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadProjects();
  }

  loadProjects() {
    this.loadingProjects = true;
    // Try different user IDs since User ID 1 might not exist
    const userId = 1; // Try user ID 1 first
    console.log(`Attempting to load projects for userId: ${userId}`);
    console.log(`Full API URL: ${environment.apiUrl}/api/Project?userId=${userId}`);
    
    this.http.get<any[]>(`${environment.apiUrl}/api/Project?userId=${userId}`).subscribe({
      next: data => {
        console.log('API Response:', data);
        console.log('Response type:', typeof data);
        console.log('Is array:', Array.isArray(data));
        console.log('Response length:', data?.length);
        
        this.projects = data || [];
        this.loadingProjects = false;
        
        if (this.projects.length === 0) {
          console.warn('No projects found for user ID', userId);
          // Try with a different user ID
          this.tryDifferentUserId();
        } else {
          console.log('Projects loaded successfully:', this.projects);
        }
      },
      error: err => {
        console.error('API Error:', err);
        console.error('Error status:', err.status);
        console.error('Error message:', err.message);
        console.error('Full error object:', err);
        
        if (err.status === 404) {
          console.log('User not found, trying different user ID...');
          this.tryDifferentUserId();
        } else {
          this.showError(`Failed to load projects: ${err.status} - ${err.message || 'Unknown error'}`);
          this.loadingProjects = false;
        }
      }
    });
  }
  
  tryDifferentUserId() {
    // Try user IDs 2, 3, 4, 5 (based on the AddDevelopers.sql script)
    const userIdsToTry = [2, 3, 4, 5];
    let currentIndex = 0;
    
    const tryNextUser = () => {
      if (currentIndex >= userIdsToTry.length) {
        this.showError('No projects found for any user ID. Please check database.');
        this.loadingProjects = false;
        return;
      }
      
      const userId = userIdsToTry[currentIndex];
      console.log(`Trying user ID: ${userId}`);
      
      this.http.get<any[]>(`${environment.apiUrl}/api/Project?userId=${userId}`).subscribe({
        next: data => {
          console.log(`User ID ${userId} response:`, data);
          if (data && data.length > 0) {
            this.projects = data;
            this.loadingProjects = false;
            console.log(`Success! Found projects for user ID ${userId}:`, data);
            this.showSuccess(`Loaded projects for user ID ${userId}`);
          } else {
            currentIndex++;
            tryNextUser();
          }
        },
        error: err => {
          console.log(`User ID ${userId} failed:`, err.status);
          currentIndex++;
          tryNextUser();
        }
      });
    };
    
    tryNextUser();
  }

  onProjectChange() {
    this.files = [];
    this.versions = [];
    if (this.selectedProjectId) {
      this.loadFiles();
    }
  }

  loadFiles() {
    this.loadingFiles = true;
    this.http.get<any[]>(`${environment.apiUrl}/api/cloudstorage/project/${this.selectedProjectId}`).subscribe({
      next: data => {
        this.files = data;
        this.loadingFiles = false;
      },
      error: err => {
        this.showError('Failed to load files');
        this.loadingFiles = false;
      }
    });
  }

  onFileChange(event: any) {
    this.uploadError = '';
    const file = event.target.files[0];
    if (file) {
      if (file.size > 100 * 1024 * 1024) {
        this.uploadError = 'File size must be less than 100MB.';
      } else {
        this.uploadFile = file;
      }
    }
  }

  upload() {
    if (!this.uploadFile || !this.selectedProjectId) {
      this.uploadError = 'Select a project and a file.';
      return;
    }
    this.uploading = true;
    const formData = new FormData();
    formData.append('projectId', String(this.selectedProjectId)); // Backend expects 'projectId' not 'ProjectId'
    formData.append('file', this.uploadFile, this.uploadFile.name); // Backend expects 'file' not 'File'
    formData.append('uploadedBy', '1'); // Add required uploadedBy parameter (using userId 1 for now)
    console.log('Uploading file with data:');
    console.log('- projectId:', this.selectedProjectId);
    console.log('- file name:', this.uploadFile.name);
    console.log('- file size:', this.uploadFile.size);
    console.log('- uploadedBy: 1');
    console.log('FormData prepared with:');
    console.log('- projectId parameter added');
    console.log('- file parameter added');
    console.log('- uploadedBy parameter added');
    
    this.http.post(`${environment.apiUrl}/api/cloudstorage/upload`, formData).subscribe({
      next: (response) => {
        console.log('Upload successful! Response:', response);
        this.showSuccess('File uploaded successfully');
        this.uploadFile = null;
        (document.getElementById('cloud-upload-input') as HTMLInputElement).value = '';
        this.loadFiles();
        this.uploading = false;
      },
      error: err => {
        console.error('Upload failed! Full error:', err);
        console.error('Error status:', err.status);
        console.error('Error message:', err.message);
        console.error('Error body:', err.error);
        
        let errorMessage = 'Upload failed';
        if (err.error && typeof err.error === 'string') {
          errorMessage = `Upload failed: ${err.error}`;
        } else if (err.error && err.error.message) {
          errorMessage = `Upload failed: ${err.error.message}`;
        } else if (err.message) {
          errorMessage = `Upload failed: ${err.message}`;
        } else {
          errorMessage = `Upload failed: HTTP ${err.status}`;
        }
        
        this.showError(errorMessage);
        this.uploading = false;
      }
    });
  }

  showFileVersions(file: any) {
    this.selectedFileId = file.Id; // Use Id instead of FileId to match database
    this.selectedFileName = file.FileName;
    this.versions = [];
    this.loadingVersions = true;
    this.http.get<any[]>(`${environment.apiUrl}/api/cloudstorage/versions/${file.Id}`).subscribe({
      next: data => {
        this.versions = data;
        this.loadingVersions = false;
      },
      error: err => {
        this.showError('Failed to load versions');
        this.loadingVersions = false;
      }
    });
  }

  download(fileId: number, version: string) {
    this.http.get(`${environment.apiUrl}/api/cloudstorage/download/${fileId}?version=${version}`, { responseType: 'blob' }).subscribe({
      next: blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = this.selectedFileName || 'file';
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: err => {
        this.showError('Download failed');
      }
    });
  }

  showError(msg: string) {
    this.toastMessage = msg;
    this.toastColor = 'danger';
    this.showToast = true;
    setTimeout(() => this.showToast = false, 2500);
  }

  showSuccess(msg: string) {
    this.toastMessage = msg;
    this.toastColor = 'success';
    this.showToast = true;
    setTimeout(() => this.showToast = false, 2500);
  }
} 