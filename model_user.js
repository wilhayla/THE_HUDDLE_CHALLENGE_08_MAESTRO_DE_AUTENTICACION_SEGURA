const { db } = require('../config/database'); // Asumo que tu conexión a la DB está aquí

class User {
    /**
     * Inserta un nuevo usuario en la base de datos.
     * @returns {number} El ID del usuario recién creado.
     */
    static create({username, email, password, role}) {
        const sql = 'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)';
        
        return new Promise((resolve, reject) => {
            db.run(sql, [username, email, password, role], function (err) {
                if (err) {
                    reject(err);
                } else {
                    // this.lastID contiene el ID del último registro insertado
                    resolve(this.lastID); 
                }
            });
        });
    }

    /**
     * Busca un usuario por nombre de usuario O por email.
     * @returns {object|null} El objeto de usuario si se encuentra, o null.
     */
    static findByUsernameOrEmail(identifier) {
        const sql = 'SELECT * FROM users WHERE username = ? OR email = ?';

        return new Promise((resolve, reject) => {
            db.get(sql, [identifier, identifier], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row); 
                }
            });
        });
    }

    s/**
     * Cuenta el número total de usuarios registrados en la base de datos.
     * @returns {Promise<{count: number}>} Un objeto con el conteo.
     */
    
    static countAll() {
        const sql = 'SELECT COUNT(*) as count FROM users';
        
        return new Promise((resolve, reject) => {
             // 🔑 CORRECCIÓN: Usamos db.get con un callback y lo envolvemos en una Promesa.
            
            db.get(sql, (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    // row debe ser { count: N }
                    resolve(row);
                }
            });
        });
    }

    // Método estático para encontrar un usuario por ID.
    // Retorna una promesa que resuelve en el objeto usuario o null.
    static findById(id) {
        return new Promise((resolve, reject) => {
            // Utilizamos .get() porque esperamos que la consulta devuelva 0 o 1 fila.
            // Excluimos la contraseña explícitamente en la consulta SELECT.
            const sql = 'SELECT id, username, email, role FROM users WHERE id = ?';
            
            db.get(sql, [id], (err, row) => {
                if (err) {
                    console.error("Error en User.findById:", err.message);
                    return reject(err);
                }
                // Si row es undefined, no se encontró el usuario, devolvemos null.
                resolve(row);
            });
        });
    }
}

    

module.exports = User;
