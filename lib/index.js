#!/usr/bin/env node
const { getStackDeps } = require('./dependencies');
const { saveDeps } = require('./files');
const { log } = require('./log');
const { cloneRemoteStore, pushDeps } = require('./git');

log.info('Aloha Honua!');

const main = async () => {
  
  const deps = await getStackDeps(process.cwd());
  
  if (deps.cfDeps.length > 0) {
    log.info('CloudFormation dependencies:', deps);
    const storage = await cloneRemoteStore();
    log.debug(storage);
    await saveDeps(deps, storage.localDir);
    await pushDeps(storage);
    log.info('Done.');
  } else {
    log.info('No CloudFormation dependencies found to document.');
  }
};

main();