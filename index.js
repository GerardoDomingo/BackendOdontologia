const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');  // Importar cookie-parser
const csrf = require('csurf');  // Importar csurf

const app = express();

// Configuración de middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(cookieParser());  // Usar cookie-parser

// Configurar middleware CSRF
const csrfProtection = csrf({ cookie: true });

// Ruta para obtener el token CSRF y enviarlo al cliente
app.get('/api/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Importar las rutas
const userRoutes = require('./routes/userRoutes');
const Registrer = require('./routes/registrer');
const politicasRoutes = require('./routes/politicasRoutes.js');
const deslindeRoutes = require('./routes/deslindelegal.js');
const terminosRoutes = require('./routes/terminosYcondicion.js');
const perfil_empresa = require('./routes/perfilEmpresa.js');

// Asignar las rutas a la aplicación
app.use('/api', Registrer); // Rutas de registro
app.use('/api/users', userRoutes); // Rutas de usuarios
app.use('/api/politicas', politicasRoutes); // Rutas de políticas
app.use('/api/deslinde', deslindeRoutes); // Rutas de deslinde legal
app.use('/api/termiCondicion', terminosRoutes); // Rutas de términos y condiciones
app.use('/api/perfilEmpresa', perfil_empresa);

// Proteger las rutas POST sensibles con CSRF
app.post('/api/users/login', csrfProtection, (req, res, next) => {
  next();  // A partir de aquí se usará tu lógica de login (ver abajo)
});

// Iniciar el servidor
app.listen(3001, () => {
  console.log('Servidor corriendo en puerto 3001');
});
