const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

function checkServer(url){
  return new Promise((resolve)=>{
    const req = http.request(url, { method: 'GET', timeout: 2000 }, (res)=>{
      resolve(res.statusCode >= 200 && res.statusCode < 500);
    });
    req.on('error', ()=> resolve(false));
    req.on('timeout', ()=> { req.destroy(); resolve(false); });
    req.end();
  });
}

(async ()=>{
  const cwd = path.resolve(__dirname, '..');
  console.log('Spawning npm run dev detached in', cwd);
  // Start dev server detached
  const child = spawn('npm', ['run','dev'], { cwd, detached: true, stdio: 'ignore' });
  child.unref();

  console.log('Waiting for http://localhost:3000 to respond...');
  let ok = false;
  for (let i=0;i<60;i++){
    // eslint-disable-next-line no-await-in-loop
    ok = await checkServer('http://localhost:3000');
    if (ok) break;
    // eslint-disable-next-line no-await-in-loop
    await new Promise(r=>setTimeout(r,1000));
  }

  if (!ok) {
    console.error('Server did not become ready within timeout');
    process.exit(1);
  }

  console.log('Server is up. Running e2e script...');
  const e2e = spawn(process.execPath, [path.join(__dirname,'e2e-upload.js')], { cwd, stdio: 'inherit' });
  e2e.on('close', (code)=>{
    console.log('E2E finished with code', code);
    process.exit(code||0);
  });
})();
