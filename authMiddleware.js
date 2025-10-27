const jwt = require('jsonwebtoken');
const User = require('../models/user')
const { decrypt } = require('../utils/encryption');

require('dotenv').config();

// Asegúrate de que esta clave secreta coincide con la que usas para firmar el token
const JWT_SECRET = process.env.JWT_SECRET; 

//Middleware que implementa autenticación híbrida (Sesión + JWT)
// 1. Verifica si hay una sesión activa (cookie de sesión). Si es así, autentica al usuario.
// 2. Si no hay sesión, verifica el token JWT en los encabezados de autorización.
// 3. Si el token es válido, autentica al usuario; si no, rechaza la solicitud.
const protect = async (req, res, next) => {

    // 1. Verificar la Sesión Persistente (Cookie)
    // Si la sesión de Express está activa, el usuario está autenticado.
    if (req.session && req.session.userId) {
        req.user = {
            id: req.session.userId,   // Adjuntar el ID de sesión a la petición
            role: req.session.role
        } 
        return next(); // Autenticación por cookie exitosa
    }
    let token;

    // 1. Verificar si el token está en los encabezados (formato: "Bearer <token>")
    if (
        req.headers.Authorization &&
        req.headers.Authorization.startsWith('Bearer')
    ) {
        try {
            // Extraer el token de la cadena "Bearer <token>"
            token = req.headers.Authorization.split(' ')[1]; //separa en array el Bearer y el token en dos elementos
                                                            // y accede al segundo elemento [1] para obtener el token
            // 2. Verificar y decodificar el token
            const decoded = jwt.verify(token, JWT_SECRET);

            let decryptedEmail = null;
            if (decoded.encryptedEmail) {
                decryptedEmail = decrypt(decoded.encryptedEmail);
                if (!decryptedEmail) {
                    // Fallo en el descifrado
                    return res.status(401).json({ message: 'No autorizado: El email cifrado es inválido.' });
                }
            }

            // 3. Adjuntar el ID de usuario a la petición
            // Esto permite que las rutas sepan qué usuario está autenticado
            req.user = {
                id: decoded.userId,
                role: decoded.role,
                email: decryptedEmail
            }

            return next(); // Continuar con la ruta solicitada

        } catch (error) {
            console.error('Error de verificación de token:', error);
            // El token no es válido (expiró, firma incorrecta, etc.)
            return res.status(401).json({ 
                message: 'No autorizado, token fallido o expirado.',
                error: error.message 
            });
        }
    }
    
    // No se encontró ningún token en los encabezados
    return res.status(401).json({ message: 'No autorizado, no se encontró token.' });
    
};

module.exports = protect;
