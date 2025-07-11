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
        note.textContent = `${task.business_name}: ${task.service_type} @ ${task.scheduled_time} (${task.status})`;

        // Optional: add color by status
        if (task.status === 'Approved') note.style.color = 'green';
        else if (task.status === 'Denied') note.style.color = 'red';
        else note.style.color = 'orange';

        dayBox.appendChild(note);
      });
    }

    calendar.appendChild(dayBox);
  }
}



function logout() {
  document.cookie = "token=; path=/; max-age=0;";
  location.href = '/';
}