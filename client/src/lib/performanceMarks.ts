const mark = (name: string): void => {
  if (typeof performance === 'undefined' || typeof performance.mark !== 'function') {
    return;
  }

  performance.mark(name);
};

export const measureApiSpan = (name: string, startMark: string, endMark: string): void => {
  if (typeof performance === 'undefined' || typeof performance.measure !== 'function') {
    return;
  }

  try {
    performance.measure(name, startMark, endMark);
  } catch {
    return;
  } finally {
    performance.clearMarks(startMark);
    performance.clearMarks(endMark);
  }
};

export const markApiStart = (name: string): string => {
  const startMark = `${name}:start:${performance.now()}`;
  mark(startMark);
  return startMark;
};

export const markApiEnd = (name: string): string => {
  const endMark = `${name}:end:${performance.now()}`;
  mark(endMark);
  return endMark;
};
