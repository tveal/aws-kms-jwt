const findInFiles = require('find-in-files');
const { log } = require('./log');
const { CF_DEPS_EXCLUDES, CURRENT_REPO } = require('./options');

module.exports.getStackDeps = async (workDir) => {
  const results = await findInFiles.findSync(/\${cf[^:]*:[a-zA-Z0-9\-]+/, workDir, '.yml$|.yaml$');

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
    repoName: CURRENT_REPO,
    cfDeps: [...new Set(stackDeps)],
  };
};