// Mock for node:child_process for React Native
// This module is not available in React Native, so we provide a stub

function spawn() {
  throw new Error('child_process.spawn is not available in React Native');
}

function exec() {
  throw new Error('child_process.exec is not available in React Native');
}

function execSync() {
  throw new Error('child_process.execSync is not available in React Native');
}

function fork() {
  throw new Error('child_process.fork is not available in React Native');
}

module.exports = {
  spawn,
  exec,
  execSync,
  fork,
  // Export a minimal ChildProcess mock for compatibility
  ChildProcess: class ChildProcess {},
};
