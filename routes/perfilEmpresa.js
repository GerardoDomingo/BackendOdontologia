const express = require('express');
const db = require('../db'); // Ruta correcta a tu archivo de configuración de base de datos
const multer = require('multer');
const router = express.Router();

// Configuración de multer para manejar la subida de archivos en memoria
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 1024 * 1024 * 10 }, // Límite de 10MB para archivos
    fileFilter: (req, file, cb) => {
        // Permitir archivos JPEG, JPG y PNG
        if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg' || file.mimetype === 'image/png') {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten archivos JPEG, JPG y PNG'), false);
        }
    },
});

// Endpoint para insertar el perfil de empresa
router.post('/insert', (req, res, next) => {
    upload.single('logo')(req, res, (err) => {
        if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).send('El archivo es demasiado grande. El tamaño máximo permitido es de 10MB.');
        } else if (err) {
            return res.status(400).send(err.message);
        }
        next();
    });
}, (req, res) => {
    const { nombre_empresa, direccion, telefono, correo_electronico, descripcion, slogan, titulo_pagina } = req.body;
    const logo = req.file ? req.file.buffer : null;

    if (!nombre_empresa || !correo_electronico) {
        return res.status(400).send('Nombre de empresa y correo electrónico son obligatorios');
    }

    const query = `INSERT INTO perfil_empresa (nombre_empresa, direccion, telefono, correo_electronico, descripcion, logo, slogan, titulo_pagina) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

    db.query(query, [nombre_empresa, direccion, telefono, correo_electronico, descripcion, logo, slogan, titulo_pagina], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).send('Error en el servidor');
        }
        res.status(200).send('Perfil de empresa insertado con éxito');
    });
});

// Endpoint para obtener el perfil de empresa
router.get('/get', (req, res) => {
    const query = `SELECT * FROM perfil_empresa LIMIT 1`;
    db.query(query, (err, results) => {
        if (err) {
            console.log(err);
            return res.status(500).send('Error en el servidor');
        }
        if (results.length === 0) {
            return res.status(404).send('Perfil de empresa no encontrado');
        }

        const perfilEmpresa = results[0];

        // Convertir el logo (longblob) a base64
        if (perfilEmpresa.logo) {
            perfilEmpresa.logo = perfilEmpresa.logo.toString('base64');
        }

        res.status(200).json(perfilEmpresa); // Devuelve el resultado con los nuevos campos incluidos
    });
});


// Endpoint para actualizar el perfil de empresa
router.put('/update', (req, res, next) => {
    upload.single('logo')(req, res, (err) => {
        if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).send('El archivo es demasiado grande. El tamaño máximo permitido es de 10MB.');
        } else if (err) {
            return res.status(400).send(err.message);
        }
        next();
    });
}, (req, res) => {
    const { id_empresa, nombre_empresa, direccion, telefono, correo_electronico, descripcion, slogan, titulo_pagina } = req.body;
    const logo = req.file ? req.file.buffer : null;

    // Verifica que se haya enviado el id_empresa
    if (!id_empresa) {
        return res.status(400).send('El id_empresa es obligatorio para actualizar');
    }

    // Verifica que se envíen los campos obligatorios
    if (!nombre_empresa || !correo_electronico) {
        return res.status(400).send('Nombre de empresa y correo electrónico son obligatorios');
    }

    // Prepara la consulta SQL para la actualización
    let query = `UPDATE perfil_empresa SET nombre_empresa = ?, direccion = ?, telefono = ?, correo_electronico = ?, descripcion = ?, slogan = ?, titulo_pagina = ?`;
    const queryParams = [nombre_empresa, direccion, telefono, correo_electronico, descripcion, slogan, titulo_pagina];

    // Si se subió un nuevo logo, incluir el logo en la actualización
    if (logo) {
        query += `, logo = ?`;
        queryParams.push(logo);
    }

    query += ` WHERE id_empresa = ?`;
    queryParams.push(id_empresa);

    // Ejecuta la consulta
    db.query(query, queryParams, (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).send('Error en el servidor');
        }

        if (result.affectedRows === 0) {
            return res.status(404).send('Perfil de empresa no encontrado');
        }

        res.status(200).send('Perfil de empresa actualizado con éxito');
    });
});

// Endpoint para eliminar el perfil de empresa
router.delete('/delete/:id', (req, res) => {
    const { id } = req.params;

    const query = `DELETE FROM perfil_empresa WHERE id_empresa = ?`;
    db.query(query, [id], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).send('Error en el servidor');
        }
        res.status(200).send('Perfil de empresa eliminado con éxito');
    });
});

// Exportar el router
module.exports = router;
