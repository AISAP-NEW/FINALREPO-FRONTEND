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

  async ngOnInit() {
    console.log('🚀 TrainingSessionsPage initialized');
    
    // Test backend connection first
    await this.testBackendConnection();
    
    this.setupAutoRefresh();
    await this.loadSessions();
  }

  async testBackendConnection() {
    try {
      console.log('🧪 Testing backend connection...');
      await this.trainingService.testConnection().toPromise();
      console.log('✅ Backend connection successful');
    } catch (error) {
      console.error('❌ Backend connection failed:', error);
      this.toastService.presentToast('error', 'Cannot connect to backend. Please ensure the backend is running.');
    }
  }

  ngOnDestroy() {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  private setupAutoRefresh() {
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
          console.log('📊 Session status:', session.status);
          console.log('🎮 Session controls - canPause:', session.canPause, 'canResume:', session.canResume, 'canCancel:', session.canCancel);
          
          // Convert date strings to Date objects
          const processedSession = {
            ...session,
            startedAt: session.startedAt ? new Date(session.startedAt) : new Date(),
            completedAt: session.completedAt ? new Date(session.completedAt) : undefined,
            pausedAt: session.pausedAt ? new Date(session.pausedAt) : undefined,
            duration: this.calculateDuration({
              ...session,
              startedAt: session.startedAt ? new Date(session.startedAt) : new Date(),
              completedAt: session.completedAt ? new Date(session.completedAt) : undefined
            }),
            // Use backend computed properties - these should always be provided by the backend
            canPause: session.canPause || false,
            canResume: session.canResume || false,
            canCancel: session.canCancel || false
          };
          
          console.log('✅ Processed session controls - canPause:', processedSession.canPause, 'canResume:', processedSession.canResume, 'canCancel:', processedSession.canCancel);
          return processedSession;
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
    console.log('⏸️ Attempting to pause session:', session.id, 'canPause:', session.canPause);
    if (!session.canPause) {
      console.warn('⚠️ Cannot pause session - canPause is false');
      this.toastService.presentToast('warning', 'This session cannot be paused');
      return;
    }

    try {
      console.log('📡 Making pause API call for session:', session.id);
      const response = await this.trainingService.pauseTrainingSession(session.id).toPromise();
      console.log('✅ Pause response:', response);
      this.toastService.presentToast('success', `Training session ${session.id} paused successfully`);
      this.loadSessions(); // Refresh the list
    } catch (error: any) {
      console.error('❌ Error pausing session:', error);
      console.error('🔍 Error details:', {
        status: error.status,
        message: error.message,
        error: error.error
      });
      
      const errorMessage = error.error?.message || error.message || 'Failed to pause training session';
      this.toastService.presentToast('error', `Pause failed: ${errorMessage}`);
    }
  }

  async resumeSession(session: TrainingSession) {
    console.log('▶️ Attempting to resume session:', session.id, 'canResume:', session.canResume);
    if (!session.canResume) {
      console.warn('⚠️ Cannot resume session - canResume is false');
      this.toastService.presentToast('warning', 'This session cannot be resumed');
      return;
    }

    try {
      console.log('📡 Making resume API call for session:', session.id);
      const response = await this.trainingService.resumeTrainingSession(session.id).toPromise();
      console.log('✅ Resume response:', response);
      this.toastService.presentToast('success', `Training session ${session.id} resumed successfully`);
      this.loadSessions(); // Refresh the list
    } catch (error: any) {
      console.error('❌ Error resuming session:', error);
      console.error('🔍 Error details:', {
        status: error.status,
        message: error.message,
        error: error.error
      });
      
      const errorMessage = error.error?.message || error.message || 'Failed to resume training session';
      this.toastService.presentToast('error', `Resume failed: ${errorMessage}`);
    }
  }

  async cancelSession(session: TrainingSession) {
    console.log('🛑 Attempting to cancel session:', session.id, 'canCancel:', session.canCancel);
    if (!session.canCancel) {
      console.warn('⚠️ Cannot cancel session - canCancel is false');
      this.toastService.presentToast('warning', 'This session cannot be cancelled');
      return;
    }

    try {
      console.log('📡 Making cancel API call for session:', session.id);
      const response = await this.trainingService.cancelTrainingSession(session.id).toPromise();
      console.log('✅ Cancel response:', response);
      this.toastService.presentToast('success', `Training session ${session.id} cancelled successfully`);
      this.loadSessions(); // Refresh the list
    } catch (error: any) {
      console.error('❌ Error cancelling session:', error);
      console.error('🔍 Error details:', {
        status: error.status,
        message: error.message,
        error: error.error
      });
      
      const errorMessage = error.error?.message || error.message || 'Failed to cancel training session';
      this.toastService.presentToast('error', `Cancel failed: ${errorMessage}`);
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
