import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonIcon, 
  IonList, IonItem, IonLabel, IonSpinner, IonSelect, IonSelectOption,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonText,
  IonItemSliding, IonItemOptions, IonItemOption, IonGrid, IonRow, IonCol,
  IonButtons, IonMenuButton, IonTextarea, IonInput, IonItemDivider, 
  IonNote, IonBadge, IonProgressBar, IonSegment, IonSegmentButton,
  LoadingController, 
  ToastController, 
  AlertController 
} from '@ionic/angular/standalone';
import { FileUploadService } from '../../services/file-upload.service';
import { ProjectService, Project } from '../../services/project.service';
import { lastValueFrom } from 'rxjs';

export interface CloudFile {
  id: number;
  name: string;
  originalName: string;
  size: number;
  type: string;
  uploadDate: Date;
  projectId: number | null;
  description: string;
  downloadUrl: string;
}

@Component({
  selector: 'app-cloudstorage',
  templateUrl: './cloudstorage.page.html',
  styleUrls: ['./cloudstorage.page.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonIcon,
    IonList, IonItem, IonLabel, IonSpinner, IonSelect, IonSelectOption,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonText,
    IonItemSliding, IonItemOptions, IonItemOption, IonGrid, IonRow, IonCol,
    IonButtons, IonMenuButton, IonTextarea, IonInput, IonItemDivider, 
    IonNote, IonBadge, IonProgressBar, IonSegment, IonSegmentButton
  ],
  providers: [
    FileUploadService,
    ProjectService,
    LoadingController,
    ToastController,
    AlertController
  ]
})
export class CloudStoragePage implements OnInit {
  @ViewChild('slidingItem') slidingItem: IonItemSliding | undefined;
  
  projects: Project[] = [];
  selectedProjectId: number | null = null;
  files: CloudFile[] = [];
  datasets: CloudFile[] = []; // New property for datasets
  loading = false;
  loadingDatasets = false; // New loading state for datasets
  uploadProgress: number | null = null;
  currentSegment = 'files'; // Track active tab
  
  // New file upload
  newFile: File | null = null;
  fileName: string = '';
  fileDescription: string = '';

  constructor(
    private fileUploadService: FileUploadService,
    private projectService: ProjectService,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private alertController: AlertController
  ) {}

  async ngOnInit() {
    await this.loadProjects();
  }

  async loadProjects() {
    this.loading = true;
    try {
      this.projects = await lastValueFrom(this.projectService.getProjects());
    } catch (error) {
      console.error('Error loading projects:', error);
      this.showToast('Failed to load projects', 'danger');
    } finally {
      this.loading = false;
    }
  }

  async onProjectChange(event: any) {
    this.selectedProjectId = event.detail.value;
    if (this.selectedProjectId) {
      await this.loadFiles();
      await this.loadDatasets();
    } else {
      this.files = [];
      this.datasets = [];
    }
  }

  async loadFiles() {
    if (!this.selectedProjectId) return;
    
    this.loading = true;
    try {
      // Fetch files for the selected project
      this.files = await lastValueFrom(
        this.fileUploadService.getProjectFiles(this.selectedProjectId)
      );
      
      console.log('Loaded files:', this.files); // For debugging
      
    } catch (error) {
      console.error('Error loading files:', error);
      this.showError('Failed to load files. Please try again.');
    } finally {
      this.loading = false;
    }
  }

  async loadDatasets() {
    if (!this.selectedProjectId) return;
    
    this.loadingDatasets = true;
    try {
      // First, get all files for the project
      const allFiles = await lastValueFrom(
        this.fileUploadService.getProjectFiles(this.selectedProjectId)
      );
      
      console.log('All files from API:', allFiles); // Debug log
      
      // Filter for dataset files - more inclusive filter
      this.datasets = allFiles.filter(file => {
        const lowerName = file.name.toLowerCase();
        const lowerType = (file.type || '').toLowerCase();
        
        return (
          // Common data file extensions
          lowerName.endsWith('.csv') ||
          lowerName.endsWith('.xls') ||
          lowerName.endsWith('.xlsx') ||
          lowerName.endsWith('.json') ||
          lowerName.endsWith('.xml') ||
          
          // Common data MIME types
          lowerType.includes('csv') ||
          lowerType.includes('excel') ||
          lowerType.includes('spreadsheet') ||
          lowerType.includes('json') ||
          lowerType.includes('xml') ||
          
          // Filename indicators
          lowerName.includes('data') ||
          lowerName.includes('dataset') ||
          lowerName.includes('export')
        );
      });
      
      console.log('Filtered datasets:', this.datasets); // Debug log
      
      // If no datasets found, show all files (for debugging)
      if (this.datasets.length === 0) {
        console.warn('No datasets found using filter, showing all files');
        this.datasets = [...allFiles];
      }
      
    } catch (error) {
      console.error('Error loading datasets:', error);
      this.showError('Failed to load datasets');
    } finally {
      this.loadingDatasets = false;
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.newFile = file;
      this.fileName = file.name.split('.')[0]; // Set default name without extension
    }
  }

