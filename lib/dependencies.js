const path = require('path');
const findInFiles = require('find-in-files');
const { log } = require('./log');
const { CF_DEPS_EXCLUDES } = require('./options');

module.exports.getStackDeps = async (workDir) => {
  const results = await findInFiles.findSync(/\${cf[^:]*:[a-zA-Z0-9\-]+/, workDir, '.yml$|.yaml$');

  const repo = path.basename(path.resolve(process.cwd()));
  log.debug(results);

  let stackDeps = [];
  for (var filePath in results) {
    var fileResults = results[filePath];
    if (fileResults.count > 0) {
      const matches = [...new Set(fileResults.matches)];

      matches.forEach((match) => {
        const depRepo = match.replace(/\${cf[^:]*:/, '').replace(/-$/, '');
        
        if (CF_DEPS_EXCLUDES.includes(depRepo)) {
          log.debug('EXCLUDED ${cf: match:', match);
          log.debug('EXCLUDED ${cf: filePath:', filePath);
        } else {
          stackDeps.push(depRepo);
        }
      });
    }
  }
  return {
    repoName: repo,
    cfDeps: [...new Set(stackDeps)],
  };
};