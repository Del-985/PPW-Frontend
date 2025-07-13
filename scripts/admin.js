const selectedEntryIds = new Set();

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
    await loadAuditLog();
    await loadAdminSchedule(); // 👈 New admin-specific calendar
    await loadInvoices();


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

async function loadAuditLog() {
  try {
    const res = await fetch('https://pioneer-pressure-washing.onrender.com/api/admin/audit-log', {
      credentials: 'include'
    });
    const data = await res.json();
    const tbody = document.querySelector('#audit-log-table tbody');
    tbody.innerHTML = '';
    data.forEach(entry => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${entry.id}</td>
        <td>${entry.admin_email || 'N/A'}</td>
        <td>${entry.action}</td>
        <td>${entry.service_type || '—'}</td>
        <td>${entry.scheduled_date || '—'}</td>
        <td>${new Date(entry.timestamp).toLocaleString()}</td>
      `;
      tbody.appendChild(row);
    });
  } catch (err) {
    alert('Failed to load audit log.');
  }
}

// scripts/admin.js

document.addEventListener('DOMContentLoaded', () => {
  const tabs = document.querySelectorAll('.tab');
  const panels = document.querySelectorAll('.tab-panel');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Remove active from all tabs/panels
      tabs.forEach(t => t.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));
      // Activate selected
      tab.classList.add('active');
      document.getElementById(tab.dataset.tab).classList.add('active');
    });
  });

  // TODO: Fetch and render data for each section as needed
  // Example: fetchContacts(), fetchUsers(), fetchSchedule(), fetchAuditLog()
});

document.addEventListener('DOMContentLoaded', function() {
  const invoiceForm = document.getElementById('invoice-form');
  if (invoiceForm) {
    invoiceForm.addEventListener('submit', async function(e) {
      e.preventDefault();

      // Build data from the form
      const formData = new FormData(invoiceForm);
      const data = {
        customer_name: formData.get('customer_name'),
        business_user_id: Number(formData.get('business_user_id')),
        amount: Number(formData.get('amount')),
        description: formData.get('description'),
        due_date: formData.get('due_date'),
        service_date: formData.get('service_date')
      };

      // Optional: Frontend validation
      if (!data.customer_name || !data.business_user_id || !data.amount) {
        setInvoiceMsg('Please fill in all required fields.');
        return;
      }

      try {
        const res = await fetch('https://pioneer-pressure-washing.onrender.com/api/admin/invoice', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });

        if (res.ok) {
          setInvoiceMsg('Invoice created successfully!');
          invoiceForm.reset();
        } else {
          const err = await res.json();
          setInvoiceMsg('Error: ' + (err.error || 'Failed to create invoice.'));
        }
      } catch (err) {
        setInvoiceMsg('Network or server error.');
      }
    });
  }

  function setInvoiceMsg(msg) {
    const msgDiv = document.getElementById('invoice-message');
    if (msgDiv) {
      msgDiv.textContent = msg;
    }
  }
});

async function loadInvoices() {
  try {
    const res = await fetch('https://pioneer-pressure-washing.onrender.com/api/admin/invoices', {
      credentials: 'include'
    });
    if (!res.ok) throw new Error('Failed to fetch invoices');
    const invoices = await res.json();
    const tbody = document.querySelector('#invoice-table tbody');
    tbody.innerHTML = '';
    invoices.forEach(inv => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${inv.id}</td>
        <td>${inv.customer_name}</td>
        <td>${inv.business_name || inv.business_user_id}</td>
        <td>$${Number(inv.amount).toFixed(2)}</td>
        <td>${inv.description || ''}</td>
        <td>${inv.due_date ? inv.due_date : ''}</td>
        <td>${inv.service_date ? inv.service_date : ''}</td>
        <td>${inv.paid ? 'Yes' : 'No'}</td>
        <td>
          ${inv.paid ? '' : `<button class="btn-paid" data-id="${inv.id}">Mark Paid</button>`}
          <button class="btn-delete" data-id="${inv.id}">Delete</button>
          <a href="https://pioneer-pressure-washing.onrender.com/api/admin/invoice/${inv.id}/pdf" 
             target="_blank" rel="noopener" class="btn-download-pdf">PDF</a>
        </td>
      `;
      tbody.appendChild(row);
    });

    // Attach action handlers after DOM is updated
    tbody.querySelectorAll('.btn-paid').forEach(btn => {
      btn.addEventListener('click', async function () {
        const id = this.dataset.id;
        if (confirm('Mark this invoice as paid?')) {
          const res = await fetch(`https://pioneer-pressure-washing.onrender.com/api/admin/invoice/${id}/paid`, {
            method: 'PATCH',
            credentials: 'include'
          });
          if (res.ok) {
            await loadInvoices(); // Refresh table
          } else {
            alert('Failed to mark as paid');
          }
        }
      });
    });

    tbody.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', async function () {
        const id = this.dataset.id;
        if (confirm('Delete this invoice? This cannot be undone.')) {
          const res = await fetch(`https://pioneer-pressure-washing.onrender.com/api/admin/invoice/${id}`, {
            method: 'DELETE',
            credentials: 'include'
          });
          if (res.ok) {
            await loadInvoices();
          } else {
            alert('Failed to delete invoice');
          }
        }
      });
    });
  } catch (err) {
    console.error('Error loading invoices:', err);
    const tbody = document.querySelector('#invoice-table tbody');
    if (tbody) tbody.innerHTML = `<tr><td colspan="9">Failed to load invoices</td></tr>`;
  }
}




function logout() {
  document.cookie = "token=; path=/; max-age=0;";
  location.href = '/';
}
