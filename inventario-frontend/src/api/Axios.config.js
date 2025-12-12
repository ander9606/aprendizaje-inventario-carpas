import axios from "axios";

// URL base del backend (desde .env o por defecto localhost)
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

//crear una instancia de axios con la configuración base

const api = axios.create({  
    baseURL: API_URL,
    timeout: 10000,
    headers: {
        "Content-Type": "application/json",
    },
})

api.interceptors.request.use(
    (config) => {
        /*const token = localStorage.getItem('token')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }*/
        
        console.log(`🚀 [API] ${config.method.toUpperCase()} ${config.url}`);
        return config;
    },
    (error) => {  // manejo de errores
        console.error('❌ Error en petición:', error);
        return Promise.reject(error);
    }
)

//===========================
//INTERCEPTORES DE RESPUESTA
//===========================

api.interceptors.response.use(
    (response) => {
        console.log(`✅ [API] Respuesta recibida de ${response.config.url}`);
        console.log(`📦 [API] Datos:`, response.data);
        return response;
    },
    (error) => {
        //Manejo global de errores
        if (error.response){
            // el servidor responde con un codigo de error
            console.error(`❌ [API] Error ${error.response.status}:` ,  error.response.data);

            switch (error.response.status){
                case 400:
                console.error("Solicitud incorrecta.");
                break;
                case 401:
                console.error("No autorizado. Por favor, inicie sesión.");
                break;
                case 404:
                console.error("Recurso no encontrado.");
                break;
                case 500:
                console.error("Error interno del servidor.");
                break;
                default:
                console.error("Ocurrió un error inesperado.");    
            }
        } else if (error.request){
            // La petición fue hecha pero no se recibió respuesta
            console.error(`❌ sin respuesta del servidor:`, error.request);
        } else {
            // Algo pasó al preparar la petición
            console.error('❌ Error en la configuración de la petición:', error.message);
        }
        return Promise.reject(error);
    }
)

//==============================
//EXPORTAR LA INSTANCIA DE AXIOS
//==============================

export default api;  
export { API_URL };