 let selectedEntryIds = new Set();

document.addEventListener('DOMContentLoaded', async function () {
  try {
    const res = await fetch('https://pioneer-pressure-washing.onrender.com/api/me', {
      credentials: 'include'
    });
    if (!res.ok) throw new Error('Unauthorized');
    const user = await res.json();
    console.log('[DEBUG] Logged in user:', user);

    const isAdminPage = window.location.pathname.includes('admin.html');
    if (isAdminPage && !user.is_admin) {
      alert('Access denied. Admins only.');
      location.replace('/portal.html');
      return;
    }

    // 🎯 Tab-switcher setup (with calendar fix)
    document.querySelectorAll('nav.dashboard-tabs .tab').forEach(btn => {
      btn.addEventListener('click', async () => {
        document.querySelectorAll('nav.dashboard-tabs .tab').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('main .tab-panel').forEach(panel => panel.classList.remove('active'));

        btn.classList.add('active');
        const panel = document.getElementById(btn.dataset.tab);
        if (panel) panel.classList.add('active');

        // 🗓 If scheduling tab clicked, render calendar
        if (btn.dataset.tab === 'scheduling-panel') {
          try {
            await renderCalendar();
          } catch (err) {
            console.error('Calendar rendering failed on tab switch:', err);
            renderCalendarFallback();
          }
        }
      });
    });

    // ✅ Load initial content
    setupScheduleForm();
    loadContacts();

    // Optionally pre-render calendar if it's the first tab
    const activeTab = document.querySelector('nav.dashboard-tabs .tab.active');
    if (activeTab && activeTab.dataset.tab === 'scheduling-panel') {
      try {
        await renderCalendar();
      } catch (err) {
        console.error('Initial calendar rendering failed:', err);
        renderCalendarFallback();
      }
    }

  } catch (err) {
    console.error('Auth failure:', err);
    location.replace('/portal.html');
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

  const data = await res.json();
  if (!Array.isArray(data)) throw new Error('Invalid schedule response');

  const monthPrefix = (month + 1).toString().padStart(2, '0');
  const currentMonth = `${year}-${monthPrefix}`;

  data.forEach(task => {
    const dateStr = task.scheduled_date;
    if (dateStr.startsWith(currentMonth)) {
      const day = parseInt(dateStr.split('-')[2], 10);
      if (!taskMap[day]) taskMap[day] = [];
      taskMap[day].push(task);
    }
  });

  for (let i = 1; i <= daysInMonth; i++) {
    const dayBox = document.createElement('div');
    dayBox.className = 'calendar-day';
    dayBox.innerHTML = `<span>${i}</span>`;

    dayBox.addEventListener('click', async () => {
      const serviceType = prompt('Service Type:');
      if (!serviceType) return;

      const scheduledTime = prompt('Scheduled Time (HH:MM):');
      if (!scheduledTime) return;

      const notes = prompt('Any notes?') || '';

      const scheduledDate = `${year}-${monthPrefix}-${i.toString().padStart(2, '0')}`;

      const createRes = await fetch('https://pioneer-pressure-washing.onrender.com/api/business/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          service_type: serviceType,
          scheduled_time: scheduledTime,
          scheduled_date: scheduledDate,
          notes: notes
        })
      });

      if (createRes.ok) {
        await renderCalendar();
      } else {
        alert('Failed to create entry.');
      }
    });

    if (taskMap[i]) {
      taskMap[i].forEach(task => {
        const note = document.createElement('div');
        note.style.fontSize = '12px';
        note.style.marginTop = '4px';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.style.marginRight = '4px';
        checkbox.checked = selectedEntryIds.has(task.id);
        checkbox.addEventListener('change', () => {
          if (checkbox.checked) selectedEntryIds.add(task.id);
          else selectedEntryIds.delete(task.id);
        });
        note.appendChild(checkbox);

        const label = document.createElement('span');
        label.textContent = `${task.service_type} @ ${task.scheduled_time} (${task.status})`;
        note.appendChild(label);

        if (task.status === 'Approved') note.style.color = 'green';
        else if (task.status === 'Denied') note.style.color = 'red';
        else note.style.color = 'orange';

        const actions = document.createElement('div');
        actions.style.marginTop = '2px';

        const editBtn = document.createElement('button');
        editBtn.textContent = 'Edit';
        editBtn.style.marginRight = '4px';
        editBtn.style.fontSize = '10px';
        editBtn.onclick = async () => {
          const newService = prompt('New service type:', task.service_type);
          if (!newService) return;

          const newTime = prompt('New time (HH:MM):', task.scheduled_time);
          if (!newTime) return;

          const newNotes = prompt('Edit notes:', task.notes || '');
          if (newNotes === null) return;

          const updateRes = await fetch(`https://pioneer-pressure-washing.onrender.com/api/business/schedule/${task.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              service_type: newService,
              scheduled_time: newTime,
              notes: newNotes
            })
          });

          if (updateRes.ok) {
            await renderCalendar();
          } else {
            alert('Failed to update.');
          }
        };

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.style.fontSize = '10px';
        deleteBtn.onclick = async () => {
          const confirmed = confirm('Delete this entry?');
          if (!confirmed) return;

          const delRes = await fetch(`https://pioneer-pressure-washing.onrender.com/api/business/schedule/${task.id}`, {
            method: 'DELETE',
            credentials: 'include'
          });

          if (delRes.ok) {
            await renderCalendar();
          } else {
            alert('Failed to delete.');
          }
        };

        actions.appendChild(editBtn);
        actions.appendChild(deleteBtn);
        note.appendChild(actions);
        dayBox.appendChild(note);
      });
    }

    calendar.appendChild(dayBox);
  }
}


  // ⬛ Bulk action control buttons (once)
  const bulkControls = document.getElementById('bulkControls');
  if (bulkControls) {
    bulkControls.innerHTML = `
      <button id="bulkApprove">Approve Selected</button>
      <button id="bulkDeny">Deny Selected</button>
      <span id="bulkStatus" style="margin-left:10px;"></span>
    `;

    document.getElementById('bulkApprove').onclick = () => sendBulkAction('Approved');
    document.getElementById('bulkDeny').onclick = () => sendBulkAction('Denied');
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

async function sendBulkAction(status) {
  const ids = Array.from(selectedEntryIds);
  if (ids.length === 0) {
    alert('No entries selected.');
    return;
  }

  try {
    const res = await fetch('https://pioneer-pressure-washing.onrender.com/api/admin/schedule/status/bulk', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ ids, status })
    });

    const data = await res.json();
    const msgBox = document.getElementById('bulkStatus');

    if (res.ok) {
      msgBox.textContent = `Updated ${data.updated.length} entries.`;
      msgBox.style.color = 'green';
      selectedEntryIds.clear();
      await renderCalendar();
    } else {
      msgBox.textContent = data.error || 'Failed.';
      msgBox.style.color = 'red';
    }
  } catch (err) {
    console.error('Bulk action error:', err);
    document.getElementById('bulkStatus').textContent = 'Error';
  }
}

function logout() {
  localStorage.clear();
  window.location.href = '/';
}
