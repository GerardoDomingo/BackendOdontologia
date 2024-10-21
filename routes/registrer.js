const express = require('express');
const db = require('../db');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const router = express.Router();

// Configuración de nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'emma041117@gmail.com',
        pass: 'zgjb boek cqbg mphx',
    },
});

// Ruta para registrar un nuevo usuario
router.post('/register', async (req, res) => {
    const { nombre, aPaterno, aMaterno, edad, genero, lugar, telefono, email, alergias, password } = req.body;

    if (!nombre || !aPaterno || !aMaterno || !edad || !genero || !lugar || !telefono || !email || !password) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    try {
        const checkUserSql = 'SELECT * FROM pacientes WHERE email = ?';
        db.query(checkUserSql, [email], async (err, result) => {
            if (err) {
                return res.status(500).json({ message: 'Error al verificar el correo electrónico' });
            }

            if (result.length > 0) {
                const paciente = result[0];
                if (paciente.registro_completo === 1) {
                    // Si el registro ya está completo
                    return res.status(400).json({ message: 'El correo electrónico ya está registrado y el registro está completo.' });
                } else {
                    // Si el correo ya existe pero no ha completado el registro
                    // Completa los datos faltantes
                    const updateSql = `UPDATE pacientes SET nombre = ?, aPaterno = ?, aMaterno = ?, edad = ?, genero = ?, lugar = ?, telefono = ?, alergias = ?, password = ?, registro_completo = 1 WHERE email = ?`;
                    const hashedPassword = await bcrypt.hash(password, 10);

                    db.query(updateSql, [nombre, aPaterno, aMaterno, edad, genero, lugar, telefono, alergias, hashedPassword, email], (err, result) => {
                        if (err) {
                            return res.status(500).json({ message: 'Error al completar el registro.' });
                        }
                        return res.status(200).json({ message: 'Registro completado correctamente.' });
                    });
                }
            } else {
                // Nuevo registro
                const saltRounds = 10;
                const hashedPassword = await bcrypt.hash(password, saltRounds);

                const insertSql = `INSERT INTO pacientes (nombre, aPaterno, aMaterno, edad, genero, lugar, telefono, email, alergias, password, registro_completo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`;
                db.query(insertSql, [nombre, aPaterno, aMaterno, edad, genero, lugar, telefono, email, alergias, hashedPassword], (err, result) => {
                    if (err) {
                        return res.status(500).json({ message: 'Error al registrar el paciente.' });
                    }
                    return res.status(201).json({ message: 'Paciente registrado correctamente.' });
                });
            }
        });
    } catch (error) {
        return res.status(500).json({ message: 'Error en el registro' });
    }
});

// Genera un token con formato de 12 caracteres, separados en grupos de 3 por guiones
const generateToken = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 12; i++) {
        token += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return `${token.slice(0, 3)}-${token.slice(3, 6)}-${token.slice(6, 9)}-${token.slice(9)}`;
};

// Endpoint para solicitar la recuperación de contraseña
router.post('/recuperacion', async (req, res) => {
    const { email } = req.body;

    try {
        // Verificar si el correo existe en la base de datos
        const checkUserSql = 'SELECT * FROM pacientes WHERE email = ?';
        db.query(checkUserSql, [email], (err, result) => {
            if (err) {
                return res.status(500).json({ message: 'Error al verificar el correo electrónico.' });
            }

            if (result.length === 0) {
                return res.status(404).json({ message: 'No existe una cuenta con este correo electrónico.' });
            }

            // Generar un token de recuperación utilizando el campo `token_verificacion`
            const token = generateToken();
            const tokenExpiration = new Date(Date.now() + 900000); // Expira en 15 minutos

            // Actualizar la base de datos con el token de verificación y la expiración
            const updateTokenSql = 'UPDATE pacientes SET token_verificacion = ?, token_expiracion = ? WHERE email = ?';
            db.query(updateTokenSql, [token, tokenExpiration, email], (err, result) => {
                if (err) {
                    return res.status(500).json({ message: 'Error al generar el token de recuperación.' });
                }

                // Formatear el contenido HTML del correo de recuperación de contraseña
                const mailOptions = {
                    from: 'e_gr@hotmail.com',
                    to: email,
                    subject: 'Recuperación de Contraseña - Odontología Carol',
                    html: `
                        <div style="font-family: Arial, sans-serif; color: #333;">
                            <div style="text-align: center; padding: 20px;">
                                <h1 style="color: #1976d2;">Odontología Carol</h1>
                                <p>¡Hola!</p>
                                <p>Hemos recibido una solicitud para restablecer tu contraseña en <b>Odontología Carol</b>.</p>
                                <p>Si no realizaste esta solicitud, puedes ignorar este correo. De lo contrario, utiliza el siguiente código para restablecer tu contraseña:</p>
                                <div style="padding: 10px; background-color: #f0f0f0; border-radius: 5px; display: inline-block; margin: 20px 0;">
                                    <span style="font-size: 24px; font-weight: bold; color: #1976d2;">${token}</span>
                                </div>
                                <p style="color: #d32f2f; font-weight: bold; font-size: 18px;">El token debe ser copiado tal y como está, respetando mayúsculas, minúsculas y guiones.</p>
                                <p><b>Nota:</b> Este código caduca en 15 minutos.</p>
                                <hr style="margin: 20px 0;">
                                <footer>
                                    <p>Odontología Carol - Cuidando de tu salud bucal</p>
                                    <p>Este es un correo generado automáticamente, por favor no respondas a este mensaje.</p>
                                </footer>
                            </div>
                        </div>
                        `,
                };


                transporter.sendMail(mailOptions, (err, info) => {
                    if (err) {
                        return res.status(500).json({ message: 'Error al enviar el correo de recuperación.' });
                    }
                    res.status(200).json({ message: 'Se ha enviado un enlace de recuperación a tu correo.' });
                });
            });
        });
    } catch (error) {
        console.error('Error en la recuperación de contraseña:', error);
        res.status(500).json({ message: 'Error en el servidor. Inténtalo de nuevo más tarde.' });
    }
});

