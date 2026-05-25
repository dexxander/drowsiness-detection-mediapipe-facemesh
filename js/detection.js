// Landmark indices for the eyes
const LEFT_EYE = [33, 160, 158, 133, 153, 144];
const RIGHT_EYE = [362, 385, 387, 263, 373, 380];

// --- Global State for Visuals ---
let currentDriverState = "NEUTRAL";

// --- Drowsiness Logic Variables ---
let sleepStart = null;
let isAlarmPlaying = false; 

// --- Distraction Logic Variables ---
let distractionStart = null;
let isDistractionAlarmPlaying = false;
const SLEEP_THRESHOLD = 0.20; 
const SLEEP_TIME = 5000; 

function calculateEAR(landmarks) {
    const v1 = Math.hypot(landmarks[1].x - landmarks[5].x, landmarks[1].y - landmarks[5].y);
    const v2 = Math.hypot(landmarks[2].x - landmarks[4].x, landmarks[2].y - landmarks[4].y);
    const h = Math.hypot(landmarks[0].x - landmarks[3].x, landmarks[0].y - landmarks[3].y);
    return (v1 + v2) / (2.0 * h);
}

function detectExpression(landmarks) {
    const leftEye = calculateEAR([landmarks[33], landmarks[160], landmarks[158], landmarks[133], landmarks[153], landmarks[144]]);
    const rightEye = calculateEAR([landmarks[362], landmarks[385], landmarks[387], landmarks[263], landmarks[373], landmarks[380]]);
    const avgEAR = (leftEye + rightEye) / 2;

    const mouthDistance = Math.abs(landmarks[13].y - landmarks[14].y);
    const isYawning = mouthDistance > 0.05;
    const browDistance = Math.abs(landmarks[52].y - landmarks[159].y);

    if (isYawning) return "YAWNING";
    if (avgEAR < 0.25 && avgEAR > 0.20 && browDistance < 0.04) return "TIRED";
    if (avgEAR <= 0.20) return "EYES CLOSED";
    
    return "NEUTRAL";
}

function checkDrowsiness(ear) {
    const statusBadge = document.getElementById('drive-status');
    const timerCard = document.getElementById('timer-card');
    const timerVal = document.getElementById('timer-val');
    const alarmSound = document.getElementById('alarm-sound');

    const INTERNAL_THRESHOLD = 0.20; 

    if (ear < INTERNAL_THRESHOLD) {
        if (!sleepStart) sleepStart = Date.now();
        const duration = (Date.now() - sleepStart) / 1000; 

        if (duration >= 1.0) {
            currentDriverState = "DROWSY"; // Triggers the red visuals
            
            if(statusBadge) {
                statusBadge.innerText = "EYE IS CLOSED";
                statusBadge.className = "status-warning";
            }
            if(timerCard) timerCard.style.display = "block"; 
            if(timerVal) timerVal.innerText = duration.toFixed(1) + "s";
        }

        if (duration >= 3.0) {
            if(statusBadge) {
                statusBadge.innerText = "WARNING: DROWSINESS!";
                statusBadge.className = "status-danger";
            }
            
            if (!isAlarmPlaying) {
                playAlarm(alarmSound);
                isAlarmPlaying = true;
            }
        }
    } else {
        // RESET Logic
        sleepStart = null;
        currentDriverState = "NEUTRAL"; // Reverts to green visuals
        
        if (isAlarmPlaying) {
            stopAlarm(alarmSound);
            isAlarmPlaying = false;
        }
        
        if (statusBadge && statusBadge.innerText !== "WARNING: DISTRACTED!") {
            statusBadge.innerText = "Active";
            statusBadge.className = "status-safe";
            if(timerCard) timerCard.style.display = "none"; 
        }
    }
}

function detectHeadPose(landmarks) {
    const nose = landmarks[1];          
    const leftEye = landmarks[33];      
    const rightEye = landmarks[263];    
    const chin = landmarks[152];        
    const forehead = landmarks[10];     

    const eyeCenter = (leftEye.x + rightEye.x) / 2;
    const yaw = (nose.x - eyeCenter) * 100; 
    const faceHeight = chin.y - forehead.y;
    const noseRelativePos = (nose.y - forehead.y) / faceHeight;
    const pitch = (noseRelativePos - 0.5) * 100; 

    if (yaw > 12) return "LOOKING RIGHT";
    if (yaw < -12) return "LOOKING LEFT";
    if (pitch > 8) return "LOOKING DOWN"; 
    
    return "FORWARD";
}

