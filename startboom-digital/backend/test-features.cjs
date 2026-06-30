const http = require('http');

function req(method, path, body, token) {
  return new Promise((resolve) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: 'localhost', port: 5000,
      path: '/api' + path, method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': 'Bearer ' + token } : {}),
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {})
      }
    };
    const r = http.request(opts, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: d, headers: res.headers }));
    });
    r.on('error', e => resolve({ status: 0, body: e.message }));
    if (data) r.write(data);
    r.end();
  });
}

let passed = 0, failed = 0;
function check(label, ok, detail) {
  if (ok) { passed++; console.log('  PASS', label, detail ? '| ' + detail : ''); }
  else    { failed++; console.log('  FAIL', label, detail ? '| ' + detail : ''); }
}

async function run() {
  console.log('Logging in...');
  const loginRes = await req('POST', '/auth/login', { email: 'xtreative@crm.com', password: 'admin123' });
  if (loginRes.status !== 200) {
    console.error('Login failed!', loginRes.body);
    return;
  }
  const token = JSON.parse(loginRes.body).token;
  console.log('Login successful. Running tests...\n');

  console.log('=== 1. IMMUTABLE AUDIT LOGS ===');
  const g = await req('GET', '/audit-logs?limit=3', null, token);
  check('GET /audit-logs 200', g.status === 200, 'status:' + g.status);
  const logs = JSON.parse(g.body);
  check('Returns logs array', Array.isArray(logs.logs), 'total:' + (logs.pagination && logs.pagination.total));
  const blkPost = await req('POST', '/audit-logs', {action:'LOGIN',description:'hack'}, token);
  check('POST blocked 405', blkPost.status === 405, 'status:' + blkPost.status);
  const blkDel = await req('DELETE', '/audit-logs/507f1f77bcf86cd799439011', null, token);
  check('DELETE blocked 405', blkDel.status === 405, 'status:' + blkDel.status);
  const blkPut = await req('PUT', '/audit-logs/507f1f77bcf86cd799439011', {}, token);
  check('PUT blocked 405', blkPut.status === 405, 'status:' + blkPut.status);
  const stats = await req('GET', '/audit-logs/stats/summary', null, token);
  check('GET stats/summary 200', stats.status === 200, 'status:' + stats.status);
  const s = JSON.parse(stats.body);
  check('Stats has total+recent', typeof s.total === 'number', 'total:' + s.total + ' recent:' + s.recent);

  console.log('\n=== 2. ONBOARDING WIZARD ===');
  const ob = await req('GET', '/tenants/onboarding', null, token);
  check('GET /tenants/onboarding 200', ob.status === 200, 'status:' + ob.status);
  const obData = JSON.parse(ob.body);
  check('Has completed flag', typeof obData.completed === 'boolean', 'completed:' + obData.completed);
  check('Has stepsCompleted', typeof obData.stepsCompleted === 'object', JSON.stringify(obData.stepsCompleted));
  const sb = await req('PATCH', '/tenants/onboarding', {step:'branding',completed:true,currentStep:1,primaryColor:'#f97316',companyName:'Default Company'}, token);
  check('PATCH branding 200', sb.status === 200, 'status:' + sb.status);
  const sl = await req('PATCH', '/tenants/onboarding', {step:'localization',completed:true,currentStep:2,timezone:'Africa/Kampala',currency:'UGX',dateFormat:'DD/MM/YYYY'}, token);
  check('PATCH localization 200', sl.status === 200, 'status:' + sl.status);
  const obc = JSON.parse((await req('GET', '/tenants/onboarding', null, token)).body);
  check('Branding persisted', obc.stepsCompleted && obc.stepsCompleted.branding === true, 'value:' + (obc.stepsCompleted && obc.stepsCompleted.branding));
  check('Localization persisted', obc.stepsCompleted && obc.stepsCompleted.localization === true, 'value:' + (obc.stepsCompleted && obc.stepsCompleted.localization));
  check('Currency=UGX', obc.settings && obc.settings.currency === 'UGX', 'value:' + (obc.settings && obc.settings.currency));
  check('Timezone saved', obc.settings && obc.settings.timezone === 'Africa/Kampala', 'value:' + (obc.settings && obc.settings.timezone));
  const sc = await req('PATCH', '/tenants/onboarding', {step:'complete',completed:true,currentStep:5}, token);
  check('PATCH complete 200', sc.status === 200, 'status:' + sc.status);
  const fin = JSON.parse((await req('GET', '/tenants/onboarding', null, token)).body);
  check('Onboarding completed=true', fin.completed === true, 'completed:' + fin.completed);
  await req('PATCH', '/tenants/onboarding', {step:'complete',completed:false,currentStep:0}, token);

  console.log('\n=== 3. PDF EXPORT ===');
  const pdf = await req('GET', '/clients/export/pdf', null, token);
  check('GET /clients/export/pdf 200', pdf.status === 200, 'status:' + pdf.status);
  check('Body is PDF', pdf.body.startsWith('%PDF'), 'starts:' + pdf.body.substring(0,4));
  const pdfF = await req('GET', '/clients/export/pdf?status=active', null, token);
  check('PDF with filter 200', pdfF.status === 200, 'status:' + pdfF.status);

  console.log('\n=== 4. TASK REMINDERS ===');
  const cl = JSON.parse((await req('GET', '/clients?limit=5', null, token)).body);
  const clientList = cl.clients || cl;
  const hasC = Array.isArray(clientList) && clientList.length > 0;
  check('Clients exist', hasC, 'count:' + (Array.isArray(clientList) ? clientList.length : 0));
  if (hasC) {
    const id = clientList[0]._id;
    const tr = await req('POST', '/clients/' + id + '/tasks', {title:'Test reminder task',description:'Automated test',dueDate:new Date(Date.now() - 7200000).toISOString()}, token);
    check('POST task 200', tr.status === 200, 'status:' + tr.status);
    const td = JSON.parse(tr.body);
    const tasks = td.tasks || [];
    const t = tasks[tasks.length - 1];
    check('Task created', t && t.title === 'Test reminder task', 'title:' + (t && t.title));
    check('reminderSent field exists', t && 'reminderSent' in t, 'value:' + (t && t.reminderSent));
    check('overdueSent field exists',  t && 'overdueSent'  in t, 'value:' + (t && t.overdueSent));
    check('reminderSent=false', t && t.reminderSent === false, 'value:' + (t && t.reminderSent));
    check('overdueSent=false',  t && t.overdueSent  === false, 'value:' + (t && t.overdueSent));
  }

  console.log('\n=== 5. NOTIFICATIONS ===');
  const notifs = await req('GET', '/notifications?limit=5', null, token);
  check('GET /notifications 200', notifs.status === 200, 'status:' + notifs.status);
  const unread = await req('GET', '/notifications/unread-count', null, token);
  check('GET unread-count 200', unread.status === 200, 'status:' + unread.status);

  console.log('\n' + '='.repeat(50));
  console.log('RESULTS: ' + passed + ' passed, ' + failed + ' failed');
  console.log(failed === 0 ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED');
  console.log('='.repeat(50));
}

run().catch(function(e) { console.error('Runner error:', e.message); });
