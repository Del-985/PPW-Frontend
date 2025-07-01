document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contact-form');
  const responseDiv = document.getElementById('formResponse');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const data = {
      name: formData.get('name').trim(),
      email: formData.get('email').trim(),
      message: formData.get('message').trim(),
    };

    try {
      const response = await fetch('https://pioneer-pressure-washing.onrender.com/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.message) {
        responseDiv.textContent = 'Message sent successfully!';
        responseDiv.style.color = 'green';
        form.reset();
      } else {
        responseDiv.textContent = 'Error sending message. Please try again later.';
        responseDiv.style.color = 'red';
      }
    } catch (err) {
      responseDiv.textContent = 'Network error. Please try again later.';
      responseDiv.style.color = 'red';
    }
  });
});
