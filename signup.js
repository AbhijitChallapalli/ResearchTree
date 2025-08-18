// signup.js
document.addEventListener('DOMContentLoaded', () => {
  const form   = document.getElementById('signupForm');
  const email  = document.getElementById('signupEmail');
  const pw1    = document.getElementById('signupPassword');
  const pw2    = document.getElementById('signupPassword2');
  const msg    = document.getElementById('signupMsg');
  const btn    = document.getElementById('signupBtn');
  const showPw = document.getElementById('showPw');

  showPw.addEventListener('change', () => {
    const type = showPw.checked ? 'text' : 'password';
    pw1.type = type;
    pw2.type = type;
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setMsg('');

    const vEmail = email.value.trim();
    const vPw1   = pw1.value;
    const vPw2   = pw2.value;

    if (!vEmail)           return setMsg('Please enter an email.');
    if (vPw1.length < 6)   return setMsg('Password must be at least 6 characters.');
    if (vPw1 !== vPw2)     return setMsg('Passwords do not match.');

    toggle(false);
    try {
      const cred = await auth.createUserWithEmailAndPassword(vEmail, vPw1);
      try { await cred.user.sendEmailVerification(); } catch {}
      setMsg('Signup successful! Redirecting to login…');
      setTimeout(() => { window.location.href = 'index.html'; }, 900);
    } catch (err) {
      setMsg(humanizeFirebaseError(err));
    } finally {
      toggle(true);
    }
  });

  function setMsg(text) { msg.textContent = text; }
  function toggle(enable) {
    btn.disabled = !enable;
    btn.textContent = enable ? 'Create account' : 'Creating…';
  }
  function humanizeFirebaseError(err) {
    if (!err || !err.code) return 'Signup failed. Please try again.';
    switch (err.code) {
      case 'auth/email-already-in-use': return 'That email is already in use.';
      case 'auth/invalid-email':        return 'Please enter a valid email address.';
      case 'auth/weak-password':        return 'Password is too weak (min 6 characters).';
      default:                          return err.message || 'Signup failed.';
    }
  }
});
