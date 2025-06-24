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
  filteredDatasets: Dataset[] = [];
  loading = true;
  error: string | null = null;
  searchTerm: string = '';

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
        // Process each dataset to ensure thumbnail URLs are properly formatted
        this.datasets = data.map(dataset => ({
          ...dataset,
          // Add a default thumbnail if none exists
          thumbnailBase64: dataset.thumbnailBase64 || 'assets/images/default-dataset.png'
        }));
        this.filteredDatasets = [...this.datasets];
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading datasets:', err);
        this.error = 'Failed to load datasets. Please try again later.';
        this.loading = false;
      }
    });
  }

  handleSearch(event: any) {
    const searchTerm = event?.target?.value?.toLowerCase() || '';
    if (!searchTerm) {
      this.filteredDatasets = [...this.datasets];
      return;
    }
    this.filteredDatasets = this.datasets.filter(dataset => {
      const searchableFields = [
        dataset.datasetName,
        dataset.description,
        dataset.fileType
      ].map(field => field?.toLowerCase() || '');

      // Split search term into words for multi-term search
      const searchTerms = searchTerm.split(' ').filter((term: string) => term.length > 0);

      // Check if all search terms are found in any of the searchable fields
      return searchTerms.every((term: string) =>
        searchableFields.some(field => field.includes(term))
      );
    });
  }
} 