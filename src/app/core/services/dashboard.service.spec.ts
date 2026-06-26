import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { DashboardResponse, DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });

    service = TestBed.inject(DashboardService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('loads the current student dashboard', () => {
    const dashboard: DashboardResponse = {
      stats: {
        totalCourses: 3,
        completedCourses: 2,
        totalLessons: 12,
        completedLessons: 8,
        totalQuizAttempts: 5,
        passedQuizAttempts: 4,
        averageQuizScore: 82,
        flashcardsDueToday: 6,
        totalFlashcards: 30,
        totalStudyMinutes: 120,
      },
      courses: [],
      recentActivity: [],
      flashcardsDue: [],
    };

    service.getDashboard().subscribe(response => {
      expect(response).toEqual(dashboard);
    });

    const req = httpMock.expectOne('http://localhost:8069/api/dashboard');
    expect(req.request.method).toBe('GET');
    req.flush(dashboard);
  });
});
