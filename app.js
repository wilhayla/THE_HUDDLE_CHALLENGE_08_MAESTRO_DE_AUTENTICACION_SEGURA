const session = require('express-session'); // para crear y gestionar sesiones de usuario en el servidor
const cookieParser = require('cookie-parser');
const csurf = require('csurf');
const express = require('express');
const authRoutes = require('./backend/routes/authRoutes');
const adminRoutes = require('./backend/routes/adminRoutes');
const userRoutes = require('./backend/routes/userRoutes');
const path = require('path');
const helmet = require('helmet');

require('dotenv').config();

// Conexión a la base de datos
//const db = require('./backend/config/database');
const { db, init: dbInit } = require('./backend/config/database');


const app = express();
const port = 3000;

console.log(`========================================`);
console.log(`| ENTORNO ACTUAL (NODE_ENV): ${process.env.NODE_ENV}`);
console.log(`| Bandera 'secure' de cookie: ${process.env.NODE_ENV === 'production'}`);
console.log(`========================================`);

app.use(helmet()); // Middleware de seguridad

// Configuracion espesifica CSP
app.use(helmet.contentSecurityPolicy({
    directives: {
        defaultSrc: ["'self'"], // Permite cargar recursos(imagenes,fuentes,etc) solo desde el propio origen de tu aplicacion
        scriptSrc: ["'self'"], // Le dice al navegador que solo puede ejecutar codigo Javascript que provengan de archivos cargados desde tu propio servidor.
        objectSrc: ["'none'"], // Bloquea por completo cualquier tipo de contenido incrustado o plugin.
        upgradeInsecureRequests: [], //Instruye al navegador a cambiar automaticamente todas las peticiones HTTP inseguras a HTTPS seguras.
    },
}));

// configurar de Express para manejar diferentes tipos de datos en las peticiones
app.use(express.static(path.join(__dirname, 'frontend', 'public')))
app.use(express.json()) 
app.use(express.urlencoded({ extended: true }));  

// 1. Configurar Cookie Parser
// Permite a express leer y escribir cookies HTTP (necesario para el manejo de la sesion)
app.use(cookieParser(process.env.SESSION_SECRET));

// 2. Configurar Express Session
// Crea y mantiene una sesion unica para cada usuario,
// a traves de una cookie de ID de sesion. En este sesion es donde se guarda 
// la clave maestra del CSRF.
app.use(session({
    
    secret: process.env.SESSION_SECRET, // Clave secreta para la sesión
    resave: false,  // 
    saveUninitialized: true,
    // Configuración de cookie segura (crucial para producción)
    cookie: { 
        // Bandera secure le dice al navegador web como debe manejar y transmitir esa cookie
        secure: process.env.NODE_ENV === 'production', // Asegura que la cookie solo se envie a traves de conexiones HTTPS seguras
        httpOnly: true, // Permite que la cookie se envie solo al servidor en cada peticion.
                        // Cualquier script que se ejecute en el frontend no puede acceder ni leer la cookie
        sameSite: 'Strict', // impide que el nevegador envie las cookies a una solicitud get iniciadas por sitios externos
        maxAge: null // La cookie de sesión durará hasta que el navegador se cierre
    }
}));

// Definir las rutas y asociarlas con las funciones del controlador
app.use('/api', authRoutes)
app.use('/api', adminRoutes)
app.use('/api', userRoutes)

// 3. Configurar el Middleware CSRF
// Inicializa el modulo csurf. Le dice a express que usara la sesion
// y que el token de validacion se buscara en el encabezado o
// cuerpo de las peticiones.
const csrfProtection = csurf({ 
    cookie: true // enviar el token anti CSRF en una cookie dedicada csurf al navegador.
});              // el frontend cuando hace una solicitud extrae el token y lo reenvia al servidor en el encabezado.

// Exponer csrfProtection para que las rutas lo usen
app.use((req, res, next) => {
    req.csrfProtection = csrfProtection;
    next();
});


dbInit() // inicializa la base de datos y crea las tablas.
     // promesa: si la base de datos y las tablas se crearon correctamete se ejecuta luego de .then.
    .then(() => {
        // La base de datos está lista. Ahora podemos iniciar el servidor.
        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            console.log(`Servidor escuchando en http://localhost:${PORT}`);
            console.log(`Accede a la interfaz en: http://localhost:${PORT}/index.html`);
        });
    })
    .catch((err) => {
        console.error('Fallo crítico al iniciar la DB:', err);
    });
