const adminProtect = (req, res, next) => {
    // ASUMIDO: El ID y el rol se deben adjuntar a req durante la autenticación.
    // Para el flujo de cookies: req.session.role
    // Para el flujo JWT: req.userRole (debes modificar authMiddleware para obtener el rol del JWT)
    
    // 🔑 Vamos a simplificarlo usando el ID del usuario y buscando el rol (menos eficiente pero seguro)
    // O MEJOR: Modifica el authController y authMiddleware para guardar el ROL del usuario en req.session o req.userRole.
    
    // ASUMIMOS que el authMiddleware ya se ejecutó y adjuntó req.userId.
    if (!req.user || !req.user.role) {
        console.error("ADMIN PROTECT: No se encontró rol en req.user.");
        return res.status(401).json({ message: 'Acceso denegado. Informacion del rol faltante.' });
    }

    // ⚠️ REQUERIRÁ MODIFICACIÓN EN authMiddleware Y LOGIN
    // Si tienes el rol adjunto a la petición:
    const userRole = req.user.role.toLowerCase(); 

    if (userRole === 'admin') {
        next(); // Es admin, continúa
    } else {
        console.warn(`Intento de acceso de rol no-admin: ${userRole}`);
        res.status(403).json({ message: 'Acceso denegado. Se requiere rol de administrador.' });
    }
};

module.exports = adminProtect;
