// connect.js
import sql from "mssql";

const config = {
  user: "cristian",
  password: "GupySR344",
  server: "multideportivoserver.database.windows.net",
  database: "multideportivodb",
  options: {
    encrypt: true,               // Azure SQL requiere conexión cifrada
    trustServerCertificate: false
  }
};

// Exportamos la conexión por defecto
const poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {
        console.log("✅ Conectado a Azure SQL Database");
        return pool;
    })
    .catch(err => {
        console.error("❌ Error al conectar a Azure SQL:", err);
        throw err;
    });

export default poolPromise;
