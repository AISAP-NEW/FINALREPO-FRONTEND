import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { DatasetService, SplitResponse } from '../../services/dataset.service';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ToastService } from '../../services/toast.service';

/**
 * Dataset Split Page Component
 * 
 * This component is responsible for handling the dataset split functionality.
 * It provides a form for the user to input the training set ratio and 
 * displays the split results.
 */
@Component({
  selector: 'app-dataset-split',
  templateUrl: './dataset-split.page.html',
  styleUrls: ['./dataset-split.page.scss'],

  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, ReactiveFormsModule]
})
export class DatasetSplitPage implements OnInit {
  datasetId: string | null = null;
  splitForm: FormGroup;
  splitting = false;
  error: string | null = null;
  splitResult: SplitResponse | null = null;
  testRatio: number = 20; // Default to 20% since train is 80% by default

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private formBuilder: FormBuilder,
    private datasetService: DatasetService
  ) {
    this.splitForm = this.formBuilder.group({
      trainRatio: [80, [Validators.required, Validators.min(10), Validators.max(90)]]
    });

    // Calculate test ratio based on train ratio
    this.splitForm.get('trainRatio')?.valueChanges.subscribe((value) => {
      this.testRatio = 100 - value;
    });
  }

  ngOnInit() {
    this.datasetId = this.route.snapshot.paramMap.get('id');
  }

  onSubmit() {
    if (!this.datasetId) {
      this.error = 'Dataset ID is missing';
      return;
    }

    if (this.splitForm.valid) {
      this.splitting = true;
      this.error = null;
      this.splitResult = null;

      const trainRatio = this.splitForm.get('trainRatio')?.value;
      const testRatio = 100 - trainRatio;

      this.datasetService.splitDataset(this.datasetId, trainRatio, testRatio).subscribe({
        next: (response) => {
          this.splitting = false;
          this.splitResult = response;
        },
        error: (err) => {
          this.splitting = false;
          this.error = 'Error splitting dataset: ' + (err.error?.message || err.message || 'Unknown error');
        }
      });
    }
  }
} 