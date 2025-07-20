import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { TrainingService } from '../../services/training.service';
import { interval, Subscription } from 'rxjs';

import { IonButton } from '@ionic/angular/standalone';

@Component({
  selector: 'app-training-dashboard',
  templateUrl: './training-dashboard.component.html',
  styleUrls: ['./training-dashboard.component.scss'],
  standalone: true,
  imports: [
    CommonModule,IonButton]
})
export class TrainingDashboardComponent implements OnInit {
  trainSessionId!: number;
  status: string = '';
  logs: string = '';
  metrics: any = {};
  isLoading = false;
  pollSub?: Subscription;
  error: string = '';

  constructor(
    private route: ActivatedRoute,
    private trainingService: TrainingService
  ) {}

  ngOnInit() {
    this.trainSessionId = Number(this.route.snapshot.paramMap.get('trainSessionId'));
    this.pollTrainingStatus();
    this.pollSub = interval(5000).subscribe(() => this.pollTrainingStatus());
  }

  pollTrainingStatus() {
    if (!this.trainSessionId) return;
    this.isLoading = true;
    this.trainingService.getStatus(this.trainSessionId).subscribe({
      next: (res: any) => {
        this.status = res.status || '';
        this.logs = res.logs || '';
        this.metrics = res.metrics || {};
        this.isLoading = false;
      },
      error: err => {
        this.error = 'Failed to fetch training status.';
        this.isLoading = false;
      }
    });
  }

  pauseTraining() {
    if (!this.trainSessionId) return;
    this.trainingService.pause(this.trainSessionId).subscribe(() => this.pollTrainingStatus());
  }

  resumeTraining() {
    if (!this.trainSessionId) return;
    this.trainingService.resume(this.trainSessionId).subscribe(() => this.pollTrainingStatus());
  }

  ngOnDestroy() {
    this.pollSub?.unsubscribe();
  }
}
