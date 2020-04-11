const path = require('path');
const yargs = require('yargs')
  .epilog('Work extra hard to masterfully automate today\'s problem so you can fully focus on the next big thing.')
  .usage(`$0
    Create list of CloudFormation stackName references from yaml/yml files
    and upload them to a central git repo for scalable deploy-dependency
    management. Use this in a CI/CD space to dynamically publish stack
    dependencies.
  ` + '\nStarred options are required. Specify by command flag or ENV var listed in []')
  .example(`$0 -f deps.json -r git@here.org/repo.git -u me -m me@here.org`)
  .example(`
  export CF_DEPS_JSON_FILE="deps.json";
  export CF_DEPS_REMOTE_GIT="git@here.org/repo.git";
  export CF_DEPS_GIT_USR_NAME="me";
  export CF_DEPS_GIT_USR_MAIL="me@here.org";
  $0`)
  .option('file', { alias: 'f', type: 'string', desc: '*[CF_DEPS_REMOTE_GIT] json file for storage' })
  .option('remote', { alias: 'r', type: 'string', desc: '*[CF_DEPS_JSON_FILE] git clone url for cf-deps storage' })
  .option('username', { alias: 'u', type: 'string', desc: '*[CF_DEPS_GIT_USR_NAME] git username' })
  .option('email', { alias: 'm', type: 'string', desc: '*[CF_DEPS_GIT_USR_MAIL] git user email' })
  .option('branch', { alias: 'b', type: 'string', desc: '[CF_DEPS_REMOTE_BRANCH] git branch, default: master' })
  .option('debug', { type: 'boolean', desc: '[CF_DEPS_DEBUG] enable debug logging' })
  .option('excludes', { alias: 'e', type: 'string', desc: '[CF_DEPS_EXCLUDES] comma-delimited stackNames to exclude' })
  .nargs('r', 1)
  .nargs('f', 1)
  .nargs('b', 1)
  .nargs('e', 1);
const { argv } = yargs;

module.exports = {
  CF_DEPS_DEBUG: argv.debug || process.env.CF_DEPS_DEBUG,
  CF_DEPS_REMOTE_GIT: requireOption(argv.r, 'CF_DEPS_REMOTE_GIT'),
  CF_DEPS_JSON_FILE: requireOption(argv.f, 'CF_DEPS_JSON_FILE'),
  CF_DEPS_GIT_USR_NAME: requireOption(argv.u, 'CF_DEPS_GIT_USR_NAME'),
  CF_DEPS_GIT_USR_MAIL: requireOption(argv.m, 'CF_DEPS_GIT_USR_MAIL'),
  CF_DEPS_REMOTE_BRANCH: getBranch(),
  CF_DEPS_EXCLUDES: getExcludes(),
  CURRENT_REPO: path.basename(path.resolve(process.cwd())),
};

function requireOption(cliValue, envName) {
  const val = cliValue || process.env[envName];
  if (!val) {
    yargs.showHelp();
    throw new Error(`Missing ${envName}, see above for help.`);
  }
  return val;
}

function getBranch() {
  const fromConfig = argv.b || process.env.CF_DEPS_REMOTE_BRANCH;
  return fromConfig || 'master';
}

function getExcludes() {
  const fromCli = argv.e
    ? argv.e.split(',')
    : [];
  const fromEnv = process.env.CF_DEPS_EXCLUDES
    ? process.env.CF_DEPS_EXCLUDES.split(',')
    : [];
  return fromCli.concat(fromEnv);
}
