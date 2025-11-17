import process from 'node:process';
import { Command } from 'commander';
import pc from 'picocolors';
import { rulesGenerate } from './rulesGenerate.js';

export const run = async (): Promise<void> => {
  try {
    const program = new Command();

    program
      .description('Rulefy - Transform GitHub repositories into cursor rules instructions')
      .argument('[repo-path]', 'Path to the repository', '.')
      .allowExcessArguments(true)
      .option('--provider <provider>', 'LLM model to use', 'claude-3-7-sonnet-latest')
      .option('--description <text>', 'Description of what should be rulefied')
      .option('--rule-type <type>', 'Type of rule to generate (auto, manual, agent, always)')
      .option(
        '--chunk-size <size>',
        'Chunk size for the repository to be processed in one go',
        (value: string) => {
          const num = Number.parseInt(value);
          if (Number.isNaN(num) || num <= 0)
            throw new Error(`Invalid chunk size "${value}". Please provide a positive integer.`);
          return num;
        },
        100000
      )
      .allowUnknownOption(true);

    program.parse(process.argv);

    const options = program.opts();
    const args = program.args;

    // Find the repository path (first argument that doesn't start with --)
    const repoPathIndex = args.findIndex(arg => !arg.startsWith('--'));
    const repoPath = repoPathIndex >= 0 ? args[repoPathIndex] : '.';

    console.log(pc.bold(`\n🧩 Rulefy - Generating cursor rules for ${repoPath}\n`));

    if (options.description) {
      console.log(pc.cyan(`Rulefying with description: "${options.description}"\n`));
    }

    // Create a dictionary for additional options
    const additionalOptions: Record<string, string> = {};

    // Known options already handled by Commander
    const knownOptions = ['provider', 'description', 'rule-type', 'chunk-size'];
    const knownOptionFlags = knownOptions.map(opt => `--${opt}`);

    // Parse additional options from args array
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];

      // Skip the repository path
      if (i === repoPathIndex) continue;

      // Check if it's an option (starts with --)
      if (arg.startsWith('--') && !knownOptionFlags.includes(arg)) {
        const optionName = arg.slice(2); // Remove '--'

        // Check if next argument exists and doesn't start with -- and isn't the repo path
        if (i + 1 < args.length && !args[i + 1].startsWith('--') && i + 1 !== repoPathIndex) {
          additionalOptions[optionName] = args[i + 1];
          i++; // Skip the next argument since we've used it as a value
        } else {
          // Option without value (boolean flag)
          additionalOptions[optionName] = 'true';
        }
      }
    }

    await rulesGenerate(repoPath, {
      description: options.description,
      ruleType: options.ruleType,
      provider: options.provider,
      chunkSize: options.chunkSize,
      additionalOptions
    });

  } catch (error) {
    if (error instanceof Error) {
      console.error('Error:', error.message);
    } else {
      console.error('Unknown error occurred');
    }
    process.exit(1);
  }
};
