// secret-check.js
const fs = require("fs");
const path = require("path");

// List of secret patterns
const secretPatterns = [
  // AWS Keys
  /AKIA[0-9A-Z]{16}/, // AWS Access Key
  /[A-Za-z0-9/+=]{40}/, // AWS Secret Access Key

  // Google Cloud Keys
  /AIza[0-9A-Za-z-_]{35}/, // Google API Key

  // Azure Keys
  /([A-Za-z0-9]{32})\-([A-Za-z0-9]{16})\-([A-Za-z0-9]{24})/, // Azure Storage Account Key

  // GitHub Token Patterns
  /ghp_[A-Za-z0-9]{36}/, // GitHub Personal Access Token

  // Slack Tokens
  /xox[baprs]-([0-9A-Za-z]{10,48})/, // Slack OAuth token

  // Twilio API Keys
  /SK[0-9a-fA-F]{32}/, // Twilio API Key

  // Stripe Secret Keys
  /sk_live_[0-9a-zA-Z]{24}/, // Stripe API Secret Key

  // Firebase API Keys
  /AIza[0-9A-Za-z-_]{35}/, // Firebase API Key

  // Docker Hub Token
  /[A-Za-z0-9]{30}/, // Docker Hub Access Token

  // Generic Base64 encoded secrets (e.g., tokens)
  /[A-Za-z0-9+\/=]{32,}/, // Base64 Token Pattern

  // Miscellaneous sensitive data (e.g., passwords, JWTs)
  /(?:eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,})/, // JWT Token Pattern
  /password[\s]*=[\s]*['"][^'"]{8,}['"]/i, // Password Pattern

  // OAuth tokens
  /[A-Za-z0-9_-]{35,}/, // Generic OAuth Token
];

// Function to check if a file contains any secret pattern and return the line numbers
function containsSecrets(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8').split('\n');
  const foundSecrets = [];

  content.forEach((line, index) => {
    secretPatterns.forEach((pattern) => {
      const matches = line.match(pattern);
      if (matches) {
        matches.forEach((match) => {
          foundSecrets.push({
            secret: match,
            lineNumber: index + 1, // Line numbers are 1-based
          });
        });
      }
    });
  });

  return foundSecrets;
}

// Get all staged files from the command line arguments
const files = process.argv.slice(2);

// Iterate through each file and check for secrets
files.forEach((file) => {
  const filePath = path.resolve(file);
  const secrets = containsSecrets(filePath);

  if (secrets.length > 0) {
    console.log(`Secrets detected in ${filePath}:`);
    secrets.forEach((secretObj) => {
      console.log(`(Line ${secretObj.lineNumber})  - ${secretObj.secret} `); // Log each found secret with line number
    });
    process.exit(1); // Reject the commit if secrets are found
  }
});
