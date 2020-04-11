const { CF_DEPS_DEBUG } = require('./options');

module.exports.log = {

  info: (msg, extra) => {
    logit('[cf-deps INFO]', msg, extra);
  },

  debug: (msg, extra) => {
    if (CF_DEPS_DEBUG) {
      logit('[cf-deps DEBUG]', msg, extra);
    }
  },

  error: (msg, extra) => {
    logit('[cf-deps ERROR]', msg, extra);
  },

};

function logit(prefix, msg, extra) {
  if (extra) {
    console.log(prefix, msg, extra);
  } else {
    console.log(prefix, msg);
  }
}