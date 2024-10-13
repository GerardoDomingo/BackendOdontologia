const express = require('express');
const db = require('../db'); // Asegúrate de que la ruta a tu conexión de base de datos sea correcta
const router = express.Router();

// Ruta para insertar una nueva política de privacidad
router.post('/insert', (req, res) => {
    const { numero_politica, titulo, contenido } = req.body;

    const query = `INSERT INTO politicas_privacidad (numero_politica, titulo, contenido) VALUES (?, ?, ?)`;

    db.query(query, [numero_politica, titulo, contenido], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).send('Error en el servidor');
        }
        res.status(200).send('Política de privacidad insertada con éxito');
    });
});

// Ruta para actualizar una política de privacidad
router.put('/update/:id', (req, res) => {
    const { id } = req.params;
    const { numero_politica, titulo, contenido } = req.body;

    const query = `UPDATE politicas_privacidad SET numero_politica = ?, titulo = ?, contenido = ? WHERE id = ?`;

    db.query(query, [numero_politica, titulo, contenido, id], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).send('Error en el servidor');
        }
        res.status(200).send('Política de privacidad actualizada con éxito');
    });
});

// Ruta para eliminar una política de privacidad
router.delete('/delete/:id', (req, res) => {
    const { id } = req.params;

    const query = `DELETE FROM politicas_privacidad WHERE id = ?`;

    db.query(query, [id], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).send('Error en el servidor');
        }
        res.status(200).send('Política de privacidad eliminada con éxito');
    });
});

// Ruta para obtener todas las políticas de privacidad
router.get('/getpolitica', (req, res) => {
    const query = `SELECT * FROM politicas_privacidad ORDER BY numero_politica`;

    db.query(query, (err, results) => {
        if (err) {
            console.log(err);
            return res.status(500).send('Error en el servidor');
        }
        res.status(200).json(results);
    });
});

module.exports = router;
