const { ESLint } = require("eslint");
(async function main() {
  const eslint = new ESLint({ 
    useEslintrc: false, 
    baseConfig: { 
      extends: ["eslint:recommended"], 
      parserOptions: { ecmaVersion: 2021, sourceType: "module", ecmaFeatures: { jsx: true } }, 
      env: { browser: true, es2021: true } 
    }
  });
  const results = await eslint.lintFiles(["src/**/*.jsx"]);
  const errors = results.filter(r => r.errorCount > 0 || r.fatalErrorCount > 0);
  console.log(JSON.stringify(errors.map(e => ({ filePath: e.filePath, messages: e.messages })), null, 2));
})().catch(console.error);
