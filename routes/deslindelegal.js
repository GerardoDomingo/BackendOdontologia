const express = require('express');
const db = require('../db'); // Asegúrate de que la ruta a tu conexión de base de datos sea correcta
const router = express.Router();

// Ruta para insertar un nuevo deslinde legal
router.post('/insert', (req, res) => {
    const { numero_deslinde, titulo, contenido } = req.body;

    const query = `INSERT INTO tbldeslinde_legal (numero_deslinde, titulo, contenido) VALUES (?, ?, ?)`;

    db.query(query, [numero_deslinde, titulo, contenido], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).send('Error en el servidor');
        }
        res.status(200).send('Deslinde legal insertado con éxito');
    });
});

// Ruta para actualizar un deslinde legal
router.put('/update/:id', (req, res) => {
    const { id } = req.params;
    const { numero_deslinde, titulo, contenido } = req.body;

    const query = `UPDATE tbldeslinde_legal SET numero_deslinde = ?, titulo = ?, contenido = ? WHERE id = ?`;

    db.query(query, [numero_deslinde, titulo, contenido, id], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).send('Error en el servidor');
        }
        res.status(200).send('Deslinde legal actualizado con éxito');
    });
});

// Ruta para eliminar un deslinde legal
router.delete('/delete/:id', (req, res) => {
    const { id } = req.params;

    const query = `DELETE FROM tbldeslinde_legal WHERE id = ?`;

    db.query(query, [id], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).send('Error en el servidor');
        }
        res.status(200).send('Deslinde legal eliminado con éxito');
    });
});

// Ruta para obtener todos los deslindes legales
router.get('/getdeslinde', (req, res) => {
    const query = `SELECT * FROM tbldeslinde_legal ORDER BY numero_deslinde`;

    db.query(query, (err, results) => {
        if (err) {
            console.log(err);
            return res.status(500).send('Error en el servidor');
        }
        res.status(200).json(results);
    });
});

module.exports = router;
