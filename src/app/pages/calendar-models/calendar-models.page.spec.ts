import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CalendarModelsPage } from './calendar-models.page';

describe('CalendarModelsPage', () => {
  let component: CalendarModelsPage;
  let fixture: ComponentFixture<CalendarModelsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CalendarModelsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
