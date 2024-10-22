const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const helmet = require('helmet');  // Usa helmet para manejar las cabeceras de seguridad
const logger = require('./utils/logger');

// Forzar un log de prueba
logger.info('Este es un log de información.');
logger.error('Este es un error de prueba.');

// Configurar las políticas de seguridad de contenido (CSP) con Helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "https://www.google.com", "https://www.gstatic.com"],
        frameSrc: ["'self'", "https://www.google.com", "https://www.recaptcha.net"],
        imgSrc: ["'self'", "https://www.google.com", "https://www.gstatic.com"],
      },
    },
  })
);

// Configuración de middlewares
app.use(cors());
app.use(bodyParser.json());

// Importar las rutas
const userRoutes = require('./routes/userRoutes');
const Registrer = require('./routes/registrer');
const politicasRoutes = require('./routes/politicasRoutes.js');
const deslindeRoutes = require('./routes/deslindelegal.js');
const terminosRoutes = require('./routes/terminosYcondicion.js');
const perfil_empresa=require('./routes/perfilEmpresa.js');

// Asignar las rutas a la aplicaciónes
app.use('/api', Registrer); // Rutas de registro
app.use('/api/users', userRoutes); // Rutas de usuarios
app.use('/api/politicas', politicasRoutes); // Rutas de políticas
app.use('/api/deslinde', deslindeRoutes); // Rutas de deslinde legal
app.use('/api/termiCondicion', terminosRoutes); // Rutas de términos y condiciones
app.use('/api/perfilEmpresa', perfil_empresa);

// Iniciar el servidor
app.listen(3001, () => {
  console.log('Servidor corriendo en puerto 3001');
});
