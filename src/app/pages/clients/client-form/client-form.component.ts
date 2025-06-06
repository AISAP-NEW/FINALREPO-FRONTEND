import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline } from 'ionicons/icons';
import { Client, CreateClientDTO, UpdateClientDTO } from '../../../services/client.service';

@Component({
  selector: 'app-client-form',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ client ? 'Edit Client' : 'New Client' }}</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="dismiss()">
            <ion-icon name="close-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <form [formGroup]="clientForm" (ngSubmit)="onSubmit()">
        <ion-list>
          <ion-item>
            <ion-label position="stacked">Name *</ion-label>
            <ion-input
              type="text"
              formControlName="name"
              placeholder="Enter client name"
              [clearInput]="true">
            </ion-input>
            <div class="error-message" *ngIf="clientForm.get('name')?.touched && clientForm.get('name')?.errors?.['required']">
              Name is required
            </div>
          </ion-item>

          <ion-item>
            <ion-label position="stacked">Email *</ion-label>
            <ion-input
              type="email"
              formControlName="email"
              placeholder="Enter client email"
              [clearInput]="true">
            </ion-input>
            <div class="error-message" *ngIf="clientForm.get('email')?.touched && clientForm.get('email')?.errors?.['required']">
              Email is required
            </div>
            <div class="error-message" *ngIf="clientForm.get('email')?.touched && clientForm.get('email')?.errors?.['email']">
              Please enter a valid email address
            </div>
          </ion-item>

          <ion-item>
            <ion-label position="stacked">Telephone *</ion-label>
            <ion-input
              type="tel"
              formControlName="telephoneNumber"
              placeholder="Enter telephone number"
              [clearInput]="true">
            </ion-input>
            <div class="error-message" *ngIf="clientForm.get('telephoneNumber')?.touched && clientForm.get('telephoneNumber')?.errors?.['required']">
              Telephone number is required
            </div>
          </ion-item>

          <ion-item>
            <ion-label position="stacked">Address *</ion-label>
            <ion-input
              type="text"
              formControlName="address"
              placeholder="Enter client address"
              [clearInput]="true">
            </ion-input>
            <div class="error-message" *ngIf="clientForm.get('address')?.touched && clientForm.get('address')?.errors?.['required']">
              Address is required
            </div>
          </ion-item>
        </ion-list>

        <div class="ion-padding">
          <ion-button expand="block" type="submit" [disabled]="!clientForm.valid">
            {{ client ? 'Update Client' : 'Create Client' }}
          </ion-button>
        </div>
      </form>
    </ion-content>
  `,
  styles: [`
    .error-message {
      color: var(--ion-color-danger);
      font-size: 0.8em;
      margin: 8px 0 0 16px;
    }

    ion-item {
      --padding-start: 0;
      --padding-end: 0;
      --inner-padding-end: 0;
    }

    ion-label {
      margin-bottom: 8px;
    }

    ion-input {
      --padding-start: 16px;
      --padding-end: 16px;
    }
  `],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    IonIcon,
    IonList,
    IonItem,
    IonLabel,
    IonInput
  ]
})
export class ClientFormComponent implements OnInit {
  @Input() client?: Client;
  clientForm: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    private modalController: ModalController
  ) {
    addIcons({ closeOutline });
    
    this.clientForm = this.formBuilder.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      telephoneNumber: ['', [Validators.required]],
      address: ['', [Validators.required]]
    });
  }

  ngOnInit() {
    if (this.client) {
      this.clientForm.patchValue({
        name: this.client.name,
        email: this.client.email,
        telephoneNumber: this.client.telephoneNumber,
        address: this.client.address
      });
    }
  }

  onSubmit() {
    if (this.clientForm.valid) {
      const formData = this.clientForm.value;
      const clientData: CreateClientDTO | UpdateClientDTO = {
        name: formData.name,
        email: formData.email,
        telephoneNumber: formData.telephoneNumber,
        address: formData.address
      };
      this.modalController.dismiss(clientData, 'confirm');
    }
  }

  dismiss() {
    this.modalController.dismiss(null, 'cancel');
  }
} 