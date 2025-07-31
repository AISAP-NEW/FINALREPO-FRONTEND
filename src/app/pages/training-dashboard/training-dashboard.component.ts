import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TrainingService, TrainingStatus, TrainingLogs } from '../../services/training.service';
import { SignalRService, TrainingStatusUpdate } from '../../services/signalr.service';
import { interval, Subscription, combineLatest } from 'rxjs';
import { finalize, filter } from 'rxjs/operators';

import { IonButton, IonToast, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonItem, IonLabel, IonIcon, IonSpinner, IonBadge } from '@ionic/angular/standalone';

@Component({
  selector: 'app-training-dashboard',
  templateUrl: './training-dashboard.component.html',
  styleUrls: ['./training-dashboard.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonButton,
    IonToast,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonItem,
    IonLabel,
    IonIcon,
    IonSpinner,
    IonBadge
  ]
})
export class TrainingDashboardComponent implements OnInit, OnDestroy {
  trainSessionId?: number;
  status: string = '';
  vmStatus: string = '';
  isRunning: boolean = false;
  logs: string = '';
  metrics: any = {};
  isLoading = false;
  pollSub?: Subscription;
  error: string = '';
  showErrorToast = false;
  errorMessage = '';

  // Training session details
  startedAt?: string;
  completedAt?: string;
  pausedAt?: string;
  errorDetails?: string;

  // General dashboard properties
  isGeneralDashboard = false;
  activeTrainingSessions: any[] = [];
  systemResources: any = null;

  // SignalR properties
  isSignalRConnected = false;
  signalRError = '';
  realTimeUpdates: TrainingStatusUpdate | null = null;
  lastUpdateTime: string = '';

