
import { spawn } from 'child_process';
import path from 'path';

// Function to run a command
function runCommand(command, args, cwd, env = {}) {
  console.log(`Running command: ${command} ${args.join(' ')}`);
  const childProcess = spawn(command, args, {
    cwd,
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, ...env } // Merge current process env with custom env
  });
  
  childProcess.on('error', (error) => {
    console.error(`Error executing command: ${error.message}`);
  });
  
  return childProcess;
}

// Start the backend server
console.log('Starting backend server...');
const server = runCommand('node', ['server.cjs'], process.cwd(), { NODE_ENV: 'development' });

// Start the frontend dev server
console.log('Starting frontend dev server...');
const frontend = runCommand('npx', ['vite'], path.join(process.cwd(), 'frontend'));

// Handle process termination
process.on('SIGINT', () => {
  console.log('Shutting down servers...');
  server.kill();
  frontend.kill();
  process.exit();
});

console.log('\nServers started! Press Ctrl+C to stop both servers.\n');
