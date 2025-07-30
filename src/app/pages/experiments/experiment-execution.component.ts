import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonModal, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, 
  IonInput, IonItem, IonLabel, IonSelect, IonSelectOption, IonTextarea,
  IonProgressBar, IonList, IonListHeader, IonIcon, IonNote, IonBadge,
  IonSpinner, IonAlert, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle,
  IonCardContent, IonGrid, IonRow, IonCol, IonButtons, IonText, IonChip
} from '@ionic/angular/standalone';
import { play, close, refresh, cloudUpload, time, speedometer, checkmarkCircle, warning, alertCircle, closeCircle, stopCircle } from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { ExperimentExecutionService, VirtualMachine, ExperimentExecutionRequest, ExperimentExecutionResult, ExperimentProgress } from 'src/app/services/experiment-execution.service';
import { Subscription, interval } from 'rxjs';
import { takeWhile } from 'rxjs/operators';

@Component({
  selector: 'app-experiment-execution',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonModal, IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
    IonInput, IonItem, IonLabel, IonSelect, IonSelectOption, IonTextarea,
    IonProgressBar, IonList, IonListHeader, IonIcon, IonNote, IonBadge,
    IonSpinner, IonAlert, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle,
    IonCardContent, IonGrid, IonRow, IonCol, IonButtons, IonText, IonChip
  ],
  template: `
    <ion-modal [isOpen]="isOpen" (didDismiss)="dismiss.emit()" class="execution-modal">
      <ion-header>
        <ion-toolbar>
          <ion-title>Run Experiment: {{ experiment?.ExperimentId ? ('#' + experiment?.ExperimentId) : 'New Experiment' }}</ion-title>
          <ion-buttons slot="end">
            <ion-button (click)="dismiss.emit()">
              <ion-icon slot="icon-only" name="close"></ion-icon>
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      
      <ion-content class="ion-padding" [scrollY]="true">
        <!-- Execution Form -->
        <form (ngSubmit)="onSubmit()" *ngIf="!isExecuting && !executionResult">
          <ion-card>
            <ion-card-header>
              <ion-card-title>Model Configuration</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <!-- Model File Upload -->
              <ion-item>
                <ion-label position="stacked">Upload Model File <ion-text color="danger">*</ion-text></ion-label>
                <input type="file" #fileInput (change)="onFileSelected($event)" 
                       accept=".py,.ipynb,.pkl,.h5,.pt,.pth,.onnx"
                       style="margin-top: 10px;" required>
              </ion-item>
              
              <ion-item *ngIf="selectedFile" lines="none">
                <ion-label>
                  <h3>Selected File</h3>
                  <p>{{ selectedFile.name }} ({{ formatFileSize(selectedFile.size) }})</p>
                </ion-label>
                <ion-chip color="primary">{{ getFileType(selectedFile.name) }}</ion-chip>
              </ion-item>
              
              <ion-item>
                <ion-label position="stacked">Model Type <ion-text color="danger">*</ion-text></ion-label>
                <ion-select [(ngModel)]="modelType" name="modelType" required>
                  <ion-select-option value="tensorflow">TensorFlow</ion-select-option>
                  <ion-select-option value="pytorch">PyTorch</ion-select-option>
                  <ion-select-option value="scikit-learn">Scikit-Learn</ion-select-option>
                  <ion-select-option value="python">Python Script</ion-select-option>
                  <ion-select-option value="onnx">ONNX</ion-select-option>
                </ion-select>
              </ion-item>
              
              <ion-item>
                <ion-label position="stacked">Custom Model Name (Optional)</ion-label>
                <ion-input [(ngModel)]="customModelName" name="customName" placeholder="Enter custom name"></ion-input>
              </ion-item>
            </ion-card-content>
          </ion-card>
          
          <ion-card>
            <ion-card-header>
              <ion-card-title>Execution Configuration</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <ion-item>
                <ion-label position="stacked">Virtual Machine <ion-text color="danger">*</ion-text></ion-label>
                
                <div *ngIf="isLoadingVMs" class="ion-padding">
                  <ion-spinner></ion-spinner>
                  <ion-text>Loading virtual machines...</ion-text>
                </div>
                
                <div *ngIf="!isLoadingVMs && virtualMachines.length === 0" class="ion-padding">
                  <ion-text color="warning">No virtual machines available. Please add a VM first.</ion-text>
                </div>
                
                <ion-select *ngIf="!isLoadingVMs && virtualMachines.length > 0" 
                          [(ngModel)]="selectedVmId" 
                          name="vmId" 
                          required>
                  <ion-select-option *ngFor="let vm of virtualMachines" 
                                   [value]="vm.VmId" 
                                   [disabled]="vm.Status !== 'Running'">
                    {{ vm.Name }} ({{ vm.HostAddress }}) - {{ vm.Status }}
                    <span *ngIf="vm.Status !== 'Running'" class="ion-float-end">
                      <ion-text color="medium">(Not Available)</ion-text>
                    </span>
                  </ion-select-option>
                </ion-select>
                
                <ion-note *ngIf="errorMessage" color="danger" class="ion-margin-top">
                  {{ errorMessage }}
                </ion-note>
              </ion-item>
              
              <ion-item>
                <ion-label position="stacked">Parameters (JSON)</ion-label>
                <ion-textarea [(ngModel)]="parametersJson" name="parameters" placeholder='{"epochs": 10, "batch_size": 32}'></ion-textarea>
              </ion-item>
              
              <div class="ion-margin-top">
                <ion-button expand="block" type="submit" [disabled]="!isFormValid()">
                  <ion-icon slot="start" name="play"></ion-icon>
                  Run Experiment
                </ion-button>
              </div>
            </ion-card-content>
          </ion-card>
        </form>
        
        <!-- Execution Progress -->
        <div *ngIf="isExecuting">
          <ion-card>
            <ion-card-header>
              <ion-card-title>
                <ion-spinner name="crescent"></ion-spinner>
                Executing Experiment...
              </ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <ion-progress-bar [value]="progressPercentage / 100"></ion-progress-bar>
              <p>{{ currentStep }}</p>
              <p><strong>Duration:</strong> {{ formatDuration(executionDuration) }}</p>
              
              <ion-button color="danger" fill="outline" (click)="cancelExecution()">
                <ion-icon slot="start" name="stop-circle"></ion-icon>
                Cancel Execution
              </ion-button>
            </ion-card-content>
          </ion-card>
          
          <ion-card *ngIf="executionLogs.length > 0">
            <ion-card-header>
              <ion-card-title>Execution Logs</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <div style="background: #f5f5f5; padding: 10px; border-radius: 5px; font-family: monospace; max-height: 200px; overflow-y: auto;">
                <div *ngFor="let log of executionLogs">{{ log }}</div>
              </div>
            </ion-card-content>
          </ion-card>
        </div>
        
        <!-- Execution Results -->
        <div *ngIf="executionResult">
          <ion-card>
            <ion-card-header>
              <ion-card-title>
                <ion-icon [name]="executionResult.success ? 'checkmark-circle' : 'close-circle'" 
                          [color]="executionResult.success ? 'success' : 'danger'"></ion-icon>
                Execution {{ executionResult.success ? 'Completed' : 'Failed' }}
              </ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <ion-list>
                <ion-item>
                  <ion-label>
                    <h3>Status</h3>
                    <p>{{ executionResult.Status || 'N/A' }}</p>
                  </ion-label>
                  <ion-badge [color]="executionResult.success ? 'success' : 'danger'">
                    {{ executionResult.Status || 'Unknown' }}
                  </ion-badge>
                </ion-item>
                
                <ion-item *ngIf="executionResult.success && executionResult.accuracy !== undefined">
                  <ion-label>
                    <h3>Accuracy</h3>
                    <p>{{ formatAccuracy(executionResult.accuracy) }}</p>
                  </ion-label>
                </ion-item>
                
                <ion-item>
                  <ion-label>
                    <h3>Duration</h3>
                    <p>{{ formatDuration(executionResult.DurationSeconds || 0) }}</p>
                  </ion-label>
                </ion-item>
                
                <ion-item *ngIf="executionResult.ErrorMessage">
                  <ion-label color="danger">
                    <h3>Error</h3>
                    <p>{{ executionResult.ErrorMessage }}</p>
                  </ion-label>
                </ion-item>
              </ion-list>
              
              <div *ngIf="executionResult.metrics" style="margin-top: 20px;">
                <h4>Metrics</h4>
                <ion-chip *ngFor="let metric of getMetricsArray(executionResult.metrics)" color="primary">
                  {{ metric.key }}: {{ metric.value }}
                </ion-chip>
              </div>
            </ion-card-content>
          </ion-card>
          
          <ion-card *ngIf="executionResult.Logs">
            <ion-card-header>
              <ion-card-title>Execution Logs</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <div style="background: #f5f5f5; padding: 10px; border-radius: 5px; font-family: monospace; max-height: 300px; overflow-y: auto; white-space: pre-line;">
                {{ executionResult.Logs }}
              </div>
            </ion-card-content>
          </ion-card>
          
          <ion-button expand="block" color="primary" (click)="runAnotherExperiment()">
            <span style="margin-right: 8px;">🔄</span>
            Run Another Experiment
          </ion-button>
        </div>
      </ion-content>
    </ion-modal>
  `,
  styles: [`
    .execution-modal {
      --width: 90%;
      --max-width: 800px;
      --height: 90%;
      --border-radius: 12px;
      --box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    }
    
    ion-card {
      margin: 16px 0;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }
    
    ion-card-header {
      background: var(--ion-color-light);
    }
    
    ion-card-title {
      font-size: 1.2rem;
      font-weight: 600;
    }
    
    ion-item {
      --border-radius: 8px;
      --padding-start: 0;
      --inner-padding-end: 0;
      margin-bottom: 16px;
    }
    
    ion-button[type="submit"] {
      --padding-top: 20px;
      --padding-bottom: 20px;
      --border-radius: 8px;
      font-weight: 600;
      margin-top: 24px;
    }
    
    ion-textarea {
      --background: #f8f9fa;
      --padding-start: 12px;
      --padding-end: 12px;
      --padding-top: 12px;
      --padding-bottom: 12px;
      border-radius: 8px;
      margin-top: 8px;
    }
    
    input[type="file"] {
      width: 100%;
      padding: 12px;
      border: 1px solid #ddd;
      border-radius: 8px;
      background: #f8f9fa;
    }
  `]
})
export class ExperimentExecutionComponent implements OnInit, OnDestroy {
  private _isOpen = false;
  
