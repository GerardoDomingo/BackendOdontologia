const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf } = format;
const db = require('../db');  // Importar el pool de conexiones de MySQL

const logFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level.toUpperCase()}]: ${message}`;
});

// Transporte personalizado para insertar los logs en MySQL
class MySQLTransport extends transports.Stream {
  log(info, callback) {
    setImmediate(() => this.emit('logged', info));

    const sql = 'INSERT INTO logs (level, message, timestamp) VALUES (?, ?, ?)';
    db.query(sql, [info.level, info.message, new Date()], (err) => {
      if (err) {
        console.error('Error al insertar el log en la base de datos:', err);
      }
    });

    callback();
  }
}

const logger = createLogger({
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports: [
    new transports.Console(),  // Log en la consola
    new MySQLTransport()  // Nuestro transporte personalizado para MySQL
  ]
});

module.exports = logger;
