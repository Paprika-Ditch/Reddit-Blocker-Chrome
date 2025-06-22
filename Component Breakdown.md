

#### Component Breakdown Diagram
```
Reddit-Blocker-Chrome Extension/
├── background.js
├── manifest.json
├── popup.html
├── popup.js
└── icons/
    ├── lightdarkmode16.png
    ├── lightdarkmode48.png
    └── lightdarkmode128.png
```


#### Root Files
- **`manifest.json`**  
    Defines the extension's metadata, permissions, and core components.
    - Declares background service worker (`background.js`)
    - Registers popup UI (`popup.html`)
    - Grants permissions for storage, alarms, and declarativeNetRequest
- **`background.js`**  
    The service worker that runs persistently in the background.
    - Installs and removes blocking rules for Reddit
    - Stores blocking state and timer in `chrome.storage.local`
    - Handles challenge generation and validation
    - Listens for `chrome.alarms` to re-enable blocking after timeout
- **`popup.html`**  
    The popup window shown when the user clicks the extension icon.
    - Displays the toggle button
    - Renders the challenge UI dynamically when triggered
    - Includes layout and style for minimal UI interaction
- **`popup.js`**  
    Script loaded by `popup.html` to manage interactivity.
    - Sends messages to `background.js` to toggle blocking or request challenge
    - Displays challenge UI and handles submission
    - Updates UI in real time using countdown and status polling

#### Icons Folder
- **`icons/lightdarkmode16.png`**, **48.png**, **128.png**  
    Used for the extension's icon at various resolutions:
    - `16x16`: toolbar and browser UI
    - `48x48`: Chrome Web Store listing
    - `128x128`: Extension management page


##### Background.js

```
[ Extension Events ]
┌────────────────────────────────────────────┐
│ chrome.runtime.onInstalled                │
│ chrome.runtime.onStartup                  │
└────────────────────────────────────────────┘
               │
               ▼
        ┌──────────────┐
        │ init()       │
        └──────────────┘
           │        │
           ▼        ▼
chrome.alarms.clear()   updateBlockingState(true)
                          │
                          ├── Set isBlocking in storage
                          ├── Add/remove DNR rules
                          ├── Set/remove resumeTime
                          └── Create/clear alarm

────────────────────────────────────────────

[ Runtime Messaging ]
┌────────────────────────────────────┐
│ chrome.runtime.onMessage          │
└────────────────────────────────────┘
           │
           ▼
     ┌──────────────┐
     │ message.type │
     └──────────────┘
       │     │     │     │     │
       ▼     ▼     ▼     ▼     ▼
 getStatus  requestChallenge  submitChallenge  reEnableNow  cancelChallenge
    │             │               │               │               │
    ▼             ▼               ▼               ▼               ▼
read from    generateChallenge   compare     clear alarm     clear current
storage      → currentChallenge  answer →    → updateBlock   challenge
             set in-memory       updateBlock     (true)

────────────────────────────────────────────

[ Alarms ]
┌────────────────────────────────────────────┐
│ chrome.alarms.onAlarm                      │
└────────────────────────────────────────────┘
           │
           ▼
  if (name === "reEnableBlocking")
           │
           ▼
updateBlockingState(true)

────────────────────────────────────────────

[ Port Connection (Popup) ]
┌────────────────────────────────────────────┐
│ chrome.runtime.onConnect (popup)           │
└────────────────────────────────────────────┘
           │
           ▼
port.onDisconnect → currentChallenge = null

────────────────────────────────────────────

[ Helper Function ]
┌────────────────────────────┐
│ generateChallenge(length)  │
└────────────────────────────┘
Returns a random string of A–Z, a–z, 0–9
```

