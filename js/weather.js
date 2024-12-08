// Weather Integration Module
const weatherModule = {
    apiKey: '', // To be configured by user
    baseUrl: 'https://api.openweathermap.org/data/2.5',

    async getCurrentWeather(lat, lon) {
        try {
            const response = await fetch(
                `${this.baseUrl}/weather?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`
            );
            return await response.json();
        } catch (error) {
            console.error('Weather fetch error:', error);
            return null;
        }
    },

    async getForecast(lat, lon) {
        try {
            const response = await fetch(
                `${this.baseUrl}/forecast?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`
            );
            return await response.json();
        } catch (error) {
            console.error('Forecast fetch error:', error);
            return null;
        }
    },

    // Weather-based recommendations
    getCropRecommendations(weatherData) {
        const temp = weatherData.main.temp;
        const humidity = weatherData.main.humidity;
        const recommendations = [];

        if (temp > 25 && humidity > 70) {
            recommendations.push('Consider fungicide application - conditions favor fungal growth');
        }
        if (temp < 10) {
            recommendations.push('Protect sensitive crops from frost');
        }
        if (humidity < 30) {
            recommendations.push('Increase irrigation - dry conditions detected');
        }

        return recommendations;
    },

    // Weather alerts system
    processWeatherAlerts(weatherData) {
        const alerts = [];
        const temp = weatherData.main.temp;
        const wind = weatherData.wind.speed;
        const rain = weatherData.rain ? weatherData.rain['1h'] : 0;

        if (temp > 35) alerts.push({ type: 'extreme_heat', message: 'Extreme heat warning - protect crops and workers' });
        if (temp < 0) alerts.push({ type: 'frost', message: 'Frost warning - protect sensitive crops' });
        if (wind > 20) alerts.push({ type: 'wind', message: 'High wind warning - secure equipment and structures' });
        if (rain > 10) alerts.push({ type: 'rain', message: 'Heavy rain warning - check drainage systems' });

        return alerts;
    }
};

// Initialize weather module
document.addEventListener('DOMContentLoaded', () => {
    // Get user's location for weather data
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            const { latitude, longitude } = position.coords;
            weatherModule.getCurrentWeather(latitude, longitude)
                .then(data => {
                    if (data) {
                        updateWeatherDisplay(data);
                        const recommendations = weatherModule.getCropRecommendations(data);
                        const alerts = weatherModule.processWeatherAlerts(data);
                        displayRecommendations(recommendations);
                        displayAlerts(alerts);
                    }
                });
        });
    }
});

// Export module
export default weatherModule;
