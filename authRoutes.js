const express = require('express');
const router = express.Router();
const csurf = require('csurf');
const authController = require('../controllers/authController'); // Suponiendo esta ruta
const csrfProtection  = csurf({cookie: true});
const protect = require('../middleware/authMiddleware');
const adminProtect = require('../middleware/adminAuth');
const loginLimiter = require('../middleware/loginLimiter');


// =========================================================================
// 🔑 MIDDLEWARE CONDICIONAL PARA CSRF (EL MISMO QUE USAS EN LOGOUT)
// =========================================================================
/**
 * Middleware que aplica la protección CSRF solo si el cliente
 * tiene una cookie de sesión activa (asumido para clientes web stateful).
 */
const conditionalCsrf = (req, res, next) => {
    // 1. Verificamos la presencia de la cabecera 'cookie'. 
    // Los clientes API (JWT) no la envían, los navegadores sí.
    const isStatelessClient = !req.headers.cookie;

    if (isStatelessClient) {
        // Si no se envía la cabecera Cookie, asumimos que es un cliente API/JWT puro
        // y le permitimos pasar sin CSRF.
        console.log('CSRF Protection OFF: No Cookie Header (Assumed API/JWT Client).');
        return next();
    }
    
    // Si la cabecera Cookie está presente, es un navegador web.
    // Debemos forzar la protección CSRF para mitigar ataques CSRF.
    console.log('CSRF Protection ON: Cookie Header detected (Web Client).');
    return csrfProtection(req, res, next);
};

// Ruta simple para que el frontend pida el token
// csrfProteccion.
//1. Genera un token anti CSRF
//2. Guarda el token en la RAM
//3. Y prepara una copia del token para enviar al cliente
//4. Si la sesion ya tiene  un token CSRF, csurf recupera el existente en vez de cerar uno nuevo
router.get('/csrf-token', csrfProtection, (req, res) => {
    // csurf hace dos cosas aquí:
    // 1. Guarda el token secreto en la sesión del servidor (cookie)
    // 2. Envía un token "copia" al cliente usando req.csrfToken()
    res.json({ csrfToken: req.csrfToken() }); 
});

// Verifica la autenticacion del usuario. Si pasa el servidor puede confiar en que la identidad es real.
// Verifica si el token es valido, si esta firmado correctamente y no ha expirado y este presente en el header.
router.get('/profile', protect, (req, res) => {     
    res.status(200).json({                          
        message: 'Acceso a la ruta privada concedido.',
        userId: req.userId,
        sessionType: 'JWT Stateless'
    });
});


// Aplica el middleware CSRF a la ruta de registro y login
router.post('/register', csrfProtection, authController.registerUser);
router.post('/login', loginLimiter, conditionalCsrf, authController.loginUser);
router.post('/logout', conditionalCsrf, authController.logoutUser);


module.exports = router;
