import { execSync } from 'child_process';
try {
  console.log('Current working directory:', process.cwd());
  const paths = execSync('find . -maxdepth 4 -name "Reports*" -o -name ".git"', { encoding: 'utf-8' });
  console.log('Found paths:\n', paths);
} catch (e: any) {
  console.error('Error:', e?.message);
}
