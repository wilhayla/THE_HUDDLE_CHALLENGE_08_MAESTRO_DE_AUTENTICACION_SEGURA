const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// La base de datos se almacenará en un archivo llamado 'auth.sqlite'
const DB_PATH = path.join(__dirname, 'base_de_datos.db');

let dbInstance;

// Abrir o crear la base de datos
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('Error al conectar con SQLite:', err.message);
    } else {
        console.log('Conectado a la base de datos SQLite.');
        dbInstance = db
    }
});

const init = () => {
    return new Promise((resolve, reject) => {
        db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'user'
            );
        `, (err) => {
            if (err) {
                console.error('Error al crear la tabla users:', err.message);
                reject(err);
            } else {
                console.log('Tabla de usuarios verificada/creada.');
                resolve();
            }
        });
    });
};


module.exports = {
    db: db,
    init: init
};
