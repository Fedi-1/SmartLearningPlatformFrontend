import { fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AdminCertificatesComponent } from './admin-certificates.component';
import { AdminCertificateItem, AdminService } from '../../../../core/services/admin.service';

describe('AdminCertificatesComponent', () => {
  let component: AdminCertificatesComponent;
  let adminService: jasmine.SpyObj<AdminService>;

  beforeEach(() => {
    adminService = jasmine.createSpyObj<AdminService>('AdminService', ['getAllCertificates', 'approveCertificate', 'revokeCertificate']);
    component = new AdminCertificatesComponent(adminService);
  });

  it('loads certificates from admin service', () => {
    adminService.getAllCertificates.and.returnValue(of([certificate(1, 'PENDING')]));

    component.load();

    expect(component.loading).toBeFalse();
    expect(component.certificates.length).toBe(1);
  });

  it('filters certificates by status and search query', () => {
    component.certificates = [
      certificate(1, 'PENDING', 'Ada Lovelace', 'Math'),
      certificate(2, 'APPROVED', 'Grace Hopper', 'Computing')
    ];
    component.activeFilter = 'PENDING';
    component.searchQuery = 'ada';

    expect(component.filtered.length).toBe(1);
    expect(component.filtered[0].studentName).toBe('Ada Lovelace');
  });

  it('approves certificates and updates local status', () => {
    component.certificates = [certificate(1, 'PENDING')];
    component.requestAction(1, 'approve');
    adminService.approveCertificate.and.returnValue(of(void 0));
    spyOn(component, 'showToast');

    component.confirmAction();

    expect(adminService.approveCertificate).toHaveBeenCalledWith(1);
    expect(component.certificates[0].status).toBe('APPROVED');
    expect(component.processingId).toBeNull();
    expect(component.showToast).toHaveBeenCalledWith('Certificate approved. Student notified.', 'success');
  });

  it('revokes certificates and updates local status', () => {
    component.certificates = [certificate(1, 'APPROVED')];
    component.requestAction(1, 'revoke');
    adminService.revokeCertificate.and.returnValue(of(void 0));
    spyOn(component, 'showToast');

    component.confirmAction();

    expect(adminService.revokeCertificate).toHaveBeenCalledWith(1);
    expect(component.certificates[0].status).toBe('REVOKED');
    expect(component.showToast).toHaveBeenCalledWith('Certificate revoked. Student notified.', 'error');
  });

  it('shows error toast when action fails', () => {
    component.certificates = [certificate(1, 'PENDING')];
    component.requestAction(1, 'approve');
    adminService.approveCertificate.and.returnValue(throwError(() => new Error('boom')));
    spyOn(component, 'showToast');

    component.confirmAction();

    expect(component.processingId).toBeNull();
    expect(component.showToast).toHaveBeenCalledWith('Action failed. Please try again.', 'error');
  });

  it('removes toast after timeout', fakeAsync(() => {
    component.showToast('Saved', 'success');
    expect(component.toasts.length).toBe(1);

    tick(3000);

    expect(component.toasts.length).toBe(0);
  }));

  function certificate(
    id: number,
    status: AdminCertificateItem['status'],
    studentName = 'Ada Lovelace',
    courseTitle = 'Math'
  ): AdminCertificateItem {
    return {
      id,
      certificateUUID: 'uuid',
      studentName,
      studentEmail: 'ada@example.com',
      studentId: 7,
      courseTitle,
      courseId: 9,
      category: 'STEM',
      score: 90,
      issuedAt: '2026-01-01',
      status
    };
  }
});
