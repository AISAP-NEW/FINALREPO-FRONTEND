import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaintenanceService } from '../services/maintenance.service';
import { IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon, IonSpinner, IonGrid, IonRow, IonCol, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonLabel, IonItem, IonInput, IonText } from '@ionic/angular/standalone';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-database-maintenance',
  template: `
  <ion-header>
    <ion-toolbar color="primary">
      <ion-title>Database Maintenance</ion-title>
      <ion-buttons slot="end">
        <ion-button routerLink="/home">Home</ion-button>
      </ion-buttons>
    </ion-toolbar>
  </ion-header>

  <ion-content class="ion-padding maintenance-content">
    <section class="hero">
      <div class="hero-left">
        <h1>Data Recovery & Backup</h1>
        <p class="sub">Safely create backups and restore your database when needed. Only Lead Developers are authorized.</p>
      </div>
      <div class="hero-graphic">
        <div class="cloud"></div>
        <div class="drive"></div>
      </div>
    </section>

    <ion-grid class="cards">
      <ion-row class="cards-row" collapse="md">
        <ion-col size="12" size-md="6">
          <ion-card class="action-card backup">
            <ion-card-header>
              <ion-card-title>Backup Database</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <p class="desc">Create a full database backup (.bak). You can optionally choose a server-side directory if permitted.</p>
              <ion-item lines="none" class="dir-input">
                <ion-label position="stacked">Backup directory (optional)</ion-label>
                <ion-input [(ngModel)]="backupDirectory" placeholder="e.g. C:/SqlBackups"></ion-input>
              </ion-item>
              <div class="inline">
                <ion-button color="primary" [disabled]="isBackingUp" (click)="onBackup()">
                  <ion-spinner *ngIf="isBackingUp" name="crescent"></ion-spinner>
                  <span *ngIf="!isBackingUp">Start Backup</span>
                </ion-button>
                <ion-text *ngIf="backupResult" class="result">{{ backupResult }}</ion-text>
              </div>
            </ion-card-content>
          </ion-card>
        </ion-col>
        <ion-col size="12" size-md="6">
          <ion-card class="action-card restore">
            <ion-card-header>
              <ion-card-title>Restore Database</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <p class="desc">Restore the current database from a .bak file. Drag and drop a backup file or browse.</p>
              <div class="drop-zone" [class.dragging]="dragging" (dragover)="onDragOver($event)" (dragleave)="onDragLeave($event)" (drop)="onDrop($event)" (click)="fileInput.click()">
                <input type="file" #fileInput accept=".bak" hidden (change)="onFileSelected($event)"/>
                <ion-icon name="cloud-upload-outline"></ion-icon>
                <div class="texts">
                  <div class="title">{{ restoreFile ? restoreFile.name : 'Drop .bak here or click to browse' }}</div>
                  <div class="hint">Max size depends on server limits</div>
                </div>
              </div>
              <div class="inline">
                <ion-button color="danger" [disabled]="!restoreFile || isRestoring" (click)="onRestore()">
                  <ion-spinner *ngIf="isRestoring" name="crescent"></ion-spinner>
                  <span *ngIf="!isRestoring">Start Restore</span>
                </ion-button>
                <ion-text *ngIf="restoreResult" class="result">{{ restoreResult }}</ion-text>
              </div>
            </ion-card-content>
          </ion-card>
        </ion-col>
      </ion-row>
    </ion-grid>
  </ion-content>
  `,
  styles: [`
    .maintenance-content { --background: #f7f8fc; }
    .hero { display:flex; align-items:center; justify-content:space-between; gap:24px; padding:16px; background: linear-gradient(135deg, #eef2ff 0%, #f7f8fc 60%); border-radius:16px; margin-bottom:16px; }
    .hero-left h1 { margin:0 0 8px; font-size:32px; font-weight:700; color:#2c2f48; }
    .hero-left .sub { margin:0; color:#5e6282; }
    .hero-graphic { position:relative; width:220px; height:140px; }
    .cloud { position:absolute; top:10px; right:10px; width:120px; height:60px; background:#dbe4ff; border-radius:30px; box-shadow: 20px 10px 0 0 #e9efff, 40px 15px 0 0 #eef3ff; }
    .drive { position:absolute; bottom:0; right:0; width:160px; height:90px; background:#c7d2fe; border-radius:12px; box-shadow: inset 0 0 0 4px #a5b4fc; }

    .cards-row { gap:16px; }
    .action-card { border-radius:16px; box-shadow: 0 6px 24px rgba(0,0,0,0.06); }
    .action-card.backup { border-left:6px solid #4f46e5; }
    .action-card.restore { border-left:6px solid #dc2626; }
    .desc { color:#5e6282; margin-bottom:12px; }
    .dir-input { --background: transparent; }
    .inline { display:flex; align-items:center; gap:12px; margin-top:12px; }
    .result { color:#374151; font-size:13px; }

    .drop-zone { border:2px dashed #cbd5e1; border-radius:12px; padding:18px; cursor:pointer; display:flex; align-items:center; gap:12px; transition: all .2s ease; background:#fff; }
    .drop-zone.dragging { border-color:#6366f1; background:#eef2ff; }
    .drop-zone ion-icon { font-size:28px; color:#6366f1; }
    .drop-zone .texts .title { font-weight:600; color:#2c2f48; }
    .drop-zone .texts .hint { color:#6b7280; font-size:12px; }

    @media (max-width: 768px) {
      .hero { flex-direction:column; align-items:flex-start; }
      .hero-graphic { width:100%; height:120px; }
    }
  `],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon, IonSpinner,
    IonGrid, IonRow, IonCol, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonLabel, IonItem, IonInput, IonText
  ]
})
export class DatabaseMaintenancePage {
  isBackingUp = false;
  isRestoring = false;
  backupDirectory: string | null = null;
  backupResult: string | null = null;
  restoreFile: File | null = null;
  restoreResult: string | null = null;
  dragging = false;

