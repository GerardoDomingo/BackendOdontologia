const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();

app.use(cors());
app.use(bodyParser.json());

// Importar las rutas desde los archivos de rutas
const userRoutes = require('./routes/userRoutes');


// Usar las rutas
app.use('/api/users', userRoutes);


// Iniciar servidor
app.listen(3001, () => {
  console.log('Servidor corriendo en puerto 3001');
});
