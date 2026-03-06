// script.js - Frontend logic

const chatBox = document.getElementById('chatBox');
const userInput = document.getElementById('userInput');
const typingIndicator = document.getElementById('typingIndicator');
const voiceBtn = document.getElementById('voiceBtn');
let currentLanguage = 'en-US'; // Default English. Tamil is 'ta-IN'

// --- INIT ---
document.addEventListener("DOMContentLoaded", () => {
    loadChatHistory();
});

// --- UI INTERACTIONS ---

// Toggle Dark Mode
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    document.getElementById('themeToggleBtn').innerHTML = isDark
        ? '<i class="fa-solid fa-sun"></i> Light Mode'
        : '<i class="fa-solid fa-moon"></i> Dark Mode';
}

// Toggle Language
function toggleLanguage() {
    if (currentLanguage === 'en-US') {
        currentLanguage = 'ta-IN';
        document.getElementById('langToggleBtn').innerHTML = '<i class="fa-solid fa-language"></i> Lang: Tamil';
    } else {
        currentLanguage = 'en-US';
        document.getElementById('langToggleBtn').innerHTML = '<i class="fa-solid fa-language"></i> Lang: English';
    }
}

// Modals
function openModal(modalId) { document.getElementById(modalId).style.display = 'flex'; }
function closeModal(modalId) { document.getElementById(modalId).style.display = 'none'; }
window.onclick = function (event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = "none";
    }
}

// --- CHAT LOGIC ---

