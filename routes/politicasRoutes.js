const express = require('express');
const db = require('../db'); // Asegúrate de que la ruta a tu conexión de base de datos sea correcta
const router = express.Router();

// Ruta para insertar una nueva política de privacidad (siempre versión 1)
router.post('/insert', (req, res) => {
    const { numero_politica, titulo, contenido } = req.body;

    const query = 'INSERT INTO politicas_privacidad (numero_politica, titulo, contenido, estado, version) VALUES (?, ?, ?, ?, ?)';

    db.query(query, [numero_politica, titulo, contenido, 'activo', '1'], (err, result) => {
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

    // Primero obtenemos la última versión de esta política para calcular la nueva versión
    const selectQuery = 'SELECT version FROM politicas_privacidad WHERE numero_politica = ? ORDER BY CAST(version AS DECIMAL(10,2)) DESC LIMIT 1';
    db.query(selectQuery, [numero_politica], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).send('Error al obtener la versión actual');
        }

        const currentVersion = result[0].version;
        const versionParts = currentVersion.split('.'); // Dividimos la versión en partes
        let newVersion;

        if (versionParts.length === 1) {
            // Si es una versión entera (1), la siguiente será 1.1
            newVersion = `${versionParts[0]}.1`;
        } else {
            // Si es una versión decimal (1.1), incrementamos la parte decimal
            const majorVersion = versionParts[0];
            const minorVersion = parseInt(versionParts[1]) + 1;
            newVersion = `${majorVersion}.${minorVersion}`;
        }

        const updateQuery = 'UPDATE politicas_privacidad SET numero_politica = ?, titulo = ?, contenido = ?, version = ?, estado = ? WHERE id = ?';
        
        // Desactivamos la política anterior
        db.query(updateQuery, [numero_politica, titulo, contenido, newVersion, 'activo', id], (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).send('Error al actualizar la política');
            }
            res.status(200).send(`Política actualizada a la versión ${newVersion}`);
        });
    });
});

// Ruta para eliminar (lógicamente) una política de privacidad
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
    const query = 'SELECT * FROM politicas_privacidad ORDER BY numero_politica';

    db.query(query, (err, results) => {
        if (err) {
            console.log(err);
            return res.status(500).send('Error en el servidor');
        }
        res.status(200).json(results);
    });
});

module.exports = router;
