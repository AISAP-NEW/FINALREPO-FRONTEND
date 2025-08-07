import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DeploymentsPage } from './deployments.page';

describe('DeploymentsPage', () => {
  let component: DeploymentsPage;
  let fixture: ComponentFixture<DeploymentsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(DeploymentsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
