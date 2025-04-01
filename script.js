// API Configuration
const API_KEY = '430f7a1a4cdf5712603c079af77eea34'; // Replace with your actual OpenWeatherMap API key
const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';
const FORECAST_URL = 'https://api.openweathermap.org/data/2.5/forecast';

// DOM Elements
const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const locationBtn = document.getElementById('location-btn');
const cityName = document.getElementById('city-name');
const currentDate = document.getElementById('current-date');
const weatherIcon = document.getElementById('weather-icon');
const temperature = document.getElementById('temperature');
const weatherDescription = document.getElementById('weather-description');
const windSpeed = document.getElementById('wind-speed');
const humidity = document.getElementById('humidity');
const pressure = document.getElementById('pressure');
const forecastContainer = document.getElementById('forecast-container');

// Event Listeners
searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city) {
        fetchWeatherData(city);
    } else {
        alert('Please enter a city name');
    }
});

locationBtn.addEventListener('click', getLocationWeather);

cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const city = cityInput.value.trim();
        if (city) {
            fetchWeatherData(city);
        }
    }
});

// Initialize with default city when page loads
window.addEventListener('load', () => {
    fetchWeatherData('London');
    updateDateTime(); // Update time immediately
    setInterval(updateDateTime, 60000); // Update time every minute
});

// Main function to fetch weather data
async function fetchWeatherData(city) {
    try {
        // Show loading state
        cityName.textContent = 'Loading...';
        temperature.textContent = '--';
        
        // Fetch current weather
        const currentResponse = await fetch(`${BASE_URL}?q=${city}&appid=${API_KEY}&units=metric`);
        
        if (!currentResponse.ok) {
            throw new Error(`Error: ${currentResponse.status}`);
        }
        
        const currentData = await currentResponse.json();
        updateCurrentWeather(currentData);
        
        // Fetch forecast data
        const forecastResponse = await fetch(`${FORECAST_URL}?q=${city}&appid=${API_KEY}&units=metric`);
        
        if (!forecastResponse.ok) {
            throw new Error(`Error: ${forecastResponse.status}`);
        }
        
        const forecastData = await forecastResponse.json();
        updateForecast(forecastData);
        
    } catch (error) {
        handleWeatherError(error);
    }
}

// Update current weather display
function updateCurrentWeather(data) {
    cityName.textContent = `${data.name}, ${data.sys.country}`;
    temperature.textContent = Math.round(data.main.temp);
    weatherDescription.textContent = data.weather[0].description;
    windSpeed.textContent = `${Math.round(data.wind.speed * 3.6)} km/h`; // Convert m/s to km/h
    humidity.textContent = `${data.main.humidity}%`;
    pressure.textContent = `${data.main.pressure} hPa`;
    
    // Update weather icon
    const iconCode = data.weather[0].icon;
    weatherIcon.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
    weatherIcon.alt = data.weather[0].main;
    
    // Change background based on weather
    updateBackground(data.weather[0].main);
}

// Update 5-day forecast display
function updateForecast(data) {
    forecastContainer.innerHTML = '';
    
    // Filter to get one forecast per day (at noon)
    const dailyForecasts = data.list.filter(item => {
        return item.dt_txt.includes('12:00:00');
    }).slice(0, 5); // Get next 5 days
    
    dailyForecasts.forEach(day => {
        const forecastDate = new Date(day.dt * 1000);
        const dayName = forecastDate.toLocaleDateString('en-US', { weekday: 'short' });
        
        const forecastItem = document.createElement('div');
        forecastItem.className = 'forecast-item';
        forecastItem.innerHTML = `
            <div class="forecast-day">${dayName}</div>
            <img class="forecast-icon" src="https://openweathermap.org/img/wn/${day.weather[0].icon}.png" alt="${day.weather[0].main}">
            <div class="forecast-temp">
                <span class="max-temp">${Math.round(day.main.temp_max)}°</span>
                <span class="min-temp">${Math.round(day.main.temp_min)}°</span>
            </div>
        `;
        
        forecastContainer.appendChild(forecastItem);
    });
}

// Get weather by geolocation
function getLocationWeather() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    // Fetch current weather by coordinates
                    const response = await fetch(`${BASE_URL}?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`);
                    const data = await response.json();
                    
                    updateCurrentWeather(data);
                    cityInput.value = data.name;
                    
                    // Fetch forecast by coordinates
                    const forecastResponse = await fetch(`${FORECAST_URL}?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`);
                    const forecastData = await forecastResponse.json();
                    updateForecast(forecastData);
                    
                } catch (error) {
                    handleWeatherError(error);
                }
            },
            (error) => {
                alert('Unable to retrieve your location. Please enable location services or search manually.');
                console.error('Geolocation error:', error);
            }
        );
    } else {
        alert('Geolocation is not supported by your browser. Please search manually.');
    }
}

// Update date and time display
function updateDateTime() {
    const now = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    currentDate.textContent = now.toLocaleDateString('en-US', options);
}

// Change background based on weather conditions
function updateBackground(weatherCondition) {
    const body = document.body;
    let bgClass = 'default-bg';
    
    switch (weatherCondition.toLowerCase()) {
        case 'clear':
            bgClass = 'clear-bg';
            break;
        case 'clouds':
            bgClass = 'clouds-bg';
            break;
        case 'rain':
        case 'drizzle':
            bgClass = 'rain-bg';
            break;
        case 'thunderstorm':
            bgClass = 'thunderstorm-bg';
            break;
        case 'snow':
            bgClass = 'snow-bg';
            break;
        case 'mist':
        case 'smoke':
        case 'haze':
        case 'fog':
            bgClass = 'mist-bg';
            break;
    }
    
    // Remove all weather classes and add the new one
    body.className = '';
    body.classList.add(bgClass);
}

// Handle API errors
function handleWeatherError(error) {
    console.error('Weather API Error:', error);
    
    if (error.message.includes('404')) {
        alert('City not found. Please check the spelling and try again.');
    } else if (error.message.includes('401')) {
        alert('Invalid API key. Please check your configuration.');
    } else if (error.message.includes('400')) {
        alert('Invalid request. Please try a different city.');
    } else {
        alert('Unable to fetch weather data. Please check your internet connection and try again.');
    }
    
    // Reset display
    cityName.textContent = '--';
    temperature.textContent = '--';
    weatherDescription.textContent = '--';
    forecastContainer.innerHTML = '<p>Forecast unavailable</p>';
}