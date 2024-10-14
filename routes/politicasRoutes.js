const express = require('express');
const db = require('../db'); // Asegúrate de que la ruta a tu conexión de base de datos sea correcta
const router = express.Router();

// Ruta para insertar un nuevo perfil de empresa
router.post('/insert', (req, res) => {
    const { nombre_empresa, direccion, telefono, correo_electronico, descripcion, logo } = req.body;

    const query = `INSERT INTO perfil_empresa (nombre_empresa, direccion, telefono, correo_electronico, descripcion, logo) VALUES (?, ?, ?, ?, ?, ?)`;

    db.query(query, [nombre_empresa, direccion, telefono, correo_electronico, descripcion, logo], (err, result) => {
        if (err) {
            console.error('Error al ejecutar la consulta:', err); // Agrega este log
            return res.status(500).send('Error en el servidor');
        }
        res.status(200).send('Perfil de empresa insertado con éxito');
    });
});

module.exports = router;