  @Input() 
  get isOpen(): boolean { 
    return this._isOpen; 
  }
  
  set isOpen(value: boolean) {
    if (this._isOpen !== value) {
      this._isOpen = value;
      if (this._isOpen) {
        this.resetForm();
        this.loadVirtualMachines();
      }
    }
  }
  
  @Input() experiment: ExperimentExecutionResult | null = null;
  @Output() dismiss = new EventEmitter<void>();
  @Output() executionComplete = new EventEmitter<ExperimentExecutionResult>();

  // Form state
  selectedFile: File | null = null;
  modelType: string = 'tensorflow';
  customModelName: string = '';
  selectedVmId: number | null = null;
  parametersJson: string = '{}';
  formSubmitted = false;
  errorMessage: string | null = null;
  
  // Execution state
  isExecuting = false;
  isLoadingVMs = false;
  executionResult: ExperimentExecutionResult | null = null;
  executionLogs: string[] = [];
  executionDuration = 0;
  progressPercentage = 0;
  currentStep = 'Initializing...';
  virtualMachines: VirtualMachine[] = [];
  startTime: number = 0;
  progressSubscription?: Subscription;
  durationSubscription?: Subscription;
  executionSubscription?: Subscription;

  constructor(private experimentService: ExperimentExecutionService) { 
    // Register all icons used in this component
    addIcons({ play, close, refresh, cloudUpload, time, speedometer, checkmarkCircle, warning, alertCircle, closeCircle, stopCircle });
  }

