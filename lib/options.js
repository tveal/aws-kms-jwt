const { argv } = require('yargs')
  .epilog('Work extra hard to masterfully automate today\'s problem so you can fully focus on the next big thing.')
  .usage(`$0
    Create list of CloudFormation stackName references from yaml/yml files
    and upload them to a central git repo for scalable deploy-dependency
    management. Use this in a CI/CD space to dynamically publish stack
    dependencies.
  `)
  .example('$0 -f deps.json -r my-repo-clone-url')
  .example(`
  export CF_DEPS_JSON_FILE="deps.json";
  export CF_DEPS_REMOTE_GIT="my-repo-clone-url";
  $0`)
  .option('debug', { type: 'boolean', desc: '[CF_DEPS_DEBUG] enable debug logging' })
  .option('remote', { alias: 'r', type: 'string', desc: '[CF_DEPS_JSON_FILE] git clone url for cf-deps storage' })
  .option('file', { alias: 'f', type: 'string', desc: '[CF_DEPS_REMOTE_GIT] json file for storage' })
  .option('excludes', { alias: 'e', type: 'string', desc: '[CF_DEPS_EXCLUDES] comma-delimited stackNames to exclude' })
  .nargs('r', 1)
  .nargs('f', 1);

module.exports = {
  CF_DEPS_DEBUG: argv.debug || process.env.CF_DEPS_DEBUG,
  CF_DEPS_REMOTE_GIT: argv.r || process.env.CF_DEPS_REMOTE_GIT,
  CF_DEPS_JSON_FILE: argv.f || process.env.CF_DEPS_JSON_FILE,
  CF_DEPS_EXCLUDES: getExcludes(),
};

function getExcludes() {
  const fromCli = argv.e
    ? argv.e.split(',')
    : [];
  const fromEnv = process.env.CF_DEPS_EXCLUDES
    ? process.env.CF_DEPS_EXCLUDES.split(',')
    : [];
  return fromCli.concat(fromEnv);
}