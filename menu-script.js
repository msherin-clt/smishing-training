// Game state management
let messages = [];
let userProgress = {};

// DOM elements
const messageList = document.getElementById('messageList');
const searchInput = document.getElementById('searchInput');
const completedCount = document.getElementById('completedCount');
const correctCount = document.getElementById('correctCount');
const accuracyPercent = document.getElementById('accuracyPercent');
const trainingModeBtn = document.getElementById('trainingModeBtn');
const freePracticeModeBtn = document.getElementById('freePracticeModeBtn');
const resetBtn = document.getElementById('resetBtn');
const statsBtn = document.getElementById('statsBtn');

// Mode state
let currentMode = 'training'; // 'training' or 'practice'

// Load messages and initialize
async function loadMessages() {
  try {
    const response = await fetch('./messages.json');
    messages = await response.json();
    loadProgress();
    renderMessageList();
    updateProgressSummary();
  } catch (error) {
    console.error('Error loading messages:', error);
    showError();
  }
}

// Load progress from localStorage
function loadProgress() {
  const saved = localStorage.getItem('whathack_progress');
  if (saved) {
    userProgress = JSON.parse(saved);
  } else {
    // Initialize progress
    userProgress = {
      completed: [],
      results: {} // messageId: { action: 'accept|block|question', correct: true|false }
    };
  }
}

// Save progress to localStorage
function saveProgress() {
  localStorage.setItem('whathack_progress', JSON.stringify(userProgress));
}

// Render message list
function renderMessageList(filter = '') {
  messageList.innerHTML = '';
  
  const filteredMessages = messages.filter(msg => {
    if (!filter) return true;
    return msg.sender.toLowerCase().includes(filter.toLowerCase()) ||
           msg.content.toLowerCase().includes(filter.toLowerCase());
  });
  
  if (filteredMessages.length === 0) {
    messageList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🔍</div>
        <div class="empty-state-text">No messages found</div>
      </div>
    `;
    return;
  }
  
  filteredMessages.forEach((message, index) => {
    const messageItem = createMessageItem(message, index);
    messageList.appendChild(messageItem);
  });
}

// Create individual message item
function createMessageItem(message, index) {
  const item = document.createElement('a');
  item.className = 'message-item';
  item.href = `index.html?message=${message.id}`;
  
  // Determine avatar and status
  const isCompleted = userProgress.completed.includes(message.id);
  const result = userProgress.results[message.id];
  
  let avatarClass = 'unknown';
  let avatarIcon = '👤';
  

  
  // Build status badges
  let statusHTML = '';
  if (isCompleted && result) {
    if (result.correct) {
      statusHTML = '<span class="status-badge correct">✓ Correct</span>';
    } else {
      statusHTML = '<span class="status-badge incorrect">✗ Incorrect</span>';
    }
  } else {
    statusHTML = '<span class="status-badge pending">● Not Started</span>';
  }
  
  item.innerHTML = `
    <div class="message-avatar ${avatarClass}">
      ${avatarIcon}
    </div>
    <div class="message-info">
      <div class="message-header">
        <span class="message-sender">${message.sender}</span>
        <span class="message-time">${getRelativeTime(index)}</span>
      </div>
      <div class="message-preview">${truncateText(message.content, 60)}</div>
      <div class="message-status">
        ${statusHTML}
      </div>
    </div>
  `;
  
  return item;
}

// Truncate text helper
function truncateText(text, maxLength) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

// Get relative time (simulated)
function getRelativeTime(index) {
  const times = ['Just now', '2m ago', '5m ago', '15m ago', '1h ago'];
  return times[index] || `${index}h ago`;
}

// Update progress summary
function updateProgressSummary() {
  const total = messages.length;
  const completed = userProgress.completed.length;
  const correct = Object.values(userProgress.results).filter(r => r.correct).length;
  const accuracy = completed > 0 ? Math.round((correct / completed) * 100) : 0;
  
  completedCount.textContent = `${completed}/${total}`;
  correctCount.textContent = correct;
  accuracyPercent.textContent = `${accuracy}%`;
}

// Search functionality
searchInput.addEventListener('input', (e) => {
  renderMessageList(e.target.value);
});

// Reset progress
resetBtn.addEventListener('click', () => {
  if (confirm('Are you sure you want to reset all progress? This cannot be undone.')) {
    userProgress = {
      completed: [],
      results: {}
    };
    saveProgress();
    renderMessageList();
    updateProgressSummary();
    
    // Show confirmation
  }
});

// Stats view (placeholder)
statsBtn.addEventListener('click', () => {
  const total = messages.length;
  const completed = userProgress.completed.length;
  const correct = Object.values(userProgress.results).filter(r => r.correct).length;
  const accuracy = completed > 0 ? Math.round((correct / completed) * 100) : 0;
  
  let statsMessage = `📊 Your Statistics:\n\n`;
  statsMessage += `Messages Completed: ${completed}/${total}\n`;
  statsMessage += `Correct Answers: ${correct}\n`;
  statsMessage += `Accuracy: ${accuracy}%\n\n`;
  
  if (accuracy === 100 && completed === total) {
    statsMessage += '🌟 Perfect score! You\'re a smishing detection expert!';
  } else if (accuracy >= 80) {
    statsMessage += '🎯 Great work! Keep it up!';
  } else if (accuracy >= 60) {
    statsMessage += '👍 Good progress! Review the feedback to improve.';
  } else if (completed > 0) {
    statsMessage += '📚 Keep practicing! Pay attention to the warning signs.';
  } else {
    statsMessage += '🚀 Ready to start? Click any message to begin!';
  }
  
  alert(statsMessage);
});

// Show error state
function showError() {
  messageList.innerHTML = `
    <div class="empty-state">
      <div class="empty-state-icon">⚠️</div>
      <div class="empty-state-text">Failed to load messages.<br>Please refresh the page.</div>
    </div>
  `;
}

// Check if returning from a message
function checkReturnFromMessage() {
  const urlParams = new URLSearchParams(window.location.search);
  const returned = urlParams.get('returned');
  
  if (returned === 'true') {
    // Reload progress and update display
    loadProgress();
    updateProgressSummary();
    renderMessageList();
    
    // Clean URL
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
  loadMessages();
  checkReturnFromMessage();
});

// Export functions for use in other scripts
window.whathackMenu = {
  saveProgress,
  loadProgress,
  updateProgressSummary
};
