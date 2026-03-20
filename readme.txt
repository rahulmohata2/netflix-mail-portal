# 🍿 Netflix Mail Portal

A secure, full-stack web application that fetches, decodes, and displays Netflix promotional emails directly from a connected Gmail account. Built with Node.js and Vanilla JavaScript, this portal features a custom SQLite database for Role-Based Access Control (RBAC) and strict rate-limiting.

## ✨ Key Features

* **Gmail API Integration:** Securely authenticates via OAuth 2.0 to fetch and decode complex Base64 HTML emails.
* **Role-Based Access Control (RBAC):** Built-in user management with 'Super Admin' and 'Standard User' tiers.
* **Intelligent Rate Limiting:** Standard users are restricted to viewing only one email per 24-hour period, enforced at the database level.
* **Admin Dashboard:** A secure UI for Super Admins to add users, change roles, and delete accounts directly from the browser.
* **Zero-Trust UI:** The frontend only receives email subject lines. Full HTML bodies are only fetched from Google *after* the backend verifies database permissions.

## 🛠️ Tech Stack

* **Frontend:** Vanilla HTML5, CSS3, JavaScript (Fetch API)
* **Backend:** Node.js, Express.js
* **Database:** SQLite3
* **Authentication:** Google OAuth 2.0 (Gmail API)
* **Deployment:** Render.com

---

## 🚀 Local Setup & Installation

Follow these steps to run the application on your local machine.

### 1. Prerequisites
* [Node.js](https://nodejs.org/) (v20 LTS recommended)
* A Google Cloud Console account

### 2. Clone the Repository
```bash
git clone [https://github.com/rahulmohata2/netflix-mail-portal.git](https://github.com/rahulmohata2/netflix-mail-portal.git)
cd netflix-mail-portal
3. Install Dependencies
Bash
npm install
4. Environment Variables
Create a .env file in the root directory and add the following keys. Never commit this file to GitHub.

Code snippet
CLIENT_ID=your_google_client_id
CLIENT_SECRET=your_google_client_secret
REDIRECT_URI=http://localhost:3000/oauth2callback
REFRESH_TOKEN=your_google_refresh_token
5. Google Cloud Configuration
To get the above keys, you must register the app with Google:

Go to the Google Cloud Console.

Create a new project and enable the Gmail API.

Configure the OAuth Consent Screen (add your email as a test user).

Go to Credentials -> Create OAuth 2.0 Client ID (Web Application).

Add http://localhost:3000/oauth2callback to the Authorized redirect URIs.

Generate your Client ID and Client Secret.

Note: You will need to write a temporary script using googleapis to generate the initial REFRESH_TOKEN.

6. Start the Server
Bash
npm start
Open http://localhost:3000 in your browser.
Default Super Admin Login: admin@test.com / admin123

☁️ Deployment Guide (Render.com)
This application is configured for easy deployment on Render.

Connect your GitHub repository to a new Web Service on Render.

Under Environment Variables, copy over all your keys from your .env file.

CRITICAL: Update your REDIRECT_URI environment variable to match your live Render URL (e.g., https://your-app.onrender.com/oauth2callback).

Google Cloud Update: You MUST also add this new live REDIRECT_URI to your Authorized Redirect URIs inside the Google Cloud Console.

Render-Specific Fixes
To prevent build errors (like the GLIBC SQLite error) on Render's free tier, ensure the following settings are applied in your Render Dashboard:

Node Version: Add an environment variable NODE_VERSION set to 20.

Build Command: Force SQLite to build from source for the specific server architecture:

Bash
npm install && npm rebuild sqlite3 --build-from-source
Start Command: node server.js

🔒 Security Notes
API Keys: The .gitignore file strictly prevents .env from being uploaded.

Database: The app-data.db file is ignored to ensure clean deployments and prevent accidental data leaks.

(Note: For production at scale, consider upgrading from SQLite to a cloud database like PostgreSQL or MongoDB to ensure persistent storage across ephemeral server restarts).


***
