document.addEventListener('DOMContentLoaded', function () {
  const loginForm = document.getElementById('login-form');
  if (!loginForm) return;

  loginForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    const email = loginForm.email.value.trim();
    const password = loginForm.password.value;

    const responseBox = document.getElementById('loginResponse');

    try {
      const res = await fetch('https://pioneer-pressure-washing.onrender.com/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      responseBox.textContent = data.message || data.error;
      responseBox.style.color = res.ok ? 'green' : 'red';

      if (res.ok && data.token) {
        // Save the token to localStorage
        localStorage.setItem('authToken', data.token);

        // Now verify token & redirect appropriately
        const checkRes = await fetch('https://pioneer-pressure-washing.onrender.com/api/me', {
          headers: {
            'Authorization': `Bearer ${data.token}`
          }
        });

        if (checkRes.ok) {
          const user = await checkRes.json();
          console.log('User:', user);
          if (user.is_admin) {
            location.href = '/admin/admin.html';
          } else {
            location.href = '/business/dashboard.html';
          }
        } else {
          console.error('Auth check failed:', await checkRes.text());
          alert('Login successful but authentication check failed.');
        }
      }

    } catch (err) {
      console.error('Login error:', err);
      responseBox.textContent = 'Login request failed.';
      responseBox.style.color = 'red';
    }
  });
});
