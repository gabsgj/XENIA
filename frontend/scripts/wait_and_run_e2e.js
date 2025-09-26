const http = require('http');
const { spawn } = require('child_process');
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
  const url = 'http://localhost:3000';
  console.log('Waiting for', url);
  for (let i=0;i<60;i++){
    // eslint-disable-next-line no-await-in-loop
    const ok = await checkServer(url);
    if (ok){
      console.log('Server is up');
      break;
    }
    // eslint-disable-next-line no-await-in-loop
    await new Promise(r=>setTimeout(r,1000));
  }

  console.log('Running e2e script now');
  const e2e = spawn(process.execPath, [path.join(__dirname,'e2e-upload.js')], { stdio: 'inherit' });
  e2e.on('close', (code)=>{
    console.log('E2E script exited with', code);
    process.exit(code);
  });
})();
