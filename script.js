
class SensorEventDispatcher extends EventTarget {
    constructor() {
        super();
    }

    dispatchSensorEvent(eventName, detail) {
        const event = new CustomEvent(eventName, { detail });
        this.dispatchEvent(event);
    }
}

const sensorDispatcher = new SensorEventDispatcher();

// 2. Constantes y variables globales
const temperatureDisplay = document.getElementById('temperature');
const humidityDisplay = document.getElementById('humidity');
const pressureDisplay = document.getElementById('pressure');
const tempDataCard = document.getElementById('temp-card');
const eventLog = document.getElementById('event-log');
const fetchButton = document.getElementById('fetch-data-btn');
const saveButton = document.getElementById('save-data-btn');
const clearButton = document.getElementById('clear-data-btn');
const messageBox = document.getElementById('messageBox');

const TEMP_ALERT_THRESHOLD = 40; // Celsius

let currentSensorData = {
    temperature: null,
    humidity: null,
    pressure: null
};

let autoFetchInterval; // Variable para almacenar el ID del intervalo de actualización automática

// 3. Funciones utilitarias
function showMessageBox(message, type = 'info') {
    messageBox.textContent = message;
    messageBox.className = 'message-box'; 
    if (type === 'success') {
        messageBox.classList.add('bg-green-100', 'border-green-500', 'text-green-700');
    } else if (type === 'error') {
        messageBox.classList.add('bg-red-100', 'border-red-500', 'text-red-700');
    } else { 
        messageBox.classList.add('bg-blue-100', 'border-blue-500', 'text-blue-700');
    }
    messageBox.style.display = 'block';
    setTimeout(() => {
        messageBox.style.display = 'none';
    }, 3000); 
}

function logEvent(message, type = 'info') {
    const logEntry = document.createElement('p');
    logEntry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    logEntry.classList.add('mb-1', 'p-1', 'rounded');
    if (type === 'alert') {
        logEntry.classList.add('bg-red-100', 'text-red-700', 'font-semibold');
    } else if (type === 'success') {
        logEntry.classList.add('bg-green-100', 'text-green-700');
    } else if (type === 'info') {
        logEntry.classList.add('text-gray-700');
    }
    eventLog.prepend(logEntry); // Add to the top of the log
    if (eventLog.children.length > 15) { // Keep log concise
        eventLog.removeChild(eventLog.lastChild);
    }
}

function generateSensorData() {
    const temperature = (Math.random() * (50 - 15) + 15).toFixed(1); // 15.0 to 50.0
    const humidity = (Math.random() * (90 - 30) + 30).toFixed(1);    // 30.0 to 90.0
    const pressure = (Math.random() * (1050 - 950) + 950).toFixed(1); // 950.0 to 1050.0
    return {
        temperature: parseFloat(temperature),
        humidity: parseFloat(humidity),
        pressure: parseFloat(pressure)
    };
}

function simulateFetchSensorData() {
    logEvent('Simulando llamada a la API para obtener datos...');
    return new Promise((resolve) => {
        setTimeout(() => {
            const data = generateSensorData();
            logEvent('Datos de sensores recibidos de la API simulada.', 'success');
            resolve(data);
        }, 1500); // Simulate network delay
    });
}

function simulateSaveToDatabase(data) {
    logEvent('Simulando guardado de datos en la "base de datos" (localStorage)...');
    return new Promise((resolve, reject) => {
        try {
            localStorage.setItem('sensorData', JSON.stringify(data));
            logEvent('Datos guardados exitosamente en localStorage.', 'success');
            showMessageBox('Datos guardados exitosamente!', 'success');
            resolve();
        } catch (e) {
            logEvent('Error al guardar datos en localStorage: ' + e.message, 'error');
            showMessageBox('Error al guardar datos!', 'error');
            reject(e);
        }
    });
}

function updateSensorDisplay(data) {
    temperatureDisplay.textContent = `${data.temperature}°C`;
    humidityDisplay.textContent = `${data.humidity}%`;
    pressureDisplay.textContent = `${data.pressure} hPa`;
    currentSensorData = data; // Update global current data
    logEvent('Pantalla de sensores actualizada.');
    // Check for temperature alert
    if (data.temperature > TEMP_ALERT_THRESHOLD) {
        sensorDispatcher.dispatchSensorEvent('sensorAlert', {
            sensor: 'temperature',
            value: data.temperature,
            threshold: TEMP_ALERT_THRESHOLD,
            message: `¡Alerta! Temperatura alta: ${data.temperature}°C`
        });
    } else {
        // Remove alert styling if temperature is normal
        tempDataCard.classList.remove('animate-pulse-red', 'bg-red-500');
        tempDataCard.classList.add('bg-blue-500'); // Ensure it returns to blue if not red
    }
}