  // Make Object available in template
  protected readonly Object = Object;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private trainingService: TrainingService,
    private signalRService: SignalRService
  ) {}

  ngOnInit() {
    this.trainSessionId = Number(this.route.snapshot.paramMap.get('trainSessionId'));
    
    // Initialize SignalR connection
    this.initializeSignalR();
    
    if (!this.trainSessionId) {
      // General training dashboard view
      this.isGeneralDashboard = true;
      this.loadGeneralDashboard();
    } else {
      // Specific training session view
      this.isGeneralDashboard = false;
      this.pollTrainingStatus();
      // Poll every 5 seconds for status updates (fallback)
      this.pollSub = interval(5000).subscribe(() => this.pollTrainingStatus());
    }
  }

  ngOnDestroy() {
    this.pollSub?.unsubscribe();
    this.cleanupSignalR();
  }

  /**
   * Load general training dashboard
   */
  loadGeneralDashboard() {
    this.isLoading = true;
    this.error = '';
    
    // Load system resources
    this.trainingService.getSystemResources().subscribe({
      next: (resources) => {
        this.systemResources = resources;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load system resources:', err);
        this.isLoading = false;
      }
    });
  }

  /**
   * Navigate to a specific training session
   */
  navigateToSession(sessionId: number) {
    this.router.navigate(['/dashboard', sessionId]);
  }

  /**
   * Start a new training session
   */
  startNewTraining() {
    this.router.navigate(['/models']);
  }

  /**
   * Poll training status from backend
   * Maps to: GET /api/Training/status/{trainSessionId}
   */
  pollTrainingStatus() {
    if (!this.trainSessionId) return;
    
    this.isLoading = true;
    this.error = '';
    
    this.trainingService.getStatus(this.trainSessionId).subscribe({
      next: (response: TrainingStatus) => {
        this.status = response.status || '';
        this.vmStatus = response.vmStatus || '';
        this.isRunning = response.isRunning || false;
        this.startedAt = response.startedAt;
        this.completedAt = response.completedAt;
        this.pausedAt = response.pausedAt;
        this.errorDetails = response.errorMessage;
        
        // If there's an error message, show it
        if (response.errorMessage) {
          this.showError(response.errorMessage);
        }
        
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err.message || 'Failed to fetch training status.';
        this.isLoading = false;
        this.showError(this.error);
      }
    });
  }

  /**
   * Fetch training logs
   * Maps to: GET /api/Training/logs/{trainSessionId}
   */
  fetchLogs() {
    if (!this.trainSessionId) return;
    
    this.trainingService.getLogs(this.trainSessionId).subscribe({
      next: (response: TrainingLogs) => {
        this.logs = response.logs || '';
      },
      error: (err) => {
        console.error('Failed to fetch logs:', err);
        this.logs = 'Failed to load training logs.';
      }
    });
  }

  /**
   * Pause training session
   * Maps to: POST /api/Training/pause/{trainSessionId}
   */
  pauseTraining() {
    if (!this.trainSessionId) return;
    
    this.isLoading = true;
    this.trainingService.pause(this.trainSessionId).subscribe({
      next: () => {
        this.showSuccess('Training paused successfully');
        this.pollTrainingStatus(); // Refresh status
      },
      error: (err) => {
        this.showError(err.message || 'Failed to pause training');
        this.isLoading = false;
      }
    });
  }

  /**
   * Resume training session
   * Maps to: POST /api/Training/resume/{trainSessionId}
   */
  resumeTraining() {
    if (!this.trainSessionId) return;
    
    this.isLoading = true;
    this.trainingService.resume(this.trainSessionId).subscribe({
      next: () => {
        this.showSuccess('Training resumed successfully');
        this.pollTrainingStatus(); // Refresh status
      },
      error: (err) => {
        this.showError(err.message || 'Failed to resume training');
        this.isLoading = false;
      }
    });
  }

  /**
   * Cancel training session
   * Maps to: POST /api/Training/cancel/{trainSessionId}
   */
  cancelTraining() {
    if (!this.trainSessionId) return;
    
    if (!confirm('Are you sure you want to cancel this training session? This action cannot be undone.')) {
      return;
    }
    
    this.isLoading = true;
    this.trainingService.cancel(this.trainSessionId).subscribe({
      next: () => {
        this.showSuccess('Training cancelled successfully');
        this.pollTrainingStatus(); // Refresh status
      },
      error: (err) => {
        this.showError(err.message || 'Failed to cancel training');
        this.isLoading = false;
      }
    });
  }

  /**
   * Test VM logs for debugging
   */
  testVMLogs() {
    // This would need the instanceId, but we don't have it in this component
    // You might want to pass it as a parameter or get it from the training status
    console.log('Testing VM logs...');
  }

  /**
   * Get system resources
   */
  getSystemResources() {
    this.trainingService.getSystemResources().subscribe({
      next: (resources) => {
        console.log('System resources:', resources);
        this.showSuccess(`CPU: ${resources.cpuUsage}, Memory: ${resources.memoryUsage}`);
      },
      error: (err) => {
        this.showError('Failed to get system resources');
      }
    });
  }

  /**
   * Navigate back to models page
   */
  goBack() {
    this.router.navigate(['/models']);
  }

  /**
   * Show error toast
   */
  private showError(message: string) {
    this.errorMessage = message;
    this.showErrorToast = true;
  }

  /**
   * Show success toast
   */
  private showSuccess(message: string) {
    // You can implement a success toast here
    console.log('Success:', message);
  }

  /**
   * Dismiss error toast
   */
  dismissError() {
    this.showErrorToast = false;
  }

  /**
   * Get status badge class for styling
   */
  getStatusClass(): string {
    switch (this.status.toLowerCase()) {
      case 'running':
      case 'inprogress':
        return 'status-running';
      case 'completed':
      case 'finished':
        return 'status-completed';
      case 'paused':
        return 'status-paused';
      case 'cancelled':
      case 'stopped':
        return 'status-cancelled';
      case 'failed':
      case 'error':
        return 'status-error';
      default:
        return 'status-pending';
    }
  }

  /**
   * Check if training is active (running or paused)
   */
  isTrainingActive(): boolean {
    return this.status.toLowerCase() === 'running' || 
           this.status.toLowerCase() === 'inprogress' || 
           this.status.toLowerCase() === 'paused';
  }

  /**
   * Check if training is completed
   */
  isTrainingCompleted(): boolean {
    return this.status.toLowerCase() === 'completed' || 
           this.status.toLowerCase() === 'finished';
  }

  /**
   * Check if training failed
   */
  isTrainingFailed(): boolean {
    return this.status.toLowerCase() === 'failed' || 
           this.status.toLowerCase() === 'error' || 
           this.status.toLowerCase() === 'cancelled';
  }

  // SignalR Methods

  /**
   * Initialize SignalR connection and set up subscriptions
   */
  private async initializeSignalR(): Promise<void> {
    try {
      // Start SignalR connection
      await this.signalRService.startConnection();
      
      // Subscribe to connection state changes
      this.signalRService.getConnectionState().subscribe(isConnected => {
        this.isSignalRConnected = isConnected;
        if (!isConnected) {
          this.signalRError = 'Real-time connection lost';
        } else {
          this.signalRError = '';
        }
      });

      // Subscribe to training updates
      this.signalRService.getTrainingUpdates().subscribe(update => {
        if (update && this.trainSessionId && update.instanceId === this.trainSessionId) {
          this.handleRealTimeUpdate(update);
        }
      });

      // Subscribe to error messages
      this.signalRService.getErrorMessages().subscribe(error => {
        if (error) {
          this.signalRError = error;
        }
      });

      // Join training group if we have a session ID
      if (this.trainSessionId) {
        await this.signalRService.joinTrainingGroup(this.trainSessionId);
      }
    } catch (error) {
      console.error('Failed to initialize SignalR:', error);
      this.signalRError = 'Failed to connect to real-time updates';
    }
  }

  /**
   * Handle real-time training updates from SignalR
   */
  private handleRealTimeUpdate(update: TrainingStatusUpdate): void {
    console.log('Handling real-time update:', update);
    
    // Update status
    this.status = update.status;
    this.lastUpdateTime = update.timestamp;
    
    // Update logs if provided
    if (update.logs) {
      this.logs = update.logs;
    }
    
    // Update metrics if provided
    if (update.metrics) {
      this.metrics = update.metrics;
    }
    
    // Update completion time if training is finished
    if (update.completedAt) {
      this.completedAt = update.completedAt;
    }
    
    // Update running state
    this.isRunning = update.status.toLowerCase() === 'running' || 
                     update.status.toLowerCase() === 'inprogress';
    
    // Store the update
    this.realTimeUpdates = update;
    
    // Show success message for status changes
    if (update.message) {
      this.showSuccess(update.message);
    }
  }

  /**
   * Clean up SignalR connection
   */
  private async cleanupSignalR(): Promise<void> {
    if (this.trainSessionId) {
      await this.signalRService.leaveTrainingGroup(this.trainSessionId);
    }
    await this.signalRService.stopConnection();
  }

  /**
   * Manually reconnect to SignalR
   */
  async reconnectSignalR(): Promise<void> {
    this.signalRError = 'Reconnecting...';
    await this.initializeSignalR();
  }

  /**
   * Get connection status text
   */
  getConnectionStatusText(): string {
    if (this.isSignalRConnected) {
      return 'Real-time updates connected';
    } else if (this.signalRError) {
      return this.signalRError;
    } else {
      return 'Real-time updates disconnected';
    }
  }

  /**
   * Get connection status color
   */
  getConnectionStatusColor(): string {
    if (this.isSignalRConnected) {
      return 'success';
    } else {
      return 'danger';
    }
  }
}