  resetForm(): void {
    this.selectedFile = null;
    this.modelType = 'tensorflow';
    this.customModelName = '';
    this.selectedVmId = null;
    this.parametersJson = '{}';
    this.formSubmitted = false;
    this.errorMessage = null;
    this.executionResult = null;
    this.executionLogs = [];
    this.executionDuration = 0;
    this.progressPercentage = 0;
    this.currentStep = 'Initializing...';
    this.isExecuting = false;
  }

  ngOnInit() {
    this.loadVirtualMachines();
  }

  ngOnDestroy() {
    if (this.progressSubscription) {
      this.progressSubscription.unsubscribe();
    }
    if (this.durationSubscription) {
      this.durationSubscription.unsubscribe();
    }
    if (this.executionSubscription) {
      this.executionSubscription.unsubscribe();
    }
  }

  private loadVirtualMachines(): void {
    this.isLoadingVMs = true;
    this.errorMessage = null;
    
    this.experimentService.getAvailableVMs().subscribe({
      next: (vms) => {
        console.log('Loaded VMs:', vms);
        this.virtualMachines = vms || [];
        
        if (this.virtualMachines.length === 0) {
          this.errorMessage = 'No virtual machines available. Please add a VM first.';
        } else {
          // Try to find a running VM first, otherwise use the first available
          const runningVm = this.virtualMachines.find(vm => vm.Status === 'Running');
          this.selectedVmId = runningVm ? runningVm.VmId : this.virtualMachines[0].VmId;
        }
        
        this.isLoadingVMs = false;
      },
      error: (error) => {
        console.error('Error loading VMs:', error);
        this.errorMessage = `Failed to load virtual machines: ${error.message || 'Unknown error'}`;
        this.virtualMachines = [];
        this.isLoadingVMs = false;
      }
    });
  }

