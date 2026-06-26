import { TokenService } from './token.service';

describe('TokenService', () => {
  let service: TokenService;

  beforeEach(() => {
    localStorage.clear();
    service = new TokenService();
  });

  afterEach(() => localStorage.clear());

  it('stores and retrieves JWT tokens', () => {
    service.saveToken('jwt-token');

    expect(service.getToken()).toBe('jwt-token');
    expect(service.isTokenPresent()).toBeTrue();
  });

  it('stores and retrieves users as JSON', () => {
    service.saveUser({ id: 1, email: 'student@example.com' });

    expect(service.getUser<{ id: number; email: string }>()?.email).toBe('student@example.com');
  });

  it('clears token and user together', () => {
    service.saveToken('jwt-token');
    service.saveUser({ id: 1 });

    service.clear();

    expect(service.getToken()).toBeNull();
    expect(service.getUser()).toBeNull();
  });
});
