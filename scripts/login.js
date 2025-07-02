document.getElementById('business-login-form').addEventListener('submit', async function (e) {
  e.preventDefault();
  const email = this.email.value.trim();
  const password = this.password.value.trim();
  const responseBox = document.getElementById('loginResponse');

  try {
    const response = await fetch('https://pioneer-pressure-washing.onrender.com/api/business/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (response.ok) {
      responseBox.textContent = 'Login successful!';
      document.getElementById('portal').style.display = 'block';
    } else {
      responseBox.textContent = data.error || 'Login failed.';
    }
  } catch (err) {
    console.error('Login error:', err);
    responseBox.textContent = 'Server error.';
  }
});
