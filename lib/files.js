const {
  writeFileSync,
  statSync,
} = require('fs');
const rimraf = require('rimraf');

module.exports = {
  // TODO: rewrite this to real thing, use CF_DEPS_JSON_FILE
  saveDeps: (newDeps) => {
    const existingDeps = require(`${process.cwd()}/deps.json`);
    existingDeps[newDeps.repoName] = newDeps.cfDeps;
    writeFileSync(`${process.cwd()}/deps.json`, JSON.stringify(existingDeps, null, 2));
  },

  directoryExists: (filePath) => {
    try {
      return statSync(filePath).isDirectory();
    } catch (err) {
      return false;
    }
  },

  rmDir: (dir) => {
    rimraf.sync(dir);
  },
}