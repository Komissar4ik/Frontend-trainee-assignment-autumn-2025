describe('realtime', () => {
  let startRealtimeUpdates: (callback: () => void, intervalMs?: number) => void;
  let stopRealtimeUpdates: (callback: () => void) => void;

  beforeEach(() => {
    jest.resetModules();
    jest.useFakeTimers();
    jest.clearAllTimers();
    const realtime = require('@/utils/realtime');
    startRealtimeUpdates = realtime.startRealtimeUpdates;
    stopRealtimeUpdates = realtime.stopRealtimeUpdates;
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('should call callback after interval', () => {
    const callback = jest.fn();
    
    startRealtimeUpdates(callback, 1000);
    
    expect(callback).not.toHaveBeenCalled();
    
    jest.advanceTimersByTime(1000);
    
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should call multiple callbacks', () => {
    const callback1 = jest.fn();
    const callback2 = jest.fn();
    
    startRealtimeUpdates(callback1, 1000);
    startRealtimeUpdates(callback2, 1000);
    
    jest.advanceTimersByTime(1000);
    
    expect(callback1).toHaveBeenCalledTimes(1);
    expect(callback2).toHaveBeenCalledTimes(1);
    
    stopRealtimeUpdates(callback1);
    stopRealtimeUpdates(callback2);
  });

  it('should stop calling callback after stopRealtimeUpdates', () => {
    const callback = jest.fn();
    
    startRealtimeUpdates(callback, 1000);
    stopRealtimeUpdates(callback);
    
    jest.advanceTimersByTime(1000);
    
    expect(callback).not.toHaveBeenCalled();
  });

  it('should clear interval when all callbacks are stopped', () => {
    const callback1 = jest.fn();
    const callback2 = jest.fn();
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval').mockImplementation(() => {});
    
    startRealtimeUpdates(callback1, 1000);
    startRealtimeUpdates(callback2, 1000);
    
    stopRealtimeUpdates(callback1);
    stopRealtimeUpdates(callback2);
    
    expect(clearIntervalSpy).toHaveBeenCalled();
    
    clearIntervalSpy.mockRestore();
  });

  it('should reuse existing interval for multiple callbacks', () => {
    const callback1 = jest.fn();
    const callback2 = jest.fn();
    const setIntervalSpy = jest.spyOn(global, 'setInterval');
    
    startRealtimeUpdates(callback1, 1000);
    startRealtimeUpdates(callback2, 1000);
    
    expect(setIntervalSpy).toHaveBeenCalledTimes(1);
    
    stopRealtimeUpdates(callback1);
    stopRealtimeUpdates(callback2);
    setIntervalSpy.mockRestore();
  });

  it('should not clear interval when some callbacks remain', () => {
    const callback1 = jest.fn();
    const callback2 = jest.fn();
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
    
    startRealtimeUpdates(callback1, 1000);
    startRealtimeUpdates(callback2, 1000);
    
    stopRealtimeUpdates(callback1);
    
    expect(clearIntervalSpy).not.toHaveBeenCalled();
    
    clearIntervalSpy.mockRestore();
  });

  it('should create new interval after clearing previous one', () => {
    const callback1 = jest.fn();
    const callback2 = jest.fn();
    const setIntervalSpy = jest.spyOn(global, 'setInterval');
    
    startRealtimeUpdates(callback1, 1000);
    stopRealtimeUpdates(callback1);
    
    startRealtimeUpdates(callback2, 1000);
    
    expect(setIntervalSpy).toHaveBeenCalledTimes(2);
    
    stopRealtimeUpdates(callback2);
    setIntervalSpy.mockRestore();
  });
});

