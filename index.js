const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const csurf = require('csurf');
const cookieParser = require('cookie-parser');

const app = express();
//trozon
// Configuración de CORS
const corsOptions = {
  origin: true,  // Permitir cualquier origen temporalmente
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
};


// Aplicar middleware de CORS
app.use(cors(corsOptions));

// Configuración de middlewares adicionales
app.use(bodyParser.json());
app.use(cookieParser());

// Configurar middleware CSRF con protección a nivel de cookie
const csrfProtection = csurf({ cookie: true });

// Ruta para obtener el token CSRF
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

// Aplicar protección CSRF en todas las rutas POST sensibles (por ejemplo, el login)
app.post('/api/users/login', csrfProtection, (req, res, next) => {
  next();  // A partir de aquí se usará tu lógica de login (ver tu archivo de rutas)
});

// Iniciar el servidor
app.listen(3001, () => {
  console.log('Servidor corriendo en puerto 3001');
});
