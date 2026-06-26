import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { CommunityService, SendMessageRequest } from './community.service';

describe('CommunityService', () => {
  let service: CommunityService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });

    service = TestBed.inject(CommunityService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('loads conversations for the current student', () => {
    const conversations = [
      { id: 1, otherStudentName: 'Grace Hopper', unreadCount: 2 },
    ] as any;

    service.getConversations().subscribe(response => {
      expect(response).toEqual(conversations);
    });

    const req = httpMock.expectOne('http://localhost:8069/api/community/conversations');
    expect(req.request.method).toBe('GET');
    req.flush(conversations);
  });

  it('gets or creates a conversation with another student', () => {
    const conversation = { id: 4, otherStudentId: 2 } as any;

    service.getOrCreateConversation(2).subscribe(response => {
      expect(response).toEqual(conversation);
    });

    const req = httpMock.expectOne('http://localhost:8069/api/community/conversations/2');
    expect(req.request.method).toBe('GET');
    req.flush(conversation);
  });

  it('loads messages for a conversation', () => {
    const messages = [
      { id: 7, conversationId: 4, content: 'Hi', isMine: false },
    ] as any;

    service.getMessages(4).subscribe(response => {
      expect(response).toEqual(messages);
    });

    const req = httpMock.expectOne('http://localhost:8069/api/community/conversations/4/messages');
    expect(req.request.method).toBe('GET');
    req.flush(messages);
  });

  it('sends a message request', () => {
    const request: SendMessageRequest = {
      conversationId: 4,
      recipientId: 2,
      content: 'Can you review this?',
      courseIdToShare: 10,
    };
    const savedMessage = { id: 9, content: 'Can you review this?', sharedCourseId: 10 } as any;

    service.sendMessage(request).subscribe(response => {
      expect(response).toEqual(savedMessage);
    });

    const req = httpMock.expectOne('http://localhost:8069/api/community/messages');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush(savedMessage);
  });

  it('searches students by query string', () => {
    const students = [
      { id: 2, fullName: 'Grace Hopper', email: 'grace@mail.test' },
    ] as any;

    service.searchStudents('Grace Hopper').subscribe(response => {
      expect(response).toEqual(students);
    });

    const req = httpMock.expectOne(request =>
      request.url === 'http://localhost:8069/api/community/students/search'
      && request.params.get('query') === 'Grace Hopper'
    );
    expect(req.request.method).toBe('GET');
    req.flush(students);
  });
});
