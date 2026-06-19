// Production-grade error handling and logging system

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  error?: Error;
  stack?: string;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000; // Keep last 1000 logs
  private isDevelopment = !process.env.NODE_ENV || process.env.NODE_ENV === 'development';

  log(level: LogLevel, message: string, context?: Record<string, any>, error?: Error): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      error,
      stack: error?.stack,
    };

    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Console output in development
    if (this.isDevelopment) {
      const style = this.getConsoleStyle(level);
      console.log(`%c[${level}] ${message}`, style, context || '');
    }

    // Store critical errors for later analysis
    if (level === LogLevel.CRITICAL || level === LogLevel.ERROR) {
      this.storeErrorInLocalStorage(entry);
    }
  }

  debug(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, error?: Error, context?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  critical(message: string, error?: Error, context?: Record<string, any>): void {
    this.log(LogLevel.CRITICAL, message, context, error);
  }

  private getConsoleStyle(level: LogLevel): string {
    const styles: Record<LogLevel, string> = {
      [LogLevel.DEBUG]: 'color: gray; font-weight: bold;',
      [LogLevel.INFO]: 'color: blue; font-weight: bold;',
      [LogLevel.WARN]: 'color: orange; font-weight: bold;',
      [LogLevel.ERROR]: 'color: red; font-weight: bold;',
      [LogLevel.CRITICAL]: 'color: darkred; font-weight: bold; font-size: 14px;',
    };
    return styles[level];
  }

  private storeErrorInLocalStorage(entry: LogEntry): void {
    try {
      const errorLogs = JSON.parse(localStorage.getItem('__app_error_logs') || '[]');
      errorLogs.push(entry);
      if (errorLogs.length > 100) {
        errorLogs.shift();
      }
      localStorage.setItem('__app_error_logs', JSON.stringify(errorLogs));
    } catch (e) {
      // Fail silently if localStorage is full
    }
  }

  getLogs(): LogEntry[] {
    return this.logs;
  }

  getErrorLogs(): LogEntry[] {
    return this.logs.filter(
      log => log.level === LogLevel.ERROR || log.level === LogLevel.CRITICAL
    );
  }

  clearLogs(): void {
    this.logs = [];
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  downloadLogs(): void {
    const logs = this.exportLogs();
    const blob = new Blob([logs], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `logs-${new Date().toISOString()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export const logger = new Logger();

// Global error handler for unhandled errors
export function setupGlobalErrorHandler(): void {
  window.addEventListener('error', (event) => {
    logger.error('Uncaught Error', event.error, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    logger.critical('Unhandled Promise Rejection', event.reason as Error, {
      promise: event.promise,
    });
  });
}

// Async error wrapper for try-catch
export function withErrorHandling<T extends any[], R>(
  fn: (...args: T) => Promise<R>
): (...args: T) => Promise<R | null> {
  return async (...args: T) => {
    try {
      return await fn(...args);
    } catch (error) {
      logger.error('Function execution failed', error as Error, {
        functionName: fn.name,
        args: args.length,
      });
      return null;
    }
  };
}

// Sync error wrapper
export function withErrorHandlingSync<T extends any[], R>(
  fn: (...args: T) => R
): (...args: T) => R | null {
  return (...args: T) => {
    try {
      return fn(...args);
    } catch (error) {
      logger.error('Function execution failed', error as Error, {
        functionName: fn.name,
        args: args.length,
      });
      return null;
    }
  };
}

// Custom error classes
export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super('VALIDATION_ERROR', message, 400);
    this.name = 'ValidationError';
  }
}

export class StorageError extends AppError {
  constructor(message: string) {
    super('STORAGE_ERROR', message, 500);
    this.name = 'StorageError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super('AUTH_ERROR', message, 401);
    this.name = 'AuthenticationError';
  }
}

// Validation helper
export function validateRequired(value: any, fieldName: string): void {
  if (!value) {
    throw new ValidationError(`${fieldName} is required`);
  }
}

export function validateEmail(email: string): void {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError('Invalid email format');
  }
}

export function validateNumber(value: any, fieldName: string, min?: number, max?: number): void {
  const num = Number(value);
  if (isNaN(num)) {
    throw new ValidationError(`${fieldName} must be a number`);
  }
  if (min !== undefined && num < min) {
    throw new ValidationError(`${fieldName} must be at least ${min}`);
  }
  if (max !== undefined && num > max) {
    throw new ValidationError(`${fieldName} must be at most ${max}`);
  }
}

export function validateLength(value: string, fieldName: string, min?: number, max?: number): void {
  if (min !== undefined && value.length < min) {
    throw new ValidationError(`${fieldName} must be at least ${min} characters`);
  }
  if (max !== undefined && value.length > max) {
    throw new ValidationError(`${fieldName} must be at most ${max} characters`);
  }
}

// Performance monitoring
export class PerformanceMonitor {
  private marks: Map<string, number> = new Map();

  start(label: string): void {
    this.marks.set(label, performance.now());
  }

  end(label: string): number {
    const startTime = this.marks.get(label);
    if (!startTime) {
      logger.warn(`Performance mark "${label}" not found`);
      return 0;
    }

    const duration = performance.now() - startTime;
    logger.debug(`Performance: ${label} took ${duration.toFixed(2)}ms`);
    this.marks.delete(label);

    return duration;
  }

  measure<T>(label: string, fn: () => T): T {
    this.start(label);
    try {
      const result = fn();
      this.end(label);
      return result;
    } catch (error) {
      this.end(label);
      throw error;
    }
  }

  async measureAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
    this.start(label);
    try {
      const result = await fn();
      this.end(label);
      return result;
    } catch (error) {
      this.end(label);
      throw error;
    }
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Setup global handlers on initialization
setupGlobalErrorHandler();
