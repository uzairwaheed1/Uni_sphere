import * as winston from 'winston';
import { WinstonModule } from 'nest-winston';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, stack, context, ...meta }: any) => {
    const logEntry = {
      timestamp,
      level,
      message,
      ...(context && { context }),
      ...(stack && { stack }),
      ...(meta && typeof meta === 'object' && meta !== null ? meta : {}),
    };
    return JSON.stringify(logEntry);
  })
);

const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, context, stack }) => {
    const contextStr = context ? `[${context}] ` : '';
    const stackStr = stack ? `\n${stack}` : '';
    return `${timestamp} ${level}: ${contextStr}${message}${stackStr}`;
  })
);

export const winstonConfig = {
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'unisphere-backend' },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: process.env.NODE_ENV === 'production' ? logFormat : consoleFormat,
    }),
    
    // File transport for all logs
    new winston.transports.File({
      filename: 'logs/app.log',
      level: 'info',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    
    // Separate file for errors
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/exceptions.log' })
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: 'logs/rejections.log' })
  ],
};

export const createWinstonLogger = () => {
  return WinstonModule.createLogger(winstonConfig);
};