  async uploadFile() {
    if (!this.newFile || !this.selectedProjectId) {
      this.showToast('Please select a file and project', 'warning');
      return;
    }

    if (!this.fileName) {
      this.showToast('Please enter a file name', 'warning');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Uploading file...',
    });
    await loading.present();

    try {
      // Use the fileUploadService to upload the file
      const uploadedFile = await lastValueFrom(
        this.fileUploadService.uploadFile(
          this.newFile,
          this.selectedProjectId,
          this.fileName,
          this.fileDescription
        )
      );
      
      this.showToast('File uploaded successfully', 'success');
      
      // Refresh the files list
      await this.loadFiles();
      
      // Reset the form
      this.resetForm();
      
    } catch (error) {
      console.error('Error uploading file:', error);
      this.showError('Failed to upload file. Please try again.');
    } finally {
      await loading.dismiss();
    }
  }

  async downloadFile(file: CloudFile) {
    try {
      // TODO: Implement file download
      // This is a placeholder - implement according to your backend API
      window.open(file.downloadUrl, '_blank');
    } catch (error) {
      console.error('Error downloading file:', error);
      this.showToast('Failed to download file', 'danger');
    }
  }

  async downloadDataset(dataset: CloudFile) {
    try {
      // Create a temporary anchor element
      const link = document.createElement('a');
      link.href = dataset.downloadUrl;
      link.download = dataset.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Show success message
      const toast = await this.toastController.create({
        message: 'Download started',
        duration: 2000,
        position: 'bottom',
        color: 'success'
      });
      await toast.present();
      
    } catch (error) {
      console.error('Error downloading dataset:', error);
      this.showError('Failed to download dataset');
    }
  }

  async deleteFile(file: CloudFile, slidingItem?: IonItemSliding) {
    if (slidingItem) {
      slidingItem.close();
    } else if (this.slidingItem) {
      this.slidingItem.close();
    }
    
    try {
      // TODO: Implement file deletion
      // This is a placeholder - implement according to your backend API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      this.files = this.files.filter(f => f.id !== file.id);
      this.showToast('File deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting file:', error);
      this.showToast('Failed to delete file', 'danger');
    }
  }

  async deleteDataset(dataset: CloudFile) {
    const alert = await this.alertController.create({
      header: 'Confirm Delete',
      message: `Are you sure you want to delete ${dataset.name}?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          handler: async () => {
            try {
              await lastValueFrom(
                this.fileUploadService.deleteFile(dataset.id)
              );
              
              // Remove from datasets array
              this.datasets = this.datasets.filter(d => d.id !== dataset.id);
              
              // Show success message
              const toast = await this.toastController.create({
                message: 'Dataset deleted successfully',
                duration: 2000,
                position: 'bottom',
                color: 'success'
              });
              await toast.present();
              
            } catch (error) {
              console.error('Error deleting dataset:', error);
              this.showError('Failed to delete dataset');
            }
          }
        }
      ]
    });
    
    await alert.present();
  }

  segmentChanged(event: any) {
    this.currentSegment = event.detail.value;
    if (this.currentSegment === 'datasets' && this.selectedProjectId) {
      this.loadDatasets();
    }
  }

  getFileIcon(fileType: string): string {
    if (!fileType) return 'document';
    
    if (fileType.includes('image/')) return 'image';
    if (fileType.includes('video/')) return 'videocam';
    if (fileType.includes('audio/')) return 'musical-notes';
    if (fileType.includes('application/pdf')) return 'document-text';
    if (fileType.includes('application/zip') || fileType.includes('compressed')) return 'archive';
    if (fileType.includes('text/')) return 'document-text';
    
    return 'document';
  }

  getFileColor(fileType: string): string {
    if (!fileType) return 'medium';
    
    if (fileType.includes('image/')) return 'primary';
    if (fileType.includes('video/')) return 'danger';
    if (fileType.includes('audio/')) return 'success';
    if (fileType.includes('application/pdf')) return 'danger';
    
    return 'medium';
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private resetForm() {
    this.newFile = null;
    this.fileName = '';
    this.fileDescription = '';
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }

  private async showToast(message: string, color: 'success' | 'danger' | 'warning' = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }

  private async showError(message: string) {
    const alert = await this.alertController.create({
      header: 'Error',
      message,
      buttons: ['OK']
    });
    await alert.present();
  }
}