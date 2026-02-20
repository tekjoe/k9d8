jest.mock('../../src/lib/supabase');

import { renderHook } from '@testing-library/react-native';
import { usePlaydateExpiration, usePlaydateRefresh } from '../../src/hooks/usePlaydateExpiration';
import { supabase } from '../../src/lib/supabase';

beforeEach(() => jest.clearAllMocks());

describe('usePlaydateExpiration', () => {
  it('subscribes to play_date_expirations channel on mount', () => {
    renderHook(() => usePlaydateExpiration(jest.fn()));

    expect(supabase.channel).toHaveBeenCalledWith('play_date_expirations');
  });

  it('calls onExpire when status changes to completed', () => {
    const onExpire = jest.fn();
    // Capture the callback passed to .on()
    const mockOn = jest.fn().mockReturnThis();
    const mockSubscribe = jest.fn().mockReturnValue({ unsubscribe: jest.fn() });
    (supabase.channel as jest.Mock).mockReturnValue({
      on: mockOn,
      subscribe: mockSubscribe,
      unsubscribe: jest.fn(),
    });

    renderHook(() => usePlaydateExpiration(onExpire));

    // Get the callback that was passed to .on()
    const callback = mockOn.mock.calls[0][2];
    callback({ new: { id: 'pd1', status: 'completed' } });

    expect(onExpire).toHaveBeenCalledWith('pd1');
  });

  it('does not call onExpire for non-completed status', () => {
    const onExpire = jest.fn();
    const mockOn = jest.fn().mockReturnThis();
    const mockSubscribe = jest.fn().mockReturnValue({ unsubscribe: jest.fn() });
    (supabase.channel as jest.Mock).mockReturnValue({
      on: mockOn,
      subscribe: mockSubscribe,
      unsubscribe: jest.fn(),
    });

    renderHook(() => usePlaydateExpiration(onExpire));

    const callback = mockOn.mock.calls[0][2];
    callback({ new: { id: 'pd1', status: 'active' } });

    expect(onExpire).not.toHaveBeenCalled();
  });
});

describe('usePlaydateRefresh', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('calls onRefresh at interval', () => {
    const onRefresh = jest.fn();
    renderHook(() => usePlaydateRefresh('pd1', onRefresh, 1000));

    expect(onRefresh).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1000);
    expect(onRefresh).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(1000);
    expect(onRefresh).toHaveBeenCalledTimes(2);
  });

  it('does nothing when playdateId is empty', () => {
    const onRefresh = jest.fn();
    renderHook(() => usePlaydateRefresh('', onRefresh, 1000));

    jest.advanceTimersByTime(5000);
    expect(onRefresh).not.toHaveBeenCalled();
  });
});
