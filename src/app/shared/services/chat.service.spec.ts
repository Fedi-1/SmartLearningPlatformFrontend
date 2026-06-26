import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { ChatMessage, ChatService } from './chat.service';

describe('ChatService', () => {
  let service: ChatService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });

    service = TestBed.inject(ChatService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('sends chat messages with selected mode and context', () => {
    const messages: ChatMessage[] = [{ role: 'user', content: 'Explain this lesson' }];

    service.sendMessage(messages, 'student', 'Course: Algorithms').subscribe(response => {
      expect(response).toEqual({ reply: 'Sure' } as any);
    });

    const req = httpMock.expectOne('http://localhost:8000/api/chat');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      messages,
      mode: 'student',
      context: 'Course: Algorithms',
    });
    req.flush({ reply: 'Sure' });
  });

  it('sends null context when no context is selected', () => {
    const messages: ChatMessage[] = [{ role: 'user', content: 'Hello' }];

    service.sendMessage(messages, 'visitor').subscribe();

    const req = httpMock.expectOne('http://localhost:8000/api/chat');
    expect(req.request.body).toEqual({
      messages,
      mode: 'visitor',
      context: null,
    });
    req.flush({ reply: 'Hello' });
  });
});
