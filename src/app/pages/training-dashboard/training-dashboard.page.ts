import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-training-dashboard',
  templateUrl: './training-dashboard.page.html',
  styleUrls: ['./training-dashboard.page.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    FormsModule
  ]
})
export class TrainingDashboardPage implements OnInit, OnDestroy {
  instanceId!: string;
  status: string = 'Loading...';
  logs: any[] = [];
  interval: any;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient
  ) {
    this.instanceId = this.route.snapshot.paramMap.get('instanceId')!;
  }

  ngOnInit() {
    this.fetchStatus();
    this.fetchLogs();
    this.interval = setInterval(() => this.fetchLogs(), 5000);
  }

  ngOnDestroy() {
    if (this.interval) clearInterval(this.interval);
  }

  fetchStatus() {
    this.http.get<any>(`/api/models/instances/${this.instanceId}`).subscribe(res => {
      this.status = res.status;
    });
  }

  fetchLogs() {
    this.http.get<any[]>(`/api/models/instances/${this.instanceId}/logs`).subscribe(res => {
      this.logs = res;
    });
  }

  resumeTraining() {
    this.http.post(`/api/models/instances/${this.instanceId}/resume`, {}).subscribe(() => {
      this.fetchStatus();
    });
  }

  stopTraining() {
    this.http.post(`/api/models/instances/${this.instanceId}/stop`, {}).subscribe(() => {
      this.fetchStatus();
    });
  }

  deployModel() {
    this.http.post(`/api/models/instances/${this.instanceId}/deploy`, {
      endpoint: "default-endpoint",
      deploymentConfig: "{}"
    }).subscribe(() => {
      this.fetchStatus();
    });
  }
}