  isFormValid(): boolean {
    return !!(this.selectedFile && this.modelType && this.selectedVmId);
  }

  executeExperiment(): void {
    if (!this.selectedFile || !this.selectedVmId) {
      this.showError('Please select a model file and VM');
      return;
    }

    this.isExecuting = true;
    this.progressPercentage = 0;
    this.executionDuration = 0;
    this.executionLogs = [];
    this.executionResult = null;
    this.currentStep = 'Initializing...';

    // Create the request object with required properties
    const request: ExperimentExecutionRequest = {
      ExperimentId: this.experiment?.ExperimentId || 0, // Provide a default value or handle null case
      VirtualMachineId: this.selectedVmId || 0, // Provide a default value or handle null case
      ModelType: this.modelType,
      Parameters: JSON.parse(this.parametersJson),
      ModelFile: this.selectedFile,
      CustomModelName: this.customModelName
    };

    this.addLog('Starting experiment execution...');
    
    // Start duration timer
    const startTime = Date.now();
    this.durationSubscription = interval(1000).subscribe(() => {
      this.executionDuration = (Date.now() - startTime) / 1000;
    });

    // Start progress simulation (replace with actual progress updates from backend)
    this.simulateProgress();

    // Call the experiment service
    this.experimentService.runExperiment(request).subscribe({
      next: (result) => {
        this.executionResult = result;
        this.addLog('Experiment completed successfully');
        this.completeExecution(true);
      },
      error: (error) => {
        console.error('Error executing experiment:', error);
        this.addLog(`Error: ${error.message || 'Failed to execute experiment'}`);
        this.completeExecution(false, error.message || 'Failed to execute experiment');
      }
    });
  }

