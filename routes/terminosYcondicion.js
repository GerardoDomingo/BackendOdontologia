const express = require('express');
const db = require('../db'); // Asegúrate de que la ruta a tu conexión de base de datos sea correcta
const router = express.Router();

// Ruta para insertar un nuevo término y condición
router.post('/insert', (req, res) => {
    const { numero_termino, titulo, contenido } = req.body;

    const query = `INSERT INTO terminos_condiciones (numero_termino, titulo, contenido) VALUES (?, ?, ?)`;

    db.query(query, [numero_termino, titulo, contenido], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).send('Error en el servidor');
        }
        res.status(200).send('Término y condición insertado con éxito');
    });
});

// Ruta para actualizar un término y condición
router.put('/update/:id', (req, res) => {
    const { id } = req.params;
    const { numero_termino, titulo, contenido } = req.body;

    const query = `UPDATE terminos_condiciones SET numero_termino = ?, titulo = ?, contenido = ? WHERE id = ?`;

    db.query(query, [numero_termino, titulo, contenido, id], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).send('Error en el servidor');
        }
        res.status(200).send('Término y condición actualizado con éxito');
    });
});

// Ruta para eliminar un término y condición
router.delete('/delete/:id', (req, res) => {
    const { id } = req.params;

    const query = `DELETE FROM terminos_condiciones WHERE id = ?`;

    db.query(query, [id], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).send('Error en el servidor');
        }
        res.status(200).send('Término y condición eliminado con éxito');
    });
});

// Ruta para obtener todos los términos y condiciones
router.get('/getterminos', (req, res) => {
    const query = `SELECT * FROM terminos_condiciones ORDER BY numero_termino`;

    db.query(query, (err, results) => {
        if (err) {
            console.log(err);
            return res.status(500).send('Error en el servidor');
        }
        res.status(200).json(results);
    });
});

module.exports = router;
