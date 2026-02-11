# Smishing Defense Training Tool

A mobile-style, browser-based learning tool for cybersecurity awareness training. Users learn to identify smishing attempts through interactive message scenarios with immediate feedback.

## Features

- 📱 **Realistic Mobile Interface** - Mimics smartphone messaging apps
- 🎯 **Three Action Options** - Accept, Block, or Question each message
- 📊 **Progress Tracking** - Local and server-side statistics
- 🔄 **Two Learning Modes** - Sequential training or individual message practice
- 👥 **Multi-User Support** - Centralized statistics for all users
- 📈 **Admin Dashboard** - View and export user performance data

## Project Structure

```
thesis/
├── index.html              # Main training interface
├── menu.html              # Message selection menu
├── admin.html             # Administrator dashboard
├── styles.css             # Main interface styles
├── menu-styles.css        # Menu interface styles
├── script.js              # Main training logic
├── menu-script.js         # Menu logic
├── messages.json          # Training message scenarios
├── server.js              # Node.js Express server
├── package.json           # Node.js dependencies
└── user-statistics.json   # Generated: Central statistics file
```

## Setup Instructions

### 1. Install Node.js

Make sure you have Node.js installed (v14 or higher):
```bash
node --version
npm --version
```

Download from: https://nodejs.org/

### 2. Install Dependencies

Navigate to the project directory and install required packages:

```bash
npm install
```

This will install:
- `express` - Web server framework
- `cors` - Enable cross-origin requests

### 3. Start the Server

Run the server:

```bash
npm start
```

You should see:
```
server running on http://localhost:3000


### 4. Access the Application

Open your browser and navigate to:

- **Training Menu**: http://localhost:3000/menu.html


## Usage

### For Students/Trainees

1. **Start Training**:
   - Open `menu.html` to see all available messages
   - Click any message to practice individually
   - Or open `index.html` for sequential training through all messages

2. **Interact with Messages**:
   - **Accept** - You trust this message (legitimate)
   - **Block** - You think this is suspicious/smishing
   - **Question** - View educational feedback and warning signs

3. **Get Feedback**:
   - Immediate feedback on your choice
   - Explanation of warning signs and cues
   - Progress tracking shows your accuracy

4. **Track Progress**:
   - View completed messages in the menu
   - See your accuracy percentage
   - Review which messages you got correct/incorrect

### For Administrators/Instructors

1. **Access Dashboard**:
   - Navigate to `admin.html`
   - View aggregate statistics for all users

2. **Monitor Performance**:
   - Total users and attempts
   - Average accuracy across all users
   - Individual user performance breakdown

3. **Export Data**:
   - **Summary CSV** - Quick overview of all users (accuracy, totals)
   - **Detailed CSV** - Every single attempt with timing information
   - **Detailed JSON** - Complete data including message breakdowns
   - Use for assessment, grading, or detailed analysis

### Export Formats

#### Summary CSV
Quick overview with one row per user:
- User ID, Name
- Total attempts, Correct, Incorrect
- Questions asked
- Accuracy percentage
- First/Last activity timestamps

#### Detailed CSV
One row per attempt (every action):
- User ID, Name
- Attempt number
- Message ID
- Action taken (accept/block/question)
- Correct or incorrect
- Timestamp
- Time from previous attempt (in seconds)

#### Detailed JSON
Complete hierarchical data structure:
- All attempts with timing
- Message-by-message breakdown
- Total time spent on training
- Question usage per message
- Final outcome for each message

See `sample-detailed-export.json` for full structure example.

4. **View Statistics File**:
   - `user-statistics.json` contains all raw data
   - JSON format for easy parsing and analysis
   - Automatically created when first user completes a message

## How Statistics are Saved

### User Identification
- Each user gets a unique ID on first visit
- Stored in browser localStorage
- Users can enter their name (optional)

### What Gets Tracked
- Every Accept/Block decision (correct or incorrect)
- Question button clicks (for learning, not counted as attempts)
- Timestamps for all actions
- Which messages completed
- **NEW**: Time spent between each attempt
- **NEW**: Complete attempt history per message
- **NEW**: Total time spent on training

### Timing Information
The system now tracks:
- **Time from previous attempt**: How many seconds between actions
- **Total training time**: From first to last activity
- **Per-message timing**: How long users spent on each message
- **Question timing**: When users asked for help

This helps you analyze:
- Which messages take longer (may be more difficult)
- If users are rushing through
- If question feature improves performance
- Individual learning pace

### Data Storage
- **Local**: Browser localStorage (for user's own progress)
- **Server**: Central `user-statistics.json` file
- **Persistent**: Survives page refreshes and server restarts

### Statistics Structure

```json
{
  "users": [
    {
      "userId": "user_1234567890_abc123",
      "userName": "John Doe",
      "firstAttempt": "2024-02-11T10:00:00.000Z",
      "lastActivity": "2024-02-11T10:15:00.000Z",
      "attempts": [
        {
          "messageId": 1,
          "action": "block",
          "correct": true,
          "timestamp": "2024-02-11T10:00:00.000Z"
        }
      ],
      "summary": {
        "totalAttempts": 5,
        "correctAnswers": 4,
        "incorrectAnswers": 1,
        "questionsAsked": 2,
        "messagesCompleted": [1, 2, 3, 4, 5]
      }
    }
  ]
}
```

## API Endpoints

### Save Progress
```http
POST /api/save-progress
Content-Type: application/json

