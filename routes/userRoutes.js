const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db = require('../db');
const axios = require('axios');
const xss = require('xss');
const { RateLimiterMemory } = require('rate-limiter-flexible');
const logger = require('../utils/logger');
const cookieParser = require('cookie-parser');

router.use(cookieParser()); // Configuración de cookie-parser

// Función para generar un token aleatorio seguro
function generateToken() {
    return crypto.randomBytes(64).toString('hex');
}

// Protección contra ataques de fuerza bruta
const rateLimiter = new RateLimiterMemory({
    points: 100,
    duration: 3 * 60 * 60,
});

// Función para obtener valores de configuración de la tabla config
async function getConfigValue(settingName) {
    return new Promise((resolve, reject) => {
        const query = 'SELECT setting_value FROM config WHERE setting_name = ?';
        db.query(query, [settingName], (err, result) => {
            if (err) {
                reject(err);
            } else if (result.length === 0) {
                reject(new Error('Configuración no encontrada'));
            } else {
                resolve(parseInt(result[0].setting_value, 10)); // Parsear el valor como entero
            }
        });
    });
}

// Endpoint de login
router.post('/login', async (req, res) => {
    try {
        const email = xss(req.body.email); // Sanitizar input
        const password = xss(req.body.password);
        const captchaValue = req.body.captchaValue;
        const ipAddress = req.ip;

        // Obtener valores de configuración desde la base de datos
        const MAX_ATTEMPTS = await getConfigValue('MAX_ATTEMPTS');
        const LOCK_TIME_MINUTES = await getConfigValue('LOCK_TIME_MINUTES');

        // Verificar el límite de IP con el rate limiter
        try {
            await rateLimiter.consume(ipAddress);
        } catch {
            logger.error(`Demasiados intentos desde la IP: ${ipAddress}`);
            return res.status(429).json({ message: 'Demasiados intentos. Inténtalo más tarde.' });
        }

        if (!captchaValue) {
            logger.warn(`Captcha no completado en la IP: ${ipAddress}`);
            return res.status(400).json({ message: 'Captcha no completado.' });
        }

        try {
            // Verificar CAPTCHA
            const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=6Lc74mAqAAAAAKQ5XihKY-vB3oqpf6uYgEWy4A1k&response=${captchaValue}`;
            const captchaResponse = await axios.post(verifyUrl);

            if (!captchaResponse.data.success) {
                logger.warn(`Captcha inválido en la IP: ${ipAddress}`);
                return res.status(400).json({ message: 'Captcha inválido.' });
            }

            if (!email || !password) {
                return res.status(400).json({ message: 'Proporciona correo y contraseña.' });
            }

            // Verificar si es administrador o paciente
            const checkAdminSql = 'SELECT * FROM administradores WHERE email = ?';
            db.query(checkAdminSql, [email], async (err, resultAdmin) => {
                if (err) {
                    logger.error(`Error al verificar correo: ${err.message}`);
                    return res.status(500).json({ message: 'Error al verificar correo.' });
                }

                if (resultAdmin.length > 0) {
                    const administrador = resultAdmin[0];
                    return autenticarUsuario(administrador, ipAddress, password, 'administrador', res, MAX_ATTEMPTS, LOCK_TIME_MINUTES);
                }

                const checkUserSql = 'SELECT * FROM pacientes WHERE email = ?';
                db.query(checkUserSql, [email], async (err, resultPaciente) => {
                    if (err) {
                        logger.error(`Error al verificar correo del paciente: ${err.message}`);
                        return res.status(500).json({ message: 'Error al verificar correo.' });
                    }

                    if (resultPaciente.length === 0) {
                        return res.status(404).json({ message: 'Correo no registrado.' });
                    }

                    const paciente = resultPaciente[0];
                    return autenticarUsuario(paciente, ipAddress, password, 'paciente', res, MAX_ATTEMPTS, LOCK_TIME_MINUTES);
                });
            });
        } catch (error) {
            logger.error(`Error en verificación del captcha: ${error.message}`);
            return res.status(500).json({ message: 'Error en la autenticación.' });
        }
    } catch (error) {
        logger.error(`Error en /login: ${error.message}`);
        res.status(500).json({ message: 'Error del servidor.' });
    }
});

// Función para autenticar usuarios
async function autenticarUsuario(usuario, ipAddress, password, tipoUsuario, res, MAX_ATTEMPTS, LOCK_TIME_MINUTES) {
    const checkAttemptsSql = `
        SELECT * FROM login_attempts
        WHERE ${tipoUsuario === 'administrador' ? 'administrador_id' : 'paciente_id'} = ? AND ip_address = ?
        ORDER BY fecha_hora DESC LIMIT 1
    `;
    db.query(checkAttemptsSql, [usuario.id, ipAddress], async (err, attemptsResult) => {
        if (err) {
            return res.status(500).json({ message: 'Error al verificar intentos fallidos.' });
        }

        const now = new Date();
        const lastAttempt = attemptsResult[0];

        // Verificar si está bloqueado
        if (lastAttempt && lastAttempt.fecha_bloqueo) {
            const fechaBloqueo = new Date(lastAttempt.fecha_bloqueo);
            if (now < fechaBloqueo) {
                return res.status(429).json({
                    message: `Cuenta bloqueada hasta ${fechaBloqueo.toLocaleString()}.`,
                    lockStatus: true,
                    lockUntil: fechaBloqueo,
                });
            }
        }

        // Verificar la contraseña
        const isMatch = await bcrypt.compare(password, usuario.password);
        if (!isMatch) {
            const failedAttempts = lastAttempt ? lastAttempt.intentos_fallidos + 1 : 1;

            let newFechaBloqueo = null;
            if (failedAttempts >= MAX_ATTEMPTS) {
                const bloqueo = new Date(now.getTime() + LOCK_TIME_MINUTES * 60 * 1000);
                newFechaBloqueo = bloqueo.toISOString();
            }

            // Insertar o actualizar el intento fallido
            const attemptSql = lastAttempt
                ? `UPDATE login_attempts SET intentos_fallidos = ?, fecha_bloqueo = ?, fecha_hora = ? WHERE ${tipoUsuario === 'administrador' ? 'administrador_id' : 'paciente_id'} = ? AND ip_address = ?`
                : `INSERT INTO login_attempts (${tipoUsuario === 'administrador' ? 'administrador_id' : 'paciente_id'}, ip_address, exitoso, intentos_fallidos, fecha_bloqueo, fecha_hora) VALUES (?, ?, 0, ?, ?, ?)`;

            const params = lastAttempt
                ? [failedAttempts, newFechaBloqueo, now.toISOString(), usuario.id, ipAddress]
                : [usuario.id, ipAddress, failedAttempts, newFechaBloqueo, now.toISOString()];

            db.query(attemptSql, params, (err) => {
                if (err) {
                    return res.status(500).json({ message: 'Error al registrar intento fallido.' });
                }
            });

            if (failedAttempts >= MAX_ATTEMPTS) {
                return res.status(429).json({
                    message: `Cuenta bloqueada hasta ${newFechaBloqueo}.`,
                    lockStatus: true,
                    lockUntil: newFechaBloqueo,
                });
            }

            return res.status(401).json({
                message: 'Contraseña incorrecta.',
                failedAttempts,
                lockUntil: newFechaBloqueo,
            });
        }

        // Login exitoso, limpiar intentos fallidos
        const sessionToken = generateToken();
        const updateTokenSql = `UPDATE ${tipoUsuario === 'administrador' ? 'administradores' : 'pacientes'} SET cookie = ? WHERE id = ?`;
        db.query(updateTokenSql, [sessionToken, usuario.id], (err) => {
            if (err) return res.status(500).json({ message: 'Error en el servidor.' });

            res.cookie('cookie', sessionToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'Lax',
                maxAge: 2 * 60 * 60 * 1000,
            });
            
            const clearAttemptsSql = `
                DELETE FROM login_attempts WHERE ${tipoUsuario === 'administrador' ? 'administrador_id' : 'paciente_id'} = ? AND ip_address = ?
            `;
            db.query(clearAttemptsSql, [usuario.id, ipAddress], (err) => {
                if (err) {
                    return res.status(500).json({ message: 'Error al limpiar intentos fallidos.' });
                }

                return res.status(200).json({
                    message: 'Inicio de sesión exitoso',
                    user: { nombre: usuario.nombre, email: usuario.email, tipo: tipoUsuario },
                });
            });
        });
    });
}

// **Nuevo Endpoint: Verificar Autenticación**
router.get('/checkAuth', (req, res) => {
    const sessionToken = req.cookies.cookie;

    if (!sessionToken) {
        return res.status(401).json({ message: 'No autorizado. Inicia sesión nuevamente.' });
    }

    const query = `
        SELECT id, nombre, email, 'administrador' AS tipo FROM administradores WHERE cookie = ? 
        UNION 
        SELECT id, nombre, email, 'paciente' AS tipo FROM pacientes WHERE cookie = ?
    `;

    db.query(query, [sessionToken, sessionToken], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Error al verificar sesión.' });
        }

        if (results.length === 0) {
            return res.status(401).json({ message: 'No autorizado. Inicia sesión nuevamente.' });
        }

        return res.status(200).json({
            message: 'Sesión válida.',
            user: results[0], // Información del usuario autenticado
        });
    });
});

// **Endpoint de logout**
router.post('/logout', (req, res) => {
    const sessionToken = req.cookies.cookie;

    if (!sessionToken) {
        return res.status(400).json({ message: 'Sesión no activa o ya cerrada.' });
    }

    res.clearCookie('cookie', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Lax',
    });

    const query = `
        UPDATE pacientes SET cookie = NULL WHERE cookie = ?;
        UPDATE administradores SET cookie = NULL WHERE cookie = ?;
    `;
    db.query(query, [sessionToken, sessionToken], (err) => {
        if (err) {
            return res.status(500).json({ message: 'Error al cerrar sesión.' });
        }
        return res.status(200).json({ message: 'Sesión cerrada exitosamente' });
    });
});

module.exports = router;
