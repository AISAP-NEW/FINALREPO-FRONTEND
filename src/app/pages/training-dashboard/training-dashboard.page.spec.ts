import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TrainingDashboardPage } from './training-dashboard.page';

describe('TrainingDashboardPage', () => {
  let component: TrainingDashboardPage;
  let fixture: ComponentFixture<TrainingDashboardPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(TrainingDashboardPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
