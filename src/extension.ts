import * as vscode from 'vscode';

let pylosPath: string | undefined;

const pylosCommands: Record<string, number | null> = {
  'All pylos microservices': null,
  'Local infra': null,
  'Build': null,
  'Build with test': null,
  'Claim': 5,
  'Clinical informatics': 6,
  'Communication': 13,
  'CRM': 12,
  'Doctor discovery': 11,
  'Document generation': 16,
  'Document storage': 7,
  'EHR': 17,
  'General knowledge': 4,
  'Internal staff': 10,
  'Member': 2,
  'Policy': 1,
  'Profile management': 14,
  'Provider': 9,
  'Provider organization': 8,
  'Standalone reporting': 15,
  'User': 3,
};

const puroApps = [
  'All micro-frontend',
  'Authentication',
  'Claim operations',
  'Engineering',
  'Material',
  'Member',
  'Member services',
  'Organization representative',
  'Provider',
  'Provider Services',
  'Shell',
] as const;
type PuroCommandType = (typeof puroApps)[number];

export function activate(context: vscode.ExtensionContext) {
  // ----
  // Register Pylos commands
  const pylos = vscode.commands.registerCommand('pylos.run', async () => {
    const cmd = await vscode.window.showQuickPick(Object.keys(pylosCommands), {
      matchOnDescription: true,
    });

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
            Object.keys(pylosCommands).forEach((c) => {
              if (pylosCommands[c] !== null) {
                pylosCreateTerminal(c);
              }
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

function pylosCreateTerminal(command: string) {
  const terminal = createOrReuseTerminal('Pylos: ' +command, pylosPath);

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
      const msPort = 8100 + pylosCommands[command]!;
      const grpcPort = 9100 + pylosCommands[command]!;
      terminal.sendText(
        `lsof -ti:${msPort},${grpcPort} && kill -9 $(lsof -ti:${msPort},${grpcPort})`,
        true
      );
      terminal.sendText(
        `./mvnw -pl apps/${microService} spring-boot:run -Dspring-boot.run.profiles=local -P deployment`,
        true
      );
    }
  }
}

function puroCreateTerminal(command: PuroCommandType) {
  const terminal = createOrReuseTerminal('Puro: ' + command);

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
