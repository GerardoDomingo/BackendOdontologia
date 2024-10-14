const express = require('express');
const db = require('../db'); // Importamos la conexión a la base de datos
const bcrypt = require('bcrypt');
const router = express.Router();

// Ruta para iniciar sesión (login)
router.post('/login', (req, res) => {
    const { email, password } = req.body;
    
    const query = `SELECT * FROM usuarios WHERE email = ?`;
    
    db.query(query, [email], async (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).send('Error en el servidor');
        }

        if (result.length === 0) {
            return res.status(404).send('Usuario no encontrado');
        }
        
        const user = result[0];
        
        // Comparar la contraseña proporcionada con la almacenada
        const passwordMatch = await bcrypt.compare(password, user.password);
        
        if (passwordMatch) {
            res.status(200).send('Inicio de sesión exitoso');
        } else {
            res.status(401).send('Contraseña incorrecta');
        }
    });
});

module.exports = router;

