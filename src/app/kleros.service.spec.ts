import { TestBed } from '@angular/core/testing';

import { KlerosService } from './kleros.service';

describe('KlerosService', () => {
  let service: KlerosService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(KlerosService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
