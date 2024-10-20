const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db');
const axios = require('axios');

const MAX_ATTEMPTS = 5; // Número máximo de intentos fallidos
const LOCK_TIME_MINUTES = 20; // Tiempo de bloqueo en minutos

router.post('/login', async (req, res) => {
    const { email, password, captchaValue } = req.body;
    const ipAddress = req.ip;  // Capturamos la IP del cliente

    if (!captchaValue) {
        return res.status(400).json({ message: 'Captcha no completado.' });
    }

    try {
        const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=6Lc74mAqAAAAAKQ5XihKY-vB3oqpf6uYgEWy4A1k&response=${captchaValue}`;
        const captchaResponse = await axios.post(verifyUrl);

        if (!captchaResponse.data.success) {
            return res.status(400).json({
                message: 'Captcha inválido. Por favor, inténtalo de nuevo.',
                'error-codes': captchaResponse.data['error-codes'] || [],
            });
        }

        if (!email || !password) {
            return res.status(400).json({ message: 'Por favor, proporciona ambos campos: correo electrónico y contraseña.' });
        }

        // Intentamos buscar primero en la tabla de administradores
        const checkAdminSql = 'SELECT * FROM administradores WHERE email = ?';
        db.query(checkAdminSql, [email], async (err, resultAdmin) => {
            if (err) {
                return res.status(500).json({ message: 'Error al verificar el correo electrónico.' });
            }

            if (resultAdmin.length > 0) {
                // Si el usuario es un administrador, procedemos con su autenticación
                const administrador = resultAdmin[0];
                return autenticarUsuario(administrador, ipAddress, password, 'administrador', res);
            }

            // Si no es administrador, intentamos buscar en la tabla de pacientes
            const checkUserSql = 'SELECT * FROM pacientes WHERE email = ?';
            db.query(checkUserSql, [email], async (err, resultPaciente) => {
                if (err) {
                    return res.status(500).json({ message: 'Error al verificar el correo electrónico.' });
                }

                if (resultPaciente.length === 0) {
                    return res.status(404).json({ message: 'Correo no registrado.' });
                }

                const paciente = resultPaciente[0];
                return autenticarUsuario(paciente, ipAddress, password, 'paciente', res);
            });
        });
    } catch (error) {
        console.error('Error en la verificación del captcha o en la autenticación:', error);
        return res.status(500).json({ message: 'Error en la verificación del captcha o en la autenticación.' });
    }
});

async function autenticarUsuario(usuario, ipAddress, password, tipoUsuario, res) {
    const checkAttemptsSql = `
        SELECT * FROM login_attempts
        WHERE ${tipoUsuario}_id = ? AND ip_address = ?
        ORDER BY fecha_hora DESC LIMIT 1
    `;
    db.query(checkAttemptsSql, [usuario.id, ipAddress], async (err, attemptsResult) => {
        if (err) {
            return res.status(500).json({ message: 'Error al verificar los intentos de inicio de sesión.' });
        }

        const lastAttempt = attemptsResult[0];

        // Verificamos si el usuario ya ha sido bloqueado
        if (lastAttempt && lastAttempt.fecha_bloqueo && new Date(lastAttempt.fecha_bloqueo) > new Date()) {
            return res.status(429).json({
                message: `Tu cuenta está bloqueada hasta ${lastAttempt.fecha_bloqueo}. Inténtalo nuevamente después.`,
            });
        }

        // Si el número de intentos es igual o mayor a MAX_ATTEMPTS y no ha pasado el bloqueo
        if (lastAttempt && lastAttempt.intentos_fallidos >= MAX_ATTEMPTS) {
            let bloqueadoHasta = lastAttempt.fecha_bloqueo;
            if (!bloqueadoHasta || new Date(bloqueadoHasta) < new Date()) {
                bloqueadoHasta = new Date(Date.now() + LOCK_TIME_MINUTES * 60 * 1000);

                const updateLockSql = `
                    UPDATE login_attempts
                    SET fecha_bloqueo = ?
                    WHERE ${tipoUsuario}_id = ? AND ip_address = ?
                `;
                db.query(updateLockSql, [bloqueadoHasta, usuario.id, ipAddress], (err) => {
                    if (err) {
                        return res.status(500).json({ message: 'Error al actualizar la fecha de bloqueo.' });
                    }
                });
            }

            return res.status(429).json({
                message: `Has superado el límite de intentos. Tu cuenta está bloqueada hasta ${bloqueadoHasta}.`,
                lockUntil: bloqueadoHasta
            });
        }

        const isMatch = await bcrypt.compare(password, usuario.password);

        if (!isMatch) {
            let newFailedAttempts = lastAttempt ? lastAttempt.intentos_fallidos + 1 : 1;
            let newFechaBloqueo = null;

            if (newFailedAttempts >= MAX_ATTEMPTS) {
                newFechaBloqueo = new Date(Date.now() + LOCK_TIME_MINUTES * 60 * 1000);
            }

            if (lastAttempt) {
                const updateAttemptSql = `
                    UPDATE login_attempts
                    SET intentos_fallidos = ?, fecha_bloqueo = ?
                    WHERE ${tipoUsuario}_id = ? AND ip_address = ?
                `;
                db.query(updateAttemptSql, [newFailedAttempts, newFechaBloqueo, usuario.id, ipAddress], (err) => {
                    if (err) {
                        return res.status(500).json({ message: 'Error al actualizar el intento fallido.' });
                    }
                });
            } else {
                const insertAttemptSql = `
                    INSERT INTO login_attempts (${tipoUsuario}_id, ip_address, exitoso, intentos_fallidos, fecha_bloqueo)
                    VALUES (?, ?, 0, ?, ?)
                `;
                db.query(insertAttemptSql, [usuario.id, ipAddress, newFailedAttempts, newFechaBloqueo], (err) => {
                    if (err) {
                        return res.status(500).json({ message: 'Error al registrar el intento fallido.' });
                    }
                });
            }

            return res.status(401).json({
                message: 'Contraseña incorrecta.',
                failedAttempts: newFailedAttempts,
                lockUntil: newFechaBloqueo || null,
            });
        }

        const clearAttemptsSql = `
            DELETE FROM login_attempts WHERE ${tipoUsuario}_id = ? AND ip_address = ?
        `;
        db.query(clearAttemptsSql, [usuario.id, ipAddress], (err) => {
            if (err) {
                return res.status(500).json({ message: 'Error al limpiar los intentos fallidos.' });
            }
        });

        return res.status(200).json({
            message: 'Inicio de sesión exitoso',
            user: { nombre: usuario.nombre, email: usuario.email, tipo: tipoUsuario }
        });
    });
}


module.exports = router;
