const { spawn } = require('child_process');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const serverDir = path.join(rootDir, 'server');
const clientDir = path.join(rootDir, 'client');

const isWindows = process.platform === 'win32';

console.log('\x1b[36m%s\x1b[0m', '🚀 Starting GHARMB Backend & Frontend Development Servers...\n');

// Command helper for cross-platform execution without deprecation warnings
function runNpmDev(cwd) {
  if (isWindows) {
    return spawn('cmd.exe', ['/c', 'npm', 'run', 'dev'], {
      cwd,
      stdio: 'pipe'
    });
  } else {
    return spawn('npm', ['run', 'dev'], {
      cwd,
      stdio: 'pipe'
    });
  }
}

// Start Backend Server & Frontend Client
const serverProcess = runNpmDev(serverDir);
const clientProcess = runNpmDev(clientDir);

function prefixOutput(stream, prefix, colorCode) {
  stream.on('data', (data) => {
    const lines = data.toString().split('\n');
    lines.forEach((line) => {
      if (line.trim()) {
        console.log(`${colorCode}[${prefix}]\x1b[0m ${line}`);
      }
    });
  });
}

// Yellow for Backend Server, Cyan for Frontend Client
prefixOutput(serverProcess.stdout, 'SERVER', '\x1b[33m');
prefixOutput(serverProcess.stderr, 'SERVER', '\x1b[33m');

prefixOutput(clientProcess.stdout, 'CLIENT', '\x1b[36m');
prefixOutput(clientProcess.stderr, 'CLIENT', '\x1b[36m');

let cleanedUp = false;
function cleanup() {
  if (cleanedUp) return;
  cleanedUp = true;
  console.log('\n\x1b[35m%s\x1b[0m', '🛑 Stopping development processes...');
  
  if (isWindows) {
    if (serverProcess.pid) {
      spawn('taskkill', ['/pid', serverProcess.pid, '/f', '/t']);
    }
    if (clientProcess.pid) {
      spawn('taskkill', ['/pid', clientProcess.pid, '/f', '/t']);
    }
  } else {
    serverProcess.kill('SIGINT');
    clientProcess.kill('SIGINT');
  }
}

process.on('SIGINT', () => {
  cleanup();
  process.exit();
});

process.on('SIGTERM', () => {
  cleanup();
  process.exit();
});
