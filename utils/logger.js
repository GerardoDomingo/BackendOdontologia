const { createLogger, format, transports } = require('winston');
const path = require('path');
const fs = require('fs');
const { combine, timestamp, printf } = format;

// Ruta de la carpeta de logs
const logDir = path.join(__dirname, '../logs');

// Crear la carpeta 'logs' si no existe
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Formato para los logs
const logFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level.toUpperCase()}]: ${message}`;
});

const logger = createLogger({
  level: 'info',  // Nivel de logging, puedes cambiarlo según necesidad
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),  // Formato de la fecha y hora
    logFormat  // Formato del mensaje
  ),
  transports: [
    // Para registrar los errores en error.log
    new transports.File({
      filename: path.join(logDir, 'error.log'),  // Usa la ruta correcta con 'logDir'
      level: 'error',  // Solo registra errores en este archivo
    }),
    // Para registrar todos los logs (info, warn, error, etc.) en combined.log
    new transports.File({
      filename: path.join(logDir, 'combined.log'),  // Usa la ruta correcta con 'logDir'
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
