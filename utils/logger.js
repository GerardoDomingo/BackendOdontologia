const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf } = format;
const path = require('path');

// Configuración del formato de salida del log
const logFormat = printf(({ level, message, timestamp }) => {
    return `${timestamp} [${level.toUpperCase()}]: ${message}`;
});

const logger = createLogger({
    level: 'info',  // Cambia esto a 'debug' si quieres capturar más detalles
    format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        logFormat
    ),
    transports: [
        new transports.File({ filename: path.join(__dirname, '../logs/error.log'), level: 'error' }),
        new transports.File({ filename: path.join(__dirname, '../logs/combined.log') })
    ]
});

// Para también registrar en la consola
if (process.env.NODE_ENV !== 'production') {
    logger.add(new transports.Console({
        format: combine(
            timestamp(),
            logFormat
        )
    }));
}

module.exports = logger;
