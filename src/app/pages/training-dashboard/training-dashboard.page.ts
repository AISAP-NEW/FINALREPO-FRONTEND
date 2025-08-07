import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonIcon,
  IonProgressBar,
  IonButtons,
  IonMenuButton
} from '@ionic/angular/standalone';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { interval, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface TrainingMetrics {
  epoch: number;
  loss: number;
  accuracy: number;
  val_loss: number;
  val_accuracy: number;
}

interface TrainingLog {
  timestamp: Date;
  message: string;
  type?: 'info' | 'error' | 'warning' | 'success';
}

@Component({
  selector: 'app-training-dashboard',
  templateUrl: './training-dashboard.page.html',
  styleUrls: ['./training-dashboard.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonButton,
    IonIcon,
    IonProgressBar,
    IonButtons,
    IonMenuButton
  ]
})
export class TrainingDashboardPage implements OnInit, OnDestroy {
  modelId: number;
  instanceId: number;
  status: string = 'Loading...';
  logs: TrainingLog[] = [];
  currentEpoch: number = 0;
  totalEpochs: number = 0;
  currentLoss: number = 0;
  currentAccuracy: number = 0;
  currentValLoss: number = 0;
  currentValAccuracy: number = 0;
  private destroy$ = new Subject<void>();
  private readonly API_URL = environment.apiUrl;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router
  ) {
    this.modelId = +this.route.snapshot.paramMap.get('modelId')!;
    this.instanceId = +this.route.snapshot.paramMap.get('instanceId')!;
  }

  ngOnInit() {
    this.startPolling();
    this.addLog('Training dashboard initialized', 'info');
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private startPolling() {
    // Poll every 2 seconds
    interval(2000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.fetchStatus();
      });
  }

  private fetchStatus() {
    this.http.get<any>(`${this.API_URL}/api/models/${this.modelId}/instances/${this.instanceId}`)
      .subscribe({
        next: (response) => {
          this.status = response.status;
          
          // Parse metrics if available
          if (response.metrics) {
            try {
              const metrics: TrainingMetrics = JSON.parse(response.metrics);
              this.updateMetrics(metrics);
            } catch (error) {
              console.error('Error parsing metrics:', error);
            }
          }

          // Update logs
          if (response.logs && Array.isArray(response.logs)) {
            this.updateLogs(response.logs);
          }
        },
        error: (error) => {
          console.error('Error fetching status:', error);
          this.addLog('Error fetching training status', 'error');
        }
      });
  }

  private updateMetrics(metrics: TrainingMetrics) {
    this.currentEpoch = metrics.epoch;
    this.totalEpochs = metrics.epoch; // This should come from config
    this.currentLoss = metrics.loss;
    this.currentAccuracy = metrics.accuracy;
    this.currentValLoss = metrics.val_loss;
    this.currentValAccuracy = metrics.val_accuracy;
  }

  private updateLogs(newLogs: any[]) {
    // Convert backend logs to our format and append only new ones
    const convertedLogs = newLogs.map(log => ({
      timestamp: new Date(log.timestamp),
      message: log.message,
      type: this.getLogType(log.message)
    }));

    // Only add logs we don't already have
    const existingTimestamps = new Set(this.logs.map(log => log.timestamp.getTime()));
    const newLogEntries = convertedLogs.filter(log => !existingTimestamps.has(log.timestamp.getTime()));
    
    if (newLogEntries.length > 0) {
      this.logs = [...this.logs, ...newLogEntries].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }
  }

  private getLogType(message: string): 'info' | 'error' | 'warning' | 'success' {
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('error') || lowerMessage.includes('failed')) {
      return 'error';
    }
    if (lowerMessage.includes('warning') || lowerMessage.includes('caution')) {
      return 'warning';
    }
    if (lowerMessage.includes('success') || lowerMessage.includes('completed')) {
      return 'success';
    }
    return 'info';
  }

  private addLog(message: string, type: 'info' | 'error' | 'warning' | 'success' = 'info') {
    this.logs.unshift({
      timestamp: new Date(),
      message,
      type
    });
  }

  async stopTraining() {
    try {
      await this.http.post(`${this.API_URL}/api/models/${this.modelId}/instances/${this.instanceId}/stop`, {}).toPromise();
      this.addLog('Training paused', 'warning');
    } catch (error) {
      console.error('Error stopping training:', error);
      this.addLog('Failed to pause training', 'error');
    }
  }

  async resumeTraining() {
    try {
      await this.http.post(`${this.API_URL}/api/models/${this.modelId}/instances/${this.instanceId}/resume`, {}).toPromise();
      this.addLog('Training resumed', 'success');
    } catch (error) {
      console.error('Error resuming training:', error);
      this.addLog('Failed to resume training', 'error');
    }
  }

  async deployModel() {
    try {
      await this.http.post(`${this.API_URL}/api/models/${this.modelId}/instances/${this.instanceId}/deploy`, {
        endpoint: "default-endpoint",
        deploymentConfig: "{}"
      }).toPromise();
      this.addLog('Model deployment started', 'info');
    } catch (error) {
      console.error('Error deploying model:', error);
      this.addLog('Failed to deploy model', 'error');
    }
  }

  clearLogs() {
    this.logs = [];
    this.addLog('Logs cleared', 'info');
  }
}
