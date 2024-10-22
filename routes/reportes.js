const express = require('express');
const router = express.Router();
const db = require('../db');

// Endpoint para obtener intentos de login
router.get('/login-attempts', async (req, res) => {
    const query = 'SELECT * FROM login_attempts';
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error al obtener login attempts' });
        }
        res.status(200).json(results);
    });
});

// Endpoint para obtener logs
router.get('/logs', async (req, res) => {
    const query = 'SELECT * FROM logs';
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error al obtener logs' });
        }
        res.status(200).json(results);
    });
});
// Endpoint para obtener información de un paciente por su ID
router.get('/paciente/:id', (req, res) => {
    const pacienteId = req.params.id;

    const query = 'SELECT * FROM pacientes WHERE id = ?';
    db.query(query, [pacienteId], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error al obtener la información del paciente' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'Paciente no encontrado' });
        }

        res.status(200).json(results[0]); // Retornamos solo la primera coincidencia
    });
});



module.exports = router;
