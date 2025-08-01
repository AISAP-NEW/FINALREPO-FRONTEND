import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TrainingService, TrainingSessionDTO, TrainingSessionsResponseDTO } from '../../services/training.service';
import { ToastService } from '../../services/toast.service';
import { Subscription, interval } from 'rxjs';
import { switchMap } from 'rxjs/operators';

interface TrainingSession {
  id: number;
  modelInstanceId: number;
  datasetId?: string;
  trainingConfig?: string;
  metrics?: string;
  status: string;
  startedAt: Date;
  completedAt?: Date;
  pausedAt?: Date;
  logsPath?: string;
  errorMessage?: string;
  trainingParameters?: string;
  learningRate: number;
  modelId?: number;
  modelName?: string;
  modelInstanceName?: string;
  datasetName?: string;
  duration?: string;
  canPause: boolean;
  canResume: boolean;
  canCancel: boolean;
}

@Component({
  selector: 'app-training-sessions',
  templateUrl: './training-sessions.page.html',
  styleUrls: ['./training-sessions.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class TrainingSessionsPage implements OnInit, OnDestroy {
  sessions: TrainingSession[] = [];
  filteredSessions: TrainingSession[] = [];
  isLoading = false;
  selectedStatus = 'All';
  searchTerm = '';
  
  private refreshSubscription?: Subscription;
  
  statusOptions = [
    'All',
    'InProgress',
    'Paused',
    'Completed',
    'Failed',
    'Cancelled'
  ];

  constructor(
    private trainingService: TrainingService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    // First test the connection, then load sessions
    this.testConnectionAndLoad();
  }

  private async testConnectionAndLoad() {
    console.log('🚀 Starting Training Sessions page initialization...');
    
    try {
      // Test connection first
      console.log('🧪 Testing backend connection...');
      await this.trainingService.testConnection().toPromise();
      console.log('✅ Backend connection successful!');
      
      // If connection works, load sessions
      await this.loadSessions();
      this.startAutoRefresh();
      
    } catch (error: any) {
      console.error('💥 Connection test failed:', error);
      
      // Try to provide helpful error messages
      if (error.message?.includes('0 -')) {
        this.toastService.presentToast('error', '🌐 Cannot connect to backend. Please ensure your backend is running on http://localhost:5183');
      } else if (error.message?.includes('404')) {
        this.toastService.presentToast('error', '🔍 Training endpoint not found. Check if TrainingController is properly configured.');
      } else {
        this.toastService.presentToast('error', `❌ Connection failed: ${error.message}`);
      }
      
      // Still try to load sessions (in case it's just a test endpoint issue)
      await this.loadSessions();
    }
  }

  ngOnDestroy() {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  private startAutoRefresh() {
    // Refresh every 10 seconds
    this.refreshSubscription = interval(10000)
      .pipe(
        switchMap(() => this.trainingService.getAllTrainingSessions())
      )
      .subscribe({
        next: (response: TrainingSessionsResponseDTO) => {
          console.log('🔄 Auto-refresh response:', response);
          if (response && response.success) {
            console.log('📊 Auto-refresh sessions count:', response.sessions?.length || 0);
            this.sessions = response.sessions.map(session => ({
              ...session,
              startedAt: session.startedAt ? new Date(session.startedAt) : new Date(),
              completedAt: session.completedAt ? new Date(session.completedAt) : undefined,
              pausedAt: session.pausedAt ? new Date(session.pausedAt) : undefined,
              duration: this.calculateDuration({
                ...session,
                startedAt: session.startedAt ? new Date(session.startedAt) : new Date(),
                completedAt: session.completedAt ? new Date(session.completedAt) : undefined
              }),
              // Use backend computed properties if available
              canPause: session.canPause ?? (session.status === 'InProgress'),
              canResume: session.canResume ?? (session.status === 'Paused'),
              canCancel: session.canCancel ?? (session.status === 'InProgress' || session.status === 'Paused')
            }));
            this.applyFilters();
          } else {
            console.warn('⚠️ Auto-refresh failed or no success flag:', response);
          }
        },
        error: (error) => {
          console.error('💥 Auto-refresh error:', error);
          console.error('📝 Error details:', error.message, error.status);
          // Don't show toast for auto-refresh errors to avoid spam
        }
      });
  }

  async loadSessions() {
    this.isLoading = true;
    try {
      console.log('🔄 Loading training sessions...');
      console.log('🌐 API URL:', `${this.trainingService['API_URL']}/sessions`);
      console.log('🔧 Environment API URL:', `http://localhost:5183/api/Training`);
      
      const response = await this.trainingService.getAllTrainingSessions().toPromise() as TrainingSessionsResponseDTO;
      console.log('📦 Raw API response:', response);
      console.log('📊 Response type:', typeof response);
      console.log('🎯 Success flag:', response?.success);
      console.log('📈 Sessions array:', response?.sessions);
      console.log('🔢 Sessions count:', response?.sessions?.length);
      
      if (response && response.success) {
        console.log('✅ Successfully loaded sessions:', response.sessions.length);
        
        if (response.sessions.length === 0) {
          console.log('ℹ️ No training sessions found in database');
          this.toastService.presentToast('info', 'No training sessions found. Start a training session first.');
        }
        
        this.sessions = response.sessions.map(session => {
          console.log('🔄 Processing session:', session);
          return {
            ...session,
            startedAt: session.startedAt ? new Date(session.startedAt) : new Date(),
            completedAt: session.completedAt ? new Date(session.completedAt) : undefined,
            pausedAt: session.pausedAt ? new Date(session.pausedAt) : undefined,
            duration: this.calculateDuration({
              ...session,
              startedAt: session.startedAt ? new Date(session.startedAt) : new Date(),
              completedAt: session.completedAt ? new Date(session.completedAt) : undefined
            }),
            // Use backend computed properties if available, otherwise compute them
            canPause: session.canPause ?? (session.status === 'InProgress'),
            canResume: session.canResume ?? (session.status === 'Paused'),
            canCancel: session.canCancel ?? (session.status === 'InProgress' || session.status === 'Paused')
          };
        });
        this.applyFilters();
        console.log('🎯 Filtered sessions:', this.filteredSessions.length);
      } else {
        console.warn('⚠️ API response indicates failure:', response);
        if (response?.error) {
          console.error('❌ API Error:', response.error);
          console.error('📝 Details:', response.details);
          this.toastService.presentToast('error', `Failed to load sessions: ${response.error}`);
        } else {
          console.log('ℹ️ Response success is false but no error message');
          this.toastService.presentToast('warning', 'API returned success=false but no error details');
        }
        this.sessions = [];
        this.filteredSessions = [];
      }
    } catch (error: any) {
      console.error('💥 Error loading training sessions:', error);
      console.error('🔍 Error object:', {
        status: error.status,
        statusText: error.statusText,
        message: error.message,
        url: error.url,
        error: error.error
      });
      
      // Check if it's a network error
      if (error.status === 0) {
        console.error('🌐 Network error - backend may not be running');
        this.toastService.presentToast('error', 'Cannot connect to backend. Please ensure the backend is running on port 5183.');
      } else if (error.status === 404) {
        console.error('🔍 Endpoint not found - check API URL');
        this.toastService.presentToast('error', 'Training sessions endpoint not found. Check backend configuration.');
      } else if (error.status === 500) {
        console.error('🔥 Server error - check backend logs');
        this.toastService.presentToast('error', 'Backend server error. Check backend logs for details.');
      } else {
        this.toastService.presentToast('error', `Error loading sessions: ${error.message || 'Unknown error'}`);
      }
      
      this.sessions = [];
      this.filteredSessions = [];
    } finally {
      this.isLoading = false;
    }
  }

  private calculateDuration(session: { startedAt: Date; completedAt?: Date }): string {
    const startTime = session.startedAt.getTime();
    const endTime = session.completedAt 
      ? session.completedAt.getTime()
      : Date.now();
    
    const durationMs = endTime - startTime;
    return this.formatDuration(durationMs);
  }

  private formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes % 60}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  onStatusFilterChange() {
    this.applyFilters();
  }

  onSearchChange() {
    this.applyFilters();
  }

  private applyFilters() {
    let filtered = [...this.sessions];

    // Apply status filter
    if (this.selectedStatus !== 'All') {
      filtered = filtered.filter(session => session.status === this.selectedStatus);
    }

    // Apply search filter
    if (this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(session =>
        session.modelName?.toLowerCase().includes(searchLower) ||
        session.modelInstanceName?.toLowerCase().includes(searchLower) ||
        session.datasetName?.toLowerCase().includes(searchLower) ||
        session.id.toString().includes(searchLower)
      );
    }

    this.filteredSessions = filtered;
  }

  async pauseSession(session: TrainingSession) {
    if (!session.canPause) return;

    try {
      await this.trainingService.pauseTrainingSession(session.id).toPromise();
      this.toastService.presentToast('success', `Training session ${session.id} paused successfully`);
      this.loadSessions(); // Refresh the list
    } catch (error) {
      console.error('Error pausing session:', error);
      this.toastService.presentToast('error', 'Failed to pause training session');
    }
  }

  async resumeSession(session: TrainingSession) {
    if (!session.canResume) return;

    try {
      await this.trainingService.resumeTrainingSession(session.id).toPromise();
      this.toastService.presentToast('success', `Training session ${session.id} resumed successfully`);
      this.loadSessions(); // Refresh the list
    } catch (error) {
      console.error('Error resuming session:', error);
      this.toastService.presentToast('error', 'Failed to resume training session');
    }
  }

  async cancelSession(session: TrainingSession) {
    if (!session.canCancel) return;

    try {
      await this.trainingService.cancelTrainingSession(session.id).toPromise();
      this.toastService.presentToast('success', `Training session ${session.id} cancelled successfully`);
      this.loadSessions(); // Refresh the list
    } catch (error) {
      console.error('Error cancelling session:', error);
      this.toastService.presentToast('error', 'Failed to cancel training session');
    }
  }

  getStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'inprogress':
        return 'primary';
      case 'completed':
        return 'success';
      case 'paused':
        return 'warning';
      case 'failed':
        return 'danger';
      case 'cancelled':
        return 'medium';
      default:
        return 'medium';
    }
  }

  getStatusIcon(status: string): string {
    switch (status.toLowerCase()) {
      case 'inprogress':
        return 'play-circle';
      case 'completed':
        return 'checkmark-circle';
      case 'paused':
        return 'pause-circle';
      case 'failed':
        return 'close-circle';
      case 'cancelled':
        return 'stop-circle';
      default:
        return 'help-circle';
    }
  }

  async refreshSessions(event?: any) {
    await this.loadSessions();
    if (event) {
      event.target.complete();
    }
  }
}
