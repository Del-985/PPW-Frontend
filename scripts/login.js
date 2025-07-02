document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('form');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.querySelector('input[name="username"]').value.trim();
    const password = document.querySelector('input[name="password"]').value;

    try {
      const response = await fetch('https://pioneer-pressure-washing.onrender.com/api/business/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      const result = await response.json();

      if (response.ok) {
        console.log('Login successful:', result);
        // Redirect to dashboard
        window.location.href = 'business/dashboard.html';
      } else {
        alert(result.error || 'Login failed. Please try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('An unexpected error occurred.');
    }
  });
});