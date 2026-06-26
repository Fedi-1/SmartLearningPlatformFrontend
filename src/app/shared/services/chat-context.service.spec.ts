import { TestBed } from '@angular/core/testing';

import { ChatContextService } from './chat-context.service';

describe('ChatContextService', () => {
  let service: ChatContextService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ChatContextService);
  });

  it('starts without a selected context', () => {
    expect(service.getContext()).toBeNull();
  });

  it('stores and clears the selected chat context', () => {
    service.setContext('Lesson 1: Sorting');

    expect(service.getContext()).toBe('Lesson 1: Sorting');

    service.setContext(null);

    expect(service.getContext()).toBeNull();
  });
});
