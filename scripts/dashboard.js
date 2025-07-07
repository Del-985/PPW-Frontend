document.addEventListener('DOMContentLoaded', () => {
  // Schedule form submission handler
  const scheduleForm = document.getElementById('schedule-form');
  if (scheduleForm) {
    scheduleForm.addEventListener('submit', async (e) => {
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
  }

  // Initialize FullCalendar with demo tasks (if calendar container exists)
  const calendarEl = document.getElementById('calendar');
  if (calendarEl) {
    const calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: 'dayGridMonth',
      events: [
        { title: 'Demo Task A', start: '2025-07-03' },
        { title: 'Cleanup Job - West', start: '2025-07-07', allDay: true },
      ],
    });
    calendar.render();
  }

  // Load contact form submissions (if table body exists)
  const submissionsBody = document.getElementById('submissionTableBody');
  if (submissionsBody) {
    fetch('/admin/submissions')
      .then(res => res.json())
      .then(data => {
        data.forEach(entry => {
          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${entry.name}</td>
            <td>${entry.email}</td>
            <td>${entry.message}</td>
            <td>${entry.created_at || 'N/A'}</td>
          `;
          submissionsBody.appendChild(row);
        });
      })
      .catch(err => {
        console.error('❌ Failed to load submissions:', err);
      });
  }
});

// Logout function (call from onclick or button)
function logout() {
  localStorage.clear();
  window.location.href = '/';
}
