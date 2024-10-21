// utils/logger.js
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf, colorize } = format;
const path = require('path');

// Formato personalizado para el log
const logFormat = printf(({ level, message, timestamp }) => {
    return `${timestamp} [${level.toUpperCase()}]: ${message}`;
});

const logger = createLogger({
    level: 'info',
    format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        logFormat
    ),
    transports: [
        new transports.File({
            filename: path.join(__dirname, '../logs', 'app.log'),
            level: 'error',
        }),
        new transports.File({
            filename: path.join(__dirname, '../logs', 'combined.log'),
        }),
        new transports.Console({
            format: combine(colorize(), logFormat),
        }),
    ],
});

module.exports = logger;