  constructor(private maintenance: MaintenanceService, private toast: ToastController) {}

  async presentToast(message: string, color: 'success' | 'danger' | 'warning' | 'medium' = 'medium') {
    const t = await this.toast.create({ message, duration: 2500, color });
    await t.present();
  }

  onBackup() {
    this.backupResult = null;
    this.isBackingUp = true;
    this.maintenance.backupDatabase(this.backupDirectory).subscribe({
      next: res => {
        this.isBackingUp = false;
        if (res.blob && res.fileName) {
          const url = URL.createObjectURL(res.blob);
          const a = document.createElement('a');
          a.href = url; a.download = res.fileName; a.click();
          URL.revokeObjectURL(url);
          this.backupResult = `Downloaded ${res.fileName}`;
          this.presentToast('Backup completed and downloaded', 'success');
        } else {
          this.backupResult = res.message || `Backup path: ${res.path}`;
          this.presentToast(this.backupResult || 'Backup completed', 'success');
        }
      },
      error: err => {
        this.isBackingUp = false;
        this.presentToast(err?.message || 'Backup failed', 'danger');
      }
    });
  }

  onFileSelected(ev: any) {
    const file = ev?.target?.files?.[0];
    if (file) this.restoreFile = file;
  }

  onDragOver(e: DragEvent) { e.preventDefault(); this.dragging = true; }
  onDragLeave(e: DragEvent) { e.preventDefault(); this.dragging = false; }
  onDrop(e: DragEvent) {
    e.preventDefault(); this.dragging = false;
    const f = e.dataTransfer?.files?.[0];
    if (f) this.restoreFile = f;
  }

  onRestore() {
    if (!this.restoreFile) return;
    this.restoreResult = null;
    this.isRestoring = true;
    this.maintenance.restoreDatabase(this.restoreFile).subscribe({
      next: res => {
        this.isRestoring = false;
        this.restoreResult = res?.message || 'Restore completed';
        this.presentToast(this.restoreResult, 'success');
      },
      error: err => {
        this.isRestoring = false;
        this.presentToast(err?.message || 'Restore failed', 'danger');
      }
    });
  }
}


