// Game state
let currentMessageIndex = 0;
let messages = [];
let score = 0;
let userProgress = {};
let currentMessageId = null;
let isSequentialMode = false;
let userId = null;
let userName = null;

// Server configuration
const API_BASE_URL = 'http://localhost:3000/api';

// DOM elements
const messagesContainer = document.getElementById('messagesContainer');
const senderName = document.getElementById('senderName');
const acceptBtn = document.getElementById('acceptBtn');
const questionBtn = document.getElementById('questionBtn');
const blockBtn = document.getElementById('blockBtn');
const feedbackOverlay = document.getElementById('feedbackOverlay');
const feedbackIcon = document.getElementById('feedbackIcon');
const feedbackTitle = document.getElementById('feedbackTitle');
const feedbackMessage = document.getElementById('feedbackMessage');
const continueBtn = document.getElementById('continueBtn');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const actionButtons = document.getElementById('actionButtons');
const backButton = document.querySelector('.back-button');

// Initialize user ID (create or retrieve from localStorage)
function initializeUser() {
  // Check if user ID exists in localStorage
  userId = localStorage.getItem('smishing_userId');
  userName = localStorage.getItem('smishing_userName');
  usergen = false;
  if (!userId) {
    // Generate a unique user ID
    userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('smishing_userId', userId);
    
    // Prompt for username (optional)
    const name = prompt('Welcome to Smishing Defense Training! Please enter your name (optional):');
    userName = name && name.trim() ? name.trim() : `User ${userId.substr(-6)}`;
    localStorage.setItem('smishing_userName', userName);
    usergen = true;
  }
  
  console.log(`User initialized: ${userName} (${userId})`);
  return usergen;
}


// Load messages from JSON
async function loadMessages() {
  try {
    const response = await fetch('./messages.json');
    messages = await response.json();
    
    // Initialize user
    initializeUser();
    
    // Load progress from localStorage (for local tracking)
    loadProgress();
    
    // Check if a specific message was requested via URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const messageId = urlParams.get('message');
    
    if (messageId) {
      // Individual message mode (from menu)
      isSequentialMode = false;
      currentMessageId = parseInt(messageId);
      const msgIndex = messages.findIndex(m => m.id === currentMessageId);
      if (msgIndex !== -1) {
        currentMessageIndex = msgIndex;
        displayCurrentMessage();
        initializeGame();
      } else {
        // Invalid message ID, go to first message
        currentMessageIndex = 0;
        initializeGame();
      }
    } else {
      // Sequential training mode
      isSequentialMode = true;
      initializeGame();
    }
    
    // Set up back button
    if (backButton) {
      backButton.addEventListener('click', goBackToMenu);
    }
    
  } catch (error) {
    console.error('Error loading messages:', error);
    showError('Failed to load messages. Please refresh the page.');
  }
}

// Load progress from localStorage (local tracking)
function loadProgress() {
  const saved = localStorage.getItem('smishing_progress');
  if (saved) {
    userProgress = JSON.parse(saved);
  } else {
    userProgress = {
      completed: [],
      results: {}
    };
  }
}

