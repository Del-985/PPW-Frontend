document.addEventListener('DOMContentLoaded', async () => {
  try {
    const res = await fetch('https://pioneer-pressure-washing.onrender.com/api/me', {
      credentials: 'include'
    });

    if (!res.ok) throw new Error('Unauthorized');

    const user = await res.json();
    if (!user.is_admin) {
      alert('Admins only. Access denied.');
      location.replace('/portal.html');
      return;
    }

    // ✅ Proceed with admin view
    loadContacts();
    loadBusinessUsers();
    if (typeof renderCalendar === 'function') {
      await renderCalendar();  // from dashboard.js
    }

  } catch (err) {
    console.error('Admin auth check failed:', err);
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

function logout() {
  document.cookie = "token=; path=/; max-age=0;";
  location.href = '/';
}