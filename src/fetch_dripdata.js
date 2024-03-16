// fetch_sensor1.js

// Function to fetch sensor1_latest data from ThingSpeak
function fetch_lates_drip() {
  // ThingSpeak Channel ID and API Key
  var channelID = '2357301';
  var apiKey = '9C9EWD0HC4WSXRCZ'; // Replace with your ThingSpeak API Key

  // ThingSpeak API URL to fetch the sensor1_latest entry
  var drip_sensors = 'https://api.thingspeak.com/channels/' + channelID + '/feeds/last.json?api_key=' + apiKey;

  // Fetch the sensor1_latest data from ThingSpeak
  $.getJSON(drip_sensors, function (drip_sensor_datas) {
      // Check if sensor1_latest data is available
      if (drip_sensor_datas) {
          var air_temperature = drip_sensor_datas.field1;
          var humidity = drip_sensor_datas.field2;
          var soil_moisture1 = drip_sensor_datas.field3;
          var soil_moisture2 = drip_sensor_datas.field4;
          var soil_moisture3 = drip_sensor_datas.field5;
          var soil_moisture4 = drip_sensor_datas.field6;

          var created_at = new Date(drip_sensor_datas.created_at).toLocaleString(); // Convert timestamp to a readable date/time

          // Update individual elements with sensor1_latest data
          $('#air_temperature').html(air_temperature);
          $('#air_humidity').html(humidity);
          $('#drip_soilmoisture1').html(soil_moisture1);
          $('#drip_soilmoisture2').html(soil_moisture2);
          $('#drip_soilmoisture3').html(soil_moisture3);
          $('#drip_soilmoisture4').html(soil_moisture4);
          $('#drip_timestamp1').html(created_at);
          $('#drip_timestamp2').html(created_at);

          // Construct HTML for the sensor1_latest entry (optional, based on your needs)
         
         /* $.ajax({
              type: 'POST', // Assuming this is the endpoint you set up on your server
              data: { air_temperature, humidity,soil_moisture1, soil_moisture2, timestamp: created_at },
              success: function (response) {
                  console.log(response);
              },
              error: function (error) {
                  console.error(error);
              },
          });*/
      } else {
          $('#sensor1_alldata').html('<p>No sensor1_latest data available</p>');
      }
  });
}

// Call fetch_lates_drip initially
fetch_lates_drip();

// Call fetch_lates_drip every 10 seconds (adjust interval as needed)
setInterval(fetch_lates_drip, 1000); // 10 seconds interval
