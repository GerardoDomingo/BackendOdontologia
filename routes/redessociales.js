const express = require('express');
const db = require('../db'); // Ruta correcta a tu archivo de configuración de base de datos
const router = express.Router();

// Endpoint para obtener las redes sociales de una empresa
router.get('/:id_empresa', (req, res) => {
    const { id_empresa } = req.params;

    const query = `SELECT * FROM redes_sociales WHERE id_empresa = ?`;
    db.query(query, [id_empresa], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error en el servidor al obtener redes sociales');
        }
        res.status(200).json(results);
    });
});

// Endpoint para agregar una nueva red social
router.post('/nuevo', (req, res) => {
    const { id_empresa, nombre_red, url } = req.body;

    if (!id_empresa || !nombre_red || !url) {
        return res.status(400).send('Todos los campos son obligatorios');
    }

    const query = `INSERT INTO redes_sociales (id_empresa, nombre_red, url) VALUES (?, ?, ?)`;
    db.query(query, [id_empresa, nombre_red, url], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error en el servidor al agregar red social');
        }
        res.status(201).send('Red social agregada con éxito');
    });
});

// Endpoint para editar una red social
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { nombre_red, url } = req.body;

    if (!nombre_red || !url) {
        return res.status(400).send('Todos los campos son obligatorios');
    }

    const query = `UPDATE redes_sociales SET nombre_red = ?, url = ? WHERE id = ?`;
    db.query(query, [nombre_red, url, id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error en el servidor al actualizar red social');
        }
        if (result.affectedRows === 0) {
            return res.status(404).send('Red social no encontrada');
        }
        res.status(200).send('Red social actualizada con éxito');
    });
});

// Endpoint para eliminar una red social
router.delete('/:id', (req, res) => {
    const { id } = req.params;

    const query = `DELETE FROM redes_sociales WHERE id = ?`;
    db.query(query, [id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error en el servidor al eliminar red social');
        }
        if (result.affectedRows === 0) {
            return res.status(404).send('Red social no encontrada');
        }
        res.status(200).send('Red social eliminada con éxito');
    });
});

module.exports = router;
