const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
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

        const checkUserSql = 'SELECT * FROM pacientes WHERE email = ?';
        db.query(checkUserSql, [email], async (err, result) => {
            if (err) {
                return res.status(500).json({ message: 'Error al verificar el correo electrónico.' });
            }

            if (result.length === 0) {
                return res.status(404).json({ message: 'Correo no registrado.' });
            }

            const paciente = result[0];

            // Verificamos si ya existe un registro de intentos fallidos para este paciente y IP
            const checkAttemptsSql = `
                SELECT * FROM login_attempts
                WHERE paciente_id = ? AND ip_address = ?
                ORDER BY fecha_hora DESC LIMIT 1
            `;
            db.query(checkAttemptsSql, [paciente.id, ipAddress], async (err, attemptsResult) => {
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
                        
                        // Actualizamos la fecha de bloqueo en la base de datos
                        const updateLockSql = `
                            UPDATE login_attempts
                            SET fecha_bloqueo = ?
                            WHERE paciente_id = ? AND ip_address = ?
                        `;
                        db.query(updateLockSql, [bloqueadoHasta, paciente.id, ipAddress], (err) => {
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

                const isMatch = await bcrypt.compare(password, paciente.password);

                if (!isMatch) {
                    let newFailedAttempts = lastAttempt ? lastAttempt.intentos_fallidos + 1 : 1;
                    let newFechaBloqueo = null;

                    // Si ha excedido el número máximo de intentos, se establece la fecha de bloqueo
                    if (newFailedAttempts >= MAX_ATTEMPTS) {
                        newFechaBloqueo = new Date(Date.now() + LOCK_TIME_MINUTES * 60 * 1000);
                    }

                    // Si ya hay un registro de intentos, actualizar en lugar de insertar
                    if (lastAttempt) {
                        const updateAttemptSql = `
                            UPDATE login_attempts
                            SET intentos_fallidos = ?, fecha_bloqueo = ?
                            WHERE paciente_id = ? AND ip_address = ?
                        `;
                        db.query(updateAttemptSql, [newFailedAttempts, newFechaBloqueo, paciente.id, ipAddress], (err) => {
                            if (err) {
                                return res.status(500).json({ message: 'Error al actualizar el intento fallido.' });
                            }
                        });
                    } else {
                        // Si no hay un registro previo, insertar uno nuevo
                        const insertAttemptSql = `
                            INSERT INTO login_attempts (paciente_id, ip_address, exitoso, intentos_fallidos, fecha_bloqueo)
                            VALUES (?, ?, 0, ?, ?)
                        `;
                        db.query(insertAttemptSql, [paciente.id, ipAddress, newFailedAttempts, newFechaBloqueo], (err) => {
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

                // Si el login es exitoso, eliminamos los intentos fallidos
                const clearAttemptsSql = `
                    DELETE FROM login_attempts WHERE paciente_id = ? AND ip_address = ?
                `;
                db.query(clearAttemptsSql, [paciente.id, ipAddress], (err) => {
                    if (err) {
                        return res.status(500).json({ message: 'Error al limpiar los intentos fallidos.' });
                    }
                });

                return res.status(200).json({
                    message: 'Inicio de sesión exitoso',
                    user: { nombre: paciente.nombre, email: paciente.email }
                });
            });
        });

    } catch (error) {
        console.error('Error en la verificación del captcha o en la autenticación:', error);
        return res.status(500).json({ message: 'Error en la verificación del captcha o en la autenticación.' });
    }
});

module.exports = router;
