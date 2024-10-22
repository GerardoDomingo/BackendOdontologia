const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf } = format;

// Formato personalizado para los logs
const logFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level.toUpperCase()}]: ${message}`;
});

// Crear logger con opciones
const logger = createLogger({
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports: [
    new transports.Console(),  // Log en consola
    new transports.File({ filename: 'logs/error.log', level: 'error' }),  // Log de errores
    new transports.File({ filename: 'logs/combined.log' })  // Log combinado
  ]
});

module.exports = logger;
