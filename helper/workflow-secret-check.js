const fs = require('fs');
const path = require('path');

const secretPatterns = [
  /AKIA[0-9A-Z]{16}/g, // AWS Access Key
  /[a-zA-Z0-9]{40}/g,  // Generic token
  /[A-Za-z0-9+/]{20,}={0,2}/g // Base64 strings
];

const checkFileForSecrets = (filePath) => {
  const content = fs.readFileSync(filePath, 'utf8');
  return secretPatterns.flatMap((pattern) =>
    [...content.matchAll(pattern)].map((match) => ({
      pattern: pattern.toString(),
      match: match[0],
      line: content.substring(0, match.index).split('\n').length,
    }))
  );
};

const filePath = process.argv[2];
if (!filePath) {
  console.error('No file path provided!');
  process.exit(1);
}

try {
  const secrets = checkFileForSecrets(filePath);

  if (secrets.length > 0) {
    console.error(`Secrets detected in ${filePath}:`);
    secrets.forEach((secret) =>
      console.error(
        `- Line ${secret.line}: Pattern ${secret.pattern}, Match: ${secret.match}`
      )
    );
    process.exit(1); // Fail the script
  } else {
    console.log(`No secrets found in ${filePath}`);
  }
} catch (error) {
  console.error(`Error reading file ${filePath}:`, error.message);
  process.exit(1);
}
