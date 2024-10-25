const express = require('express');
const db = require('../db'); // Asegúrate de que la ruta a tu conexión de base de datos sea correcta
const router = express.Router();

// Ruta para insertar una nueva política de privacidad
router.post('/insert', async (req, res) => {
    const { numero_politica, titulo, contenido } = req.body;

    if (!titulo || !contenido) {
        return res.status(400).send('Título y contenido son obligatorios.');
    }

    try {
        // Obtener la versión máxima existente para la política
        const maxPolicyQuery = `
            SELECT MAX(CAST(version AS DECIMAL(5,1))) AS maxVersion
            FROM politicas_privacidad
            WHERE numero_politica = ?
        `;
        const [result] = await db.query(maxPolicyQuery, [numero_politica]);
        const maxVersion = result[0].maxVersion;

        // Definir la nueva versión como 1.0 si no existen versiones anteriores, o la siguiente entera si existen
        const newVersion = maxVersion ? (Math.floor(maxVersion) + 1).toString() : "1.0";

        // Desactivar todas las políticas previas de este número de política
        await db.query(`UPDATE politicas_privacidad SET estado = 'inactivo' WHERE numero_politica = ?`, [numero_politica]);

        // Insertar la nueva política con la versión y estado activos
        const insertQuery = `
            INSERT INTO politicas_privacidad (numero_politica, titulo, contenido, estado, version, fecha_creacion)
            VALUES (?, ?, ?, 'activo', ?, NOW())
        `;
        await db.query(insertQuery, [numero_politica, titulo, contenido, newVersion]);

        res.status(200).send('Política insertada con éxito.');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al insertar la política.');
    }
});

// Ruta para actualizar una política existente
router.put('/update/:id', async (req, res) => {
    const { id } = req.params;
    const { numero_politica, titulo, contenido } = req.body;

    if (!titulo || !contenido || !numero_politica) {
        return res.status(400).send('Número de política, título y contenido son obligatorios.');
    }

    try {
        // Obtener la versión actual de la política a actualizar
        const getPolicyQuery = `SELECT version FROM politicas_privacidad WHERE id = ?`;
        const [policy] = await db.query(getPolicyQuery, [id]);

        if (policy.length === 0) {
            return res.status(404).send('Política no encontrada.');
        }

        const currentVersion = parseFloat(policy[0].version);

        // Desactivar la versión actual
        await db.query(`UPDATE politicas_privacidad SET estado = 'inactivo' WHERE id = ?`, [id]);

        // Nueva versión aumentada en 0.1
        const newVersion = (currentVersion + 0.1).toFixed(1);

        // Insertar nueva política con versión incrementada y estado activo
        const insertQuery = `
            INSERT INTO politicas_privacidad (numero_politica, titulo, contenido, estado, version, fecha_creacion)
            VALUES (?, ?, ?, 'activo', ?, NOW())
        `;
        await db.query(insertQuery, [numero_politica, titulo, contenido, newVersion]);

        res.status(200).send('Política actualizada correctamente.');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al actualizar la política.');
    }
});

// Ruta para eliminar lógicamente una política de privacidad
router.put('/deactivate/:id', (req, res) => {
    const { id } = req.params;

    const query = 'UPDATE politicas_privacidad SET estado = ? WHERE id = ?';

    db.query(query, ['inactivo', id], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).send('Error en el servidor');
        }
        res.status(200).send('Política de privacidad eliminada (lógicamente) con éxito');
    });
});

// Ruta para obtener todas las políticas de privacidad activas
router.get('/getpolitica', (req, res) => {
    const query = 'SELECT * FROM politicas_privacidad WHERE estado = "activo" ORDER BY numero_politica';

    db.query(query, (err, results) => {
        if (err) {
            console.log(err);
            return res.status(500).send('Error en el servidor');
        }
        res.status(200).json(results);
    });
});

// Ruta para obtener todas las políticas (activas e inactivas)
router.get('/getAllPoliticas', (req, res) => {
    const query = 'SELECT * FROM politicas_privacidad ORDER BY numero_politica, CAST(version AS DECIMAL(5,1)) ASC';

    db.query(query, (err, results) => {
        if (err) {
            console.log(err);
            return res.status(500).send('Error en el servidor');
        }
        res.status(200).json(results);
    });
});

module.exports = router;
