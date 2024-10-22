const { createLogger, format, transports } = require('winston');
const TransportStream = require('winston-transport');
const { combine, timestamp, printf } = format;
const db = require('../db');  // Importa tu pool de conexiones a MySQL

const logFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level.toUpperCase()}]: ${message}`;
});

// Crear transporte personalizado que herede de winston-transport
class MySQLTransport extends TransportStream {
  constructor(opts) {
    super(opts);
  }

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

// Configuración del logger
const logger = createLogger({
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports: [
    new transports.Console(),  // Log en la consola
    new MySQLTransport()       // Transporte personalizado para MySQL
  ]
});

module.exports = logger;
