import * as vscode from 'vscode';

let pylosPath: string | undefined;

const pylosCommands = [
  'All pylos microservices',
  'Local infra',
  'Build',
  'Build with test',
  'Claim',
  'Claim processing',
  'Clinical informatics',
  'CRM',
  'Doctor discovery',
  'Document generation',
  'Document storage',
  'General knowledge',
  'Internal staff',
  'Member',
  'Policy',
  'Profile management',
  'Provider',
  'Provider organization',
  'Standalone reporting',
  'User',
] as const;
type pylosCommandType = (typeof pylosCommands)[number];

const puroApps = [
  'All micro-frontend',
  'Authentication',
  'Claim operation',
  'Engineering',
  'Material',
  'Member',
  'Member services',
  'Organization-representative',
  'Provider',
  'Provider Services',
  'Shell',
] as const;
type PuroCommandType = (typeof puroApps)[number];

export function activate(context: vscode.ExtensionContext) {
  // ----
  // Register Pylos commands
  const pylos = vscode.commands.registerCommand('pylos.run', async () => {
    const cmd = (await vscode.window.showQuickPick(pylosCommands, {
      matchOnDescription: true,
    })) as pylosCommandType;

    // run only when user choose command to run
    if (!cmd) {
      return;
    }

    pylosPath = vscode.workspace.getConfiguration().get('docdoc.pylos.path');

    // check is pylos path already set in vccode settings
    if (!pylosPath) {
      vscode.window.showErrorMessage('Pylos path is not set!', {
        modal: true,
        detail: 'Open VS Code settings then search "Path to Pylos"',
      });
      return;
    }

    if (cmd === 'All pylos microservices') {
      // run local infra
      pylosCreateTerminal('Local infra');

      // wait until local infra ready before running other MS
      vscode.window
        .showInformationMessage(
          'Is local infra ready?',
          {
            modal: true,
            detail:
              'Before running the Pylos microservice, make sure the local infra is ready.\n\n Click "Continue" when the local infra is run successfully.',
          },
          'Continue'
        )
        .then((answer) => {
          if (answer === 'Continue') {
            pylosCommands
              .filter(
                (c) =>
                  ![
                    'Local infra',
                    'Build',
                    'Build with test',
                    'All pylos microservices',
                  ].includes(c)
              )
              .forEach((c) => {
                pylosCreateTerminal(c);
              });
          }
        });

      return;
    }

    pylosCreateTerminal(cmd);
  });

  // ----
  // Register Puro commands
  const puro = vscode.commands.registerCommand('puro.run', async () => {
    const cmd = (await vscode.window.showQuickPick(puroApps, {
      matchOnDescription: true,
    })) as PuroCommandType;
    if (cmd && puroApps.includes(cmd)) {
      // run only when user choose command to run
      puroCreateTerminal(cmd);
    }
  });

  context.subscriptions.push(pylos, puro);
}

function pylosCreateTerminal(command: pylosCommandType) {
  const terminal = createOrReuseTerminal(command, pylosPath);

  switch (command) {
    case 'Build':
      terminal.sendText(`./mvnw clean install -P skipTests`, true);
      break;
    case 'Build with test':
      terminal.sendText(`./mvnw clean install`, true);
      break;
    case 'Local infra':
      terminal.sendText(
        `cd "${pylosPath}/local-infra" && docker-compose up`,
        true
      );
      break;
    default: {
      const microService = command.replaceAll(' ', '-').toLowerCase();
      terminal.sendText(
        `./mvnw -pl apps/${microService} spring-boot:run -Dspring-boot.run.profiles=local -P deployment `,
        true
      );
    }
  }
}

function puroCreateTerminal(command: PuroCommandType) {
  const terminal = createOrReuseTerminal(command);

  if (command === 'All micro-frontend') {
    terminal.sendText('pnpm start', true);
  } else {
    const microService = command.replaceAll(' ', '-').toLowerCase();
    terminal.sendText(`npx nx run ${microService}:serve:local`, true);
  }
}

function createOrReuseTerminal(terminalName: string, cwd?: string) {
  let existingTerminal = vscode.window.terminals.find(
    (terminal) => terminal.name === terminalName
  );
  if (existingTerminal) {
    const processId = existingTerminal.processId;
    existingTerminal.sendText(`kill -9 ${processId}`, true);
    existingTerminal.dispose();
  }

  // create new terminal
  const terminal = vscode.window.createTerminal({
    name: terminalName,
    cwd,
  });

  terminal.show();

  return terminal;
}
