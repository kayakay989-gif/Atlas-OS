export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogContext {
  organizationId?: string
  userId?: string
  jobId?: string
  event?: string
  [key: string]: unknown
}

export interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context?: LogContext
}

export interface Logger {
  debug(message: string, context?: LogContext): void
  info(message: string, context?: LogContext): void
  warn(message: string, context?: LogContext): void
  error(message: string, context?: LogContext): void
  child(context: LogContext): Logger
}

export interface LoggerOptions {
  service: string
  minLevel?: LogLevel
  context?: LogContext
}

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
}

function shouldLog(minLevel: LogLevel, level: LogLevel): boolean {
  return LEVEL_ORDER[level] >= LEVEL_ORDER[minLevel]
}

function writeLog(entry: LogEntry): void {
  const line = JSON.stringify(entry)
  if (entry.level === 'error' || entry.level === 'warn') {
    console.error(line)
    return
  }
  console.log(line)
}

/** Thin structured JSON logger — swappable backend in future milestones. */
export function createLogger(options: LoggerOptions): Logger {
  const minLevel = options.minLevel ?? (process.env.NODE_ENV === 'production' ? 'info' : 'debug')
  const baseContext: LogContext = { service: options.service, ...options.context }

  const log = (level: LogLevel, message: string, context?: LogContext): void => {
    if (!shouldLog(minLevel, level)) {
      return
    }

    writeLog({
      level,
      message,
      timestamp: new Date().toISOString(),
      context: { ...baseContext, ...context },
    })
  }

  return {
    debug: (message, context) => {
      log('debug', message, context)
    },
    info: (message, context) => {
      log('info', message, context)
    },
    warn: (message, context) => {
      log('warn', message, context)
    },
    error: (message, context) => {
      log('error', message, context)
    },
    child: (context) =>
      createLogger({
        service: options.service,
        minLevel,
        context: { ...baseContext, ...context },
      }),
  }
}
