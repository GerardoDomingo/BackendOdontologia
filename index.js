const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const app = express();

// Middleware esencial para cookies
app.use(cookieParser());

// Configuración básica de seguridad con Helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "https://www.google.com",
          "https://www.gstatic.com",
        ],
        frameSrc: [
          "'self'",
          "https://www.google.com",
          "https://www.recaptcha.net",
        ],
        imgSrc: ["'self'", "https://www.google.com", "https://www.gstatic.com"],
        connectSrc: [
          "'self'",
          "https://odontologiacarol.onrender.com",
          "https://odontologiacarol.isoftuthh.com",
          "https://backendodontologia.onrender.com",
          "http://localhost:3000",
        ],
      },
    },
  })
);

// Configuración CORS esencial para cookies
app.use(
  cors({
    origin: function (origin, callback) {
      const allowedOrigins = [
        "https://odontologiacarol.onrender.com",
        "https://odontologiacarol.isoftuthh.com",
        "https://backendodontologia.onrender.com",
        "http://localhost:3000",
      ];

      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("No permitido por CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Middlewares básicos
app.use(bodyParser.json());
app.use(express.json());

// Middleware para asegurar headers de cookies
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Credentials", "true");
  next();
});

// Tus rutas existentes
const userRoutes = require("./routes/userRoutes");
const Registrer = require("./routes/registrer");
const politicasRoutes = require("./routes/politicasRoutes.js");
const deslindeRoutes = require("./routes/deslindelegal.js");
const terminosRoutes = require("./routes/terminosYcondicion.js");
const perfil_empresa = require("./routes/perfilEmpresa.js");
const reportes = require("./routes/reportes.js");
const redes = require("./routes/redessociales.js");
const perfil_paciente = require("./routes/perfil_paciente.js");

// Asignar rutas
app.use("/api", Registrer);
app.use("/api/users", userRoutes);

//administrador
app.use("/api/politicas", politicasRoutes);
app.use("/api/deslinde", deslindeRoutes);
app.use("/api/termiCondicion", terminosRoutes);
app.use("/api/perfilEmpresa", perfil_empresa);
app.use("/api/reportes", reportes);
app.use("/api/redesSociales", redes);

//pacientes
app.use("/api/profile", perfil_paciente);

app.listen(3001, () => {
  console.log("Servidor corriendo en puerto 3001");
});
