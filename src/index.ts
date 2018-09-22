import * as yargs from 'yargs';
import * as ware from 'ware';
import signupRoutine from 'subroutines/signup';

const commands = {
  signup: 'signup',
};

const showIntro = (req, res, next) => {
  if (req.params.verbosity > 0) {
    const header = 
`|\\     /||\\     /|(  ____ \\|\\     /|
| )   ( || )   ( || (    \\/| )   ( |
| (___) || |   | || (_____ | (___) |
|  ___  || |   | |(_____  )|  ___  |
| (   ) || |   | |      ) || (   ) |
| )   ( || (___) |/\\____) || )   ( |
|/     \\|(_______)\\_______)|/     \\|`;
  
    console.log(header);
    next();
  }
};

const parseOpts = (req, res, next) => {
  req.params = yargs
    .scriptName('hush')
    .usage('Usage: $0 <command> [options]')
    .options({
      help: {
        alias: 'h',
        description: 'Show help',
      },
      version: {
        alias: 'v',
        description: 'Show version information',
      },
      interaction: {
        description: 'Disables/enables all interactive prompts',
        type: 'boolean',
        default: true,
      },
      // seems not to be assignable. only stackable w/ the current setup
      verbosity: {
        alias: 'd',
        description: 'Sets the chattiness. [0-4]',
        type: 'count',
        default: 1,
      },
    })
    .command({
      command: 'signup [email] [name]',
      describe: 'Create a new hush account',
      builder: () => yargs
        .options({
          email: {
            alias: 'e',
            description: 'your email',
            nargs: 1,
            type: 'string',
          },
          name: {
            alias: 'n',
            description: 'your name',
            nargs: 1,
            type: 'string',
          },
        }),
        handler: () => {
          req.command = commands.signup;
        },
    })
    // TODO: @amin - report issue @typedef/yargs `handler` is not required
    // @ts-ignore
    .command({
      command: '*',
      describe: 'Run hush',
    })
    .argv;
    next();
  };
  
  const routeToSubroutine = (req, res, next) => {

    if(req.command === 'signup') {
      signupRoutine(req, res, next);
    }
    else {
      // TODO: @amin - prompt for the subroutine instead of just showing help
      yargs.showHelp();
    }
};

const mainRoutine = ware()
  .use(parseOpts)
  .use(showIntro)
  .use(routeToSubroutine);

mainRoutine.run({}, {}, (err, req, res) => {
  if(err) {
    console.error(err.message);
    return;
  }

  console.log(req);
  console.log(res);
});