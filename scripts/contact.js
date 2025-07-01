document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('contact-form');

  if (!form) return;

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const name = document.getElementById('name')?.value?.trim();
    const email = document.getElementById('email')?.value?.trim();
    const message = document.getElementById('message')?.value?.trim();

    if (!name || !email || !message) {
      alert('Please fill in all fields.');
      return;
    }

    try {
      const response = await fetch('https://pioneer-pressure-washing.onrender.com/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message })
      });

      const result = await response.json();

      if (response.ok) {
        console.log('Submission successful:', result);
        alert('Thank you! Your message has been sent.');
        form.reset();
      } else {
        console.error('Submission error:', result);
        alert('There was an error submitting the form.');
      }
    } catch (err) {
      console.error('Network error:', err);
      alert('Unable to connect to the server.');
    }
  });
});