function appendMessage(text, sender) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${sender}-message`;
    const contentDiv = document.createElement('div');
    contentDiv.className = 'msg-content';
    contentDiv.innerHTML = text; // allow HTML like links
    msgDiv.appendChild(contentDiv);

    // Insert before typing indicator
    chatBox.insertBefore(msgDiv, typingIndicator);
    scrollToBottom();
}

function scrollToBottom() {
    chatBox.scrollTop = chatBox.scrollHeight;
}

function handleEnter(e) {
    if (e.key === 'Enter') sendMessage();
}

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    const apiKey = document.getElementById('groqApiKey').value.trim();
    if (!apiKey) {
        alert("Please enter your Groq API Key in the sidebar to chat with the AI.");
        return;
    }

    // Show user msg
    appendMessage(text, 'user');
    userInput.value = '';

    // Save to LocalStorage
    saveChatToDB(text, 'user');

    // Show typing
    typingIndicator.style.display = 'flex';
    scrollToBottom();

    try {
        let system_prompt = "You are a SMART RURAL HEALTHCARE CHATBOT AI. You act as a primary assessment layer for rural patients.\n\n" +
            "CORE FUNCTIONS:\n" +
            "1. SYMPTOM CHECKING: Ask clarifying questions about symptoms before offering potential (non-diagnostic) causes.\n" +
            "2. MEDICINE ADVICE: Explain common uses and side-effects of generic medicines. DO NOT prescribe specific dosages without telling the user to confirm with a doctor.\n" +
            "3. EMERGENCY DETECTION: If a user describes severe symptoms (chest pain, heavy bleeding, stroke signs, difficulty breathing), IMMEDIATELY tell them to press the 'Emergency Alert' button or call 108.\n" +
            "4. HOSPITAL/CLINIC FINDING: If they ask for nearby facilities, remind them they can use the 'Nearby Hospitals' tool in the sidebar.\n\n" +
            "Tone: Supportive, clear, and medically safe.";

        if (currentLanguage === 'ta-IN') {
            system_prompt += "\n\nCRITICAL: YOU MUST REPLY ENTIRELY IN TAMIL LANGUAGE. (தமிழ் மொழியில் பதிலளிக்கவும்). Do not use English words.";
        } else {
            system_prompt += "\n\nCRITICAL: YOU MUST REPLY IN ENGLISH.";
        }

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: system_prompt },
                    { role: "user", content: text }
                ],
                temperature: 0.5,
                max_tokens: 512
            })
        });

        const data = await response.json();
        typingIndicator.style.display = 'none';

        if (response.ok && data.choices && data.choices.length > 0) {
            const reply = data.choices[0].message.content;
            appendMessage(reply, 'bot');
            saveChatToDB(reply, 'bot');
            speakText(reply);
        } else {
            console.error(data);
            appendMessage("Sorry, there was an error with the API Key or Groq service.", 'bot');
        }
    } catch (err) {
        typingIndicator.style.display = 'none';
        appendMessage("Network error reaching Groq API. Please try again.", 'bot');
        console.error(err);
    }
}

async function saveChatToDB(msg, sender) {
    let history = JSON.parse(localStorage.getItem('healthcare_chat_history')) || [];
    history.push({ message: msg, sender: sender, created_at: new Date().toISOString() });
    localStorage.setItem('healthcare_chat_history', JSON.stringify(history));
}

async function loadChatHistory() {
    try {
        const history = JSON.parse(localStorage.getItem('healthcare_chat_history')) || [];

        chatBox.innerHTML = `
            <div class="message bot-message">
                <div class="msg-content">Hello! I am your Smart Rural Healthcare Assistant. Please enter your Groq API Key in the sidebar to start! How can I help you today?</div>
            </div>
        `;
        chatBox.appendChild(typingIndicator);

        if (history.length > 0) {
            history.forEach(row => {
                appendMessage(row.message, row.sender);
            });
        }
    } catch (err) {
        console.error("Failed to load history", err);
    }
}

// --- VOICE (STT & TTS) ---

// Speech Recognition (Web Speech API)
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    voiceBtn.addEventListener('click', () => {
        recognition.lang = currentLanguage;
        recognition.start();
        voiceBtn.classList.add('recording');
        userInput.placeholder = "Listening...";
    });

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        userInput.value = transcript;
        sendMessage();
    };

    recognition.onend = () => {
        voiceBtn.classList.remove('recording');
        userInput.placeholder = "Type your message here...";
    };

    recognition.onerror = (event) => {
        console.error("Speech Recognition Error", event.error);
        voiceBtn.classList.remove('recording');
        userInput.placeholder = "Type your message here...";
    };
} else {
    voiceBtn.style.display = 'none'; // Hide if not supported
    console.warn("Speech Recognition API not supported in this browser.");
}

// Text to Speech
let synthVoices = [];
if ('speechSynthesis' in window) {
    // Some browsers need this event to load voices initially
    window.speechSynthesis.onvoiceschanged = () => {
        synthVoices = window.speechSynthesis.getVoices();
    };
}

function speakText(text) {
    if ('speechSynthesis' in window) {
        // Strip out markdown or URLs before speaking
        const cleanText = text.replace(/https?:\/\/[^\s]+/g, '').replace(/[*#_=]/g, '');
        const utterance = new SpeechSynthesisUtterance(cleanText);

        // This hints the browser to use Tamil or English
        utterance.lang = currentLanguage;

        // Try to get voices
        let voices = window.speechSynthesis.getVoices();
        if (voices.length === 0) voices = synthVoices;

        if (currentLanguage === 'ta-IN') {
            // Find a specific Tamil voice
            const taVoice = voices.find(v => v.lang.includes('ta') || v.name.toLowerCase().includes('tamil'));
            if (taVoice) {
                utterance.voice = taVoice;
            }
        } else {
            // Find a specific English voice
            const enVoice = voices.find(v => v.lang.includes('en-US') || v.lang.includes('en'));
            if (enVoice) {
                utterance.voice = enVoice;
            }
        }

        window.speechSynthesis.speak(utterance);
    }
}

// --- EMERGENCY & HOSPITAL ROUTING ---

// Mock Database of regional hospitals (for demonstration)
const hospitalDatabase = [
    { name: "Chennai General Hospital", lat: 13.0827, lon: 80.2707, phone: "108" },
    { name: "Madurai Apollo Hospital", lat: 9.9252, lon: 78.1198, phone: "108" },
    { name: "Coimbatore CMC", lat: 11.0168, lon: 76.9558, phone: "108" },
    { name: "Trichy Govt Hospital", lat: 10.7905, lon: 78.7047, phone: "108" },
    { name: "Salem Medical Center", lat: 11.6643, lon: 78.1460, phone: "108" }
];

// Calculate distance between two coordinates in km (Haversine Formula)
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
}

function getNearestHospital(userLat, userLon) {
    let nearest = hospitalDatabase[0];
    let minDistance = getDistance(userLat, userLon, nearest.lat, nearest.lon);

    for (let i = 1; i < hospitalDatabase.length; i++) {
        const dist = getDistance(userLat, userLon, hospitalDatabase[i].lat, hospitalDatabase[i].lon);
        if (dist < minDistance) {
            minDistance = dist;
            nearest = hospitalDatabase[i];
        }
    }
    return nearest;
}

// Emergency Alert
async function triggerEmergency() {
    const alertMsg = "🚨 EMERGENCY ALERT TRIGGERED! 🚨";
    // Fallback contact
    const fallbackContact = document.getElementById('emergencyContact').value.trim() || '108';

    appendMessage(alertMsg, 'user');

    // Try to get location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            const mapLink = `https://maps.google.com/?q=${lat},${lon}`;

            // Find Nearest Hospital
            const nearestHospital = getNearestHospital(lat, lon);
            const contact = nearestHospital.phone;

            const botReply = `Emergency Detected!📍 I have located the nearest facility: **${nearestHospital.name}**. I am now pulling up your SMS app to dispatch an ambulance there instantly.`;
            appendMessage(botReply, 'bot');
            speakText(botReply);

            // Send Real SMS via mobile deep-link pointing to the nearest hospital
            const smsBody = encodeURIComponent(`URGENT EMERGENCY! Please dispatch an ambulance immediately from ${nearestHospital.name}. Patient Location: ${mapLink}`);
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
            const separator = isIOS ? '&' : '?';
            window.location.href = `sms:${contact}${separator}body=${smsBody}`;

            // Save to DB (LocalStorage silently)
            let history = JSON.parse(localStorage.getItem('healthcare_emergency_logs')) || [];
            history.push({ alert_message: `Alert sent to ${nearestHospital.name}`, location: mapLink, date: new Date().toISOString() });
            localStorage.setItem('healthcare_emergency_logs', JSON.stringify(history));

        }, async (error) => {
            console.error("GPS Error:", error);
            saveEmergencyNoLoc(alertMsg, fallbackContact);
        }, { timeout: 5000, enableHighAccuracy: false });
    } else {
        saveEmergencyNoLoc(alertMsg, fallbackContact);
    }
}