// 4. Callbacks y manejadores de eventos personalizados
function handleSensorAlert(event) {
    const { sensor, value, message } = event.detail;
    logEvent(message, 'alert');
    showMessageBox(message, 'error');
    // Visual notification for temperature alert
    if (sensor === 'temperature') {
        tempDataCard.classList.remove('bg-blue-500'); // Remove blue before adding red
        tempDataCard.classList.add('bg-red-500', 'animate-pulse-red');
    }
    // Optional: Add auditory notification here
    // const audio = new Audio('alert_sound.mp3');
    // audio.play();
}

function handleDataReceived(event) {
    const data = event.detail;
    logEvent(`Nuevo dato recibido: Temp: ${data.temperature}°C, Hum: ${data.humidity}%, Pres: ${data.pressure}hPa`);
    updateSensorDisplay(data); // Update UI with received data
}

// 5. Funciones de inicialización y limpieza
function clearSavedData() {
    localStorage.removeItem('sensorData');
    logEvent('Datos guardados en localStorage han sido limpiados.', 'info');
    showMessageBox('Datos guardados limpiados!', 'info');
}

// Función para iniciar la actualización automática
function startAutoFetch() {
    // Limpiar cualquier intervalo existente para evitar múltiples intervalos
    if (autoFetchInterval) {
        clearInterval(autoFetchInterval);
    }
    autoFetchInterval = setInterval(() => {
        logEvent('Obteniendo datos automáticamente...');
        simulateFetchSensorData()
            .then(data => {
                sensorDispatcher.dispatchSensorEvent('dataReceived', data);
            })
            .catch(error => {
                logEvent('Fallo al obtener datos automáticamente: ' + error.message, 'error');
                showMessageBox('Error al obtener datos automáticamente!', 'error');
            });
    }, 5000); // Obtener datos cada 5 segundos (5000 milisegundos)
    logEvent('Actualización automática iniciada.', 'info');
}

// Función para detener la actualización automática (opcional, si quieres un botón para detenerla)
function stopAutoFetch() {
    if (autoFetchInterval) {
        clearInterval(autoFetchInterval);
        autoFetchInterval = null;
        logEvent('Actualización automática detenida.', 'info');
    }
}

// 6. Asignación de listeners y eventos
sensorDispatcher.addEventListener('sensorAlert', handleSensorAlert);
sensorDispatcher.addEventListener('dataReceived', handleDataReceived);

fetchButton.addEventListener('click', () => {
    simulateFetchSensorData()
        .then(data => {
            sensorDispatcher.dispatchSensorEvent('dataReceived', data);
        })
        .catch(error => {
            logEvent('Fallo al obtener datos: ' + error.message, 'error');
            showMessageBox('Error al obtener datos!', 'error');
        });
});

saveButton.addEventListener('click', () => {
    if (currentSensorData.temperature !== null) { 
        simulateSaveToDatabase(currentSensorData);
    } else {
        showMessageBox('No hay datos para guardar. Obtén datos primero.', 'info');
        logEvent('Intento de guardar sin datos existentes.', 'info');
    }
});

clearButton.addEventListener('click', clearSavedData);

document.addEventListener('DOMContentLoaded', () => {
    logEvent('Aplicación iniciada.');
    const savedData = localStorage.getItem('sensorData');
    if (savedData) {
        try {
            const data = JSON.parse(savedData);
            updateSensorDisplay(data);
            logEvent('Datos cargados desde localStorage.', 'info');
        } catch (e) {
            logEvent('Error al cargar datos de localStorage: ' + e.message, 'error');
            showMessageBox('Error al cargar datos guardados!', 'error');
        }
    } else {
        logEvent('No se encontraron datos guardados. Obteniendo nuevos datos automáticamente.');
    }
    startAutoFetch(); // Iniciar la obtención automática de datos cuando la aplicación se carga
});