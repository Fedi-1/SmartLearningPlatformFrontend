import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AdminService } from './admin.service';

describe('AdminService', () => {
  let service: AdminService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AdminService]
    });
    service = TestBed.inject(AdminService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('returns default stats when stats endpoint fails', () => {
    service.getStats().subscribe(stats => {
      expect(stats).toEqual({ totalStudents: 0, totalCourses: 0, totalCertificates: 0, totalDocuments: 0, examPassRate: 0 });
    });

    const req = http.expectOne('http://localhost:8069/api/admin/stats');
    req.flush('boom', { status: 500, statusText: 'Server Error' });
  });

  it('approves certificates with PATCH', () => {
    service.approveCertificate(5).subscribe();

    const req = http.expectOne('http://localhost:8069/api/admin/certificates/5/approve');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({});
    req.flush(null);
  });

  it('revokes certificates with PATCH', () => {
    service.revokeCertificate(5).subscribe();

    const req = http.expectOne('http://localhost:8069/api/admin/certificates/5/revoke');
    expect(req.request.method).toBe('PATCH');
    req.flush(null);
  });

  it('returns empty certificate list when admin certificate endpoint fails', () => {
    service.getAllCertificates().subscribe(items => expect(items).toEqual([]));

    const req = http.expectOne('http://localhost:8069/api/admin/certificates');
    req.flush('boom', { status: 500, statusText: 'Server Error' });
  });

  it('sends activity log filters as query params', () => {
    service.getActivityLogs(2, 20, 'UPLOAD_DOCUMENT', 7, '2026-01-01', '2026-01-31').subscribe();

    const req = http.expectOne(r => r.url === 'http://localhost:8069/api/admin/activity-logs');
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('size')).toBe('20');
    expect(req.request.params.get('action')).toBe('UPLOAD_DOCUMENT');
    expect(req.request.params.get('studentId')).toBe('7');
    expect(req.request.params.get('startDate')).toBe('2026-01-01');
    expect(req.request.params.get('endDate')).toBe('2026-01-31');
    req.flush({ content: [], totalElements: 0, totalPages: 0, currentPage: 2 });
  });
});
