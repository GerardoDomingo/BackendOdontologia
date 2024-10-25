const express = require('express');
const db = require('../db'); // Asegúrate de que la ruta a tu conexión de base de datos sea correcta
const router = express.Router();

// Ruta para insertar una nueva política de privacidad
router.post('/insert', (req, res) => {
    const { numero_politica, titulo, contenido } = req.body;

    // Verificar la versión más alta actual para asignar una nueva versión
    const selectQuery = 'SELECT MAX(CAST(version AS DECIMAL(5,2))) AS maxVersion FROM politicas_privacidad';

    db.query(selectQuery, (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).send('Error en el servidor al obtener la versión actual');
        }

        // Si no hay versiones, comenzamos con la versión 1.0
        const maxVersion = result[0].maxVersion ? Math.floor(parseFloat(result[0].maxVersion)) + 1 : 1;

        // Insertar la nueva política con la versión calculada (entera)
        const insertQuery = 'INSERT INTO politicas_privacidad (numero_politica, titulo, contenido, estado, version) VALUES (?, ?, ?, ?, ?)';
        db.query(insertQuery, [numero_politica, titulo, contenido, 'activo', maxVersion.toFixed(2)], (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).send('Error en el servidor al insertar nueva política');
            }
            res.status(200).send(`Política de privacidad insertada con éxito, versión ${maxVersion.toFixed(2)}`);
        });
    });
});

// Ruta para actualizar una política de privacidad
router.put('/update/:id', (req, res) => {
    const { numero_politica, titulo, contenido } = req.body;

    // Primero obtenemos la última versión de esta política para calcular la nueva versión
    const selectQuery = 'SELECT MAX(CAST(version AS DECIMAL(5,2))) AS maxVersion FROM politicas_privacidad WHERE numero_politica = ?';

    db.query(selectQuery, [numero_politica], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).send('Error al obtener la versión actual');
        }

        const currentVersion = result[0].maxVersion;
        let newVersion;

        if (currentVersion) {
            // Convertimos la versión a un formato decimal con precisión de dos dígitos
            const versionParts = currentVersion.toFixed(2).split('.');
            const majorVersion = parseInt(versionParts[0], 10); // Parte entera
            let minorVersion = parseInt(versionParts[1], 10);   // Parte decimal

            // Incrementamos solo la parte decimal
            minorVersion += 1;

            // Formateamos la nueva versión con dos dígitos en la parte decimal
            newVersion = `${majorVersion}.${minorVersion.toString().padStart(2, '0')}`;
        } else {
            // Si no hay versiones anteriores, comenzamos con la versión 1.01
            newVersion = '1.01';
        }

        // Desactivar la versión anterior de la política
        const deactivateQuery = 'UPDATE politicas_privacidad SET estado = "inactivo" WHERE numero_politica = ?';
        db.query(deactivateQuery, [numero_politica], (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).send('Error al desactivar la versión anterior');
            }

            // Insertar la nueva política con la versión incrementada (decimal)
            const insertQuery = 'INSERT INTO politicas_privacidad (numero_politica, titulo, contenido, estado, version) VALUES (?, ?, ?, ?, ?)';
            db.query(insertQuery, [numero_politica, titulo, contenido, 'activo', newVersion], (err, result) => {
                if (err) {
                    console.log(err);
                    return res.status(500).send('Error al insertar la nueva versión de la política');
                }
                res.status(200).send(`Política actualizada a la versión ${newVersion}`);
            });
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
    const query = 'SELECT * FROM politicas_privacidad ORDER BY numero_politica, CAST(version AS DECIMAL(5,2)) ASC';

    db.query(query, (err, results) => {
        if (err) {
            console.log(err);
            return res.status(500).send('Error en el servidor');
        }
        res.status(200).json(results);
    });
});

module.exports = router;
