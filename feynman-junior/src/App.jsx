const audienceSelect = document.getElementById('audienceSelect');
const chatInterface = document.getElementById('chatInterface');
const chatInput = document.getElementById('chatInput');
const sendButton = document.getElementById('sendButton');
const voiceButton = document.getElementById('voiceButton');
const chatLog = document.getElementById('chatLog');

let isVoiceMode = false;

audienceSelect.addEventListener('change', () => {
    if (audienceSelect.value) {
        chatInterface.style.display = 'block';
    } else {
        chatInterface.style.display = 'none';
    }
});

sendButton.addEventListener('click', sendMessage);
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

voiceButton.addEventListener('click', toggleVoiceMode);

function sendMessage() {
    const message = chatInput.value.trim();
    if (message) {
        addMessageToChatLog('user', message);
        chatInput.value = '';
        // Simulate AI response (replace with actual AI integration)
        setTimeout(() => {
            const aiResponse = `AI response to: "${message}"`;
            addMessageToChatLog('ai', aiResponse);
        }, 1000);
    }
}

function addMessageToChatLog(sender, message) {
    const messageElement = document.createElement('p');
    messageElement.textContent = message;
    messageElement.className = sender === 'user' ? 'user-message' : 'ai-message';
    chatLog.appendChild(messageElement);
    chatLog.scrollTop = chatLog.scrollHeight;
}

function toggleVoiceMode() {
    isVoiceMode = !isVoiceMode;
    voiceButton.textContent = isVoiceMode ? '🔴 Recording' : '🎤';
    // Implement voice recognition logic here
}
