const {
  writeFileSync,
  statSync,
} = require('fs');
const rimraf = require('rimraf');
const { CF_DEPS_JSON_FILE } = require('./options');
const { bash } = require('./bash');

module.exports = {
  saveDeps: async (newDeps, localDir) => {
    const jsonFilePath = `${localDir}/${CF_DEPS_JSON_FILE}`;

    let existingDeps = {};
    if (fileExists(jsonFilePath)) {
      existingDeps = require(jsonFilePath);
    }
    existingDeps[newDeps.repoName] = newDeps.cfDeps;
    writeFileSync(jsonFilePath, JSON.stringify(existingDeps, null, 2));
    bash('git status');
  },

  directoryExists: (filePath) => {
    try {
      return statSync(filePath).isDirectory();
    } catch (err) {
      return false;
    }
  },

  fileExists: fileExists,
  
  rmDir: (dir) => {
    rimraf.sync(dir);
  },
}

function fileExists(filePath) {
  try {
    return statSync(filePath).isFile();
  } catch (err) {
    return false;
  }
}