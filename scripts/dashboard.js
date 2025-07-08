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

  const { tasks } = await res.json(); // ← FIXED: Destructure `tasks` from object

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
            await renderCalendar(); // Refresh calendar after inline post
          }
        } catch (err) {
          console.error('Inline scheduling failed', err);
        }
      }
    });

    calendar.appendChild(dayBox);
  }
}
