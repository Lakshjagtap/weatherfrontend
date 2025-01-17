const BASE_URL = "https://api.openweathermap.org/data/2.5";
const cityInput = document.getElementById("city-input");
const searchButton = document.getElementById("search-button");
const errorMessage = document.getElementById("error-message");
const cityName = document.getElementById("city-name");
const temperature = document.getElementById("temperature");
const humidity = document.getElementById("humidity");
const windSpeed = document.getElementById("wind-speed");
const chartCanvas = document.getElementById("temperature-chart");
const mapContainer = document.getElementById("map");

let temperatureChart;
let map;  // Leaflet map object

let requestCount = 0; // Track number of requests
let isRequestLimitReached = false; // Flag to check if the limit is reached
const maxRequestsPerMinute = 60; // Max requests per minute

// Search button click event
searchButton.addEventListener("click", async () => {
    const city = cityInput.value.trim();

    if (!city) {
        errorMessage.textContent = "Please enter a city name.";
        return;
    }

    errorMessage.textContent = "";
    try {
        const weatherData = await fetchWeatherData(city);
        updateWeatherInfo(weatherData);
        const forecastData = await fetchForecastData(city);
        updateChart(forecastData);
        displayMap(weatherData.coord.lat, weatherData.coord.lon);  // Display map based on lat/lon
    } catch (error) {
        errorMessage.textContent = "Unable to fetch weather data. Please try again.";
    }
});

// Function to update the request count display
function updateRequestCountDisplay() {
    const requestCountDisplay = document.getElementById('request-count');
    requestCountDisplay.innerHTML = `Requests made: ${requestCount} / ${maxRequestsPerMinute}`;
}

// Fetch weather data from the backend
async function fetchWeatherData(city) {
    if (isRequestLimitReached) {
        alert("Request limit reached. Please wait a minute before trying again.");
        return; // Prevent further requests
    }

    // Check if the request count exceeds the limit
    if (requestCount >= maxRequestsPerMinute) {
        // Disable the input and search button
        isRequestLimitReached = true;
        cityInput.disabled = true;
        searchButton.disabled = true;

        alert("You have exceeded your request limit. Please try again later.");

        // Re-enable input and button after 1 minute (cooldown period)
        setTimeout(() => {
            isRequestLimitReached = false;
            cityInput.disabled = false;
            searchButton.disabled = false;
            requestCount = 0; // Reset request count
            updateRequestCountDisplay(); // Update display after reset
            console.log("Request count reset. You can now make requests.");
        }, 60000); // Cooldown period of 1 minute

        return; // Stop further requests
    }

    // Increment the request count and update the display
    requestCount++;
    updateRequestCountDisplay();

    // Now we call the backend to get weather data (backend endpoint)
    const response = await fetch(`/api/weather?city=${city}`);
    if (!response.ok) throw new Error("City not found");
    return response.json();
}

// Fetch forecast data from the backend
async function fetchForecastData(city) {
    const response = await fetch(`/api/forecast?city=${city}`);
    if (!response.ok) throw new Error("Forecast data not available");
    return response.json();
}

// Update weather info on the page
function updateWeatherInfo(data) {
    cityName.textContent = `City: ${data.name}`;
    temperature.textContent = `Temperature: ${data.main.temp.toFixed(1)} °C`;
    humidity.textContent = `Humidity: ${data.main.humidity}%`;
    windSpeed.textContent = `Wind Speed: ${data.wind.speed} km/h`;
}

// Update the temperature chart
function updateChart(data) {
    const labels = data.list.map((item) => new Date(item.dt_txt).toLocaleString());
    const temps = data.list.map((item) => item.main.temp);

    if (temperatureChart) {
        temperatureChart.destroy();
    }

    temperatureChart = new Chart(chartCanvas, {
        type: "line",
        data: {
            labels: labels,
            datasets: [
                {
                    label: "Temperature (°C)",
                    data: temps,
                    borderColor: "#0078d7",
                    backgroundColor: "rgba(0, 120, 215, 0.2)",
                    fill: true,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
        },
    });
}

// Display the map
function displayMap(lat, lon) {
    // Initialize the map only once
    if (!map) {
        map = L.map(mapContainer).setView([lat, lon], 10);  // Set initial view (latitude, longitude, zoom level)

        // Add OpenStreetMap tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);
    }

    // Center the map to the new coordinates and add a marker
    map.setView([lat, lon], 10);
    L.marker([lat, lon]).addTo(map).bindPopup("Weather location").openPopup();
}
