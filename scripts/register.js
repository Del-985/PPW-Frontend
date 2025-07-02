document.getElementById('register-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const business_name = e.target.business_name.value.trim();
  const email = e.target.email.value.trim();
  const password = e.target.password.value.trim();
  const responseBox = document.getElementById('registerResponse');

  const res = await fetch('https://pioneer-pressure-washing.onrender.com/api/business/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ business_name, email, password })
  });

  const data = await res.json();

  if (res.ok) {
    responseBox.textContent = 'Registration successful. Please log in.';
    responseBox.style.color = 'green';
    e.target.reset();
  } else {
    responseBox.textContent = data.error || 'Registration failed.';
    responseBox.style.color = 'red';
  }
});
