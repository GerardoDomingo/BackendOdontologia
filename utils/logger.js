const { createLogger, format, transports } = require('winston');
const path = require('path');
const { combine, timestamp, printf } = format;

// Formato para los logs
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
    // Para registrar los errores en error.log dentro de utils/logs
    new transports.File({
      filename: path.join(__dirname, './logs/error.log'),  // Se ajusta la ruta
      level: 'error'
    }),
    // Para registrar todos los logs (info, warn, error, etc.) en combined.log dentro de utils/logs
    new transports.File({
      filename: path.join(__dirname, './logs/combined.log')  // Se ajusta la ruta
    }),
  ],
});

// Solo agregar la consola si no está en producción
if (process.env.NODE_ENV !== 'production') {
  logger.add(new transports.Console({
    format: combine(timestamp(), logFormat),
  }));
}

module.exports = logger;
