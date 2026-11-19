# Driver Drowsiness & Head Pose Detection System (Open Source)

A logic-based facial tracking system designed to identify driver fatigue and distractions in real-time. Created by **Dexter Oliver Robilin**.

## 🧠 Core Logic (`detection.js`)
This repository showcases the core detection algorithms built to parse facial landmark data (e.g., from MediaPipe). Features include:
* **EAR (Eye Aspect Ratio) Calculation:** Detects micro-sleeps and prolonged eye closures.
* **Yawn Detection:** Analyzes the distance between the upper and lower lip landmarks.
* **Head Pose Estimation:** Calculates Pitch (vertical tilt) and Yaw (horizontal rotation) to detect phone usage or looking away from the road.
* **Time-gated Alert System:** Escalates from warnings (1s) to critical alarms (3s) to prevent false positives during natural blinking.

## 🚀 How to Run Locally

Because modern web browsers require a local server to properly load external files (like audio files and modules), you cannot just double-click the `index.html` file. 

Follow one of these methods to run it on `localhost`:

**Method 1: Using VS Code (Recommended)**
1. Open this project folder in Visual Studio Code.
2. Install the **Live Server** extension by Ritwick Dey.
3. Right-click `index.html` and select **"Open with Live Server"**.

**Method 2: Using Python**
If you have Python installed, open your terminal, navigate to this project folder, and run:
* Python 3: `python -m http.server 8000`
* Then open `http://localhost:8000` in your browser.

**Method 3: Using Node.js**
If you have Node.js installed, open your terminal and run:
* `npx serve`
* Then open the local link provided in the terminal.
