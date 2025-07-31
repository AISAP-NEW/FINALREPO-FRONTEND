import { Injectable } from '@angular/core';
import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface TrainingStatusUpdate {
  instanceId: number;
  status: string;
  message: string;
  completedAt?: string;
  timestamp: string;
  progress?: number;
  logs?: string;
  metrics?: any;
}

@Injectable({
  providedIn: 'root'
})
export class SignalRService {
  private hubConnection?: HubConnection;
  private connectionState = new BehaviorSubject<boolean>(false);
  private trainingUpdates = new BehaviorSubject<TrainingStatusUpdate | null>(null);
  private errorMessage = new BehaviorSubject<string>('');

  // Observables for components to subscribe to
  public connectionState$ = this.connectionState.asObservable();
  public trainingUpdates$ = this.trainingUpdates.asObservable();
  public errorMessage$ = this.errorMessage.asObservable();

  constructor() {}

  /**
   * Start the SignalR connection
   */
  async startConnection(): Promise<void> {
    try {
      this.hubConnection = new HubConnectionBuilder()
        .withUrl(`${environment.apiUrl}/trainingHub`)
        .withAutomaticReconnect([0, 2000, 10000, 30000]) // Retry connection with delays
        .configureLogging(LogLevel.Information)
        .build();

      // Set up event handlers
      this.setupEventHandlers();

      // Start the connection
      await this.hubConnection.start();
      console.log('SignalR connection established');
      this.connectionState.next(true);
      this.errorMessage.next('');
    } catch (error) {
      console.error('SignalR connection failed:', error);
      this.connectionState.next(false);
      this.errorMessage.next('Failed to connect to real-time updates');
    }
  }

  /**
   * Stop the SignalR connection
   */
  async stopConnection(): Promise<void> {
    if (this.hubConnection) {
      try {
        await this.hubConnection.stop();
        console.log('SignalR connection stopped');
        this.connectionState.next(false);
      } catch (error) {
        console.error('Error stopping SignalR connection:', error);
      }
    }
  }

  /**
   * Join a training group to receive updates for a specific training session
   */
  async joinTrainingGroup(instanceId: number): Promise<void> {
    if (!this.hubConnection || this.hubConnection.state !== 'Connected') {
      console.warn('SignalR connection not available');
      return;
    }

    try {
      await this.hubConnection.invoke('JoinTrainingGroup', instanceId);
      console.log(`Joined training group for instance ${instanceId}`);
    } catch (error) {
      console.error('Failed to join training group:', error);
      this.errorMessage.next('Failed to join training group');
    }
  }

  /**
   * Leave a training group
   */
  async leaveTrainingGroup(instanceId: number): Promise<void> {
    if (!this.hubConnection || this.hubConnection.state !== 'Connected') {
      return;
    }

    try {
      await this.hubConnection.invoke('LeaveTrainingGroup', instanceId);
      console.log(`Left training group for instance ${instanceId}`);
    } catch (error) {
      console.error('Failed to leave training group:', error);
    }
  }

  /**
   * Set up event handlers for SignalR messages
   */
  private setupEventHandlers(): void {
    if (!this.hubConnection) return;

    // Handle training status updates
    this.hubConnection.on('TrainingStatusUpdated', (data: TrainingStatusUpdate) => {
      console.log('Received training status update:', data);
      this.trainingUpdates.next(data);
    });

    // Handle connection state changes
    this.hubConnection.onreconnecting((error) => {
      console.log('SignalR reconnecting:', error);
      this.connectionState.next(false);
      this.errorMessage.next('Connection lost. Reconnecting...');
    });

    this.hubConnection.onreconnected((connectionId) => {
      console.log('SignalR reconnected:', connectionId);
      this.connectionState.next(true);
      this.errorMessage.next('');
    });

    this.hubConnection.onclose((error) => {
      console.log('SignalR connection closed:', error);
      this.connectionState.next(false);
      this.errorMessage.next('Connection closed');
    });
  }

  /**
   * Get current connection state
   */
  isConnected(): boolean {
    return this.hubConnection?.state === 'Connected';
  }

  /**
   * Get current connection state as observable
   */
  getConnectionState(): Observable<boolean> {
    return this.connectionState$;
  }

  /**
   * Get training updates as observable
   */
  getTrainingUpdates(): Observable<TrainingStatusUpdate | null> {
    return this.trainingUpdates$;
  }

  /**
   * Get error messages as observable
   */
  getErrorMessages(): Observable<string> {
    return this.errorMessage$;
  }

  /**
   * Clear current training update
   */
  clearTrainingUpdate(): void {
    this.trainingUpdates.next(null);
  }
} 