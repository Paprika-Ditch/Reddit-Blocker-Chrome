// popup.js

let timerInterval = null;

// 1. Grab references to our DOM elements.
//    document.getElementById lets us find elements by their `id`.
const toggleButton      = document.getElementById('toggleButton');
const challengeDiv      = document.getElementById('challengeContainer');
const challengeText     = document.getElementById('challengeText');
const challengeInput    = document.getElementById('challengeInput');
const confirmButton     = document.getElementById('confirmButton');
const errorMsg          = document.getElementById('errorMsg');

// 2. Utility: generate a random alphanumeric string of given length.
//    We build it by picking random characters from our `chars` string.
function generateRandomString(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';               // an empty string
  for (let i = 0; i < length; i++) {
    // Math.random() gives [0,1). Multiply by chars.length, floor it to get an index.
    const idx = Math.floor(Math.random() * chars.length);
    result += chars[idx];        // append that character
  }
  return result;
}

// 3. Show the challenge UI and wire up the confirmation logic.
function promptForConfirmation(onConfirmed) {
  // Hide the toggle button so they can’t click it again
  toggleButton.style.display = 'none';

  // Generate and display 10-char challenge
  const code = generateRandomString(10);
  challengeText.innerText = code;
  challengeInput.value = '';       // clear any previous input
  errorMsg.style.display = 'none'; // hide error message
  challengeDiv.style.display = 'block';

  // Once they click “Confirm”, check if it matches
  confirmButton.onclick = () => {
    if (challengeInput.value === code) {
      // If correct, invoke the callback
      onConfirmed();
    } else {
      // Otherwise show error and optionally regenerate
      errorMsg.style.display = 'block';
      // Uncomment to force a new code each try:
      // promptForConfirmation(onConfirmed);
    }
  };

  // Also allow pressing Enter in the input to trigger confirmation
  challengeInput.onkeydown = (e) => {
    if (e.key === 'Enter') {
      confirmButton.click();
    }
  };

  // Focus the input right away
  challengeInput.focus();
}

// 4. The original toggle logic, extracted into its own function
function doToggle() {
  // Clear any previous alarm and then toggle
  chrome.alarms.clear('reEnableBlocking').then(() => {
    return chrome.runtime.sendMessage({ action: 'toggleBlocking' });
  }).then((response) => {
    if (response && typeof response.isBlocking === 'boolean') {
      updateButton(response.isBlocking);
    }
  });
}

// 5. Hook up the toggle button to prompt first
toggleButton.addEventListener('click', () => {
  // If currently blocking, then they’re clicking “Disable for 5 min”
  // so we ask them to confirm.
  chrome.storage.local.get('isBlocking', (data) => {
    const isBlocking = data.isBlocking !== false;
    if (isBlocking) {
      promptForConfirmation(doToggle);
    } else {
      // If already disabled, clicking is “Don’t re-enable yet”?
      // You can decide if you want a challenge here too.
      doToggle();
    }
  });
});

// --- The rest of your existing code for countdown, updateButton, etc. ---

function checkCountdown(isBlocking, resumeTime) {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  if (!isBlocking && resumeTime && resumeTime > Date.now()) {
    updateCountdownButton(resumeTime);
    timerInterval = setInterval(() => updateCountdownButton(resumeTime), 1000);
  } else {
    toggleButton.textContent = isBlocking
      ? 'Disable for 5 min'
      : 'Re-enabling in 5 min...';
    toggleButton.style.display = 'block';
    challengeDiv.style.display = 'none';
  }
}

function updateCountdownButton(resumeTime) {
  const remainingMs = resumeTime - Date.now();
  if (remainingMs > 0) {
    const min = Math.floor(remainingMs / 60000);
    const sec = Math.floor((remainingMs % 60000) / 1000);
    toggleButton.textContent = `Re-enabling in ${min}:${sec < 10 ? '0':''}${sec}...`;
  } else {
    clearInterval(timerInterval);
    timerInterval = null;
    chrome.storage.local.get('isBlocking', (data) => {
      updateButton(data.isBlocking !== false);
    });
  }
}

function updateButton(isBlocking) {
  chrome.storage.local.get('resumeTime', (data) => {
    checkCountdown(isBlocking, data.resumeTime);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get(['isBlocking', 'resumeTime'], (data) => {
    const isBlocking = data.isBlocking !== false;
    checkCountdown(isBlocking, data.resumeTime);
  });
});
