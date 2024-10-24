const express = require('express');
const db = require('../db'); // Ruta correcta a tu archivo de configuración de base de datos
const router = express.Router();

// Función para validar URL (simplificada sin validación de WhatsApp)
function validateUrl(url) {
    const urlPattern = new RegExp(
        '^(https?:\\/\\/)?' + // Protocolo
        '((([a-zA-Z0-9$_.+!*\'(),;?&=-]|%[0-9a-fA-F]{2})+(:([a-zA-Z0-9$_.+!*\'(),;?&=-]|%[0-9a-fA-F]{2})+)?@)?' + // Usuario:Contraseña
        '((\\[(|([0-9A-Fa-f]{1,4}:){0,5}([0-9A-Fa-f]{1,4})?\\]))|' + // IPv6 (opcional)
        '(([a-zA-Z0-9_.~%+-]+)+)?([a-zA-Z]{2,})(:\\d+)?' + // Dominio e IP
        '(\\/[-a-zA-Z0-9@:%._\\+~#=]*)*' + // Ruta
        '(\\?([;&a-zA-Z0-9$_.+!*\'(),;=:@%#?&=-]+)?)?' + // Parámetros opcionales
        '(#[-a-zA-Z0-9@:%._\\+~#=]*)?$' // Fragmentos opcionales
    );
    return urlPattern.test(url);
}

// Endpoint para obtener todas las redes sociales
router.get('/get', (req, res) => {
    const query = `SELECT * FROM redes_sociales ORDER BY fecha_creacion DESC`;
    db.query(query, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error en el servidor al obtener redes sociales');
        }
        res.status(200).json(results);
    });
});

// Endpoint para agregar una nueva red social
router.post('/nuevo', (req, res) => {
    const { nombre_red, url } = req.body;

    if (!nombre_red || !url || !validateUrl(url)) {
        return res.status(400).send('Todos los campos son obligatorios y el URL debe ser válido');
    }

    const query = `INSERT INTO redes_sociales (nombre_red, url) VALUES (?, ?)`;
    db.query(query, [nombre_red, url], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error en el servidor al agregar red social');
        }
        res.status(201).send('Red social agregada con éxito');
    });
});

// Endpoint para editar una red social
router.put('/editar/:id', (req, res) => {
    const { id } = req.params;
    const { nombre_red, url } = req.body;

    if (!nombre_red || !url || !validateUrl(url)) {
        return res.status(400).send('Todos los campos son obligatorios y el URL debe ser válido');
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
router.delete('/eliminar/:id', (req, res) => {
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
