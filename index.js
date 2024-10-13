const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();

app.use(cors());
app.use(bodyParser.json());

// Importar las rutas desde los archivos de rutas
const userRoutes = require('./routes/userRoutes');
const politicas =require('./routes/politicas');
const deslindelegal =require('./routes/deslindelegal');
const terminos_condiciones=require('./routes/terminosYcondicion');

// Usar las rutas
//user
app.use('/api/users', userRoutes);
//politicas
app.use('/api/politicas', politicas);
app.use('/api/deslinde', deslindelegal);
app.use('/api/termiCondicion',terminos_condiciones);

// Iniciar servidor
app.listen(3001, () => {
  console.log('Servidor corriendo en puerto 3001');
});
