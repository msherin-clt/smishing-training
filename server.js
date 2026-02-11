// server.js - Node.js Express server for handling user statistics
const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors()); // Allow cross-origin requests
app.use(express.json()); // Parse JSON bodies
app.use(express.static('.')); // Serve static files from current directory

// Path to statistics file
const STATS_FILE = path.join(__dirname, 'user-statistics.json');

// Initialize statistics file if it doesn't exist
async function initializeStatsFile() {
  try {
    await fs.access(STATS_FILE);
  } catch {
    // File doesn't exist, create it with empty array
    await fs.writeFile(STATS_FILE, JSON.stringify({ users: [] }, null, 2));
    console.log('Created user-statistics.json file');
  }
}

// Load statistics from file
async function loadStatistics() {
  try {
    const data = await fs.readFile(STATS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading statistics:', error);
    return { users: [] };
  }
}

// Save statistics to file
async function saveStatistics(stats) {
  try {
    await fs.writeFile(STATS_FILE, JSON.stringify(stats, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving statistics:', error);
    return false;
  }
}

// API endpoint to save user progress
app.post('/api/save-progress', async (req, res) => {
  try {
    const { userId, userName, messageId, action, correct, timestamp } = req.body;

    // Validate required fields
    if (!userId || !messageId || !action) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userId, messageId, action'
      });
    }

    // Load current statistics
    const stats = await loadStatistics();

    // Find or create user
    let user = stats.users.find(u => u.userId === userId);
    if (!user) {
      user = {
        userId: userId,
        userName: userName || `User_${userId}`,
        firstAttempt: timestamp || new Date().toISOString(),
        lastActivity: timestamp || new Date().toISOString(),
        attempts: [],
        summary: {
          totalAttempts: 0,
          correctAnswers: 0,
          incorrectAnswers: 0,
          questionsAsked: 0,
          messagesCompleted: new Set()
        }
      };
      stats.users.push(user);
    }

    // Update last activity
    user.lastActivity = timestamp || new Date().toISOString();

    // Add this attempt
    user.attempts.push({
      messageId: messageId,
      action: action,
      correct: correct,
      timestamp: timestamp || new Date().toISOString(),
    });
    user.summary.messagesCompleted = Array.from(user.summary.messagesCompleted);

    // Update summary statistics
    user.summary.totalAttempts++;
    if (action === 'question') {
      user.summary.questionsAsked++;
    } else {
      if (correct) {
        user.summary.correctAnswers++;
      } else {
        user.summary.incorrectAnswers++;
      }
      user.summary.messagesCompleted.push(messageId);
    }

    // Convert Set to Array for JSON serialization

    // Save updated statistics
    const saved = await saveStatistics(stats);

    if (saved) {
      res.json({
        success: true,
        message: 'Progress saved successfully',
        userStats: {
          totalAttempts: user.summary.totalAttempts,
          correctAnswers: user.summary.correctAnswers,
          accuracy: user.summary.totalAttempts - user.summary.questionsAsked > 0
            ? Math.round((user.summary.correctAnswers / (user.summary.totalAttempts - user.summary.questionsAsked)) * 100)
            : 0
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to save statistics'
      });
    }

  } catch (error) {
    console.error('Error in /api/save-progress:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// API endpoint to get user statistics
app.get('/api/user-stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const stats = await loadStatistics();

    const user = stats.users.find(u => u.userId === userId);

    if (user) {
      res.json({
        success: true,
        user: user
      });
    } else {
      res.json({
        success: false,
        message: 'User not found'
      });
    }

  } catch (error) {
    console.error('Error in /api/user-stats:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});


// Start server
async function startServer() {
  await initializeStatsFile();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
