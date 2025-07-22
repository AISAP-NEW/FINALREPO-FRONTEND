import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { IonButton, IonContent, IonHeader, IonInput, IonItem, IonLabel, IonList, IonTitle, IonToolbar, IonModal, IonTextarea, IonSelect, IonSelectOption, IonIcon } from '@ionic/angular/standalone';

@Component({
  selector: 'app-experiment-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonInput, IonButton, IonModal, IonTextarea, IonSelect, IonSelectOption, IonIcon],
  templateUrl: './experiment-modal.component.html'
})
export class ExperimentModalComponent implements OnInit {
  @Input() isOpen = false;
  @Input() experiment: any = {};
  @Input() mode: 'create' | 'edit' | 'view' = 'view';
  @Input() datasets: any[] = [];
  @Input() projects: any[] = [];
  @Output() dismiss = new EventEmitter<any>();
  @Output() save = new EventEmitter<any>();

  durationOptions = [
    { label: '1 hour', value: 1 },
    { label: '6 hours', value: 6 },
    { label: '24 hours', value: 24 }
  ];
  artifactFile: File | null = null;
  artifactError = '';
  jsonError = '';
  showToast = false;
  toastMessage = '';

  variables: { key: string, value: string }[] = [];
  variablesKeyError = false;
  variablesDuplicateError = false;
  artifactRequired = true;
  missingFields: string[] = [];
  showArtifacts = true;

  ngOnInit() {
    if (this.mode === 'create') {
      this.experiment.duration = 1;
      this.experiment.status = 'Draft';
      this.variables = [];
      this.experiment.variablesJson = '{}';
      this.showArtifacts = true;
    } else {
      // Parse variablesJson to array for edit/view
      try {
        const parsed = this.experiment.variablesJson ? JSON.parse(this.experiment.variablesJson) : {};
        this.variables = Object.keys(parsed).map(key => ({ key, value: String(parsed[key]) }));
      } catch {
        this.variables = [];
      }
      this.showArtifacts = false;
    }
  }

  addVariable() {
    this.variables.push({ key: '', value: '' });
    this.syncVariablesJson();
  }

  removeVariable(i: number) {
    this.variables.splice(i, 1);
    this.syncVariablesJson();
  }

  onVariableChange() {
    this.syncVariablesJson();
  }

  syncVariablesJson() {
    this.variablesKeyError = this.variables.some(v => !v.key.trim());
    const keys = this.variables.map(v => v.key.trim());
    this.variablesDuplicateError = keys.length !== new Set(keys).size;
    if (!this.variablesKeyError && !this.variablesDuplicateError) {
      const obj: any = {};
      this.variables.forEach(v => { obj[v.key.trim()] = v.value; });
      this.experiment.variablesJson = JSON.stringify(obj);
      this.jsonError = '';
    } else {
      this.jsonError = this.variablesKeyError ? 'Parameter keys cannot be empty.' : 'Duplicate parameter keys are not allowed.';
    }
  }

  validateJson() {
    this.jsonError = '';
    if (this.experiment.variablesJson) {
      try {
        JSON.parse(this.experiment.variablesJson);
      } catch {
        this.jsonError = 'Variables must be valid JSON.';
      }
    }
  }

  onFileChange(event: any) {
    this.artifactError = '';
    const file = event.target.files[0];
    if (file) {
      if (!['application/zip', 'application/json', 'application/x-zip-compressed', 'application/octet-stream'].includes(file.type) && !file.name.endsWith('.zip') && !file.name.endsWith('.json')) {
        this.artifactError = 'Only .zip or .json files are allowed.';
      } else if (file.size > 50 * 1024 * 1024) {
        this.artifactError = 'File size must be less than 50MB.';
      } else {
        this.artifactFile = file;
      }
    }
  }

  showError(message: string) {
    this.toastMessage = message;
    this.showToast = true;
  }

  onSubmit(form: NgForm) {
    this.validateJson();
    this.missingFields = [];
    if (!this.experiment.name || this.experiment.name.length > 50) this.missingFields.push('Name');
    if (!this.experiment.datasetVersionId) this.missingFields.push('Dataset');
    if (this.artifactRequired && !this.artifactFile) this.missingFields.push('Artifact');
    if (form.invalid || this.jsonError || this.artifactError || this.missingFields.length) {
      this.showError('Please fix errors before submitting.' + (this.missingFields.length ? ' Missing: ' + this.missingFields.join(', ') : ''));
      return;
    }
    // Attach artifact file if present
    const result = { ...this.experiment };
    if (this.artifactFile) {
      result.artifactFile = this.artifactFile;
    }
    this.save.emit(result);
    this.close();
  }

  close() {
    this.dismiss.emit();
    this.artifactFile = null;
    this.artifactError = '';
    this.jsonError = '';
    this.showToast = false;
    this.toastMessage = '';
  }

  isViewMode() {
    return this.mode === 'view';
  }

  formInvalid() {
    // Name, Dataset, Artifact required
    return !this.experiment.name || this.experiment.name.length > 50 ||
      !this.experiment.datasetVersionId ||
      (this.artifactRequired && !this.artifactFile) ||
      !!this.jsonError || !!this.artifactError;
  }
} 