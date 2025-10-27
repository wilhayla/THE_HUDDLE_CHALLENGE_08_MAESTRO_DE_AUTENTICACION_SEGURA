const express = require('express');
const router = express.Router();

const protect = require('../middleware/authMiddleware'); // Asumiendo que existe
const checkRole = require('../middleware/roleMiddleware');
const { db } = require('../config/database');

// =========================================================
// RUTAS EXCLUSIVAS PARA ADMINISTRADORES (role: 'admin')
// =========================================================


// 1. Eliminar Datos de Otros Usuarios (Acción PELIGROSA)
router.delete('/delete-user/:id', 
    protect, 
    checkRole(['admin']), // 🔑 Solo ADMIN
    (req, res) => {

        const userIdToDelete = req.params.id;

        // ** LÓGICA CRÍTICA DE BORRADO DE BASE DE DATOS **
        db.run('DELETE FROM users WHERE id = ?', userIdToDelete, function(err) {
            if (err) {
                console.error('Error al intentar borrar usuario:', err.message);
                return res.status(500).json({ 
                    message: 'Error interno del servidor al intentar eliminar el usuario.',
                    error: err.message 
                });
            }
            
            // 'this.changes' indica el número de filas afectadas
            if (this.changes === 0) {
                return res.status(404).json({ 
                    message: `Usuario con ID ${userIdToDelete} no encontrado. No se realizó ninguna eliminación.` 
                });
            }

            res.status(200).json({
                message: `El administrador ${req.user.identifier} ha ELIMINADO al usuario ${req.params.id}.`
            });
        });
    }
);

module.exports = router;
