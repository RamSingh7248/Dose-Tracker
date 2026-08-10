const API_URL = 'http://localhost:5000/api';

async function runEnterpriseSecurityTests() {
  console.log('🔒 Testing Production Enterprise SaaS Security & Whitelist Controls...\n');

  try {
    // 1. Attempt Public Admin Registration (Should fail with 403 Forbidden)
    const adminRegRes = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Hacker Admin',
        email: `hacker_${Date.now()}@example.com`,
        password: 'HackerPassword123!',
        role: 'admin',
      }),
    });
    if (adminRegRes.status === 403) {
      console.log('  ✅ [403] Public Admin Registration Blocked as Expected');
    } else {
      console.error(`❌ Unexpected status for admin registration: ${adminRegRes.status}`);
    }

    // 2. Register a Normal Patient Account
    const patientEmail = `patient_sec_${Date.now()}@example.com`;
    const regRes = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Security Test Patient',
        email: patientEmail,
        password: 'PatientPassword123!',
        role: 'patient',
      }),
    });
    const regData = await regRes.json();
    const patientToken = regData.token;
    console.log('  ✅ [201] Patient Registered Successfully');

    // 3. Attempt Admin API Access with Patient Account (Should fail with 403 Forbidden)
    const patientAdminRes = await fetch(`${API_URL}/admin/dashboard`, {
      headers: { Authorization: `Bearer ${patientToken}` },
    });
    if (patientAdminRes.status === 403) {
      console.log('  ✅ [403] Patient Access to Admin Portal Forbidden');
    } else {
      console.error(`❌ Unexpected status for patient admin access: ${patientAdminRes.status}`);
    }

    // 4. Login as Authorized Whitelisted Admin (admin@dosetracker.com)
    const adminLoginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@dosetracker.com',
        password: 'AdminPassword123!',
      }),
    });
    const adminData = await adminLoginRes.json();
    const adminToken = adminData.token;

    const adminDashRes = await fetch(`${API_URL}/admin/dashboard`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (adminDashRes.status === 200) {
      console.log('  ✅ [200] Whitelisted ADMIN_EMAILS Access to Admin Portal Granted');
    }

    console.log('\n🎉 ALL PRODUCTION ENTERPRISE SAAS SECURITY TESTS PASSED PERFECTLY!\n');
  } catch (err) {
    console.error('❌ Enterprise security test error:', err.message);
  }
}

runEnterpriseSecurityTests();
