// scripts/commercial-quote.js

document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('commercial-quote-form');
  const responseBox = document.getElementById('quoteResponse');
  
  if (!form) return;

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    responseBox.textContent = '';
    
    const formData = new FormData(form);

    try {
      const res = await fetch('/api/quotes/commercial', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();

      if (data.success) {
        responseBox.textContent = "Thank you! Your request has been received. We'll be in touch soon.";
        form.reset();
      } else {
        responseBox.textContent = data.message || "Submission failed. Please try again.";
      }
    } catch (err) {
      responseBox.textContent = "Submission failed. Please try again or contact us by phone.";
    }
  });
});
