document.getElementById('schedule-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const form = e.target;
  const service_type = form.service_type.value.trim();
  const scheduled_date = form.scheduled_date.value;
  const scheduled_time = form.scheduled_time.value;
  const notes = form.notes.value.trim();
  const responseBox = document.getElementById('scheduleResponse');

  try {
    const res = await fetch('https://pioneer-pressure-washing.onrender.com/api/business/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ service_type, scheduled_date, scheduled_time, notes })
    });

    const data = await res.json();
    responseBox.textContent = data.message || data.error;
    responseBox.style.color = res.ok ? 'green' : 'red';
  } catch (err) {
    responseBox.textContent = 'An error occurred.';
    responseBox.style.color = 'red';
  }
});