async function saveEmergencyNoLoc(alertMsg, contact) {
    const botReply = `Emergency Detected! But I cannot access your GPS. I am pulling up your SMS app to text ${contact}. Please call 108 directly if possible!`;
    appendMessage(botReply, 'bot');
    speakText(botReply);

    const smsBody = encodeURIComponent(`EMERGENCY ALERT! Please help me immediately. My exact location is unknown.`);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const separator = isIOS ? '&' : '?';
    window.location.href = `sms:${contact}${separator}body=${smsBody}`;

    let history = JSON.parse(localStorage.getItem('healthcare_emergency_logs')) || [];
    history.push({ alert_message: alertMsg, location: 'Unknown', date: new Date().toISOString() });
    localStorage.setItem('healthcare_emergency_logs', JSON.stringify(history));
}

// Live Location Sharing
function shareLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            const mapLink = `https://maps.google.com/?q=${lat},${lon}`;

            const msg = `Here is my current location: <a href="${mapLink}" target="_blank">View on Google Maps</a>`;
            appendMessage(msg, 'user');
            saveChatToDB(`Location shared: ${mapLink}`, 'user');

            // Simulate bot processing location
            setTimeout(() => {
                const reply = "I have received your location. How can I help you regarding this area? Are you looking for nearby hospitals?";
                appendMessage(reply, 'bot');
                saveChatToDB(reply, 'bot');
                speakText(reply);
            }, 1000);
        }, () => {
            alert("Unable to retrieve your location. Please check browser permissions.");
        });
    } else {
        alert("Geolocation is not supported by this browser.");
    }
}

