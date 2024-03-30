var airGraph;
var soilMoistureGraph;
var pointRadius = 2; // Set the point radius value here

// Define border colors
var temperatureBorderColor = '#5a57ff';
var humidityBorderColor = '#e94949';
var soilMoistureBorderColor1 = '#5df06e'; // Color for soil moisture 1
var soilMoistureBorderColor2 = '#c6da2e'; // Color for soil moisture 2
var soilMoistureBorderColor3 = '#da2e8a'; // Color for soil moisture 3
var soilMoistureBorderColor4 = '#2ed7da'; // Color for soil moisture 4

// Function to update the air temperature and humidity chart
function updateAirChart(air_temperature, air_humidity) {
    var canvas = document.getElementById('air_graph').getContext('2d');

    if (!airGraph) {
        airGraph = new Chart(canvas, {
            type: 'line',
            data: {
                labels: air_temperature.map(entry => entry.timestamp),
                datasets: [{
                        label: 'Temperature',
                        data: air_temperature.map(entry => entry.value),
                        backgroundColor: '#5a57ff',
                        borderColor: temperatureBorderColor,
                        borderWidth: 2,
                        pointRadius: pointRadius,
                        fill: true
                    },
                    {
                        label: 'Humidity (°C)',
                        data: air_humidity.map(entry => entry.value),
                        borderColor: humidityBorderColor,
                        backgroundColor: '#e94949',
                        borderWidth: 2,
                        pointRadius: pointRadius,
                        fill: true
                    }
                ]
            },
            options: {
                scales: {
                    x: {
                        ticks: {
                            display: false
                        }
                    },
                    y: {
                        beginAtZero: false,
                    }
                }
            }
        });
    } else {
        // Update the existing chart
        airGraph.data.labels = air_temperature.map(entry => entry.timestamp);
        airGraph.data.datasets[0].data = air_temperature.map(entry => entry.value);
        airGraph.data.datasets[1].data = air_humidity.map(entry => entry.value);
        airGraph.data.datasets[0].pointRadius = pointRadius;
        airGraph.data.datasets[1].pointRadius = pointRadius;
        airGraph.update();
    }
}

