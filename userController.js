const User = require('../models/user');

// Controlador para obtener el perfil del usuario autenticado

getProfile = async (req, res) => {  
    try {
        // El middleware de autenticación (authMiddleware) DEBE haber
        // inyectado los datos del usuario autenticado en req.user.

        const userId = req.user.id; // Tomamos el ID del usuario AHORA logueado

        // Buscamos SOLO los datos de ESE usuario.
        const user = await User.findById(userId); 

        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado." });
        }

        // Devolvemos SÓLO la información relevante del perfil.
        res.status(200).json({
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role
            
        });
    } catch (error) {
        console.error("Error al obtener el perfil:", error.message);
        res.status(500).json({ message: "Error interno del servidor.", error: error.message });
    }
};

module.exports = getProfile;
