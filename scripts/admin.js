document.addEventListener('DOMContentLoaded', async function () {
  try {
    const res = await fetch('https://pioneer-pressure-washing.onrender.com/api/me', {
      credentials: 'include'
    });
    if (!res.ok) throw new Error('Unauthorized');
    const user = await res.json();

    const isAdminPage = window.location.pathname.includes('admin.html');

    if (isAdminPage && !user.is_admin) {
      alert('Admins only');
      location.replace('/portal.html');
      return;
    }

    loadContacts();
    loadBusinessUsers();
    await loadAdminSchedule(); // 👈 New admin-specific calendar

  } catch (err) {
    console.error('Auth check failed:', err);
    location.replace('/portal.html');
  }
});

// Load Contacts
async function loadContacts() {
  try {
    const res = await fetch('https://pioneer-pressure-washing.onrender.com/api/admin/contacts', {
      credentials: 'include'
    });
    const data = await res.json();
    const tbody = document.querySelector('#contacts-table tbody');
    tbody.innerHTML = '';
    data.forEach(c => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${c.id}</td><td>${c.name}</td><td>${c.email}</td>
        <td>${c.message}</td><td>${new Date(c.submitted_at).toLocaleString()}</td>
        <td><span class="btn-delete" onclick="deleteContact(${c.id})">🗑️</span></td>
      `;
      tbody.appendChild(row);
    });
  } catch (err) {
    alert('Failed to load contacts.');
  }
}

// Load Business Users
async function loadBusinessUsers() {
  try {
    const res = await fetch('https://pioneer-pressure-washing.onrender.com/api/admin/business-users', {
      credentials: 'include'
    });
    const data = await res.json();
    const tbody = document.querySelector('#business-users-table tbody');
    tbody.innerHTML = '';
    data.forEach(u => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${u.id}</td><td>${u.business_name}</td><td>${u.email}</td>
        <td><span class="btn-delete" onclick="deleteBusinessUser(${u.id})">🗑️</span></td>
      `;
      tbody.appendChild(row);
    });
  } catch (err) {
    alert('Failed to load business users.');
  }
}

async function deleteContact(id) {
  if (!confirm('Are you sure you want to delete this contact?')) return;
  await fetch(`https://pioneer-pressure-washing.onrender.com/api/admin/contact/${id}`, {
    method: 'DELETE',
    credentials: 'include'
  });
  loadContacts();
}

async function deleteBusinessUser(id) {
  if (!confirm('Are you sure you want to delete this user?')) return;
  await fetch(`https://pioneer-pressure-washing.onrender.com/api/admin/business-user/${id}`, {
    method: 'DELETE',
    credentials: 'include'
  });
  loadBusinessUsers();
}

async function loadAdminSchedule() {
  const calendar = document.getElementById('calendar');
  if (!calendar) return;
  calendar.innerHTML = '';

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const res = await fetch('https://pioneer-pressure-washing.onrender.com/api/admin/schedule', {
    credentials: 'include'
  });

  const data = await res.json();
  const taskMap = {};
  const selectedEntryIds = new Set();

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

    if (taskMap[i]) {
      taskMap[i].forEach(task => {
        const note = document.createElement('div');
        note.style.fontSize = '12px';
        note.style.marginTop = '4px';

        // Create checkbox
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.style.marginRight = '4px';
        checkbox.checked = selectedEntryIds.has(task.id);
        checkbox.addEventListener('change', () => {
          if (checkbox.checked) selectedEntryIds.add(task.id);
          else selectedEntryIds.delete(task.id);
        });
        note.appendChild(checkbox);

        // Task text
        const text = document.createElement('span');
        text.textContent = `${task.business_name}: ${task.service_type} @ ${task.scheduled_time} (${task.status})`;
        note.appendChild(text);

        // Status color
        if (task.status === 'Approved') note.style.color = 'green';
        else if (task.status === 'Denied') note.style.color = 'red';
        else note.style.color = 'orange';

        // Per-task controls
        const controls = document.createElement('div');
        controls.style.marginTop = '2px';

        const approveBtn = document.createElement('button');
        approveBtn.textContent = 'Approve';
        approveBtn.style.fontSize = '10px';
        approveBtn.onclick = () => sendIndividualAction(task.id, 'Approved');

        const denyBtn = document.createElement('button');
        denyBtn.textContent = 'Deny';
        denyBtn.style.fontSize = '10px';
        denyBtn.onclick = () => sendIndividualAction(task.id, 'Denied');

        controls.appendChild(approveBtn);
        controls.appendChild(denyBtn);
        note.appendChild(controls);

        dayBox.appendChild(note);
      });
    }

    calendar.appendChild(dayBox);
  }

  // Bulk action buttons
  const bulkDiv = document.getElementById('bulkControls');
  if (bulkDiv) {
    bulkDiv.innerHTML = `
      <button id="bulkApprove">Approve Selected</button>
      <button id="bulkDeny">Deny Selected</button>
      <span id="bulkStatus" style="margin-left:10px;"></span>
    `;

    document.getElementById('bulkApprove').onclick = () =>
      sendBulkAction('Approved', Array.from(selectedEntryIds));
    document.getElementById('bulkDeny').onclick = () =>
      sendBulkAction('Denied', Array.from(selectedEntryIds));
  }
}

// Bulk approval/denial
async function sendBulkAction(status) {
  if (selectedEntryIds.size === 0) {
    alert('No entries selected.');
    return;
  }

  try {
    const res = await fetch('https://pioneer-pressure-washing.onrender.com/api/admin/schedule/status/bulk', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ ids: Array.from(selectedEntryIds), status })
    });

    const data = await res.json();
    if (res.ok) {
      selectedEntryIds.clear();
      document.getElementById('bulkStatus').textContent = data.message || 'Bulk update successful.';
      await loadAdminSchedule();
    } else {
      throw new Error(data.error || 'Bulk update failed');
    }
  } catch (err) {
    console.error(err);
    alert('Bulk action failed.');
  }
}

// Individual approval/denial
async function sendIndividualAction(taskId, status) {
  try {
    const res = await fetch(`https://pioneer-pressure-washing.onrender.com/api/admin/schedule/${taskId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status })
    });

    if (res.ok) {
      await loadAdminSchedule();
    } else {
      const err = await res.json().catch(() => ({}));
      alert(err.message || 'Failed to update status.');
    }
  } catch (err) {
    console.error('Unexpected error:', err);
    alert('An error occurred while updating.');
  }
}


function logout() {
  document.cookie = "token=; path=/; max-age=0;";
  location.href = '/';
}
