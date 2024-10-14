const express = require('express');
const db = require('../db'); // Importar la conexión a la base de datos
const bcrypt = require('bcrypt'); // Importar bcrypt para el hashing de contraseñas
const router = express.Router();

// Ruta para registrar un nuevo usuario
router.post('/register', async (req, res) => {  // Asegúrate de usar '/register'
  const { nombre, aPaterno, aMaterno, edad, genero, lugar, telefono, email, alergias, password } = req.body;

  // Validar que todos los campos requeridos estén presentes
  if (!nombre || !aPaterno || !aMaterno || !edad || !genero || !lugar || !telefono || !email || !password) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios' });
  }

  try {
    // Verificar si el usuario ya existe por email
    const checkUserSql = 'SELECT * FROM pacientes WHERE email = ?';
    db.query(checkUserSql, [email], async (err, result) => {
      if (err) {
        return res.status(500).json({ message: 'Error al verificar el correo electrónico' });
      }

      if (result.length > 0) {
        return res.status(400).json({ message: 'El correo electrónico ya está registrado' });
      }

      // Hash de la contraseña usando bcrypt
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Insertar el nuevo usuario en la base de datos
      const sql = `INSERT INTO pacientes (nombre, aPaterno, aMaterno, edad, genero, lugar, telefono, email, alergias, password)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

      db.query(sql, [nombre, aPaterno, aMaterno, edad, genero, lugar, telefono, email, alergias, hashedPassword], (err, result) => {
        if (err) {
          console.error('Error al registrar el paciente:', err);
          return res.status(500).json({ message: 'Error al registrar el paciente' });
        }

        res.status(201).json({ message: 'Paciente registrado correctamente' });
      });
    });
  } catch (error) {
    console.error('Error en el registro:', error);
    res.status(500).json({ message: 'Error en el registro' });
  }
});

module.exports = router;
