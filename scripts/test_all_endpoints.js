/**
 * test_all_endpoints.js
 * ─────────────────────────────────────────────────────────────
 * Comprehensive verification script to test every API endpoint in
 * DoseTracker AI monorepo.
 */

const http = require('http');

const BASE_URL = process.env.TEST_URL || 'http://localhost:5000';

async function main() {
  console.log(`\n🧪 Starting DoseTracker API Endpoint Test Suite against ${BASE_URL}...\n`);

  let passed = 0;
  let failed = 0;
  const results = [];

  async function request(method, path, body = null, token = null) {
    return new Promise((resolve) => {
      const url = new URL(path, BASE_URL);
      const options = {
        method: method,
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
      }

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          let json = null;
          try {
            json = JSON.parse(data);
          } catch (e) {
            json = { raw: data };
          }
          resolve({ status: res.statusCode, headers: res.headers, body: json });
        });
      });

      req.on('error', (err) => {
        resolve({ status: 500, error: err.message });
      });

      if (body) {
        req.write(JSON.stringify(body));
      }
      req.end();
    });
  }

  function logResult(endpoint, method, status, success, body = null) {
    const isOk = status >= 200 && status < 300 && success;
    if (isOk) {
      passed++;
      console.log(`  ✅ [${status}] ${method.padEnd(6)} ${endpoint}`);
    } else {
      failed++;
      console.error(`  ❌ [${status}] ${method.padEnd(6)} ${endpoint} - ${JSON.stringify(body)}`);
    }
    results.push({ endpoint, method, status, ok: isOk });
  }

  // 1. Health Check
  const health = await request('GET', '/api/health');
  logResult('/api/health', 'GET', health.status, health.body?.status === 'ok');

  // 2. Auth: Login / Register Admin
  let adminLogin = await request('POST', '/api/auth/login', {
    email: 'admin@dosetracker.com',
    password: 'AdminPassword123!',
  });
  let adminToken = adminLogin.body?.token;
  logResult('/api/auth/login (Admin)', 'POST', adminLogin.status, !!adminToken);

  // 3. Auth: Login / Register Doctor
  let doctorLogin = await request('POST', '/api/auth/login', {
    email: 'doctor_test@dosetracker.com',
    password: 'DoctorPassword123!',
  });
  if (!doctorLogin.body?.token) {
    const regRes = await request('POST', '/api/auth/register', {
      name: 'Dr. Sarah Jenkins',
      email: 'doctor_test@dosetracker.com',
      password: 'DoctorPassword123!',
      role: 'doctor',
      specialization: 'Cardiology',
      hospital: 'City Hospital',
    });
    doctorLogin = await request('POST', '/api/auth/login', { email: 'doctor_test@dosetracker.com', password: 'DoctorPassword123!' });
  }
  let doctorToken = doctorLogin.body?.token;
  logResult('/api/auth/login (Doctor)', 'POST', doctorLogin.status, !!doctorToken, doctorLogin.body);

  // 4. Auth: Login / Register Patient
  let patientLogin = await request('POST', '/api/auth/login', {
    email: 'patient_test@dosetracker.com',
    password: 'PatientPassword123!',
  });
  if (!patientLogin.body?.token) {
    await request('POST', '/api/auth/register', {
      name: 'Alex Johnson',
      email: 'patient_test@dosetracker.com',
      password: 'PatientPassword123!',
      role: 'patient',
    });
    patientLogin = await request('POST', '/api/auth/login', { email: 'patient_test@dosetracker.com', password: 'PatientPassword123!' });
  }
  let patientToken = patientLogin.body?.token;
  let patientRefreshToken = patientLogin.body?.refreshToken;
  logResult('/api/auth/login (Patient)', 'POST', patientLogin.status, !!patientToken);

  if (!patientToken || !adminToken || !doctorToken) {
    console.error('\n❌ Could not obtain auth tokens. Please make sure backend server is running with seeds.');
    process.exit(1);
  }

  // 5. Patient Endpoint Tests
  const me = await request('GET', '/api/auth/me', null, patientToken);
  logResult('/api/auth/me', 'GET', me.status, me.body?.success === true);

  const medList = await request('GET', '/api/medications', null, patientToken);
  logResult('/api/medications', 'GET', medList.status, medList.body?.success === true);

  const createMed = await request('POST', '/api/medications', {
    name: 'Test Amoxicillin ' + Date.now(),
    dosage: '500',
    dosageUnit: 'mg',
    frequency: 'twice_daily',
    times: ['08:00', '20:00'],
  }, patientToken);
  const testMedId = createMed.body?.data?._id;
  logResult('/api/medications', 'POST', createMed.status, createMed.body?.success === true, createMed.body);

  const getMed = await request('GET', `/api/medications/${testMedId}`, null, patientToken);
  logResult(`/api/medications/${testMedId}`, 'GET', getMed.status, getMed.body?.success === true, getMed.body);

  const refillAlerts = await request('GET', '/api/medications/refill-alerts', null, patientToken);
  logResult('/api/medications/refill-alerts', 'GET', refillAlerts.status, refillAlerts.body?.success === true, refillAlerts.body);

  const logDoseRes = await request('POST', '/api/doses/log', {
    medicationId: testMedId,
    status: 'taken',
    pillsTaken: 1,
  }, patientToken);
  const testDoseId = logDoseRes.body?.data?._id;
  logResult('/api/doses/log', 'POST', logDoseRes.status, logDoseRes.body?.success === true, logDoseRes.body);

  const doseList = await request('GET', '/api/doses', null, patientToken);
  logResult('/api/doses', 'GET', doseList.status, doseList.body?.success === true, doseList.body);

  const doseStats = await request('GET', '/api/doses/stats', null, patientToken);
  logResult('/api/doses/stats', 'GET', doseStats.status, doseStats.body?.success === true, doseStats.body);

  const membersList = await request('GET', '/api/members', null, patientToken);
  logResult('/api/members', 'GET', membersList.status, membersList.body?.success === true, membersList.body);

  const createMemberRes = await request('POST', '/api/members', {
    name: 'Test Child ' + Date.now(),
    relationship: 'child',
  }, patientToken);
  logResult('/api/members', 'POST', createMemberRes.status, createMemberRes.body?.success === true, createMemberRes.body);

  const apptList = await request('GET', '/api/appointments', null, patientToken);
  logResult('/api/appointments', 'GET', apptList.status, apptList.body?.success === true, apptList.body);

  const apptUpcoming = await request('GET', '/api/appointments/upcoming', null, patientToken);
  logResult('/api/appointments/upcoming', 'GET', apptUpcoming.status, apptUpcoming.body?.success === true, apptUpcoming.body);

  const createAppt = await request('POST', '/api/appointments', {
    title: 'General Checkup ' + Date.now(),
    appointmentDate: new Date(Date.now() + 86400000).toISOString(),
    appointmentTime: '10:00',
    location: 'City Hospital',
  }, patientToken);
  const testApptId = createAppt.body?.data?._id;
  logResult('/api/appointments', 'POST', createAppt.status, createAppt.body?.success === true, createAppt.body);

  const healthEvents = await request('GET', '/api/health-events', null, patientToken);
  logResult('/api/health-events', 'GET', healthEvents.status, healthEvents.body?.success === true, healthEvents.body);

  const docs = await request('GET', '/api/documents', null, patientToken);
  logResult('/api/documents', 'GET', docs.status, docs.body?.success === true, docs.body);

  const emergencyCard = await request('GET', '/api/emergency-card', null, patientToken);
  logResult('/api/emergency-card', 'GET', emergencyCard.status, emergencyCard.body?.success === true, emergencyCard.body);

  const stockPredictions = await request('GET', '/api/stock/predictions', null, patientToken);
  logResult('/api/stock/predictions', 'GET', stockPredictions.status, stockPredictions.body?.success === true);

  const timeline = await request('GET', '/api/timeline', null, patientToken);
  logResult('/api/timeline', 'GET', timeline.status, timeline.body?.success === true);

  const weeklyAdherence = await request('GET', '/api/adherence/weekly', null, patientToken);
  logResult('/api/adherence/weekly', 'GET', weeklyAdherence.status, weeklyAdherence.body?.success === true);

  const healthScore = await request('GET', '/api/adherence/health-score', null, patientToken);
  logResult('/api/adherence/health-score', 'GET', healthScore.status, healthScore.body?.success === true);

  // 6. Doctor Endpoint Tests
  const docStats = await request('GET', '/api/doctor/stats', null, doctorToken);
  logResult('/api/doctor/stats', 'GET', docStats.status, docStats.body?.success === true);

  const docPatients = await request('GET', '/api/doctor/patients', null, doctorToken);
  logResult('/api/doctor/patients', 'GET', docPatients.status, docPatients.body?.success === true);

  const docAppts = await request('GET', '/api/doctor/appointments', null, doctorToken);
  logResult('/api/doctor/appointments', 'GET', docAppts.status, docAppts.body?.success === true);

  const docNotes = await request('GET', '/api/doctor/notes', null, doctorToken);
  logResult('/api/doctor/notes', 'GET', docNotes.status, docNotes.body?.success === true);

  const docAnalytics = await request('GET', '/api/doctor/analytics', null, doctorToken);
  logResult('/api/doctor/analytics', 'GET', docAnalytics.status, docAnalytics.body?.success === true);

  const docPerf = await request('GET', '/api/doctor/performance', null, doctorToken);
  logResult('/api/doctor/performance', 'GET', docPerf.status, docPerf.body?.success === true);

  // 7. Admin Endpoint Tests
  const adminStats = await request('GET', '/api/admin/dashboard', null, adminToken);
  logResult('/api/admin/dashboard', 'GET', adminStats.status, adminStats.body?.success === true);

  const adminUsers = await request('GET', '/api/admin/users', null, adminToken);
  logResult('/api/admin/users', 'GET', adminUsers.status, adminUsers.body?.success === true);

  const adminReports = await request('GET', '/api/admin/reports', null, adminToken);
  logResult('/api/admin/reports', 'GET', adminReports.status, adminReports.body?.success === true);

  const adminAuditLogs = await request('GET', '/api/admin/audit-logs', null, adminToken);
  logResult('/api/admin/audit-logs', 'GET', adminAuditLogs.status, adminAuditLogs.body?.success === true);

  const systemSettings = await request('GET', '/api/system-settings', null, adminToken);
  logResult('/api/system-settings', 'GET', systemSettings.status, systemSettings.body?.success === true);

  // 8. Security Endpoint Verification
  if (patientRefreshToken) {
    const refreshRes = await request('POST', '/api/auth/refresh', { refreshToken: patientRefreshToken });
    logResult('/api/auth/refresh (Token Rotation)', 'POST', refreshRes.status, refreshRes.body?.success === true, refreshRes.body);
  }

  const logoutRes = await request('POST', '/api/auth/logout', null, patientToken);
  logResult('/api/auth/logout', 'POST', logoutRes.status, logoutRes.body?.success === true);

  // 9. Cleanup test entities
  if (testDoseId) {
    await request('DELETE', `/api/doses/${testDoseId}`, null, patientToken);
  }
  if (testMedId) {
    await request('DELETE', `/api/medications/${testMedId}`, null, patientToken);
  }
  if (testApptId) {
    await request('DELETE', `/api/appointments/${testApptId}`, null, patientToken);
  }

  console.log(`\n📊 Test Summary: ${passed} Passed, ${failed} Failed out of ${results.length} total endpoints tested.\n`);
  if (failed === 0) {
    console.log('🎉 ALL BACKEND APIs PASSED STABILITY & CONSISTENCY TESTS PERFECTLY!\n');
  } else {
    console.error('⚠️ Some endpoints failed. Please check the logs above.\n');
    process.exit(1);
  }
}

main().catch(err => console.error('Fatal test runner error:', err));
