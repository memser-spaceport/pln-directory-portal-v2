const fs = require('fs');
const path = require('path');

const secretPatterns = [
  /AKIA[0-9A-Z]{16}/, // AWS Access Key
  /[a-zA-Z0-9]{40}/,  // Generic token
  /[A-Za-z0-9+/]{20,}={0,2}/ // Base64 strings
];

const checkFileForSecrets = (filePath) => {
  const content = fs.readFileSync(filePath, 'utf8');
  const matches = secretPatterns.flatMap((pattern) =>
    [...content.matchAll(pattern)].map((match) => ({
      pattern: pattern.toString(),
      match: match[0],
      line: content.substring(0, match.index).split('\n').length,
    }))
  );
  return matches;
};

const main = () => {
  const dir = process.cwd();
  const files = fs.readdirSync(dir).filter((file) => file.endsWith('.ts'));
console.log(files);
  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const secrets = checkFileForSecrets(filePath);

    if (secrets.length > 0) {
      console.log(`Secrets detected in ${filePath}:`);
      secrets.forEach((secret) =>
        console.log(`- Pattern: ${secret.pattern}, Line: ${secret.line}`)
      );
      process.exit(1); // Fail the workflow
    }
  });
};

main();
