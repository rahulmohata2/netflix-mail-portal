require('dotenv').config();
const { google } = require('googleapis');
const readline = require('readline');

// Set up the OAuth2 client with your credentials
const oAuth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);

// We are asking for permission to READ emails only
const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];

// Generate the login URL
const authUrl = oAuth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES,
});

console.log('--------------------------------------------------');
console.log('1. Click this link to authorize your app:');
console.log(authUrl);
console.log('--------------------------------------------------');

// Set up a way to type the code back into the terminal
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('2. Enter the code from that page here: ', (code) => {
  rl.close();
  
  // Exchange the code for the tokens
  oAuth2Client.getToken(code, (err, token) => {
    if (err) return console.error('Error retrieving token:', err);
    
    console.log('\n🎉 SUCCESS! 🎉');
    console.log('Here is your REFRESH_TOKEN:\n');
    console.log(token.refresh_token);
    console.log('\nCopy the exact text above and paste it into your .env file next to REFRESH_TOKEN=');
  });
});