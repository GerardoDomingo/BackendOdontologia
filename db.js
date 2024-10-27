const mysql = require('mysql2');

// Crear un pool de conexiones a MySQL (Hostinger)
const pool = mysql.createPool({
  host: '193.203.166.102',  
  user: 'u666156220_carol',
  password: '20221058Emma',
  database: 'u666156220_db_carol',
  port: 3306,  // Asegúrate de usar el puerto correcto
  waitForConnections: true,
  connectionLimit: 10,  // Número máximo de conexiones simultáneas
  queueLimit: 0
});

// Verificar la conexión al crear el pool
pool.getConnection((err, connection) => {
  if (err) {
    console.error('Error conectando a la base de datos:', err.message);
    return;
  }
  console.log('Conexión a MySQL exitosa');
  connection.release();  // Liberar la conexión después de usarla
});

module.exports = pool;  // Exportar el pool para usarlo en otros archivos