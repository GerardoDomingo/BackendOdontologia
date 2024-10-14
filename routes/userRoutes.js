const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../db');
const axios = require('axios');

router.post('/login', async (req, res) => {
    const { email, password, captchaValue } = req.body;

    console.log('Captcha Value received in backend:', captchaValue); 

    if (!captchaValue) {
        return res.status(400).json({ message: 'Captcha no completado.' });
    }

    try {
        const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=6Lc74mAqAAAAAKQ5XihKY-vB3aopf6uYgEWy4A1k&response=${captchaValue}`;
        const captchaResponse = await axios.post(verifyUrl);

        console.log('Respuesta del captcha de Google:', captchaResponse.data);

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

            const isMatch = await bcrypt.compare(password, paciente.password);
            if (!isMatch) {
                return res.status(401).json({ message: 'Contraseña incorrecta.' });
            }

            return res.status(200).json({ message: 'Inicio de sesión exitoso', user: { nombre: paciente.nombre, email: paciente.email } });
        });

    } catch (error) {
        console.error('Error en la verificación del captcha o en la autenticación:', error);
        return res.status(500).json({ message: 'Error en la verificación del captcha o en la autenticación.' });
    }
});

module.exports = router;
