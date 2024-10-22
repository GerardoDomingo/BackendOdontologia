const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf } = format;
const db = require('../db');  // Importar el pool de conexiones

const logFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level.toUpperCase()}]: ${message}`;
});

const logger = createLogger({
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports: [
    new transports.Console(),  // Mostrar logs en la consola
    new transports.Stream({
      stream: {
        write: (log) => {
          const logData = JSON.parse(log);
          const sql = 'INSERT INTO logs (level, message, timestamp) VALUES (?, ?, ?)';
          db.query(sql, [logData.level, logData.message, logData.timestamp], (err) => {
            if (err) {
              console.error('Error al insertar el log en la base de datos:', err);
            }
          });
        }
      }
    })
  ]
});

module.exports = logger;
