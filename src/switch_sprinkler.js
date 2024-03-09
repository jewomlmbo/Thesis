var sprinkler_switch_channel = '2402222';
var sprinklerswitch_readkey = 'AR6JJP2H3XJPYA72';
var sprinklerswitch_writekey = 'HPW6GCEL83G2UAZ2';

/*var sprinkler_switch_channel = '2390529';
var sprinklerswitch_readkey = 'QXMZVXSGBQH8BHJR';
var sprinklerswitch_writekey = '3N8AFCTPXSA3CBKG';*/

var sprinkler_masterswitch_channel = '2402223';
var sprinkler_masterswitch_readkey = '2UQLL6B4TON0C1MV';
var sprinkler_masterswitch_writekey = 'NLVRYW33LCS8U8XP';

var isSwitch1Enabled = true; // Disable state for switch 1
var isSwitch2Enabled = true; // Disable state for switch 2
var isField5Cooldown = false;
// Fetch the latest value for field 5 from ThingSpeak
function getLatestValueField5() {
fetch('https://api.thingspeak.com/channels/' + sprinkler_switch_channel + '/fields/5.json?results=1')
  .then(response => response.json())
  .then(data => {
    if (data && data.feeds && data.feeds.length > 0) {
      var latestValue = parseFloat(data.feeds[0].field5);
      // Set the position of the slider based on the latest value
      document.getElementById("slider1").value = latestValue;
      document.getElementById("sliderValue1").innerHTML = latestValue;
      // Display the latest value and timestamp
      displayLatestFieldValueAndTimestamp5(data.feeds[0].field5, data.feeds[0].created_at);
    }
  })
  .catch(error => {
    console.error('Error fetching latest value for field 5:', error);
  });
}

// Fetch the latest value for field 6 from ThingSpeak
function getLatestValueField6() {
fetch('https://api.thingspeak.com/channels/' + sprinkler_masterswitch_channel + '/fields/6.json?results=1')
  .then(response => response.json())
  .then(data => {
    if (data && data.feeds && data.feeds.length > 0) {
      var latestValue = parseFloat(data.feeds[0].field6);
      // Set the position of the slider based on the latest value
      document.getElementById("slider2").value = latestValue;
      document.getElementById("sliderValue2").innerHTML = latestValue;
      // Display the latest value and timestamp
      displayLatestFieldValueAndTimestamp6(data.feeds[0].field6, data.feeds[0].created_at);
    }
  })
  .catch(error => {
    console.error('Error fetching latest value for field 6:', error);
  });
}

// Update the position of the field5 switch
function updateField5Position() {
setInterval(function () {
  getLatestValueField5();
}, 1000); // Update every 5 seconds
}

// Update the position of the field6 switch
function updateField6Position() {
setInterval(function () {
  getLatestValueField6();
  handleSwitch1BasedOnField6(); // Check and handle switch 1 based on field 6
}, 1000); // Update every 5 seconds
}


function handleSwitch1BasedOnField6() {
var field6Value = parseFloat(document.getElementById("slider2").value);

if (field6Value === 0) {
  // If field 6 is 0, disable the switch for field 5 if it's not in cooldown
  if (!isField5Cooldown) {
    disableSwitch1();
    // Start a 15-second cooldown for the field 5 switch
    startField5Cooldown();
  }
} else if(field6Value === 1){
  // If field 6 is 1, enable the switch for field 5 if it's not in cooldown
  if (!isField5Cooldown) {
    enableSwitch1();
  }
}
}
function startField5Cooldown() {
isField5Cooldown = true;
setTimeout(function () {
  isField5Cooldown = false; // Reset the cooldown after 15 seconds
}, 15000);
}
// Disable switch 1
function disableSwitch1() {
isSwitch1Enabled = false;
document.getElementById("slider1").disabled = true;
}

// Enable switch 1
function enableSwitch1() {
if (!isSwitch1Enabled) {
  isSwitch1Enabled = true;
  document.getElementById("slider1").disabled = false;

  // Schedule re-enabling of the switch after 15 seconds
  setTimeout(function () {
    isSwitch1Enabled = true;
    document.getElementById("slider1").disabled = false;
  }, 15000);
}
}
updateField5Position(); // Start updating the position of field5 switch
updateField6Position(); // Start updating the position of field6 switch

function updateThingSpeak5() {
  var sliderValue = document.getElementById("slider1").value;
  document.getElementById("sliderValue1").innerHTML = sliderValue;

  if (!isSwitch1Enabled || isField5Cooldown) {
    return; // Do nothing if the switch is disabled or in cooldown
  }

  // Disable the switch
  isSwitch1Enabled = false;
  document.getElementById("slider1").disabled = true;

  // Start a 15-second cooldown for the field 5 switch
  startField5Cooldown();

  // Send the slider value to ThingSpeak directly for field 5
  sendToThingSpeak5(sliderValue);
}




function updateThingSpeak6() {
  var sliderValue = document.getElementById("slider2").value;
  document.getElementById("sliderValue2").innerHTML = sliderValue;

  if (!isSwitch2Enabled) {
    return; // Do nothing if the switch is disabled
  }

  // Disable the switch for 15 seconds
  isSwitch2Enabled = false;
  document.getElementById("slider2").disabled = true;

  setTimeout(function() {
    isSwitch2Enabled = true; // Enable the switch after 15 seconds
    document.getElementById("slider2").disabled = false;
  }, 15000);

  // Send the slider value to ThingSpeak directly for field 6
  sendToThingSpeak6(sliderValue);
}

function sendToThingSpeak5(value) {
  fetch('https://api.thingspeak.com/update?api_key='+sprinklerswitch_writekey+'&field5=' + value)
    .then(response => response.text())
    .then(data => {
      console.log(data);
      alert('Value sent to ThingSpeak for field 5 successfully!');
    })
    .catch(error => {
      console.error('Error sending value to ThingSpeak for field 5:', error);
      alert('Error sending value to ThingSpeak for field 5. Please try again.');
    });
}

function sendToThingSpeak6(value) {
  fetch('https://api.thingspeak.com/update?api_key='+sprinkler_masterswitch_writekey+'&field6=' + value)
    .then(response => response.text())
    .then(data => {
      console.log(data);
      alert('Value sent to ThingSpeak for field 6 successfully!');
    })
    .catch(error => {
      console.error('Error sending value to ThingSpeak for field 6:', error);
      alert('Error sending value to ThingSpeak for field 6. Please try again.');
    });
}


$(document).ready(function () {
    // Fetch solenoid status initially
    fetchSolenoidStatus();

    // Set interval to continuously update solenoid status every second
    setInterval(fetchSolenoidStatus, 1000);

    function fetchSolenoidStatus() {
        // ThigSpeak API URL to fetch the latest entry
        var solenoidStatusURL = 'https://api.thingspeak.com/channels/' + sprinkler_switch_channel + '/feeds/last.json?api_key=' + sprinklerswitch_readkey;

        // Fetch the data from ThingSpeak
        $.getJSON(solenoidStatusURL, function (solenoidData) {
            if (solenoidData) {
                var solenoidValue = solenoidData.field5;
                var solenoidStatus = (solenoidValue == 1) ? 'On' : 'Off';
                var createdAt = new Date(solenoidData.created_at).toLocaleString(); // Convert timestamp to a readable date/time

                // Update HTML elements with solenoid status, value, and timestamp
                $('#sprinkler_solenoid').html(solenoidValue);
                $('#sprinkler_solenoidstatus').html(solenoidStatus);
                $('#sprinkler_solenoidtimestamp').html( createdAt);

                // Additional code if needed
            }
        });
    }
});