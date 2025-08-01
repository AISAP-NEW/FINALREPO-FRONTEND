import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TrainingService, TrainingStatus, TrainingLogs, TrainingSessionDTO, TrainingSessionsResponseDTO } from '../../services/training.service';
import { interval, Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { IonButton, IonToast, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonList, IonItem, IonLabel, IonIcon, IonSpinner, IonHeader, IonToolbar, IonTitle, IonButtons, IonMenuButton, IonContent } from '@ionic/angular/standalone';

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
    IonList,
    IonItem,
    IonLabel,
    IonIcon,
    IonSpinner,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonMenuButton,
    IonContent
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
  activeTrainingSessions: TrainingSessionDTO[] = [];
  systemResources: any = null;
  allSessionsPollSub?: Subscription;

  // Make Object available in template
  protected readonly Object = Object;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private trainingService: TrainingService
  ) {}

  ngOnInit() {
    this.trainSessionId = Number(this.route.snapshot.paramMap.get('trainSessionId'));
    
    if (!this.trainSessionId) {
      // General training dashboard view
      this.isGeneralDashboard = true;
      this.loadGeneralDashboard();
      // Poll every 10 seconds for session updates
      this.allSessionsPollSub = interval(10000).subscribe(() => this.loadAllTrainingSessions());
    } else {
      // Specific training session view
      this.isGeneralDashboard = false;
      this.pollTrainingStatus();
      // Poll every 5 seconds for status updates
      this.pollSub = interval(5000).subscribe(() => this.pollTrainingStatus());
    }
  }

  ngOnDestroy() {
    this.pollSub?.unsubscribe();
    this.allSessionsPollSub?.unsubscribe();
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

    // Load all training sessions
    this.loadAllTrainingSessions();
  }

  /**
   * Load all training sessions
   */
  loadAllTrainingSessions() {
    console.log('Loading all training sessions...');
    this.isLoading = true;
    this.trainingService.getAllTrainingSessions().subscribe({
      next: (response: TrainingSessionsResponseDTO) => {
        console.log('Training sessions response:', response);
        this.activeTrainingSessions = response.sessions || [];
        console.log('Active training sessions:', this.activeTrainingSessions);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load training sessions:', err);
        this.error = err.message || 'Failed to load training sessions';
        this.isLoading = false;
      }
    });
  }

  /**
   * Refresh training sessions list
   */
  refreshTrainingSessions() {
    this.loadAllTrainingSessions();
  }

  /**
   * Navigate to a specific training session
   */
  navigateToSession(sessionId: number) {
    this.router.navigate(['/training-dashboard', sessionId]);
  }

  /**
   * Pause a training session from the list
   */
  pauseSession(session: TrainingSessionDTO, event: Event) {
    event.stopPropagation(); // Prevent navigation
    
    this.trainingService.pauseTrainingSession(session.id).subscribe({
      next: () => {
        this.showSuccess(`Training session for ${session.modelName} paused successfully`);
        this.refreshTrainingSessions();
      },
      error: (err) => {
        this.showError(err.message || 'Failed to pause training session');
      }
    });
  }

  /**
   * Resume a training session from the list
   */
  resumeSession(session: TrainingSessionDTO, event: Event) {
    event.stopPropagation(); // Prevent navigation
    
    this.trainingService.resumeTrainingSession(session.id).subscribe({
      next: () => {
        this.showSuccess(`Training session for ${session.modelName} resumed successfully`);
        this.refreshTrainingSessions();
      },
      error: (err) => {
        this.showError(err.message || 'Failed to resume training session');
      }
    });
  }

  /**
   * Cancel a training session from the list
   */
  cancelSession(session: TrainingSessionDTO, event: Event) {
    event.stopPropagation(); // Prevent navigation
    
    if (!confirm(`Are you sure you want to cancel the training session for ${session.modelName}? This action cannot be undone.`)) {
      return;
    }
    
    this.trainingService.cancelTrainingSession(session.id).subscribe({
      next: () => {
        this.showSuccess(`Training session for ${session.modelName} cancelled successfully`);
        this.refreshTrainingSessions();
      },
      error: (err) => {
        this.showError(err.message || 'Failed to cancel training session');
      }
    });
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
    // For now, we'll show an alert - you can replace this with a proper toast
    alert(message);
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
   * Get session icon based on status
   */
  getSessionIcon(status: string): string {
    switch (status.toLowerCase()) {
      case 'running':
      case 'inprogress':
        return 'play-circle';
      case 'completed':
      case 'finished':
        return 'checkmark-circle';
      case 'paused':
        return 'pause-circle';
      case 'cancelled':
      case 'stopped':
        return 'stop-circle';
      case 'failed':
      case 'error':
        return 'close-circle';
      default:
        return 'time';
    }
  }

  /**
   * Get session color based on status
   */
  getSessionColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'running':
      case 'inprogress':
        return 'success';
      case 'completed':
      case 'finished':
        return 'primary';
      case 'paused':
        return 'warning';
      case 'cancelled':
      case 'stopped':
        return 'medium';
      case 'failed':
      case 'error':
        return 'danger';
      default:
        return 'medium';
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
}
