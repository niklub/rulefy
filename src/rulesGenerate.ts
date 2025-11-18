import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import pc from 'picocolors';
import { generateWithLLM } from './llmGenerator.js';

interface RulesGenerateOptions {
  description?: string;
  ruleType?: string;
  provider: string;
  chunkSize: number;
  tokenizer: string;
  additionalOptions?: Record<string, string>;
}

export async function rulesGenerate(
  repoPath: string,
  options: RulesGenerateOptions
): Promise<void> {
  try {
    // 1. Extract repo name from URL or path
    const repoName = extractRepoName(repoPath);

    // 2. Set output directory based on repo name
    const outputDir = `${repoName}-output`;
    const outputFile = path.join(outputDir, `${repoName}.rules.mdc`);

    // Ensure output directory exists
    await fs.mkdir(outputDir, { recursive: true });

    console.log(pc.cyan('1. Converting repository to text using repomix...'));
    // 3. Run repomix to get repo representation
    let repoText: string;
    try {
      repoText = await runRepomix(repoPath, outputDir, options.tokenizer, options.additionalOptions);
    } catch (error) {
      console.log(pc.yellow(`Warning: Could not get actual repo content. Error: ${error}. Using mock content for testing.`));
      repoText = generateMockRepoContent(repoName);
    }

    console.log(pc.cyan('2. Reading cursor rules guidelines...'));
    // 4. Read guidelines file
    let guidelinesText: string;
    try {
      // First try with a path relative to the current module
      const modulePath = new URL(import.meta.url).pathname;
      const moduleDir = path.dirname(modulePath);
      const moduleDirPath = path.resolve(moduleDir, '../src/prompts/cursor_mdc.md');

      guidelinesText = await fs.readFile(moduleDirPath, 'utf-8');
      console.log(pc.green('✓ Successfully read guidelines from module path'));
    } catch (_error) {
      // If not found in module path, try with a local path
      try {
        console.debug(`Error: ${_error}. Trying to read guidelines from local path...`);
        guidelinesText = await readGuidelines('../src/prompts/cursor_mdc.md');
        console.log(pc.green('✓ Successfully read guidelines from local path'));
      } catch (innerError) {
        console.log(pc.yellow('Warning: Could not read guidelines. Error: ' + innerError + '. Using built-in guidelines.'));
        guidelinesText = generateMockGuidelines();
      }
    }

    console.log(pc.cyan('3. Generating cursor rules...'));
    // 5. Generate rules using LLM
    const generatedRules = await generateWithLLM(
      repoText,
      guidelinesText,
      outputDir,
      options.provider,
      options.chunkSize,
      options.tokenizer,
      options.description,
      options.ruleType,
    );

    console.log(pc.cyan(`4. Writing rules to ${outputFile}...`));
    // 6. Write output to file
    await fs.writeFile(outputFile, generatedRules);

    console.log(pc.green(`\n✅ Successfully generated cursor rules for ${repoName}!`));
    console.log(`Output saved to: ${pc.bold(outputFile)}`);
    console.log(`All generated files are in: ${pc.bold(outputDir)}`);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to generate rules: ${error.message}`);
    }
    throw new Error('Failed to generate rules: Unknown error');
  }
}

function extractRepoName(repoPath: string): string {
  // Handle current directory case
  if (repoPath === '.') {
    return path.basename(process.cwd());
  }

  // For local paths, use the directory name
  try {
    // Sync version to avoid Promise handling in this synchronous function
    if (fsSync.statSync(repoPath).isDirectory()) {
      return path.basename(repoPath);
    }
  } catch (_e) {
    // Path doesn't exist or can't be accessed, check if it's a remote repo
    console.log(pc.yellow(`Warning: Could not find a local repo by path: ${repoPath}. Error: ${_e}`));
  }

  // Handle format like 'owner/repo'
  if (/^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+$/.test(repoPath)) {
    return repoPath.split('/')[1];
  }

  // Handle GitHub URLs (only http or https)
  const githubUrlMatch = repoPath.match(/^https?:\/\/github\.com\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_-]+)/);
  if (githubUrlMatch) {
    return githubUrlMatch[2];
  }

  // If no match, use a sanitized version of the path as fallback
  return repoPath.replace(/[^a-zA-Z0-9_-]/g, '-').replace(/^-+|-+$/g, '');
}

async function runRepomix(repoPath: string, outputDir: string, tokenizer: string, additionalOptions?: Record<string, string>): Promise<string> {
  try {

    // Build repomix command based on whether it's a remote or local repository
    let command = `npx repomix ${repoPath} --token-count-encoding ${tokenizer}`;

    // Add any additional options to the command
    if (additionalOptions) {
      for (const [key, value] of Object.entries(additionalOptions)) {
        if (value === 'true') {
          command += ` --${key}`;
        } else {
          command += ` --${key} "${value}"`;
        }
      }
    }

    // Add output directory to command
    const outputFilePath = path.join(outputDir, 'repomix-output');
    command += ` --output "${outputFilePath}"`;

    // Display the command being executed
    console.log(pc.cyan(`Executing: ${command}`));

    // Run repomix command
    execSync(command, {
      encoding: 'utf-8',
      stdio: 'inherit' // Show all output directly in the console
    });

    // Read the content of the generated file
    console.log(pc.green(`Reading repomix output from: ${outputFilePath}`));

    const content = await fs.readFile(outputFilePath, 'utf-8');
    return content;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error running repomix: ${error.message}`);
    }
    throw new Error('Unknown error occurred while running repomix');
  }
}

async function readGuidelines(guidelinesPath: string): Promise<string> {
  try {
    const absolutePath = path.resolve(process.cwd(), guidelinesPath);
    return await fs.readFile(absolutePath, 'utf-8');
  } catch (_error) {
    throw new Error(`Failed to read guidelines file at ${guidelinesPath}. Error: ${_error}. Make sure the file exists.`);
  }
}

function generateMockRepoContent(repoName: string): string {
  return `# Project: ${repoName}

## Directory Structure
- src/
  - index.ts
  - core/
    - processor.ts
    - utils.ts
  - lib/
    - api.ts
    - helpers.ts
- tests/
  - core.test.ts
  - api.test.ts
- package.json
- tsconfig.json
- README.md

## Key Files
### src/index.ts
This is the main entry point of the application.

### src/core/processor.ts
Contains the core processing logic.

### src/lib/api.ts
Contains API integration code.

## Technologies Used
- TypeScript
- Node.js
- Jest for testing
`;
}

function generateMockGuidelines(): string {
  return `**Guidelines for Creating Content for** .cursorrules

.cursorrules files serve as customized instruction sets for Cursor AI, tailoring its code generation behavior to specific project requirements. These files should be placed in the repository root to provide project-wide context and guidelines.

**1. Use Markdown for Documentation**
* All documentation within .cursorrules files or accompanying READMEs must be written in Markdown to ensure consistency and readability.

**2. Maintain a Clear Structure**
* Organize content logically with clear sections (e.g., general guidelines, project-specific rules, file structure) to provide context and instructions effectively.

**3. Focus on Best Practices and Standards**
* Define coding standards, best practices, and style guidelines specific to the technology or framework to ensure consistent, high-quality output.

**4. Include Project-Specific Context**
* Include details about the project's structure, architectural decisions, and commonly used libraries or methods to guide AI behavior.
`;
}
