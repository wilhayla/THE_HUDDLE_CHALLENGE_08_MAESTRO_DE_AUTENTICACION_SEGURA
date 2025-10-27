// Importamos el módulo nativo de Node.js para operaciones criptográficas
const crypto = require('crypto');

// Utilizaremos AES-256-CBC, un algoritmo de cifrado simétrico robusto.
const algorithm = 'aes-256-cbc'; 

require('dotenv').config();

// 🚨 CLAVE CRÍTICA: Debe ser de 32 bytes (256 bits). 
// ¡DEBES almacenar esto de forma segura en tus variables de entorno (.env)!
// Aquí usamos una clave de demostración, pero cámbiala.
// Usaremos el mismo JWT_SECRET por simplicidad si tiene 32 caracteres, 
// pero se recomienda usar una clave diferente y específica para el cifrado.
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; 

// El vector de inicialización (IV) de 16 bytes. 
// asegura que si cifras el texto 2 veces el resultado (hash) sea totalmente diferente
const IV_LENGTH = 16;

// 🔑 VERIFICACIÓN CRÍTICA DE CLAVE 
// Si la clave no está definida o no tiene la longitud correcta (32 caracteres),
// detenemos la aplicación para evitar errores criptográficos en runtime.
if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
    console.error('--------------------------------------------------------------------------------');
    console.error('FATAL ERROR: ENCRYPTION_KEY no está definida o no tiene 32 caracteres.');
    console.error('Por favor, defina una clave de 32 caracteres en el archivo .env.');
    console.error('--------------------------------------------------------------------------------');
    // Usamos un proceso de salida forzosa para evitar que el servidor inicie con una configuración insegura/incorrecta.
    process.exit(1);
}

/**
 * Cifra un texto plano utilizando AES-256-CBC.
 * @param {string} text - El texto a cifrar.
 * @returns {string} - El IV y el texto cifrado concatenados y codificados en hex.
 */

// Esta funcion toma un texto plano como parametro y lo convierte en una cadena ilegible
// que solo puede ser revertida por la clave secreta y el vector de inicializacion(IV)
function encrypt(text) {
    // Convertimos la clave de cifrado a un objeto binario (buffer)
    const key = Buffer.from(ENCRYPTION_KEY, 'utf-8');
    
    // Generamos una secuencia de bytes aleatoria de una longitud espesifica (IV)
    const iv = crypto.randomBytes(IV_LENGTH); 

    // crea el objeto que realizara el cifrado, recibe el algoritmo, la llave y el vector de inicializacion
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    
    // realiza la encriptacion del texto plano (text) codificada en hexadecimal
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex'); //toma cualquier dato restante que el procesador no haya cifrado completamente y lo concatena a encrypted.
    
    //convierte el buffer generado  en una cadena hexadecimal
    // formato retornado [IV_HEX]:[TEXTO_CIFRADO_HEX]
    return iv.toString('hex') + ':' + encrypted;
}

/**
 * Descifra el texto cifrado.
 * @param {string} text - El texto cifrado (IV:data).
 * @returns {string} - El texto plano original.
 */
function decrypt(text) {
    try {
        const textParts = text.split(':');
        // El primer fragmento es el IV
        const iv = Buffer.from(textParts.shift(), 'hex');
        // El resto es el texto cifrado
        const encryptedText = textParts.join(':');
        // carga la llave secreta que lo convierte a un objeto binario(buffer)
        const key = Buffer.from(ENCRYPTION_KEY, 'utf-8');
        // Crea el objeto que revertira el cifrado
        const decipher = crypto.createDecipheriv(algorithm, key, iv);
        // descifra la cadena de texto plano
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    } catch (e) {
        console.error('Error al descifrar el token:', e);
        return null;
    }
}

module.exports = {
    encrypt,
    decrypt
};
