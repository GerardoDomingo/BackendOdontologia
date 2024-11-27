const express = require('express');
const router = express.Router();
const db = require('../db');


  
// Endpoint para obtener intentos de login
router.get('/login-attempts', async (req, res) => {
    try {
      const attemptsSql = `
        SELECT id, ip_address, paciente_id, fecha_hora, intentos_fallidos, fecha_bloqueo
        FROM login_attempts
      `;
      
      db.query(attemptsSql, async (err, attempts) => {
        if (err) {
          return res.status(500).json({ message: 'Error al obtener los intentos de inicio de sesión.' });
        }
  
        // También puedes agregar la configuración de intentos máximos y tiempo de bloqueo si es relevante
        const maxAttemptsSql = 'SELECT setting_value FROM config WHERE setting_name = "MAX_ATTEMPTS"';
        const lockTimeSql = 'SELECT setting_value FROM config WHERE setting_name = "LOCK_TIME_MINUTES"';
  
        const maxAttempts = await new Promise((resolve, reject) => {
          db.query(maxAttemptsSql, (err, result) => {
            if (err) reject(err);
            else resolve(parseInt(result[0].setting_value, 10));
          });
        });
  
        const lockTimeMinutes = await new Promise((resolve, reject) => {
          db.query(lockTimeSql, (err, result) => {
            if (err) reject(err);
            else resolve(parseInt(result[0].setting_value, 10));
          });
        });
  
        res.status(200).json({
          attempts,
          maxAttempts,
          lockTimeMinutes
        });
      });
    } catch (error) {
      res.status(500).json({ message: 'Error en el servidor.' });
    }
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

// Este endpoint actualizará los valores en la tabla 'config'
router.post('/update-config', async (req, res) => {
    const { settingName, settingValue } = req.body;
  
    if (!settingName || !settingValue) {
      return res.status(400).json({ message: 'Nombre y valor de la configuración son requeridos.' });
    }
  
    const updateConfigSql = 'UPDATE config SET setting_value = ? WHERE setting_name = ?';
  
    db.query(updateConfigSql, [settingValue, settingName], (err, result) => {
      if (err) {
        return res.status(500).json({ message: 'Error al actualizar la configuración.' });
      }
      return res.status(200).json({ message: 'Configuración actualizada exitosamente.' });
    });
  });
  
// Endpoint para obtener el reporte de pacientes
router.get('/pacientes', async (req, res) => {
  try {
      const query = `
          SELECT 
              id, 
              nombre, 
              aPaterno, 
              aMaterno, 
              fechaNacimiento, 
              genero, 
              lugar, 
              telefono, 
              email, 
              alergias, 
              estado 
          FROM pacientes
      `;

      db.query(query, (err, results) => {
          if (err) {
              logger.error(`Error al obtener pacientes: ${err.message}`);
              return res.status(500).json({ message: 'Error al obtener pacientes.' });
          }

          return res.status(200).json(results);
      });
  } catch (error) {
      logger.error(`Error en el servidor: ${error.message}`);
      return res.status(500).json({ message: 'Error en el servidor.' });
  }
});

module.exports = router;
