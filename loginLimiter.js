const rateLimit = require('express-rate-limit');

// Configuración específica para el endpoint de login
const loginLimiter = rateLimit({
    // 1. Duración de la ventana (5 minutos)
    windowMs: 5 * 60 * 1000, 
    
    // 2. Número máximo de peticiones por ventana (5 intentos fallidos)
    max: 5, 
    
    // 3. Mensaje de error a mostrar si se supera el límite
    message: {
        message: "Demasiados intentos de login fallidos desde esta IP. Por favor, inténtelo de nuevo después de 5 minutos."
    },
    
    // 4. Encabezados de respuesta (para informar al cliente)
    standardHeaders: true, 
    legacyHeaders: false,
    
    // 5. Opción para no contar las peticiones exitosas
    // Esto es muy importante: solo queremos castigar los intentos fallidos.
    // La función del controlador debe llamar a 'next(error)' si las credenciales fallan, 
    // pero como el error se maneja dentro del try/catch del login, lo dejaremos en false
    // y ajustaremos la lógica del controlador para resetear el contador si es exitoso.
    // Por ahora, usaremos la configuración simple y contaremos todas las peticiones POST.
});

module.exports = loginLimiter;