  private simulateProgress(): void {
    // Clear any existing progress subscription
    if (this.progressSubscription) {
      this.progressSubscription.unsubscribe();
    }

    let progress = 0;
    this.progressSubscription = interval(300).subscribe({
      next: () => {
        if (progress >= 90 || !this.isExecuting) {
          this.progressSubscription?.unsubscribe();
          return;
        }
        
        progress += Math.random() * 10;
        this.progressPercentage = Math.min(progress, 90); // Cap at 90% until complete
        
        // Update current step based on progress
        if (this.progressPercentage < 30) {
          this.currentStep = 'Uploading model...';
        } else if (this.progressPercentage < 60) {
          this.currentStep = 'Initializing VM...';
        } else {
          this.currentStep = 'Running experiment...';
        }
        
        this.addLog(`Progress: ${Math.round(this.progressPercentage)}% - ${this.currentStep}`);
      }
    });
  }

  private completeExecution(success: boolean, errorMessage: string = ''): void {
    this.isExecuting = false;
    this.progressPercentage = 100;
    
    if (this.durationSubscription) {
      this.durationSubscription.unsubscribe();
    }
    
    if (success) {
      this.currentStep = 'Completed';
      this.addLog('Experiment completed successfully!');
    } else {
      this.currentStep = 'Failed';
      this.addLog(`Experiment failed: ${errorMessage}`);
      this.showError(errorMessage);
    }
  }

  cancelExecution(): void {
    if (confirm('Are you sure you want to cancel the experiment?')) {
      this.addLog('Experiment cancelled by user');
      this.completeExecution(false, 'Cancelled by user');
      // TODO: Call cancel experiment API if supported by backend
    }
  }

  runAnotherExperiment(): void {
    this.executionResult = null;
    this.formSubmitted = false;
    this.selectedFile = null;
    this.parametersJson = '{}';
    this.progressPercentage = 0;
    this.executionDuration = 0;
    this.executionLogs = [];
  }

  private addLog(message: string): void {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    this.executionLogs.push(`[${timestamp}] ${message}`);
  }

  private showError(message: string): void {
    this.errorMessage = message;
    // Auto-hide error after 5 seconds
    setTimeout(() => this.errorMessage = null, 5000);
  }

  private cleanup(): void {
    if (this.progressSubscription) {
      this.progressSubscription.unsubscribe();
    }
    if (this.durationSubscription) {
      this.durationSubscription.unsubscribe();
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getFileType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    const types: { [key: string]: string } = {
      'py': 'Python Script',
      'ipynb': 'Jupyter Notebook',
      'h5': 'HDF5 Model',
      'pkl': 'Pickle File',
      'pt': 'PyTorch Model',
      'pth': 'PyTorch Checkpoint',
      'onnx': 'ONNX Model',
      'pb': 'TensorFlow Model',
      'savedmodel': 'TensorFlow SavedModel'
    };
    return types[ext] || 'Unknown';
  }

  formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs}s`;
  }

  formatAccuracy(accuracy: number): string {
    return (accuracy * 100).toFixed(2) + '%';
  }

  getMetricsArray(metrics: { [key: string]: any }): { key: string, value: any }[] {
    return Object.entries(metrics || {}).map(([key, value]) => ({ 
      key, 
      value: typeof value === 'number' ? value.toFixed(4) : value 
    }));
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      // If it's a custom model, use the filename without extension as the model name
      if (this.modelType === 'custom' && !this.customModelName) {
        this.customModelName = file.name.replace(/\.[^/.]+$/, '');
      }
    }
  }

  onSubmit(): void {
    this.formSubmitted = true;
    if (this.isFormValid()) {
      this.executeExperiment();
    } else {
      this.errorMessage = 'Please fill in all required fields and select a VM.';
    }
  }
}
