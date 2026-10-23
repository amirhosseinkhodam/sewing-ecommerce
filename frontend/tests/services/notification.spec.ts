import { TestBed } from '@angular/core/testing';
import { NotificationService } from '@shared/services/notification';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    vi.useFakeTimers();
    service = TestBed.inject(NotificationService);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows a message and clears it after 3 seconds', () => {
    service.show('success', 'saved');
    expect(service.notification()).toEqual({
      type: 'success',
      message: 'saved',
    });

    vi.advanceTimersByTime(2999);
    expect(service.notification()).not.toBeNull();
    vi.advanceTimersByTime(1);
    expect(service.notification()).toBeNull();
  });

  it('restarts the timer when a new message replaces the old one', () => {
    service.show('error', 'first');
    vi.advanceTimersByTime(2000);
    service.show('success', 'second');
    vi.advanceTimersByTime(2000);

    expect(service.notification()).toEqual({
      type: 'success',
      message: 'second',
    });
    vi.advanceTimersByTime(1000);
    expect(service.notification()).toBeNull();
  });

  it('dismisses immediately', () => {
    service.show('error', 'oops');
    service.dismiss();

    expect(service.notification()).toBeNull();
  });
});
