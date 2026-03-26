require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');
const sqlite3 = require('sqlite3').verbose(); // <-- New Database module

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// --- 1. DATABASE SETUP ---
// This creates a file called 'app-data.db' in your folder
const db = new sqlite3.Database('./app-data.db');

db.serialize(() => {
    // Create Users table
    db.run("CREATE TABLE IF NOT EXISTS users (email TEXT UNIQUE, password TEXT, role TEXT)");
    // Create Views table (tracks who viewed what and when)
    db.run("CREATE TABLE IF NOT EXISTS views (email TEXT, viewed_at INTEGER)");

    // Insert our two test users (IGNORE if they already exist)
    db.run("INSERT OR IGNORE INTO users (email, password, role) VALUES ('admin@test.com', 'admin123', 'Super Admin')");
    db.run("INSERT OR IGNORE INTO users (email, password, role) VALUES ('user@test.com', 'user123', 'Standard User')");
});

// --- 2. GOOGLE AUTH SETUP ---
const oAuth2Client = new google.auth.OAuth2(process.env.CLIENT_ID, process.env.CLIENT_SECRET, process.env.REDIRECT_URI);
oAuth2Client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN });
const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

// Decoder function (unchanged)
function getEmailBody(payload) {
    let encodedBody = '';
    if (payload.parts) {
      for (let part of payload.parts) {
        if (part.mimeType === 'text/html') { encodedBody = part.body.data; break; }
        else if (part.parts) { encodedBody = getEmailBody(part); if (encodedBody) break; }
      }
    } else if (payload.body && payload.body.data) { encodedBody = payload.body.data; }
  
    if (encodedBody) {
      const base64 = encodedBody.replace(/-/g, '+').replace(/_/g, '/');
      return Buffer.from(base64, 'base64').toString('utf-8');
    }
    return '<p>No content found</p>';
}

// --- 3. LOGIN ROUTE (Now uses the Database!) ---
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    
    // Look up the user in our SQLite database
    db.get("SELECT * FROM users WHERE email = ? AND password = ?", [email, password], (err, row) => {
        if (row) {
            res.json({ success: true, role: row.role, email: row.email });
        } else {
            res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
    });
});

// --- 4. FETCH SUBJECTS ONLY ---
// --- 4. FETCH SUBJECTS ONLY ---
app.get('/api/netflix', async (req, res) => {
    try {
      const response = await gmail.users.messages.list({ userId: 'me', q: 'from:netflix.com', maxResults: 5 });
      const messages = response.data.messages || [];
      
      const emailList = await Promise.all(messages.map(async (msg) => {
          const mail = await gmail.users.messages.get({ 
              userId: 'me', 
              id: msg.id, 
              format: 'metadata', 
              metadataHeaders: ['Subject', 'Date'] 
          });
          
          // Added a fallback `|| []` to prevent crashes if headers are missing
          const headers = mail.data.payload.headers || []; 
          const subjectHeader = headers.find(h => h.name === 'Subject');
          const dateHeader = headers.find(h => h.name === 'Date'); 

          return { 
              id: msg.id, 
              subject: subjectHeader ? subjectHeader.value : 'Netflix Update',
              date: dateHeader ? dateHeader.value : new Date().toISOString()
          };
      }));
  
      res.json(emailList); 
    } catch (error) { 
        // THIS WILL NOW PRINT THE EXACT ERROR IN RENDER!
        console.error("🚨 GMAIL API ERROR:", error.message); 
        res.status(500).json({ error: error.message || 'Failed to fetch emails from Google' }); 
    }
});

// --- 5. THE 24-HOUR GATEKEEPER ROUTE ---
app.post('/api/view-email', (req, res) => {
    const { emailId, userEmail, role } = req.body;

    // Super Admins bypass the 24-hour rule!
    if (role === 'Super Admin') {
        return fetchAndSendBody(emailId, res);
    }

    // Check the last time this regular user viewed an email
    db.get("SELECT viewed_at FROM views WHERE email = ? ORDER BY viewed_at DESC LIMIT 1", [userEmail], (err, row) => {
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

        if (row && (now - row.viewed_at) < oneDay) {
            // They viewed one too recently! Block them.
            res.status(403).json({ error: 'LIMIT_REACHED', message: 'You can only view one email every 24 hours.' });
        } else {
            // They are allowed! Record this view in the database and show the email.
            db.run("INSERT INTO views (email, viewed_at) VALUES (?, ?)", [userEmail, now]);
            fetchAndSendBody(emailId, res);
        }
    });
});


// --- 6. SUPER ADMIN ROUTES (User Management) ---

// Get all users
app.get('/api/users', (req, res) => {
    const requesterRole = req.query.role; // We pass the role in the URL
    
    // SERVER SECURITY CHECK: Are they actually an admin?
    if (requesterRole !== 'Super Admin') {
        return res.status(403).json({ error: 'Unauthorized. Admins only.' });
    }

    db.all("SELECT email, role FROM users", [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(rows);
    });
});

// Add a new user
app.post('/api/users', (req, res) => {
    const { requesterRole, email, password, role } = req.body;
    
    if (requesterRole !== 'Super Admin') {
        return res.status(403).json({ error: 'Unauthorized.' });
    }

    db.run("INSERT INTO users (email, password, role) VALUES (?, ?, ?)", [email, password, role], function(err) {
        if (err) {
            return res.status(400).json({ success: false, message: 'User already exists.' });
        }
        res.json({ success: true });
    });
});

// Update a user's role
app.put('/api/users/role', (req, res) => {
    const { requesterRole, targetEmail, newRole } = req.body;
    
    if (requesterRole !== 'Super Admin') {
        return res.status(403).json({ error: 'Unauthorized.' });
    }

    db.run("UPDATE users SET role = ? WHERE email = ?", [newRole, targetEmail], function(err) {
        if (err) return res.status(500).json({ error: 'Failed to update role' });
        res.json({ success: true });
    });
});

// Delete a user
app.delete('/api/users', (req, res) => {
    const { requesterRole, targetEmail } = req.body;
    
    // SERVER SECURITY CHECK: Only Super Admins can delete
    if (requesterRole !== 'Super Admin') {
        return res.status(403).json({ error: 'Unauthorized.' });
    }

    // Optional: Prevent the admin from deleting themselves!
    if (targetEmail === 'admin@test.com') {
        return res.status(400).json({ error: 'Cannot delete the primary admin account.' });
    }

    // Delete from the database
    db.run("DELETE FROM users WHERE email = ?", [targetEmail], function(err) {
        if (err) return res.status(500).json({ error: 'Failed to delete user' });
        
        // Also delete their view history to keep the database clean
        db.run("DELETE FROM views WHERE email = ?", [targetEmail]);
        
        res.json({ success: true });
    });
});

// Helper function to actually fetch the email body from Google
async function fetchAndSendBody(emailId, res) {
    try {
        const mail = await gmail.users.messages.get({ userId: 'me', id: emailId });
        const fullBody = getEmailBody(mail.data.payload);
        res.json({ success: true, body: fullBody });
    } catch (err) {
        res.status(500).json({ error: 'Failed to load email body' });
    }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));