#!/usr/bin/env node
const { getStackDeps } = require('./dependencies');
// const { saveDeps } = require('./files');
const { cloneRemoteStore } = require('./git');
const { log } = require('./log');

log.info('Aloha Honua!');

const main = async () => {
  
  const deps = await getStackDeps(process.cwd());
  
  // saveDeps(deps);
  if (deps.cfDeps.length > 0) {
    log.info('CloudFormation dependencies:', deps);
    const remote = await cloneRemoteStore();
    log.info(remote);
  } else {
    log.info('No CloudFormation dependencies found to document.');
  }
};

main();