// Function to update the soil moisture chart
function updateSoilMoistureChart(drip_soilmoisture1, drip_soilmoisture2, drip_soilmoisture3, drip_soilmoisture4) {
    var canvas = document.getElementById('soil_moisture_graph').getContext('2d');

    if (!soilMoistureGraph) {
        soilMoistureGraph = new Chart(canvas, {
            type: 'line',
            data: {
                labels: drip_soilmoisture1.map(entry => entry.timestamp),
                datasets: [{
                        label: 'Soil Moisture 1',
                        data: drip_soilmoisture1.map(entry => entry.value),
                        backgroundColor: '#5df06e7d',
                        borderColor: soilMoistureBorderColor1,
                        borderWidth: 2,
                        pointRadius: pointRadius,
                        fill: false
                    },
                    {
                        label: 'Soil Moisture 2',
                        data: drip_soilmoisture2.map(entry => entry.value),
                        backgroundColor: '#c6da2e78',
                        borderColor: soilMoistureBorderColor2,
                        borderWidth: 2,
                        pointRadius: pointRadius,
                        fill: false
                    },
                    {
                        label: 'Soil Moisture 3',
                        data: drip_soilmoisture3.map(entry => entry.value),

                        borderColor: soilMoistureBorderColor3,
                        borderWidth: 2,
                        pointRadius: pointRadius,
                        fill: false
                    },
                    {
                        label: 'Soil Moisture 4',
                        data: drip_soilmoisture4.map(entry => entry.value),
                        backgroundColor: '#2ed7da61',
                        borderColor: soilMoistureBorderColor4,
                        borderWidth: 2,
                        pointRadius: pointRadius,
                        fill: false
                    }
                ]
            },
            options: {
                scales: {
                    x: {
                        ticks: {
                            display: false // Hide the labels on x-axis
                        }
                    },
                    y: {
                        beginAtZero: false,
                    }
                }
            }
        });
    } else {
        // Update the existing chart
        soilMoistureGraph.data.labels = drip_soilmoisture1.map(entry => entry.timestamp);
        soilMoistureGraph.data.datasets[0].data = drip_soilmoisture1.map(entry => entry.value);
        soilMoistureGraph.data.datasets[1].data = drip_soilmoisture2.map(entry => entry.value);
        soilMoistureGraph.data.datasets[2].data = drip_soilmoisture3.map(entry => entry.value);
        soilMoistureGraph.data.datasets[3].data = drip_soilmoisture4.map(entry => entry.value);
        soilMoistureGraph.data.datasets[0].pointRadius = pointRadius;
        soilMoistureGraph.data.datasets[1].pointRadius = pointRadius;
        soilMoistureGraph.data.datasets[2].pointRadius = pointRadius;
        soilMoistureGraph.data.datasets[3].pointRadius = pointRadius;
        soilMoistureGraph.update();
    }
}
function updateSoilMoistureBarChart() {
    var canvas = document.getElementById('soil_moisture_bar_chart').getContext('2d');

    // Create a new bar chart with static data
    var soilMoistureGraph = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: ['Sensor 1', 'Sensor 2', 'Sensor 3', 'Sensor 4'],
            datasets: [{
                label: 'Soil Moisture',
                data: [40, 60, 80, 20], // Dummy data for soil moisture (replace with actual data)
                backgroundColor: ['#5df06e', '#c6da2e', '#da2e8a', '#2ed7da'],
                borderColor: ['#5df06e', '#c6da2e', '#da2e8a', '#2ed7da'],
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}




// Function to fetch all and latest data from ThingSpeak
function fetch_drip() {
    // ThingSpeak Channel ID and API Key
    var channelID = '2357301';
    var apiKey = '9C9EWD0HC4WSXRCZ'; // Replace with your ThingSpeak API Key

    // ThingSpeak API URL to fetch all entries
    var drip_datas = 'https://api.thingspeak.com/channels/' + channelID + '/feeds.json?api_key=' + apiKey;

    // Fetch all data from ThingSpeak
    $.getJSON(drip_datas, function (drip_all_data) {
        // Check if all data is available
        if (drip_all_data && drip_all_data.feeds && drip_all_data.feeds.length > 0) {
            var air_temperature = drip_all_data.feeds.map(function (feed) {
                return {
                    timestamp: new Date(feed.created_at).toLocaleString(),
                    value: parseFloat(feed.field1)
                };
            });

            var air_humidity = drip_all_data.feeds.map(function (feed) {
                return {
                    timestamp: new Date(feed.created_at).toLocaleString(),
                    value: parseFloat(feed.field2)
                };
            });

            var drip_soilmoisture1 = drip_all_data.feeds.map(function (feed) {
                return {
                    timestamp: new Date(feed.created_at).toLocaleString(),
                    value: parseFloat(feed.field3)
                };
            });

            var drip_soilmoisture2 = drip_all_data.feeds.map(function (feed) {
                return {
                    timestamp: new Date(feed.created_at).toLocaleString(),
                    value: parseFloat(feed.field4)
                };
            });
            
            var drip_soilmoisture3 = drip_all_data.feeds.map(function (feed) {
                return {
                    timestamp: new Date(feed.created_at).toLocaleString(),
                    value: parseFloat(feed.field5)
                };
            });

            var drip_soilmoisture4 = drip_all_data.feeds.map(function (feed) {
                return {
                    timestamp: new Date(feed.created_at).toLocaleString(),
                    value: parseFloat(feed.field6)
                };
            });
            

            updateAirChart(air_temperature, air_humidity);
            updateSoilMoistureChart(drip_soilmoisture1, drip_soilmoisture2, drip_soilmoisture3, drip_soilmoisture4);
            updateSoilMoistureBarChart(drip_soilmoisture1, drip_soilmoisture2, drip_soilmoisture3, drip_soilmoisture4);
        }
    });
}

// Call fetch_drip initially
fetch_drip();

// Call fetch_drip every 10 seconds (adjust interval as needed)
setInterval(fetch_drip, 10000); // 10 seconds interval
