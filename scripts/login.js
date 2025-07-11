document.addEventListener('DOMContentLoaded', function () {
  const loginForm = document.getElementById('login-form');
  if (!loginForm) return;

  loginForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    const email = loginForm.email.value.trim();
    const password = loginForm.password.value;

    const responseBox = document.getElementById('loginResponse');

    try {
      const res = await fetch('https://pioneer-pressure-washing.onrender.com/api/business/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      responseBox.textContent = data.message || data.error;
      responseBox.style.color = res.ok ? 'green' : 'red';

      if (res.ok) {
        // Delay to allow browser to set cookie
       setTimeout(async () => {
  console.log('Cookies at redirect time:', document.cookie); // Debug output

  const checkRes = await fetch('https://pioneer-pressure-washing.onrender.com/api/me', {
    credentials: 'include'
  });

  if (checkRes.ok) {
    const user = await checkRes.json();
    console.log('User:', user);
    if (data.is_admin) {
      location.href = '/admin/admin.html';
    } else {
      location.href = '/business/dashboard.html';
    }
  } else {
    console.error('Auth check failed:', await checkRes.text());
    alert('Login successful but authentication check failed.');
  }
}, 500);
      }

    } catch (err) {
      console.error('Login error:', err);
      responseBox.textContent = 'Login request failed.';
      responseBox.style.color = 'red';
    }
  });
});
