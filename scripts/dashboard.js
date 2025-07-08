document.addEventListener('DOMContentLoaded', async function () {
  setupScheduleForm();
  loadContacts();
  try {
    await renderCalendar();
  } catch (err) {
    console.error('Calendar rendering failed:', err);
    renderCalendarFallback();
  }
});

function setupScheduleForm() {
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

        if (res.ok) {
          form.reset();
          await renderCalendar();
        }
      } catch (err) {
        responseBox.textContent = 'An error occurred.';
        responseBox.style.color = 'red';
      }
    });
  }
}

function loadContacts() {
  const contactsDiv = document.getElementById('contacts');
  if (!contactsDiv) return;

  fetch('https://pioneer-pressure-washing.onrender.com/api/business/contacts', {
    credentials: 'include'
  })
    .then(res => res.json())
    .then(data => {
      if (!Array.isArray(data) || data.length === 0) {
        contactsDiv.innerHTML = '<p>No contact submissions yet.</p>';
        return;
      }

      const table = document.createElement('table');
      table.innerHTML = `
        <thead>
          <tr><th>Name</th><th>Email</th><th>Message</th><th>Submitted At</th></tr>
        </thead>
        <tbody>
          ${data.map(row => `
            <tr>
              <td>${row.name}</td>
              <td>${row.email}</td>
              <td>${row.message}</td>
              <td>${new Date(row.submitted_at).toLocaleString()}</td>
            </tr>
          `).join('')}
        </tbody>
      `;
      contactsDiv.innerHTML = '';
      contactsDiv.appendChild(table);
    })
    .catch(err => {
      contactsDiv.innerHTML = '<p style="color:red;">Failed to load contacts.</p>';
      console.error(err);
    });
}

async function renderCalendar() {
  const calendar = document.getElementById('calendar');
  if (!calendar) return;
  calendar.innerHTML = '';

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const taskMap = {};

  const res = await fetch('https://pioneer-pressure-washing.onrender.com/api/business/schedule', {
    credentials: 'include'
  });
  const tasks = await res.json();

  if (!Array.isArray(tasks)) throw new Error('Invalid schedule response');

  tasks.forEach(task => {
    const taskDate = new Date(task.scheduled_date);
    if (taskDate.getFullYear() === year && taskDate.getMonth() === month) {
      const day = taskDate.getDate();
      if (!taskMap[day]) taskMap[day] = [];
      taskMap[day].push(task);
    }
  });

  for (let i = 1; i <= daysInMonth; i++) {
    const dayBox = document.createElement('div');
    dayBox.className = 'calendar-day';
    dayBox.innerHTML = `<span>${i}</span>`;

    if (taskMap[i]) {
      taskMap[i].forEach(task => {
        const note = document.createElement('div');
        note.textContent = `${task.service_type} @ ${task.scheduled_time} (${task.status})`;
        note.style.fontSize = '12px';
        note.style.marginTop = '4px';
        dayBox.appendChild(note);
      });
    }

    dayBox.addEventListener('click', async () => {
      const service_type = prompt(`Enter service type for ${month + 1}/${i}/${year}`);
      if (service_type) {
        const scheduled_date = `${year}-${(month + 1).toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`;
        const scheduled_time = '12:00';
        const notes = '';

        try {
          const res = await fetch('https://pioneer-pressure-washing.onrender.com/api/business/schedule', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ service_type, scheduled_date, scheduled_time, notes })
          });

          if (res.ok) {
            await renderCalendar();
          }
        } catch (err) {
          console.error('Inline scheduling failed', err);
        }
      }
    });

    calendar.appendChild(dayBox);
  }
}

function renderCalendarFallback() {
  const calendar = document.getElementById('calendar');
  if (!calendar) return;
  calendar.innerHTML = '';

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let i = 1; i <= daysInMonth; i++) {
    const dayBox = document.createElement('div');
    dayBox.className = 'calendar-day';
    dayBox.innerHTML = `<span>${i}</span>`;

    dayBox.addEventListener('click', () => {
      const task = prompt(`Enter task for ${month + 1}/${i}/${year}`);
      if (task) {
        const note = document.createElement('div');
        note.textContent = task;
        note.style.fontSize = '12px';
        note.style.marginTop = '4px';
        dayBox.appendChild(note);
      }
    });

    calendar.appendChild(dayBox);
  }
}

function logout() {
  localStorage.clear();
  window.location.href = '/';
}
