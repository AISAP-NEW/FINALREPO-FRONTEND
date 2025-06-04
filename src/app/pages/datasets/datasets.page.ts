import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatasetService, Dataset } from '../../services/dataset.service';
import { DatasetCardComponent } from '../../components/dataset-card/dataset-card.component';

@Component({
  selector: 'app-datasets',
  templateUrl: './datasets.page.html',
  styleUrls: ['./datasets.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    RouterModule,
    FormsModule,
    DatasetCardComponent
  ]
})
export class DatasetsComponent implements OnInit {
  datasets: Dataset[] = [];
  loading = true;
  error: string | null = null;

  constructor(private datasetService: DatasetService) {}

  ngOnInit() {
    this.loadDatasets();
  }

  loadDatasets() {
    this.loading = true;
    this.error = null;
    
    this.datasetService.getAllDatasets().subscribe({
      next: (data) => {
        console.log('Received datasets:', data);
        this.datasets = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading datasets:', err);
        this.error = 'Failed to load datasets. Please try again later.';
        this.loading = false;
      }
    });
  }
} 