document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = e.target.email.value.trim();
  const password = e.target.password.value.trim();
  const responseBox = document.getElementById('loginResponse');

  try {
    const res = await fetch('https://pioneer-pressure-washing.onrender.com/api/business/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include' // ← Important for sending/receiving cookies
    });

    const data = await res.json();

   if (res.ok) {
  responseBox.textContent = 'Login successful. Redirecting to dashboard...';
  responseBox.style.color = 'green';

  const meRes = await fetch('https://pioneer-pressure-washing.onrender.com/api/me', {
    credentials: 'include'
  });

  if (meRes.ok) {
    const user = await meRes.json();
    const redirectUrl = user.is_admin ? '/admin.html' : '../business/dashboard.html';
    setTimeout(() => {
      window.location.href = redirectUrl;
    }, 1500);
  } else {
    responseBox.textContent = 'Login failed: Unable to verify user.';
    responseBox.style.color = 'red';
  }
}

    console.log('Login response:', res.status, data); // Optional debug
  } catch (err) {
    console.error('Login request failed:', err);
    responseBox.textContent = 'An error occurred. Please try again later.';
    responseBox.style.color = 'red';
  }
});