// BMI Calculator
function calculateBMI() {
    const weight = parseFloat(document.getElementById('bmiWeight').value);
    const height = parseFloat(document.getElementById('bmiHeight').value);
    const box = document.getElementById('bmiResult');

    if (isNaN(weight) || isNaN(height) || height <= 0 || weight <= 0) {
        box.innerText = "Please enter valid values.";
        box.classList.add('show');
        return;
    }

    const heightInMeters = height / 100;
    const bmi = (weight / (heightInMeters * heightInMeters)).toFixed(1);

    let category = "";
    if (bmi < 18.5) category = "Underweight";
    else if (bmi >= 18.5 && bmi <= 24.9) category = "Normal weight";
    else if (bmi >= 25 && bmi <= 29.9) category = "Overweight";
    else category = "Obese";

    box.innerText = `Your BMI is ${bmi} (${category})`;
    if (category === "Normal weight") {
        box.style.color = "var(--secondary-color)";
        box.style.borderColor = "var(--secondary-color)";
    } else {
        box.style.color = "var(--danger-color)";
        box.style.borderColor = "var(--danger-color)";
    }
    box.classList.add('show');
}

// Age Calculator
function calculateAge() {
    const dobInput = document.getElementById('dobInput').value;
    const box = document.getElementById('ageResult');

    if (!dobInput) {
        box.innerText = "Please select a date.";
        box.classList.add('show');
        return;
    }

    const dob = new Date(dobInput);
    const today = new Date();

    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();

    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
        age--;
    }

    box.innerText = `Exact Age: ${age} years`;
    box.classList.add('show');
}

// Nearby Hospital Finder
function findHospitals() {
    const type = document.getElementById('hospitalType').value;
    const query = encodeURIComponent(`${type} near me`);
    window.open(`https://www.google.com/maps/search/${query}`, '_blank');
}

// --- HISTORY VIEWER LOGIC ---

function openHistoryModal() {
    openModal('historyModal');
    showChatHistoryLog();
}

function showChatHistoryLog() {
    const history = JSON.parse(localStorage.getItem('healthcare_chat_history')) || [];
    const content = document.getElementById('historyContent');
    if (history.length === 0) {
        content.innerHTML = "<p>No chat history found.</p>";
        return;
    }

    let html = "<ul style='list-style-type: none; padding: 0;'>";
    history.forEach(item => {
        const date = item.created_at ? new Date(item.created_at).toLocaleString() : "Unknown Time";
        html += `<li style="margin-bottom: 15px; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 10px;">
            <strong style="color: ${item.sender === 'user' ? 'var(--user-msg-bg)' : 'var(--primary-color)'};">${item.sender === 'user' ? 'You' : 'AI Bot'}</strong> <em style="font-size: 0.8rem; opacity: 0.7;">(${date})</em>: <br>
            <div style="margin-top: 5px;">${item.message}</div>
        </li>`;
    });
    html += "</ul>";
    content.innerHTML = html;
}

function showEmergencyHistoryLog() {
    const history = JSON.parse(localStorage.getItem('healthcare_emergency_logs')) || [];
    const content = document.getElementById('historyContent');
    if (history.length === 0) {
        content.innerHTML = "<p>No emergency logs found.</p>";
        return;
    }

    let html = "<ul style='list-style-type: none; padding: 0;'>";
    history.forEach(item => {
        const date = item.date ? new Date(item.date).toLocaleString() : "Unknown Time";
        html += `<li style="margin-bottom: 15px; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 10px;">
            <strong style="color: var(--danger-color);"><i class="fa-solid fa-triangle-exclamation"></i> ALERT</strong> <em style="font-size: 0.8rem; opacity: 0.7;">(${date})</em>: <br>
            <div style="margin-top: 5px; font-weight: bold;">${item.alert_message}</div>
            <div style="margin-top: 5px; font-size: 0.9rem;">📍 Location: ${item.location.includes('http') ? `<a href="${item.location}" target="_blank" style="color: #ffeb3b;">View on Map</a>` : item.location}</div>
        </li>`;
    });
    html += "</ul>";
    content.innerHTML = html;
}

function clearHistory() {
    if (confirm("Are you sure you want to delete all Chat and Emergency History? This cannot be undone.")) {
        localStorage.removeItem('healthcare_chat_history');
        localStorage.removeItem('healthcare_emergency_logs');
        document.getElementById('historyContent').innerHTML = "<p>History cleared successfully.</p>";

        // Also clear chat box
        chatBox.innerHTML = `
            <div class="message bot-message">
                <div class="msg-content">Hello! I am your Smart Rural Healthcare Assistant. Please enter your Groq API Key in the sidebar to start! How can I help you today?</div>
            </div>
        `;
        chatBox.appendChild(typingIndicator);
    }
}

