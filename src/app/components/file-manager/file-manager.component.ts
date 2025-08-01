import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FileUploadService } from '../../services/file-upload.service';
import { LoadingController, AlertController, ToastController } from '@ionic/angular';
import { lastValueFrom } from 'rxjs';
import { HttpEvent, HttpEventType, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { CloudFile } from '../../services/file-upload.service';
import { CommonModule } from '@angular/common';
import { NgClass, DatePipe } from '@angular/common';
import { tap, catchError } from 'rxjs/operators';

interface FileItem {
  id: number;
  name: string;
  type: string;
  size: number;
  uploadedAt: Date;
  path: string;
  projectId: number | null;
  description?: string;
}

@Component({
  selector: 'app-file-manager',
  templateUrl: './file-manager.component.html',
  styleUrls: ['./file-manager.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    NgClass,
    DatePipe
  ]
})
export class FileManagerComponent {
  @Input() projectId: number | null = null;
  @Output() fileUploaded = new EventEmitter<void>();
  
  files: FileItem[] = [];
  selectedFiles: File[] = [];
  uploads: Array<{
    fileName: string;
    progress: number;
    status: 'uploading' | 'completed' | 'error';
    error?: string;
  }> = [];
  error: string | null = null;
  uploadProgress: number | null = null;
  isUploading = false;
  isLoading = false;

  constructor(
    private fileUploadService: FileUploadService,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) {}

  ngOnInit(): void {
    if (this.projectId) {
      this.loadFiles();
    }
  }

  async loadFiles(): Promise<void> {
    if (!this.projectId) return;
    
    this.isLoading = true;
    
    try {
      const files = await lastValueFrom(
        this.fileUploadService.getProjectFiles(this.projectId)
      );
      
      this.files = files.map(file => ({
        id: file.id,
        name: file.name || file.originalName || 'Unnamed File',
        type: file.type,
        size: file.size,
        uploadedAt: new Date(file.uploadDate),
        path: file.downloadUrl,
        projectId: file.projectId,
        description: file.description || ''
      }));
      
      this.error = null;
    } catch (error: unknown) {
      console.error('Error loading files:', error);
      this.showError('Failed to load files. Please try again.');
    } finally {
      this.isLoading = false;
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getFileIcon(mimeType: string): string {
    if (!mimeType) return 'bi-file-earmark';
    
    const type = mimeType.toLowerCase();
    
    if (type.includes('image/')) return 'bi-file-earmark-image';
    if (type.includes('audio/')) return 'bi-file-earmark-music';
    if (type.includes('video/')) return 'bi-file-earmark-play';
    if (type.includes('application/pdf')) return 'bi-file-earmark-pdf';
    if (type.includes('application/msword') || type.includes('wordprocessingml')) return 'bi-file-earmark-word';
    if (type.includes('spreadsheet') || type.includes('excel')) return 'bi-file-earmark-spreadsheet';
    if (type.includes('presentation') || type.includes('powerpoint')) return 'bi-file-earmark-slides';
    if (type.includes('zip') || type.includes('compressed')) return 'bi-file-earmark-zip';
    if (type.includes('text/') || type.includes('application/json') || type.includes('application/xml')) return 'bi-file-earmark-text';
    if (type.includes('application/octet-stream')) return 'bi-file-binary';
    
    return 'bi-file-earmark';
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    
    this.selectedFiles = Array.from(input.files);
    input.value = '';
  }

  async uploadFiles(): Promise<void> {
    if (this.selectedFiles.length === 0 || !this.projectId) {
      return;
    }

    this.isUploading = true;
    const loading = await this.loadingCtrl.create({
      message: 'Uploading files...',
    });
    await loading.present();

    try {
      for (const file of this.selectedFiles) {
        const upload: {
          fileName: string;
          progress: number;
          status: 'uploading' | 'completed' | 'error';
          error?: string;
        } = {
          fileName: file.name,
          progress: 0,
          status: 'uploading' as const
        };
        this.uploads.push(upload);
        
        await lastValueFrom(
          this.fileUploadService.uploadFile(file, this.projectId!, file.name, '').pipe(
            tap({
              next: (event: any) => {
                if (event.type === HttpEventType.UploadProgress) {
                  const progress = Math.round(100 * (event.loaded / (event.total || 1)));
                  upload.progress = progress;
                  this.uploadProgress = progress;
                } else if (event instanceof HttpResponse) {
                  const uploadedFile = event.body as CloudFile;
                  upload.status = 'completed' as const;
                  this.files = [...this.files, {
                    id: uploadedFile.id,
                    name: uploadedFile.name || uploadedFile.originalName,
                    type: uploadedFile.type,
                    size: uploadedFile.size,
                    uploadedAt: new Date(uploadedFile.uploadDate),
                    path: uploadedFile.downloadUrl,
                    projectId: uploadedFile.projectId,
                    description: uploadedFile.description
                  }];
                }
              },
              error: (error) => {
                upload.status = 'error' as const;
                upload.error = 'Upload failed';
                console.error('Upload error:', error);
              }
            })
          )
        );
      }
      
      await this.presentToast('Files uploaded successfully', 'success');
      this.fileUploaded.emit();
      this.selectedFiles = [];
    } catch (error: unknown) {
      console.error('Upload error:', error);
      await this.presentToast('Error uploading files', 'danger');
    } finally {
      this.isUploading = false;
      this.uploadProgress = null;
    }
  }

  async downloadFile(file: FileItem): Promise<void> {
    if (!file.path) {
      this.showError('No download URL available for this file');
      return;
    }
    
    try {
      // Create a hidden anchor element
      const link = document.createElement('a');
      link.href = file.path;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Show success message
      const toast = await this.toastCtrl.create({
        message: 'Download started',
        duration: 2000,
        position: 'bottom',
        color: 'success'
      });
      await toast.present();
      
    } catch (error) {
      console.error('Download error:', error);
      this.showError('Failed to download file');
    }
  }

  async deleteFile(file: FileItem): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Confirm Delete',
      message: `Are you sure you want to delete ${file.name}?`,
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
                this.fileUploadService.deleteFile(file.id)
              );
              
              // Remove file from the list
              this.files = this.files.filter(f => f.id !== file.id);
              
              const toast = await this.toastCtrl.create({
                message: 'File deleted successfully',
                duration: 2000,
                position: 'bottom',
                color: 'success'
              });
              await toast.present();
              
            } catch (error) {
              console.error('Delete error:', error);
              this.showError('Failed to delete file');
            }
          }
        }
      ]
    });
    
    await alert.present();
  }

  private async showError(message: string) {
    const alert = await this.alertCtrl.create({
      header: 'Error',
      message,
      buttons: ['OK']
    });
    await alert.present();
  }

  private async presentToast(message: string, color: 'success' | 'danger' | 'warning' = 'success'): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}
