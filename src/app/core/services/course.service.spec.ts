import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CourseService } from './course.service';

describe('CourseService', () => {
  let service: CourseService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CourseService]
    });
    service = TestBed.inject(CourseService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('submits quiz attempts with answers and finish reason', () => {
    const answers = [{ questionId: 1, studentAnswer: 'A' }];

    service.submitQuizAttempt(44, answers, 'TIME_EXPIRED').subscribe();

    const req = http.expectOne('http://localhost:8069/api/quiz-attempts/44/submit');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ answers, finishReason: 'TIME_EXPIRED' });
    req.flush({ attemptId: 44, score: 80, isPassed: true, attemptsUsed: 1, maxAttempts: 3, attemptsExhausted: false, lessonProgress: null });
  });

  it('submits exam attempts with default finish reason', () => {
    const answers = [{ questionId: 5, studentAnswer: 'True' }];

    service.submitExamAttempt(77, answers).subscribe();

    const req = http.expectOne('http://localhost:8069/api/exam-attempts/77/submit');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ answers, finishReason: 'SUBMITTED' });
    req.flush({ attemptId: 77, score: 90, isPassed: true, totalPointsEarned: 9, totalPointsPossible: 10, attemptNumber: 1, certificateUuid: 'uuid', certificateId: 12 });
  });

  it('loads certificate list for the current student', () => {
    service.getMyCertificates().subscribe(certs => {
      expect(certs.length).toBe(1);
      expect(certs[0].status).toBe('APPROVED');
    });

    const req = http.expectOne('http://localhost:8069/api/certificates/my-certificates');
    expect(req.request.method).toBe('GET');
    req.flush([{ id: 1, certificateUuid: 'uuid', courseId: 2, courseTitle: 'Math', score: 95, issuedAt: '2026-01-01', hasPdf: true, status: 'APPROVED' }]);
  });

  it('generates certificate PDFs through the certificate endpoint', () => {
    service.generateCertificatePdf(12).subscribe();

    const req = http.expectOne('http://localhost:8069/api/certificates/12/generate');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});
    req.flush({ id: 12, certificateUuid: 'uuid', courseId: 2, courseTitle: 'Math', score: 95, issuedAt: '2026-01-01', hasPdf: true, status: 'APPROVED' });
  });

  it('builds public certificate download URLs', () => {
    expect(service.downloadCertificateUrl('abc-123')).toBe('http://localhost:8069/api/certificates/abc-123/download');
  });

  it('loads admin suspicious activity for an attempt', () => {
    service.getAdminSuspiciousActivity(99).subscribe(items => {
      expect(items[0].activityType).toBe('TAB_SWITCH');
    });

    const req = http.expectOne('http://localhost:8069/api/admin/exam-attempts/99/suspicious-activity');
    expect(req.request.method).toBe('GET');
    req.flush([{ id: 1, examAttemptId: 99, activityType: 'TAB_SWITCH', count: 2, detectedAt: '2026-01-01', totalCount: 2 }]);
  });
});
