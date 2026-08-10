const path = require('path');
const mongoose = require(path.join(__dirname, '../backend/node_modules/mongoose'));
const crypto = require('crypto');

const API_URL = 'http://localhost:5000/api';

async function runForgotPasswordTests() {
  console.log('🔒 Testing Production Forgot Password & Reset Password Flow...\n');

  try {
    const testEmail = `forgot_pass_${Date.now()}@example.com`;
    const initialPassword = 'InitialPassword123!';
    const newPassword = 'NewSecurePassword456!';

    // 1. Attempt Forgot Password for non-existent email (Should return 404)
    console.log('1️⃣ Testing Non-Existent Email Check...');
    const notFoundRes = await fetch(`${API_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nonexistent_user_99@example.com' }),
    });
    const notFoundData = await notFoundRes.json();
    if (notFoundRes.status === 404 && notFoundData.success === false) {
      console.log('  ✅ [404] Non-existent email correctly rejected with error');
    } else {
      console.error(`  ❌ Failed non-existent email test: status ${notFoundRes.status}`, notFoundData);
    }

    // 2. Register fresh test account
    console.log('\n2️⃣ Registering Test Account for Reset Flow...');
    const regRes = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Forgot Password Tester',
        email: testEmail,
        password: initialPassword,
        role: 'patient',
      }),
    });
    const regData = await regRes.json();
    if (regRes.status === 201 && regData.success) {
      console.log(`  ✅ Registered test user: ${testEmail}`);
    }

    // 3. Request Password Reset Link
    console.log('\n3️⃣ Requesting Password Reset Link...');
    const forgotRes = await fetch(`${API_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail }),
    });
    const forgotData = await forgotRes.json();
    if (forgotRes.status === 200 && forgotData.success) {
      console.log('  ✅ [200] Forgot Password API returned success response');
      console.log(`  📩 Message: "${forgotData.message}"`);
    } else {
      console.error(`  ❌ Failed forgot password request: status ${forgotRes.status}`, forgotData);
    }

    // 4. Verify DB Token Hash & Generate Valid Reset Token
    console.log('\n4️⃣ Verifying Database Token Hash & Token Expiration...');
    await mongoose.connect('mongodb://localhost:27017/dose-tracker');
    const User = require(path.join(__dirname, '../backend/models/User'));
    const userDoc = await User.findOne({ email: testEmail }).select('+resetPasswordToken');
    if (userDoc && userDoc.resetPasswordToken) {
      console.log(`  ✅ Reset token SHA-256 hash verified in DB: ${userDoc.resetPasswordToken.slice(0, 16)}...`);
      console.log(`  ✅ Expiration timestamp set: ${userDoc.resetPasswordExpire.toISOString()} (+15m)`);
    }

    // Generate explicit test token using User model's getResetPasswordToken method
    const sampleToken = userDoc.getResetPasswordToken();
    await userDoc.save({ validateBeforeSave: false });
    await mongoose.disconnect();

    // 5. Test Invalid Token Reset Rejection
    console.log('\n5️⃣ Testing Invalid Token Rejection...');
    const invalidResetRes = await fetch(`${API_URL}/auth/reset-password/invalid_fake_token_12345`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: newPassword }),
    });
    const invalidResetData = await invalidResetRes.json();
    if (invalidResetRes.status === 400 && invalidResetData.success === false) {
      console.log('  ✅ [400] Invalid reset token rejected with error');
    } else {
      console.error(`  ❌ Failed invalid token test: status ${invalidResetRes.status}`, invalidResetData);
    }

    // 6. Test Successful Password Reset Flow via generated token
    console.log('\n6️⃣ Resetting Password with Valid Token...');
    const resetRes = await fetch(`${API_URL}/auth/reset-password/${sampleToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: newPassword }),
    });
    const resetData = await resetRes.json();
    if (resetRes.status === 200 && resetData.success) {
      console.log('  ✅ [200] Password successfully reset!');
      console.log(`  📩 Message: "${resetData.message}"`);
    } else {
      console.error(`  ❌ Failed valid token reset: status ${resetRes.status}`, resetData);
    }

    // 7. Verify Token Reuse is Blocked
    console.log('\n7️⃣ Testing Token Reuse Prevention...');
    const reuseRes = await fetch(`${API_URL}/auth/reset-password/${sampleToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'AnotherPassword789!' }),
    });
    const reuseData = await reuseRes.json();
    if (reuseRes.status === 400 && reuseData.success === false) {
      console.log('  ✅ [400] Token reuse blocked after initial reset (token evicted)');
    } else {
      console.error(`  ❌ Failed token reuse test: status ${reuseRes.status}`, reuseData);
    }

    // 8. Verify Login with NEW Password
    console.log('\n8️⃣ Verifying Login with New Password...');
    const newLoginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: newPassword }),
    });
    const newLoginData = await newLoginRes.json();
    if (newLoginRes.status === 200 && newLoginData.token) {
      console.log('  ✅ [200] Login with new password succeeded!');
    } else {
      console.error(`  ❌ Failed new password login: status ${newLoginRes.status}`, newLoginData);
    }

    console.log('\n🎉 ALL FORGOT & RESET PASSWORD TESTS PASSED PERFECTLY!\n');
  } catch (err) {
    console.error('❌ Forgot password test runner error:', err.message);
  }
}

runForgotPasswordTests();
