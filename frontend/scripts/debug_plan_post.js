const http = require('http');

(async ()=>{
  const url = 'http://localhost:8000/api/plan/generate';
  // Payload shaped to match backend PlanSchema: user_id + topics, optional learning_pace, optional new_deadline
  const payload = {
    user_id: 'test-user',
    topics: ['OOP Concepts','Polymorphism','Inheritance'],
    learning_pace: 'balanced'
    // note: do not include new_deadline when null to avoid validation error
  };
  const body = JSON.stringify(payload);
  console.log('Posting to', url, 'payload:', payload);
  const req = http.request(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } }, (res)=>{
    let data = '';
    res.on('data', (chunk)=> data += chunk);
    res.on('end', ()=>{
      console.log('Status', res.statusCode, 'Response:', data);
    });
  });
  req.on('error', (err)=> console.error('Request failed:', err.message));
  req.write(body);
  req.end();
})();