// Endpoint para verificar el token de recuperación
router.post('/verifyTokene', async (req, res) => {
    const { token, email } = req.body;

    try {
        // Verificar si el token y el email coinciden en la base de datos
        const verifyTokenSql = 'SELECT * FROM pacientes WHERE email = ? AND token_verificacion = ?';
        db.query(verifyTokenSql, [email, token], (err, result) => {
            if (err) {
                return res.status(500).json({ message: 'Error al verificar el token.' });
            }

            // Si no se encuentra el token o ha expirado
            if (result.length === 0 || new Date() > new Date(result[0].token_expiracion)) {
                return res.status(400).json({ message: 'Token no válido o ha expirado.' });
            }

            // El token es válido y no ha expirado, pero no lo eliminamos todavía
            res.status(200).json({ message: 'Token verificado correctamente.' });
        });
    } catch (error) {
        console.error('Error en la verificación del token:', error);
        res.status(500).json({ message: 'Error en el servidor. Inténtalo de nuevo más tarde.' });
    }
});

// Endpoint para cambiar la contraseña
router.post('/resetPassword', async (req, res) => {
    const { token, newPassword } = req.body;

    console.log("Token recibido:", token);
    console.log("Nueva contraseña recibida:", newPassword);

    try {
        // Verificar si el token es válido
        const verifyTokenSql = 'SELECT * FROM pacientes WHERE token_verificacion = ?';
        db.query(verifyTokenSql, [token], async (err, result) => {
            if (err) {
                console.error("Error al verificar el token:", err);
                return res.status(500).json({ message: 'Error al verificar el token.' });
            }

            if (result.length === 0) {
                console.error("Token no encontrado en la base de datos.");
                return res.status(400).json({ message: 'Token no válido.' });
            }

            console.log("Token encontrado, verificando expiración...");

            if (new Date() > new Date(result[0].token_expiracion)) {
                console.error("El token ha expirado.");
                return res.status(400).json({ message: 'Token ha expirado.' });
            }

            console.log("Token válido y no ha expirado, actualizando la contraseña...");

            // Encriptar la nueva contraseña
            const hashedPassword = await bcrypt.hash(newPassword, 10);

            // Actualizar la contraseña y limpiar el token
            const updatePasswordSql = 'UPDATE pacientes SET password = ?, token_verificacion = NULL, token_expiracion = NULL WHERE token_verificacion = ?';
            db.query(updatePasswordSql, [hashedPassword, token], (err, result) => {
                if (err) {
                    console.error("Error al actualizar la contraseña:", err);
                    return res.status(500).json({ message: 'Error al actualizar la contraseña.' });
                }
                console.log("Contraseña actualizada correctamente.");
                res.status(200).json({ message: 'Contraseña actualizada correctamente.' });
            });
        });
    } catch (error) {
        console.error('Error al cambiar la contraseña:', error);
        res.status(500).json({ message: 'Error en el servidor. Inténtalo de nuevo más tarde.' });
    }
});

