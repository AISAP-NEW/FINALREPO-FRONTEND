import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonNote,
  IonButton,
  IonFooter,
  IonButtons
} from '@ionic/angular/standalone';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-select-columns-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonItem,
    IonLabel,
    IonSelect,
    IonSelectOption,
    IonNote,
    IonButton,
    IonFooter,
    IonButtons
  ],
  templateUrl: './select-columns-modal.component.html',
  styleUrls: ['./select-columns-modal.component.scss']
})
export class SelectColumnsModalComponent implements OnInit {
  @Input() files: File[] = [];
  @Input() defaultFileIndex: number = 0;

  selectedFileIndex = 0;
  headers: string[] = [];
  fileName = '';

  selectedTarget: string | null = null;
  selectedFeatures: string[] = [];

  error: string | null = null;
  warningList: string[] = [];

  constructor(private modal: ModalController) {}

  ngOnInit(): void {
    this.selectedFileIndex = Math.min(Math.max(this.defaultFileIndex, 0), this.files.length - 1);
    if (this.files && this.files.length) {
      this.loadHeadersFromFile(this.files[this.selectedFileIndex]);
    }
  }

  async onFileChange(index: number) {
    this.selectedFileIndex = index;
    this.selectedTarget = null;
    this.selectedFeatures = [];
    await this.loadHeadersFromFile(this.files[index]);
  }

  private async loadHeadersFromFile(file: File) {
    this.fileName = file?.name || '';
    this.headers = await this.readFirstLine(file);
  }

  private readFirstLine(file: File): Promise<string[]> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const text = String(reader.result || '');
        const firstLine = text.split(/\r?\n/)[0] || '';
        const headers = this.parseCsvHeaders(firstLine);
        resolve(headers);
      };
      reader.readAsText(file);
    });
  }

  private parseCsvHeaders(line: string): string[] {
    const result: string[] = [];
    let inQuotes = false;
    let current = '';
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') inQuotes = !inQuotes;
      else if (ch === ',' && !inQuotes) { result.push(current.trim()); current = ''; }
      else current += ch;
    }
    result.push(current.trim());
    return result.filter(Boolean);
  }

  autoDetect() {
    this.error = null;
    this.warningList = [];
    if (!this.headers.length) return;
    this.selectedTarget = this.headers[this.headers.length - 1];
    this.selectedFeatures = this.headers.slice(0, -1);
    this.dismiss('auto', true);
  }

  useSelection() {
    this.error = null;
    this.warningList = [];
    if (!this.selectedTarget) {
      this.error = 'Please select exactly one Target column.';
      return;
    }
    if (!this.selectedFeatures.length) {
      this.error = 'Please select at least one Feature.';
      return;
    }
    if (this.selectedFeatures.includes(this.selectedTarget)) {
      this.error = 'Features cannot include the Target column.';
      return;
    }
    // Ensure selections exist in headers
    const missing: string[] = [];
    if (!this.headers.includes(this.selectedTarget)) missing.push(this.selectedTarget);
    for (const f of this.selectedFeatures) if (!this.headers.includes(f)) missing.push(f);
    if (missing.length) {
      this.error = 'Selected columns are not present in the CSV header.';
      this.warningList = missing;
      return;
    }
    this.dismiss('confirm');
  }

  skip() { this.dismiss('skip'); }
  cancel() { this.modal.dismiss(null, 'cancel'); }

  private dismiss(role: 'confirm' | 'auto' | 'skip', autoApplied: boolean = false) {
    this.modal.dismiss({
      fileIndex: this.selectedFileIndex,
      fileName: this.fileName,
      target: this.selectedTarget,
      features: this.selectedFeatures,
      autoApplied
    }, role);
  }
}


