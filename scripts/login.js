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
          try {
            const userRes = await fetch('https://pioneer-pressure-washing.onrender.com/api/me', {
              credentials: 'include'
            });

            if (!userRes.ok) throw new Error('Failed to fetch user');

            const user = await userRes.json();

            if (user.is_admin) {
              window.location.href = '/admin.html';
            } else {
              window.location.href = '/business/dashboard.html';
            }
          } catch (authErr) {
            console.error('Auth fetch error:', authErr);
            responseBox.textContent = 'Authentication failed after login.';
            responseBox.style.color = 'red';
          }
        }, 500); // ⏱️ 500ms delay
      }

    } catch (err) {
      console.error('Login error:', err);
      responseBox.textContent = 'Login request failed.';
      responseBox.style.color = 'red';
    }
  });
});