function checkDistraction(headPose) {
    const statusBadge = document.getElementById('drive-status');
    const distractionAudio = document.getElementById('distraction-sound');

    if (headPose !== "FORWARD") {
        if (!distractionStart) distractionStart = Date.now();
        const duration = (Date.now() - distractionStart) / 1000;

        if (duration >= 3.0) {
            if(statusBadge) {
                statusBadge.innerText = "WARNING: DISTRACTED!";
                statusBadge.className = "status-danger";
            }
            if (!isDistractionAlarmPlaying) {
                playDistractionAlarm();
                isDistractionAlarmPlaying = true;
            }
        } else {
            if(statusBadge) {
                statusBadge.innerText = "LOOK FORWARD";
                statusBadge.className = "status-warning";
            }
        }
    } else {
        distractionStart = null;
        if (isDistractionAlarmPlaying) {
            stopDistractionAlarm();
            isDistractionAlarmPlaying = false;
        }
        
        if (statusBadge && (statusBadge.innerText === "WARNING: DISTRACTED!" || statusBadge.innerText === "LOOK FORWARD")) {
            statusBadge.innerText = "Active";
            statusBadge.className = "status-safe";
        }
    }
}

function playDistractionAlarm() {
    const distractionAudio = document.getElementById('distraction-sound');
    if (distractionAudio) {
        distractionAudio.loop = true; 
        distractionAudio.play().catch(e => console.error("Distraction audio failed:", e));
    }
}

function playAlarm(audioElement) {
    if (audioElement) {
        audioElement.play().catch(e => console.log("User interaction required for audio"));
    }
}

function stopDistractionAlarm() {
    const distractionAudio = document.getElementById('distraction-sound');
    if (distractionAudio) {
        distractionAudio.pause();
        distractionAudio.currentTime = 0; 
    }
}

function stopAlarm(audioElement) {
    if (audioElement) {
        audioElement.pause();
        audioElement.currentTime = 0; 
    }
}


// ==========================================
// --- NEW OVERLAY VISUALIZATION LOGIC ---
// ==========================================

function drawVisuals(ctx, landmarks, canvasWidth, canvasHeight) {
    // 1. Calculate Face Bounding Box
    let minX = Infinity, minY = Infinity, maxX = 0, maxY = 0;
    for (let lm of landmarks) {
        const x = lm.x * canvasWidth;
        const y = lm.y * canvasHeight;
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
    }

    // Add margin/padding to the bounding box
    minX -= 20; minY -= 40; maxX += 20; maxY += 20;
    
    // Draw the green face box
    ctx.strokeStyle = '#00FF00';
    ctx.lineWidth = 3;
    ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);

    // 2. Draw Eyes
    drawEyeDetails(ctx, landmarks, LEFT_EYE, canvasWidth, canvasHeight, currentDriverState === "DROWSY");
    drawEyeDetails(ctx, landmarks, RIGHT_EYE, canvasWidth, canvasHeight, currentDriverState === "DROWSY");

    // 3. Draw Text Overlay
    ctx.font = 'bold 28px Arial';
    if (currentDriverState === "DROWSY") {
        ctx.fillStyle = '#FF0000'; // Red Text
        ctx.fillText('DROWSINESS DETECTED', minX, minY - 40);
        ctx.fillText('EYES CLOSED', minX, minY - 10);
    } else {
        ctx.fillStyle = '#00FF00'; // Green Text
        ctx.fillText('NEUTRAL', minX, minY - 10);
    }
}

function drawEyeDetails(ctx, landmarks, indices, width, height, isDrowsy) {
    ctx.beginPath();
    let eMinX = Infinity, eMinY = Infinity, eMaxX = 0, eMaxY = 0;

    // Trace the eye shape and find bounds
    for (let i = 0; i < indices.length; i++) {
        const pt = landmarks[indices[i]];
        const x = pt.x * width;
        const y = pt.y * height;

        if (x < eMinX) eMinX = x;
        if (y < eMinY) eMinY = y;
        if (x > eMaxX) eMaxX = x;
        if (y > eMaxY) eMaxY = y;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.closePath();
    
    // Draw green eye outline (Always on)
    ctx.strokeStyle = '#00FF00';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw red square over eyes ONLY if drowsy
    if (isDrowsy) {
        const pad = 10;
        eMinX -= pad; eMinY -= pad; eMaxX += pad; eMaxY += pad;
        ctx.strokeStyle = '#FF0000';
        ctx.lineWidth = 3;
        ctx.strokeRect(eMinX, eMinY, eMaxX - eMinX, eMaxY - eMinY);
    }
}