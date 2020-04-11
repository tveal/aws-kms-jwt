const git = require('simple-git/promise');
const Spinner = require('clui').Spinner;
const chalk = require('chalk');
const { CF_DEPS_REMOTE_GIT, CF_DEPS_JSON_FILE } = require('./options');
const { log } = require('./log');
const { directoryExists, rmDir } = require('./files');

module.exports = {
  cloneRemoteStore: () => {
    if (!CF_DEPS_REMOTE_GIT) {
      throw new Error('CF_DEPS_REMOTE_GIT not set; cannot update remote');
    }
    if (!CF_DEPS_JSON_FILE) {
      throw new Error('CF_DEPS_JSON_FILE not set; cannot update remote');
    }
    return cloneRepo(CF_DEPS_REMOTE_GIT);
  },
}

async function cloneRepo(remote) {
  const localDir = `${process.cwd()}/cf-deps-remote-store`;

  if (directoryExists(localDir)) {
    log.info(`Existing directory found; Deleting ${localDir}...`);
    rmDir(localDir);
  }

  const spinner = new Spinner(`Cloning ${remote} ...`, ['◜', '◠', '◝', '◞', '◡', '◟']);
  spinner.start();
  await git().silent(true)
    .clone(remote, localDir, ['-b', 'master', '--single-branch'])
    .then(() => {
      spinner.stop();
      log.info(`finished cloning: ${localDir}`);
    })
    .catch((err) => {
      spinner.stop();
      log.error(chalk.red('Is this a valid repo?', chalk.bold(remote)));
      throw err;
    });

  return {
    localDir: localDir,
    remote: remote
  };
}
