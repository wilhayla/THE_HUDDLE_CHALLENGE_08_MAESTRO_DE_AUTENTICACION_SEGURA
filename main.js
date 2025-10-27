let csrfToken = ''; //variable global para almacenar el token
const TOKEN_KEY = 'jwtToken'; // Clave para localStorage

// Obtener referencias de secciones clave
const loginSection = document.getElementById('login-section');
const registerSection = document.getElementById('register-section');
const userProfileSection = document.getElementById('user-profile-section');
const logoutButton = document.getElementById('logout-button');

/**
 * Guarda el token JWT en el almacenamiento local.
 * @param {string} token - El token JWT recibido del servidor.
 */
function saveToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
}

/**
 * Borra el token JWT del almacenamiento local
 * Asegura que todos los rastros de la sesion del usuario
 * se eliminen del navegador y que la interfaz del usuario (UI)
 * regurese a su estado inicial (no logueado).
 */
function clearAuth() {
    localStorage.removeItem(TOKEN_KEY);

    // 🔑 LÓGICA CRÍTICA DE VISIBILIDAD 🔑
    // ----------------------------------------------------

    // Mostrar Formularios
    // Cuano el usuario ya no esta logueado mostrar la vista de registro y logueo
    if (loginSection) loginSection.style.display = 'block'; // mostar el bloque de loquin
    if (registerSection) registerSection.style.display = 'block'; // mostrar el bloque de registro.
    
    // Ocultar Perfil y Botón de Logout
    if (userProfileSection) userProfileSection.style.display = 'none'; // ocultar el perfil del usuario al cerrar sesion
    const logoutButton = document.getElementById('logout-button'); // obtener el boton
    if (logoutButton) logoutButton.style.display = 'none'; // ocultar el boton al cerrar sesion

    // Limpiar datos y mensajes
    const profileUsernameEl = document.getElementById('profile-username'); //obtener el nombre de usuario 
    const profileEmailEl = document.getElementById('profile-email'); // obtener el email
    if (profileUsernameEl) profileUsernameEl.textContent = ''; // reemplazar el contenido del username por una cadena vacia
    if (profileEmailEl) profileEmailEl.textContent = ''; // reemplazar el contenido del email por una cadena vacia.
    
    console.log("Autenticación local borrada. Interfaz restablecida.");
    
    // Mostrar mensaje de éxito si hay un elemento de mensaje disponible
    const statusMsg = document.getElementById('status-message');
    if (statusMsg) {
        statusMsg.textContent = 'Sesión cerrada con éxito.';
        statusMsg.style.color = 'blue';
        setTimeout(() => { statusMsg.textContent = ''; }, 3000);
    }
}

/**
 * Muestra el perfil del usuario autenticado y oculta los formularios.
 * @param {object} user - Objeto de usuario (username, email, etc.)
 */
function displayUserProfile(user) {
    const profileUsernameEl = document.getElementById('profile-username');
    const profileEmailEl = document.getElementById('profile-email');
    
    // Inyectar datos del usuario
    if (profileUsernameEl) profileUsernameEl.textContent = user.username;
    if (profileEmailEl) profileEmailEl.textContent = user.email;

    // LÓGICA CRÍTICA DE VISIBILIDAD
    // Ocultar Formularios
    if (loginSection) loginSection.style.display = 'none';
    if (registerSection) registerSection.style.display = 'none';
    
    // Mostrar Perfil y Botón de Logout
    if (userProfileSection) userProfileSection.style.display = 'block';
    if (logoutButton) logoutButton.style.display = 'block';

    // Limpiar mensajes de login si existen
    const msg = document.getElementById('login-message');
    if (msg) msg.textContent = '';
}

/**
 * Verifica si hay un JWT y llama a /api/me para validar la sesión.
 */
async function checkAuthentication() {
    const token = localStorage.getItem(TOKEN_KEY); // extraigo el JWT del localStorage
    
    // Inicializar headers
    const headers = { 'Content-Type': 'application/json' };

    // Si hay JWT, lo añadimos al header. Si no, confiamos en la cookie.
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        // La llamada a /api/me intentará autenticar con JWT (si existe) O con la Cookie de Sesión.
        const response = await fetch('api/me', {
            method: 'GET',
            // Si el JWT existe, se envía en el header. Si no, solo se envía la cookie.
            headers: headers 
        });

        const data = await response.json();

        if (response.ok) {
            // Autenticación exitosa (por JWT o Cookie)
            displayUserProfile(data);
            return true;

        } else if (response.status === 401) {
            // Token JWT inválido o sesión de Cookie expirada
            clearAuth(); 
            return false;

        } else {
            console.error('Error al verificar sesión:', data.message);
            return false;
        }
    } catch (error) {
        // Esto puede ocurrir si el servidor está caído o hay problemas de red
        console.warn('Fallo de red al intentar verificar la sesión. Asumiendo no autenticado.', error);
        clearAuth(); // Limpiamos por si acaso había un token local corrupto
        return false;
    }
}