// Save progress to both localStorage AND server
async function saveProgress(messageId, action, isCorrect) {
  // Save to localStorage (local tracking)
  if (!userProgress.completed.includes(messageId)) {
    userProgress.completed.push(messageId);
  }
  
  userProgress.results[messageId] = {
    action: action,
    correct: isCorrect,
    timestamp: new Date().toISOString()
  };
  
  localStorage.setItem('smishing_progress', JSON.stringify(userProgress));
  
  // Save to server (central tracking)
  try {
    const response = await fetch(`${API_BASE_URL}/save-progress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userId,
        userName: userName,
        messageId: messageId,
        action: action,
        correct: isCorrect,
        timestamp: new Date().toISOString()
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('Progress saved to server:', data.userStats);
    } else {
      console.error('Failed to save to server:', data.error);
    }
  } catch (error) {
    console.error('Error saving to server:', error);
    // Continue even if server save fails - local tracking still works
  }
}

// Go back to menu
function goBackToMenu() {
  window.location.href = 'menu.html?returned=true';
}

// Initialize the game
function initializeGame() {
  if (isSequentialMode) {
    currentMessageIndex = 0;
    score = 0;
  }
  updateProgress();

  displayCurrentMessage();
  
  
  // Set up event listeners (only once)
  acceptBtn.addEventListener('click', () => handleAction('accept'));
  questionBtn.addEventListener('click', () => handleAction('question'));
  blockBtn.addEventListener('click', () => handleAction('block'));
  continueBtn.addEventListener('click', hideOverlay);
}

// Display the current message
function displayCurrentMessage() {
  if (currentMessageIndex >= messages.length) {
    showGameComplete();
    return;
  }

  const message = messages[currentMessageIndex];
  
  // Update sender name in header
  senderName.textContent = message.sender;
  
  // Clear previous messages (keep date divider)
  const dateDivider = messagesContainer.querySelector('.date-divider');
  messagesContainer.innerHTML = '';
  if (dateDivider) {
    messagesContainer.appendChild(dateDivider);
  }
  
  // Create message bubble
  const messageBubble = document.createElement('div');
  messageBubble.className = 'message-bubble received';
  
  const messageSender = document.createElement('div');
  messageSender.className = 'message-sender';
  messageSender.textContent = message.sender;
  
  const messageText = document.createElement('div');
  messageText.className = 'message-text';
  messageText.textContent = message.content;
  
  const messageTime = document.createElement('div');
  messageTime.className = 'message-time';
  messageTime.textContent = getCurrentTime();
  
  messageBubble.appendChild(messageSender);
  messageBubble.appendChild(messageText);
  messageBubble.appendChild(messageTime);
  
  messagesContainer.appendChild(messageBubble);
  
  // Scroll to bottom
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
  
  // Enable action buttons
  enableButtons();
}

// Handle user action
function handleAction(action) {
  const message = messages[currentMessageIndex];
  
  // Disable buttons during feedback
  disableButtons();
  
  if (action === 'question') {
    // Show educational feedback with cues (don't save as attempt)
    showQuestionFeedback(message);
  } else if (action === message.correctAction) {
    // Correct action
    score++;
    saveProgress(message.id, action, true);
    showCorrectFeedback(message);
  } else {
    // Incorrect action
    saveProgress(message.id, action, false);
    showIncorrectFeedback(message, action);
  }
}

// Show feedback when user clicks "Question"
function showQuestionFeedback(message) {
  feedbackOverlay.className = 'feedback-overlay show feedback-info';
  feedbackTitle.textContent = 'Analysis';
  
  let feedbackText = message.questionFeedback || 'Look carefully at this message. Key indicators: ';
  
  feedbackText += '\r\n';
  if (message.cues && message.cues.length > 0) {
    feedbackText += message.cues.map((cue, index) => `${index + 1}. ${cue}`).join('\r\n');
  }
  feedbackMessage.textContent = feedbackText;
  
  // After viewing, user can still make a choice
  continueBtn.textContent = 'Got it';
  continueBtn.onclick = () => {
    hideOverlay();
    enableButtons();
  };
}

// Show correct feedback
function showCorrectFeedback(message) {
  feedbackOverlay.className = 'feedback-overlay show feedback-correct';
  feedbackTitle.textContent = 'Correct!';
  
  let feedbackText = '';
  if (message.correctAction === 'block') {
    feedbackText = 'Good catch! This was indeed a suspicious message.';
  } else {
    feedbackText = 'Well done! This was a legitimate message.';
  }
  
  if (message.cues && message.cues.length > 0) {
    feedbackText += '\n\nKey indicators:\n• ' + message.cues.join('\n• ');
  }
  
  feedbackMessage.textContent = feedbackText;
  continueBtn.textContent = 'Continue';
  continueBtn.onclick = () => {
    hideOverlay();
    nextMessage();
  };
}

// Show incorrect feedback
function showIncorrectFeedback(message, userAction) {
  feedbackOverlay.className = 'feedback-overlay show feedback-incorrect';
  feedbackTitle.textContent = 'Not Quite';
  
  let feedbackText = '';
  
  // Use custom incorrect feedback if available
  if (message.incorrectFeedback && message.incorrectFeedback[userAction]) {
    feedbackText = message.incorrectFeedback[userAction];
  } else {
    // Generate default feedback
    if (message.correctAction === 'block') {
      feedbackText = 'This message was actually suspicious and should have been blocked.';
    } else {
      feedbackText = 'This was actually a legitimate message.';
    }
  }
  
  if (message.cues && message.cues.length > 0) {
    feedbackText += '\n\nWatch for:\n• ' + message.cues.join('\n• ');
  }
  
  feedbackMessage.textContent = feedbackText;
  continueBtn.textContent = 'Continue';
  continueBtn.onclick = () => {
    hideOverlay();
    nextMessage();
  };
}

// Move to next message
function nextMessage() {
  if (isSequentialMode) {
    // Sequential training mode - go to next message
    currentMessageIndex++;
    updateProgress();
    displayCurrentMessage();
  } else {
    // Individual message mode - return to menu
    goBackToMenu();
  }
}

// Update progress bar
function updateProgress() {
  const progress = ((currentMessageIndex) / messages.length) * 100;
  progressBar.style.width = progress + '%';
  progressText.textContent = `Message ${currentMessageIndex + 1} of ${messages.length}`;
}

// Show game complete screen
function showGameComplete() {
  const percentage = Math.round((score / messages.length) * 100);
  
  feedbackOverlay.className = 'feedback-overlay show feedback-correct';
  feedbackTitle.textContent = 'Training Complete!';
  feedbackMessage.textContent = `You correctly identified ${score} out of ${messages.length} messages (${percentage}%).\n\n${getPerformanceMessage(percentage)}`;
  continueBtn.textContent = isSequentialMode ? 'Restart' : 'Back to Menu';
  continueBtn.onclick = () => {
    hideOverlay();
    if (isSequentialMode) {
      initializeGame();
    } else {
      goBackToMenu();
    }
  };
  
  disableButtons();
}

// Get performance message based on score
function getPerformanceMessage(percentage) {
  if (percentage === 100) {
    return '🌟 Perfect score! You have excellent smishing detection skills!';
  } else if (percentage >= 70) {
    return '👍 Great job! You caught most of the threats.';
  } else if (percentage >= 50) {
    return '📚 Good effort! Review the feedback to improve your detection skills.';
  } else {
    return '⚠️ Keep practicing! Pay close attention to the warning signs.';
  }
}

// Hide overlay
function hideOverlay() {
  feedbackOverlay.classList.remove('show');
}

// Enable action buttons
function enableButtons() {
  acceptBtn.disabled = false;
  questionBtn.disabled = false;
  blockBtn.disabled = false;
}

// Disable action buttons
function disableButtons() {
  acceptBtn.disabled = true;
  questionBtn.disabled = true;
  blockBtn.disabled = true;
}

// Get current time formatted
function getCurrentTime() {
  const now = new Date();
  let hours = now.getHours();
  const minutes = now.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const minutesStr = minutes < 10 ? '0' + minutes : minutes;
  return hours + ':' + minutesStr + ' ' + ampm;
}

// Show error message
function showError(message) {
  feedbackOverlay.className = 'feedback-overlay show feedback-incorrect';
  feedbackTitle.textContent = 'Error';
  feedbackMessage.textContent = message;
  continueBtn.textContent = 'OK';
  continueBtn.onclick = hideOverlay;
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', loadMessages);
