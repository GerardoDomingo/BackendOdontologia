const express = require('express');
const db = require('../db');
const bcrypt = require('bcrypt');
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
        // Generar un token que contenga letras mayúsculas, minúsculas y números
        // Generar token que incluya letras mayúsculas, minúsculas y números
        const generateToken = (length = 9) => {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            let token = '';
            for (let i = 0; i < length; i++) {
                token += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return `${token.slice(0, 3)}-${token.slice(3, 6)}-${token.slice(6)}`;
        };

        // Generar token
        const verificationToken = generateToken();

        const tokenExpiration = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

        const sql = `
            INSERT INTO pacientes (email, token_verificacion, token_expiracion, verificado)
            VALUES (?, ?, ?, 0)
        `;
        db.query(sql, [email, verificationToken, tokenExpiration], async (err, result) => {
            if (err) {
                return res.status(500).json({ message: 'Error al generar el token de verificación.' });
            }

            const verificationLink = `http://localhost:3001/api/verify-email?token=${verificationToken}&email=${encodeURIComponent(email)}`;

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
                        <p><b>Nota:</b> Este código caduca en 10 minutos.</p>
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

    const verifySql = 'SELECT * FROM pacientes WHERE email = ? AND token_verificacion = ?';
    db.query(verifySql, [email, token], (err, result) => {
        if (err) {
            return res.status(500).json({ message: 'Error al verificar el token.' });
        }

        if (result.length === 0 || new Date() > new Date(result[0].token_expiracion)) {
            return res.status(400).json({ message: 'Token no válido o ha caducado.' });
        }

        // Actualizar como verificado
        const updateSql = 'UPDATE pacientes SET verificado = 1, token_verificacion = NULL, token_expiracion = NULL WHERE email = ?';
        db.query(updateSql, [email], (err, result) => {
            if (err) {
                return res.status(500).json({ message: 'Error al verificar el usuario.' });
            }

            res.status(200).json({ message: 'Correo verificado correctamente. Ya puedes iniciar sesión.' });
        });
    });
});



module.exports = router;
