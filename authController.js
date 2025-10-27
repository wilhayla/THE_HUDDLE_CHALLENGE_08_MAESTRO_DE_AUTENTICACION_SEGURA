const bcrypt = require('bcrypt');
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const { encrypt } = require('../utils/encryption');

require('dotenv').config();


// Nivel de complejidad del hashing. 10 es un valor estándar.
const SALT_ROUNDS = 10; 


/**
 * Registra un nuevo usuario en la base de datos.
 */
exports.registerUser = async (req, res) => {
    // 1. Obtener datos del cuerpo de la petición
    const { username, email, password } = req.body;

    // 2. Validación básica
    if (!username || !email || !password) {
        return res.status(400).json({ 
            message: 'Todos los campos (usuario, email, contraseña) son obligatorios.' 
        });
    }

    try {
        
        // 3. Verificar si hay algun usuario ya registrado
        const countResult = await User.countAll();
        const isFirstUser = countResult.count === 0;

        // Definir el rol. Condicion ternaria.
        const role = isFirstUser ? 'admin' : 'user';

        // 4. Hashing de la Contraseña
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        
        // 5. Creación del Usuario en la Base de Datos con el rol
        const userId = await User.create({
            username, 
            email, 
            password: hashedPassword, 
            role: role
        });

        // 6. Respuesta de éxito
        res.status(201).json({ 
            message: `Usuario registrado con exito. Rol: ${role}`,
            userId: userId
        });

    } catch (error) {
        console.error('Error durante el registro:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

exports.loginUser = async (req, res) => {
    const { identifier, password, rememberMe } = req.body;

    // Validación básica
    if (!identifier || !password) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
    }

    try {
        // 1. Buscar el usuario por nombre de usuario o email
        const user = await User.findByUsernameOrEmail(identifier);
        if (!user) {
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }

        // 2. Verificar la contraseña
        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch) {
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }

        // 1. Establecer la sesión en la memoria del servidor
        req.session.isLoggedIn = true; // bandera booleana marca la sesion como autenticada
        req.session.userId = user.id; // guardamos el indentificador unico del usuario en la sesion
        req.session.role = user.role // guardamos el rol  del usuario en la sesion

        if (rememberMe) {
            // 2. Si "Remember Me" está activado, extender la duración de la cookie
            const thirtydays = 30 * 24 * 60 * 60 * 1000; // 30 días
            req.session.cookie.maxAge = thirtydays; 

            res.status(200).json({
                message: 'Login exitoso. Sesión persistente activada.'
        });
        } else {
            // --- FLUJO JWT SIN ESTADO O SESIÓN DE NAVEGADOR TEMPORAL ---
            // Aseguramos que la cookie expire al cerrar el navegador si no se usa JWT.
            req.session.cookie.maxAge = null; // La cookie de sesión durará hasta que el navegador se cierre  
            
            const encryptedEmail = encrypt(user.email);
            if (!encryptedEmail) {
                return res.status(500).json({ message: 'Error interno: Fallo al cifrar datos.' });
            }
            
            // generar un token JWT.
            const token = jwt.sign(
                {
                    userId: user.id, 
                    role: user.role,
                    encryptedEmail: encryptedEmail,
                },
                process.env.JWT_SECRET,
                {expiresIn: '1h'}
            
            );
        
            // Responder con el token JWT
            res.status(200).json({
                message: 'Login exitoso. Aquí está tu token JWT.',
                token: token
            });
        }
    } catch (error) {
        console.error('Error durante el login:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};


/**
 * Cierra la sesión del usuario.
 * Maneja la destrucción de la sesión de Express (cookies) y
 * simplemente informa de éxito para el flujo JWT (el cliente debe eliminar el token).
 */
exports.logoutUser = (req, res) => {
    // 1. Manejar la Sesión Persistente (Cookie/Express Session)
    if (req.session) {
        // Destruye la sesión de Express
        req.session.destroy(err => {  // elimina el objeto de sesion almacenado
            if (err) {
                console.error('Error al destruir la sesión:', err);
                return res.status(500).json({ message: 'No se pudo cerrar la sesión correctamente.' });
            }
            // Limpia la cookie de sesión en el cliente
            res.clearCookie('connect.sid'); // elimina el id de sesion y la cookie.
            
            // Ya hemos terminado el proceso de logout para las sesiones basadas en cookies.
            return res.status(200).json({ message: 'Sesión cerrada con éxito.' });
        });
    } else {
        // 2. Manejar la Sesión No Persistente (JWT)
        // Para JWT, el backend no necesita hacer nada, pero enviamos una respuesta de éxito.
        // El cliente es responsable de eliminar el token del localStorage/SessionStorage.
        res.status(200).json({ message: 'Sesión cerrada con éxito (Recuerda eliminar el JWT del cliente).' });
    }
};
