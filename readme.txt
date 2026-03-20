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
git clone [https://github.com/YOUR_USERNAME/netflix-mail-portal.git](https://github.com/YOUR_USERNAME/netflix-mail-portal.git)
cd netflix-mail-portal
