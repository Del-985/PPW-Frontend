document.getElementById('register-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const business_name = e.target.business_name.value.trim();
  const email = e.target.email.value.trim();
  const password = e.target.password.value.trim();
  const responseBox = document.getElementById('registerResponse');

  try {
    const res = await fetch('https://pioneer-pressure-washing.onrender.com/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ business_name, email, password })
    });

    let data;
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await res.json();
    } else {
      throw new Error('Server did not return JSON');
    }

    if (res.ok) {
      responseBox.textContent = 'Registration successful. Redirecting to dashboard...';
      responseBox.style.color = 'green';
      // Optionally, store the token if returned:
      // if (data.token) localStorage.setItem('authToken', data.token);

      setTimeout(() => {
        window.location.href = '../business/dashboard.html'; // ✅ Ensure correct relative path
      }, 2000);
    } else {
      responseBox.textContent = data.error || 'Registration failed.';
      responseBox.style.color = 'red';
    }

  } catch (err) {
    console.error('Registration error:', err);
    responseBox.textContent = 'An unexpected error occurred.';
    responseBox.style.color = 'red';
  }
});
