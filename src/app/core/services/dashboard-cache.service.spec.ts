import { TestBed } from '@angular/core/testing';

import { DashboardCacheService } from './dashboard-cache.service';

describe('DashboardCacheService', () => {
  let service: DashboardCacheService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DashboardCacheService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
