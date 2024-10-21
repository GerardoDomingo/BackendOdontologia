const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const csrf = require('csurf');  // Importar el middleware CSRF
const cookieParser = require('cookie-parser'); // Necesario para manejar cookies

const app = express();

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

// Configuración de middlewares de seguridad
app.use(cors({
  origin: (origin, callback) => {
    callback(null, true);
  },
  credentials: true // Permitir el envío de cookies y encabezados de sesión
}));

app.use(bodyParser.json());
app.use(cookieParser());  // Usamos cookies para manejar el token CSRF

// Configuración de CSRF
const csrfProtection = csrf({ cookie: true });  // Habilitar CSRF con cookies

// Ruta para obtener el token CSRF
app.get('/api/csrf-token', csrfProtection, (req, res) => {
  // Enviar el token CSRF al frontend
  res.json({ csrfToken: req.csrfToken() });
});

// Importar las rutas
const userRoutes = require('./routes/userRoutes');
const Registrer = require('./routes/registrer');
const politicasRoutes = require('./routes/politicasRoutes.js');
const deslindeRoutes = require('./routes/deslindelegal.js');
const terminosRoutes = require('./routes/terminosYcondicion.js');
const perfil_empresa = require('./routes/perfilEmpresa.js');

// Asignar las rutas a la aplicación con protección CSRF
app.use('/api/users', csrfProtection, userRoutes); // Rutas de usuarios
app.use('/api', csrfProtection, Registrer); // Rutas de registro
app.use('/api/politicas', politicasRoutes); // Rutas de políticas
app.use('/api/deslinde', deslindeRoutes); // Rutas de deslinde legal
app.use('/api/termiCondicion', terminosRoutes); // Rutas de términos y condiciones
app.use('/api/perfilEmpresa', perfil_empresa); // Rutas del perfil de la empresa

// Iniciar el servidor
app.listen(3001, () => {
  console.log('Servidor corriendo en puerto 3001');
});
