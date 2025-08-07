import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { UpdateModelModalComponent } from './update-model-modal.component';

describe('UpdateModelModalComponent', () => {
  let component: UpdateModelModalComponent;
  let fixture: ComponentFixture<UpdateModelModalComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [UpdateModelModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(UpdateModelModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
