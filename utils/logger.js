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
    // En producción (Render) solo usar consola
    new transports.Console({
      format: combine(timestamp(), logFormat),
    }),
  ],
});

// Solo agregar logs a archivos si no es producción
if (process.env.NODE_ENV !== 'production') {
  logger.add(new transports.File({
    filename: path.join(__dirname, '../logs/error.log'),
    level: 'error'
  }));
  logger.add(new transports.File({
    filename: path.join(__dirname, '../logs/combined.log')
  }));
}


module.exports = logger;
