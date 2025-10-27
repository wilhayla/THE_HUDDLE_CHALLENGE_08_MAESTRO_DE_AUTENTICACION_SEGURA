/**
 * Middleware para verificar si el rol del usuario autenticado
 * está incluido en la lista de roles permitidos.
 * * Este middleware asume que el token JWT ya ha sido validado y 
 * la información del usuario (req.user.role) ha sido adjuntada 
 * al objeto de solicitud (req).
 * * @param {string[]} allowedRoles - Un array de strings con los roles permitidos (e.g., ['admin', 'manager']).
 * @returns {function} Un middleware de Express.
 */
checkRole = (allowedRoles) => {
    return (req, res, next) => {
        // 1. Verificar que el usuario esté autenticado y que req.user exista
        if (!req.user || !req.user.role) {
            // Este caso no debería ocurrir si el middleware de autenticación funciona correctamente.
            console.warn("Acceso denegado: Usuario no autenticado (roleMiddleware).");
            return res.status(401).json({ 
                error: 'No autorizado', 
                message: 'No se encontró información de autenticación.' 
            });
        }

        const userRole = req.user.role.toLowerCase();
        
        // 2. Verificar si el rol del usuario está en la lista de roles permitidos
        if (allowedRoles.includes(userRole)) {
            // El rol es permitido, continuar con la solicitud
            next();
        } else {
            // 3. Acceso denegado
            console.log(`Acceso denegado para el rol: ${userRole}. Roles requeridos: ${allowedRoles.join(', ')}`);
            return res.status(403).json({ 
                error: 'Acceso prohibido', 
                message: 'No tienes los permisos necesarios para acceder a este recurso.' 
            });
        }
    };
};

module.exports = checkRole;
