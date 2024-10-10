const mysql = require('mysql2');

// Configuración de la conexión a la base de datos hola
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'odontologia_db'
});

// Conectar a la base de datos
db.connect(err => {
  if (err) {
    console.log('Error connecting to the database', err);
    return;
  }
  console.log('Connected to the MySQL database');
});

module.exports = db; // Exportamos la conexión para utilizarla en otros archivos
