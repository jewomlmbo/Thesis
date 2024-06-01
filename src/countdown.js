let countdownInterval; // Variable to store the interval
// Function to update the countdown display
function updateCountdown() {
  // Calculate the remaining time in milliseconds
  const currentTime = new Date();
  const remainingTime = lastExpectedDate - currentTime;

  // Check if countdown has reached zero or negative
  if (remainingTime <= 0) {
    // Stop the countdown
    clearInterval(countdownInterval);
    // Set countdown to zero
    document.getElementById('countdown').textContent = '00d 00:00:00';
  } else {
    // Convert milliseconds to seconds
    const remainingSeconds = Math.floor(remainingTime / 1000);

    // Calculate days, hours, minutes, and seconds
    const days = Math.floor(remainingSeconds / (24 * 3600));
    const hours = Math.floor((remainingSeconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((remainingSeconds % 3600) / 60);
    const seconds = remainingSeconds % 60;

    // Display the remaining time in the countdown element
    const countdownElement = document.getElementById('countdown');
    countdownElement.textContent = `${pad(days)}d ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
}

// Function to pad single-digit numbers with a leading zero
function pad(number) {
  return number < 10 ? `0${number}` : number;
}

// Start the countdown interval
countdownInterval = setInterval(updateCountdown, 1000);