async function fetchCsrfToken() {
    try {
        const response = await fetch('/api/csrf-token');

        if (response.ok) {
            const data = await response.json();
            csrfToken = data.csrfToken;
            console.log('Token CSRF Obtenido y almacenado.');
        } else {
            console.error('Error al obtener el token CSRF:', response.statusText);
        }

    } catch (error) {
        console.error('Fallo la conexión con el endpoint /api/csrf-token:', error);
    }
     
}


// --- MANEJO DEL REGISTRO ---
async function handleRegister(event) {
    event.preventDefault(); // Detiene el envío del formulario HTML estándar

    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const messageElement = document.getElementById('register-message');

    if (!csrfToken) {
        messageElement.textContent = 'Error: Token CSRF no disponible. Recargue la página.';
        return;
    }

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Enviamos el Token Anti-CSRF
                'X-CSRF-Token': csrfToken 
            },
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();
        
        if (response.ok) {
            messageElement.textContent = `Éxito: ${data.message}`;
            messageElement.style.color = 'green';
            event.target.reset();
            // Limpiar formulario o redirigir
        } else {
            messageElement.textContent = `Error: ${data.message}`;
            messageElement.style.color = 'red';
        }

    } catch (error) {
        messageElement.textContent = 'Fallo la conexión con el servidor.';
        messageElement.style.color = 'red';
    }
}


// --- MANEJO DEL LOGIN ---
async function handleLogin(event) {
    event.preventDefault(); // Detiene el envío del formulario HTML estándar

    
    const identifier = document.getElementById('login-identifier').value; 
    const password = document.getElementById('login-password').value;
    const rememberMe = document.getElementById('remember-me').checked;
    const messageElement = document.getElementById('login-message');

    if (!csrfToken) {
        messageElement.textContent = 'Error: Token CSRF no disponible. Recargue la página.';
        return;
    }

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                //Enviamos el Token Anti-CSRF
                'X-CSRF-Token': csrfToken 
            },
            body: JSON.stringify({ identifier, password, rememberMe })
        });

        const data = await response.json();
        
        if (response.ok) {
            messageElement.textContent = `Éxito: ${data.message}`;
            messageElement.style.color = 'green';
            event.target.reset();

            // Manejo de JWT (si es sin estado) o solo mensaje (si es persistente)
            if (data.token) {
                saveToken(data.token); // Guardar el token en localStorage
            } 

            checkAuthentication();

            // Limpiamos el mensaje después de un tiempo si la actualización es exitosa
            setTimeout(() => {
                messageElement.textContent = '';
            }, 3000); 
            
        } else {
            messageElement.textContent = `Error: ${data.message}`;
            messageElement.style.color = 'red';
        }

    } catch (error) {
        messageElement.textContent = 'Fallo la conexión con el servidor.';
        messageElement.style.color = 'red';
    }
}

// --- MANEJO DEL LOGOUT ---
async function handleLogout() {
    // 1. Cierre de sesión local y actualización inmediata de la interfaz
    clearAuth();

    try {
        // 2. Notificar al servidor (para destruir la sesión de cookie si existe)
        const response = await fetch('api/logout', {
            method: 'POST',
            headers: {
                // CSRF no es estrictamente necesario aquí si el logout es para JWT, 
                // pero lo mantenemos para el flujo de cookies si es necesario.
                'X-CSRF-Token': csrfToken, 
                'Content-Type': 'application/json'
            },
            // El body puede estar vacío, pero el fetch necesita un cuerpo si tiene headers
            body: JSON.stringify({})
        });

        // El backend debería borrar la cookie de sesión aquí.
        if (response.ok) {
            console.log("Notificación de logout al servidor exitosa.");
        } else {
            // Si el servidor falla al notificar, ya se limpió el lado del cliente (prioridad)
            console.warn(`Advertencia: Fallo al notificar el cierre de sesión al servidor (${response.status}).`);
        }
    } catch (error) {
        // Advertencia: El servidor pudo no ser alcanzable para la limpieza de la cookie.
        console.error('Advertencia: Error de red al intentar notificar el logout al servidor.', error);
    }
}


// ----------------------------------------------------
// 5. INICIALIZACIÓN Y LISTENERS
// ----------------------------------------------------
// Le dice al codigo que espera hata que toda la estructura del HTML de la pagina (DOM)
// haya sido cargada y este disponible para ser cargada.
document.addEventListener('DOMContentLoaded', () => {
    // 1. Obtener el token al cargar la página (Necesario para Register y Login)
    fetchCsrfToken(); 
    
    // 2. Verificar la sesión y actualizar la interfaz (JWT o Cookie)
    checkAuthentication(); 
    
    // 3. Asignar manejadores de eventos a los formularios
    const registerForm = document.getElementById('register-form');
    if (registerForm) registerForm.addEventListener('submit', handleRegister);
    
    const loginForm = document.getElementById('login-form');
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    
    // 4. ASIGNAR EL LISTENER AL BOTÓN DE LOGOUT
    if (logoutButton) logoutButton.addEventListener('click', handleLogout);

});