{
  "userId": "user_123",
  "userName": "John Doe",
  "messageId": 1,
  "action": "block",
  "correct": true,
  "timestamp": "2024-02-11T10:00:00.000Z"
}
```

### Get User Statistics
```http
GET /api/user-stats/:userId
```

### Get All Statistics
```http
GET /api/all-stats
```

### Export CSV
```http
GET /api/export-csv
```
Returns summary CSV with one row per user.

### Export Detailed CSV
```http
GET /api/export-detailed-csv
```
Returns detailed CSV with one row per attempt/action.

### Export Detailed JSON
```http
GET /api/export-json
```
Returns comprehensive JSON with all data including:
- Time spent on each message
- All attempts with timing information
- Message-by-message breakdown
- Question usage statistics

## Customization

### Adding More Messages

Edit `messages.json`:

```json
{
  "id": 6,
  "sender": "PayPal Security",
  "content": "Your account needs verification...",
  "correctAction": "block",
  "cues": [
    "Suspicious URL",
    "Urgency language",
    "Requests credentials"
  ],
  "questionFeedback": "Notice the...",
  "incorrectFeedback": {
    "accept": "This is smishing because...",
    "block": null
  }
}
```

### Changing Server Port

Edit `server.js`:

```javascript
const PORT = 3000; // Change to your preferred port
```

Also update API URL in `script.js`:

```javascript
const API_BASE_URL = 'http://localhost:3000/api';
```

## Troubleshooting

### Server Won't Start
- Check if Node.js is installed: `node --version`
- Install dependencies: `npm install`
- Check if port 3000 is available

### Statistics Not Saving
- Make sure server is running
- Check browser console for errors
- Verify API_BASE_URL matches server address
- Check server logs for error messages

### Can't Access Admin Dashboard
- Ensure server is running
- Navigate to correct URL: `http://localhost:3000/admin.html`
- Check browser console for CORS errors

### Data Not Appearing
- Click "Refresh Data" in admin dashboard
- Check that `user-statistics.json` file exists
- Verify at least one user has completed a message

## Development

### Running in Development Mode

With auto-restart on file changes:

```bash
npm run dev
```

(Requires nodemon: `npm install -g nodemon`)

### File Permissions

The server needs write access to create `user-statistics.json`. If you get permission errors, check directory permissions.

## Security Notes

- This is designed for local/intranet use
- For production deployment:
  - Add user authentication
  - Use HTTPS
  - Implement rate limiting
  - Add input validation
  - Use environment variables for configuration

## License

MIT License - Feel free to use and modify for educational purposes.

## Credits

Based on the What.Hack theoretical framework for cybersecurity awareness training through role-playing and situated learning.