// Ruta para enviar correo de verificación
router.post('/send-verification-email', (req, res) => {
    const { email } = req.body;

    const checkUserSql = 'SELECT * FROM pacientes WHERE email = ?';
    db.query(checkUserSql, [email], (err, result) => {
        if (err) {
            return res.status(500).json({ message: 'Error al verificar el correo electrónico.' });
        }

        if (result.length > 0 && result[0].verificado === 1) {
            return res.status(400).json({ message: 'El correo electrónico ya está registrado.' });
        }

        if (result.length > 0) {
            return res.status(400).json({ message: 'El correo electrónico ya está registrado.' });
        }
        // Generar token
        const verificationToken = generateToken();

        const tokenExpiration = new Date(Date.now() + 900000); // Expira en 15 minutos

        const sql = `
            INSERT INTO pacientes (email, token_verificacion, token_expiracion, verificado)
            VALUES (?, ?, ?, 0)
        `;
        db.query(sql, [email, verificationToken, tokenExpiration], async (err, result) => {
            if (err) {
                return res.status(500).json({ message: 'Error al generar el token de verificación.' });
            }

            const verificationLink = `https://backendodontologia.onrender.com/api/verify-email?token=${verificationToken}&email=${encodeURIComponent(email)}`;

            // Formatear el contenido HTML del correo
            const mailOptions = {
                from: 'e_gr@hotmail.com',
                to: email,
                subject: 'Verificación de Correo - Odontología Carol',
                html: `
                <div style="font-family: Arial, sans-serif; color: #333;">
                    <div style="text-align: center; padding: 20px;">
                        <h1 style="color: #1976d2;">Odontología Carol</h1>
                        <p>¡Hola!</p>
                        <p>Gracias por registrarte en <b>Odontología Carol</b>. Para completar tu registro, por favor verifica tu correo electrónico utilizando el siguiente código:</p>
                        <div style="padding: 10px; background-color: #f0f0f0; border-radius: 5px; display: inline-block; margin: 20px 0;">
                            <span style="font-size: 24px; font-weight: bold; color: #1976d2;">${verificationToken}</span>
                        </div>
                        <p>Ingresa este código en la página de verificación de tu cuenta.</p>
                        <p style="color: #d32f2f; font-weight: bold; font-size: 18px;">El token debe ser copiado tal y como está, respetando mayúsculas, minúsculas y guiones.</p>
                        <p><b>Nota:</b> Este código caduca en 15 minutos.</p>
                        <hr style="margin: 20px 0;">
                        <footer>
                            <p>Odontología Carol - Cuidando de tu salud bucal</p>
                            <p>Este es un correo generado automáticamente, por favor no respondas a este mensaje.</p>
                        </footer>
                    </div>
                </div>
                `,
            };

            try {
                await transporter.sendMail(mailOptions);
                res.status(200).json({ message: 'Correo de verificación enviado.' });
            } catch (mailError) {
                return res.status(500).json({ message: 'Error al enviar el correo de verificación.' });
            }
        });
    });
});

// Nueva ruta para verificar el token de forma manual
router.post('/verify-token', (req, res) => {
    const { token, email } = req.body;

    // Consulta para verificar el token y el email
    const verifySql = 'SELECT * FROM pacientes WHERE email = ? AND token_verificacion = ?';
    db.query(verifySql, [email, token], (err, result) => {
        if (err) {
            console.error('Error en la consulta de verificación del token:', err);  // Mostrar el error en la consola
            return res.status(500).json({ message: 'Error en el servidor al verificar el token.' });
        }

        if (result.length === 0) {
            // Caso donde el token es incorrecto o no coincide con el email
            return res.status(400).json({ message: 'Token incorrecto. Por favor verifica el token.' });
        }

        const tokenExpiration = new Date(result[0].token_expiracion);
        if (new Date() > tokenExpiration) {
            // Caso donde el token ha expirado
            return res.status(400).json({ message: 'El token ha expirado. Solicita un nuevo token.' });
        }

        // Si todo está correcto, actualizar el estado de verificación del usuario
        const updateSql = 'UPDATE pacientes SET verificado = 1, token_verificacion = NULL, token_expiracion = NULL WHERE email = ?';
        db.query(updateSql, [email], (err, result) => {
            if (err) {
                console.error('Error al actualizar el estado de verificación:', err);
                return res.status(500).json({ message: 'Error al verificar el usuario.' });
            }

            // Respuesta exitosa
            res.status(200).json({ message: 'Correo verificado correctamente. Ya puedes iniciar sesión.' });
        });
    });
});

module.exports = router;
