/**
 * 🎯 Dataset Actions Modal — AI Model Management System
 * 
 * Purpose:
 * - Display dataset preparation actions (Preprocess, Validate, Split)
 * - Guide users through AI pipeline steps
 * - Show completion status of each step
 * 
 * Usage:
 * - Opened when user clicks on a dataset card
 * - Shows buttons for each action with their current status
 * - Navigates to respective pages when actions are clicked
 */

import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { Dataset } from '../../services/dataset.service';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-dataset-actions-modal',
  templateUrl: './dataset-actions-modal.component.html',
  styleUrls: ['./dataset-actions-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule]
})
export class DatasetActionsModalComponent implements OnInit {
  @Input() dataset!: Dataset;
  
  actions = [
    {
      title: 'Preprocess Dataset',
      icon: 'filter-outline',
      route: '/datasets/:id/preprocess',
      status: 'pending',
      description: 'Clean and prepare data for analysis',
      requiredStatus: null,
      nextStep: 'Validate Dataset'
    },
    {
      title: 'Validate Dataset',
      icon: 'checkmark-done-outline',
      route: '/datasets/:id/validate',
      status: 'pending',
      description: 'Check data consistency and quality',
      requiredStatus: 'preprocessingStatus',
      nextStep: 'Train/Test Split'
    },
    {
      title: 'Train/Test Split',
      icon: 'cut-outline',
      route: '/datasets/:id/split',
      status: 'pending',
      description: 'Divide data into training and testing sets',
      requiredStatus: 'validationStatus',
      nextStep: null
    }
  ];

  constructor(
    private modalCtrl: ModalController
  ) {}

  ngOnInit() {
    // Update action statuses based on dataset status
    this.actions = this.actions.map(action => {
      if (action.title === 'Preprocess Dataset') {
        return {
          ...action,
          status: this.dataset.preprocessingStatus === 'complete' ? 'completed' : 'pending'
        };
      }
      if (action.title === 'Validate Dataset') {
        return {
          ...action,
          status: this.dataset.validationStatus === 'Passed' ? 'completed' : 'pending'
        };
      }
      if (action.title === 'Train/Test Split') {
        return {
          ...action,
          status: this.dataset.splitStatus === 'complete' ? 'completed' : 'pending'
        };
      }
      return action;
    });
  }

  onClose() {
    this.modalCtrl.dismiss();
  }

  onActionClick(action: any) {
    // Check if the required status is met
    if (action.requiredStatus) {
      const requiredStatusValue = this.dataset?.[action.requiredStatus as keyof Dataset];
      if (!requiredStatusValue || requiredStatusValue !== 'complete') {
        this.modalCtrl.dismiss();
        return;
      }
    }

    const route = action.route.replace(':id', this.dataset.datasetId);
    this.modalCtrl.dismiss(route);
  }
}
