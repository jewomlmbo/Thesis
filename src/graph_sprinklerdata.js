var sprinkler_graph;
var pointRadius = 2; // Set the point radius value here

// Define border color for soil moisture
var soilMoistureBorderColor1 = '#5df06e'; // Choose a color for soil moisture 1
var soilMoistureBorderColor2 = '#c6da2e'; // Choose a color for soil moisture 2
var soilMoistureBorderColor2 = '#da2e8a'; // Choose a color for soil moisture 2
var soilMoistureBorderColor2 = '#2ed7da'; // Choose a color for soil moisture 2

// Function to update the soil moisture chart
function updateChart(sprinkler_soilmoisture1, sprinkler_soilmoisture2, sprinkler_soilmoisture3,sprinkler_soilmoisture4) {
    var canvas = document.getElementById('sprinkler_graph').getContext('2d');

    // Limit the data to the most recent 24 entries
    sprinkler_soilmoisture1 = sprinkler_soilmoisture1.slice(-24);
    sprinkler_soilmoisture2 = sprinkler_soilmoisture2.slice(-24);
    sprinkler_soilmoisture3 = sprinkler_soilmoisture3.slice(-24);
    sprinkler_soilmoisture4 = sprinkler_soilmoisture4.slice(-24);

    if (!sprinkler_graph) {
        sprinkler_graph = new Chart(canvas, {
            type: 'line',
            data: {
                labels: sprinkler_soilmoisture1.map(entry => entry.timestamp),
                datasets: [{
                    label: 'Soil Moisture 1',
                    data: sprinkler_soilmoisture1.map(entry => entry.value),
                    borderColor: soilMoistureBorderColor1,
                    borderWidth: 2,
                    pointRadius: pointRadius,
                    fill: false
                },
                {
                    label: 'Soil Moisture 2',
                    data: sprinkler_soilmoisture2.map(entry => entry.value),
                    borderColor: soilMoistureBorderColor2,
                    borderWidth: 2,
                    pointRadius: pointRadius,
                    fill: false
                },
                {
                    label: 'Soil Moisture 3',
                    data: sprinkler_soilmoisture3.map(entry => entry.value),
                    borderColor: soilMoistureBorderColor3,
                    borderWidth: 2,
                    pointRadius: pointRadius,
                    fill: false
                },
                {
                    label: 'Soil Moisture 4',
                    data: sprinkler_soilmoisture4.map(entry => entry.value),
                    borderColor: soilMoistureBorderColor4,
                    borderWidth: 2,
                    pointRadius: pointRadius,
                    fill: false
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: false,
                    }
                }
            }
        });
    } else {
        // Update the existing chart
        sprinkler_graph.data.labels = sprinkler_soilmoisture1.map(entry => entry.timestamp);
        sprinkler_graph.data.datasets[0].data = sprinkler_soilmoisture1.map(entry => entry.value);
        sprinkler_graph.data.datasets[1].data = sprinkler_soilmoisture2.map(entry => entry.value);
        sprinkler_graph.data.datasets[2].data = sprinkler_soilmoisture3.map(entry => entry.value);
        sprinkler_graph.data.datasets[3].data = sprinkler_soilmoisture4.map(entry => entry.value);
        sprinkler_graph.data.datasets[0].pointRadius = pointRadius;
        sprinkler_graph.data.datasets[1].pointRadius = pointRadius;
        sprinkler_graph.data.datasets[2].pointRadius = pointRadius;
        sprinkler_graph.data.datasets[3].pointRadius = pointRadius;
        sprinkler_graph.update();
    }
}

// Function to fetch all and latest data from ThingSpeak
function fetch_sprinkler() {
    // ThingSpeak Channel ID and API Key
    var channelID = '2390529';
    var apiKey = 'QXMZVXSGBQH8BHJR'; // Replace with your ThingSpeak API Key

    // ThingSpeak API URL to fetch all entries
    var sprinkler_datas = 'https://api.thingspeak.com/channels/' + channelID + '/feeds.json?api_key=' + apiKey;

    // Fetch all data from ThingSpeak
    $.getJSON(sprinkler_datas, function (sprinkler_all_data) {
        // Check if all data is available
        if (sprinkler_all_data && sprinkler_all_data.feeds && sprinkler_all_data.feeds.length > 0) {
            var sprinkler_soilmoisture1 = sprinkler_all_data.feeds.map(function (feed) {
                return {
                    timestamp: new Date(feed.created_at).toLocaleString(),
                    value: parseFloat(feed.field3)
                };
            });

            var sprinkler_soilmoisture2 = sprinkler_all_data.feeds.map(function (feed) {
                return {
                    timestamp: new Date(feed.created_at).toLocaleString(),
                    value: parseFloat(feed.field4)
                };
            });

            var sprinkler_soilmoisture3 = sprinkler_all_data.feeds.map(function (feed) {
                return {
                    timestamp: new Date(feed.created_at).toLocaleString(),
                    value: parseFloat(feed.field5)
                };
            });

            var sprinkler_soilmoisture4 = sprinkler_all_data.feeds.map(function (feed) {
                return {
                    timestamp: new Date(feed.created_at).toLocaleString(),
                    value: parseFloat(feed.field6)
                };
            });

            updateChart(sprinkler_soilmoisture1, sprinkler_soilmoisture2,sprinkler_soilmoisture3,sprinkler_soilmoisture4);
        }
    });
}
function fetch_latest_sprinkler() {
    // ThingSpeak Channel ID and API Key
    var channelID = '2390529';
    var apiKey = 'QXMZVXSGBQH8BHJR'; // Replace with your ThingSpeak API Key
  
    // ThingSpeak API URL to fetch the sensor1_latest entry
    var sprinkler_sensors = 'https://api.thingspeak.com/channels/' + channelID + '/feeds/last.json?api_key=' + apiKey;
  
    // Fetch the sensor1_latest data from ThingSpeak
    $.getJSON(sprinkler_sensors, function (sprinkler_sensor_data) {
        // Check if sensor1_latest data is available
        if (sprinkler_sensor_data) {
            var soil_moisture1 = sprinkler_sensor_data.field3;
            var soil_moisture2 = sprinkler_sensor_data.field4;
            var soil_moisture3 = sprinkler_sensor_data.field5;
            var soil_moisture4 = sprinkler_sensor_data.field6;
  
            var created_at = new Date(sprinkler_sensor_data.created_at).toLocaleString(); // Convert timestamp to a readable date/time
  
            // Update individual elements with sensor1_latest data

            $('#sprinkler_soilmoisture1').html(soil_moisture1);
            $('#sprinkler_soilmoisture2').html(soil_moisture2);
            $('#sprinkler_soilmoisture3').html(soil_moisture3);
            $('#sprinkler_soilmoisture4').html(soil_moisture4);
            $('#sprinkler_timestamp').html(created_at);
  
  
            // Send the latest data to the server
            
        } else {
            $('#sensor1_alldata').html('<p>No sensor1_latest data available</p>');
        }
    });
  }
  
  // Call fetch_latest_sprinkler initially
fetch_latest_sprinkler();
  
  // Call fetch_latest_sprinkler every 10 seconds (adjust interval as needed)
setInterval(fetch_latest_sprinkler, 10000); // 10 seconds interval
  
// Call fetch_sprinkler initially
fetch_sprinkler();

// Call fetch_sprinkler every 10 seconds (adjust interval as needed)
setInterval(fetch_sprinkler, 5000); // 10 seconds interval
