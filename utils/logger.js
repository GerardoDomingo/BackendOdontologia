const { createLogger, format, transports } = require('winston');
const path = require('path');
const { combine, timestamp, printf } = format;

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
    // Para registrar errores
    new transports.File({
      filename: path.join(__dirname, '../logs/error.log'),
      level: 'error'
    }),
    // Para registrar todos los logs (info, warn, error, etc.)
    new transports.File({
      filename: path.join(__dirname, '../logs/combined.log')
    }),
    // Opción para registrar en consola en modo desarrollo
    new transports.Console({
      format: combine(timestamp(), logFormat),
    })
  ]
});

module.exports = logger;
