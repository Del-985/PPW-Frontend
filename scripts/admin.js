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
        <td><button onclick="deleteBusinessUser(${u.id})">🗑️</button></td>
      `;
      tbody.appendChild(row);
    });
  } catch (err) {
    console.error('Failed to load business users:', err);
  }
}

async function deleteBusinessUser(id) {
  if (!confirm('Delete this user?')) return;
  await fetch(`https://pioneer-pressure-washing.onrender.com/api/admin/business-user/${id}`, {
    method: 'DELETE',
    credentials: 'include'
  });
  loadBusinessUsers();
}

function logout() {
  document.cookie = "token=; path=/; max-age=0;";
  window.location.href = "/portal.html";
}

document.addEventListener('DOMContentLoaded', () => {
  loadBusinessUsers();
});