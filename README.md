# Rulefy

[![npm version](https://img.shields.io/npm/v/rulefy.svg)](https://www.npmjs.com/package/rulefy)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/rulefy.svg)](https://nodejs.org/)

**Supercharge your Cursor AI with codebase-specific intelligence.** Rulefy transforms your GitHub repositories into custom rules that teach Cursor AI how your project works, resulting in more accurate code suggestions, better refactoring, and contextually aware assistance.

## Why Rulefy?

- ✅ **Instant Expertise**: Your AI assistant immediately understands your project conventions and architecture
- ✅ **Better Suggestions**: Get code completions that match your project's style and patterns
- ✅ **Fewer Hallucinations**: Rules constrain the AI to work within your codebase's patterns and dependencies
- ✅ **Zero Learning Curve**: One command to analyze your repo and generate optimized rules


## Features

- 🚀 Analyze GitHub repositories or local codebases with a single command
- 🧩 Intelligently extract project structure, conventions, and patterns
- 📚 Handles large codebases that exceed the token limit for LLMs
- 🤖 Generate tailored Cursor rules using Claude AI
- 📝 Create production-ready .rules.mdc files for immediate use
- 🔧 Customize analysis with flexible configuration options

## Installation

```bash
# Install globally
npm install -g rulefy

# Or use with npx (no installation required)
npx rulefy
```

## Prerequisites

- Node.js 18 or higher
- ANTHROPIC_API_KEY environment variable set with your Anthropic API key

```bash
export ANTHROPIC_API_KEY='your-anthropic-api-key'
```

## Usage

The basic command structure is:

```bash
rulefy <repo-path>
```

Examples:

```bash
# Inside a repository
rulefy

# Using local repository path
rulefy ./my-local-project/subdir

# Using GitHub URL
rulefy --remote https://github.com/fastapi/fastapi

# Rulefy with specific description as an option
rulefy --description "guidelines for extending the component using the base interface"

# Specify Cursor AI rule type
rulefy --rule-type "agent" --description "coding standards for React components"
```

This will:
1. Fetch the repository content
2. Based on the content, generate rules for Cursor AI
3. Save the output to a `<repo-name>.rules.mdc` file

### Options

```
Options:
  --provider <provider>    LLM model to use (default: "claude-sonnet-4-5-20250929")
  --description <text>     Description of what should be rulefied
  --rule-type <type>       Type of rule to generate (auto, manual, agent, always)
  --tokenizer <tokenizer>  Tokenizer used to count tokens (default: "p50k_base")
  --chunk-size <size>      Chunk size for the repository to be processed in one go (default: 100000)
  -h, --help               display help for command
```

`rulefy` supports [all options supported by `repomix`](https://github.com/yamadashy/repomix/tree/main?tab=readme-ov-file#-usage). For example, select specific files:

```bash
rulefy --include "src/**/*.ts" --compress
```

## Installing Rules in Cursor

After generating your rules file, you'll need to install it in Cursor:

1. Open Cursor editor
2. Go to Settings > AI > Rules
3. Click "Add Rules File" and select your generated `<filename>.rules.mdc` file
4. Restart Cursor to apply the new rules

For more detailed instructions, see the [official Cursor documentation](https://docs.cursor.com/context/rules-for-ai).

## Example Output

The generated `.rules.mdc` file will contain structured guidelines for Cursor AI when working with your codebase:

```markdown
# .cursorrules for my-project

## Project Overview
This project is a TypeScript application that...

## Coding Standards
- Follow TypeScript best practices with strict typing
- Use async/await for asynchronous operations
...

## File Structure Guidelines
- Place core logic in the `src/` directory
...
```

## Best Practices

### Minimize context length, cost and rate limits

If you encounter rate limits or ihigh costs, try to minimize the context length using the following ways:

- Use `rulefy --compress` to compress the context length
- Use `rulefy --include` to include only the files you need with globs
- Use `rulefy --exclude` to exclude the files you don't need with globs
- Control the size of the chunk being processed by one go by using the `--chunk-size` option. (default is `--chunk-size 100000`)


## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.


## Acknowledgements

This project is inspired by and builds upon the work of:

- [repomix](https://github.com/yamadashy/repomix) - A tool for converting repositories into textual representations
- [awesome-cursorrules](https://github.com/PatrickJS/awesome-cursorrules) - A curated list of cursor rules for different projects and languages
- [cursor-custom-agents-rules-generator](https://github.com/bmadcode/cursor-custom-agents-rules-generator) - best practices for Cursor custom agents and rules generator

We're grateful to these projects for their contributions to the developer tooling ecosystem.
