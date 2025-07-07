document.addEventListener('DOMContentLoaded', function () {
  setupScheduleForm();
  loadContacts();
  renderCalendar();
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
      } catch (err) {
        responseBox.textContent = 'An error occurred.';
        responseBox.style.color = 'red';
      }
    });
  }
}

async function renderCalendar() {
  const calendar = document.getElementById('calendar');
  calendar.innerHTML = '';

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const taskMap = {};

  try {
    const res = await fetch('https://pioneer-pressure-washing.onrender.com/api/business/schedule', {
      credentials: 'include'
    });
    const tasks = await res.json();

    tasks.forEach(task => {
      const day = new Date(task.scheduled_date).getDate();
      if (!taskMap[day]) taskMap[day] = [];
      taskMap[day].push(task);
    });
  } catch (err) {
    console.error('Failed to fetch schedule tasks:', err);
  }

  for (let i = 1; i <= daysInMonth; i++) {
    const dayBox = document.createElement('div');
    dayBox.className = 'calendar-day';
    dayBox.innerHTML = `<span>${i}</span>`;

    if (taskMap[i]) {
      taskMap[i].forEach(task => {
        const note = document.createElement('div');
        note.textContent = task.service_type || 'Task';
        note.style.fontSize = '12px';
        note.style.marginTop = '12px';
        dayBox.appendChild(note);
      });
    }

    calendar.appendChild(dayBox);
  }
}


function renderCalendar() {
  const calendar = document.getElementById('calendar');
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  calendar.innerHTML = '';

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
        note.style.marginTop = '18px';
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
