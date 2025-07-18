// scripts/admin.js

let calendarMonth = new Date().getMonth();
let calendarYear = new Date().getFullYear();
let editingExpenseId = null;
const selectedEntryIds = new Set();

// Cache form/table/modal elements ONCE at the top
const expenseForm = document.getElementById('expense-form');
const expensesTable = document.getElementById('expenses-table');
const expenseModal = document.getElementById('expense-modal');
const closeExpenseModal = document.getElementById('close-expense-modal');
const expenseModalTitle = document.getElementById('expense-modal-title');
const addExpenseBtn = document.getElementById('add-expense-btn');

// Main startup logic
document.addEventListener('DOMContentLoaded', async function () {
  try {
    const token = localStorage.getItem('authToken');
    const res = await fetch('https://pioneer-pressure-washing.onrender.com/api/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
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
    loadExpenses();
    await loadAuditLog();
    await loadAdminSchedule(); // 👈 New admin-specific calendar
    await loadInvoices();

  } catch (err) {
    console.error('Auth check failed:', err);
    location.replace('/portal.html');
  }
});

// --- Contacts ---
async function loadContacts() {
  try {
    const token = localStorage.getItem('authToken');
    const res = await fetch('https://pioneer-pressure-washing.onrender.com/api/admin/contacts', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
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

async function deleteContact(id) {
  if (!confirm('Are you sure you want to delete this contact?')) return;
  const token = localStorage.getItem('authToken');
  await fetch(`https://pioneer-pressure-washing.onrender.com/api/admin/contact/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  loadContacts();
}

// --- Business Users ---
async function loadBusinessUsers() {
  try {
    const token = localStorage.getItem('authToken');
    const res = await fetch('https://pioneer-pressure-washing.onrender.com/api/admin/business-users', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
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

async function deleteBusinessUser(id) {
  if (!confirm('Are you sure you want to delete this user?')) return;
  const token = localStorage.getItem('authToken');
  await fetch(`https://pioneer-pressure-washing.onrender.com/api/admin/business-user/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  loadBusinessUsers();
}

// --- Admin Schedule ---
async function loadAdminSchedule() {
  const calendar = document.getElementById('calendar');
  const title = document.getElementById('calendar-title');
  if (!calendar || !title) return;
  calendar.innerHTML = '';

  // Use stateful month/year (NOT always current)
  const year = calendarYear;
  const month = calendarMonth;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Month title
  title.textContent = new Date(year, month, 1).toLocaleString('default', { month: 'long', year: 'numeric' });

  // Day names header
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  days.forEach(d => {
    const div = document.createElement('div');
    div.className = 'calendar-header';
    div.textContent = d;
    calendar.appendChild(div);
  });

  // Get which day of week the 1st is
  const startDay = new Date(year, month, 1).getDay();

  // Build up your task map just like before
  const taskMap = {};
  let data = [];
  try {
    const token = localStorage.getItem('authToken');
    const res = await fetch('https://pioneer-pressure-washing.onrender.com/api/admin/schedule', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    data = await res.json();
    if (!Array.isArray(data)) throw new Error('Invalid schedule response');
  } catch (err) {
    // fail silently or show error
  }

  // Use the month/year being rendered
  const monthPrefix = (month + 1).toString().padStart(2, '0');
  const currentMonth = `${year}-${monthPrefix}`;

  data.forEach(task => {
    const dateStr = task.scheduled_date;
    if (dateStr?.startsWith(currentMonth)) {
      const day = parseInt(dateStr.split('-')[2], 10);
      if (!taskMap[day]) taskMap[day] = [];
      taskMap[day].push(task);
    }
  });

  // Fill in blank days before the first
  for (let i = 0; i < startDay; i++) {
    const div = document.createElement('div');
    div.className = 'calendar-day';
    calendar.appendChild(div);
  }

  // Days of the month
  for (let i = 1; i <= daysInMonth; i++) {
    const dayBox = document.createElement('div');
    dayBox.className = 'calendar-day';

    // Highlight today
    const today = new Date();
    if (
      i === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    ) {
      dayBox.classList.add('today');
    }

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
          renderBulkControls(); // Update bulk controls state
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

  // Render bulk controls
  if (typeof renderBulkControls === 'function') renderBulkControls();
}

// --- Bulk approval/denial ---
async function sendBulkAction(status) {
  if (selectedEntryIds.size === 0) {
    alert('No entries selected.');
    return;
  }

  try {
    const token = localStorage.getItem('authToken');
    const res = await fetch('https://pioneer-pressure-washing.onrender.com/api/admin/schedule/status/bulk', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
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
    const token = localStorage.getItem('authToken');
    const res = await fetch(`https://pioneer-pressure-washing.onrender.com/api/admin/schedule/${taskId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
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

document.getElementById('prev-month').onclick = async () => {
  calendarMonth--;
  if (calendarMonth < 0) {
    calendarMonth = 11;
    calendarYear--;
  }
  await loadAdminSchedule();
};
document.getElementById('next-month').onclick = async () => {
  calendarMonth++;
  if (calendarMonth > 11) {
    calendarMonth = 0;
    calendarYear++;
  }
  await loadAdminSchedule();
};

// --- Audit Log ---
async function loadAuditLog() {
  try {
    const token = localStorage.getItem('authToken');
    const res = await fetch('https://pioneer-pressure-washing.onrender.com/api/admin/audit-log', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
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

// --- Tab switching ---
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
});

// --- Invoices ---
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
        const token = localStorage.getItem('authToken');
        const res = await fetch('https://pioneer-pressure-washing.onrender.com/api/admin/invoice', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
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
    const token = localStorage.getItem('authToken');
    const res = await fetch('https://pioneer-pressure-washing.onrender.com/api/admin/invoices', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
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
          const token = localStorage.getItem('authToken');
          const res = await fetch(`https://pioneer-pressure-washing.onrender.com/api/admin/invoice/${id}/paid`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${token}`
            }
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
          const token = localStorage.getItem('authToken');
          const res = await fetch(`https://pioneer-pressure-washing.onrender.com/api/admin/invoice/${id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
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

// --- Expenses ---
async function loadExpenses(year = "") {
  try {
    let url = 'https://pioneer-pressure-washing.onrender.com/api/admin/expenses';
    if (year) url += `?year=${year}`;
    const token = localStorage.getItem('authToken');
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!res.ok) throw new Error('Failed to fetch expenses');
    const expenses = await res.json();
    if (!expensesTable) return;
    const tbody = expensesTable.querySelector('tbody');
    tbody.innerHTML = '';
    expenses.forEach(exp => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${exp.id}</td>
        <td>${exp.date ? exp.date.slice(0,10) : ''}</td>
        <td>${exp.category}</td>
        <td>${exp.description || ''}</td>
        <td>$${Number(exp.amount).toFixed(2)}</td>
        <td>
          <button class="btn-edit-expense" data-id="${exp.id}">Edit</button>
        </td>
      `;
      tbody.appendChild(row);
    });

   const total = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    let totalElem = document.getElementById('expenses-total');
    if (!totalElem) {
      totalElem = document.createElement('span');
      totalElem.id = 'expenses-total';
      totalElem.style.marginLeft = '2em';
      totalElem.style.fontWeight = 'bold';
      // Insert after Add Expense button
      if (addExpenseBtn) addExpenseBtn.parentNode.insertBefore(totalElem, addExpenseBtn.nextSibling);
    }
    totalElem.textContent = `Total: $${total.toFixed(2)}`;

    // Attach edit event
    tbody.querySelectorAll('.btn-edit-expense').forEach(btn => {
      btn.addEventListener('click', function () {
        const id = this.dataset.id;
        const expense = expenses.find(e => e.id == id);
        if (!expense) return;
        editingExpenseId = expense.id;
        if (expenseModalTitle) expenseModalTitle.textContent = 'Edit Expense';
        if (expenseForm) {
          expenseForm.elements['id'].value = expense.id;
          expenseForm.elements['date'].value = expense.date;
          expenseForm.elements['category'].value = expense.category;
          expenseForm.elements['description'].value = expense.description || '';
          expenseForm.elements['amount'].value = expense.amount;
        }
        showExpenseModal();
      });
    });

  } catch (err) {
    console.error('Error loading expenses:', err);
    if (!expensesTable) return;
    const tbody = expensesTable.querySelector('tbody');
    if (tbody) tbody.innerHTML = `<tr><td colspan="6">Failed to load expenses</td></tr>`;
    let totalElem = document.getElementById('expenses-total')
    if (totalElem) totalElem.textContent = '';
  }
}

function showExpenseModal() {
  if (expenseModal) expenseModal.style.display = 'block';
}
function hideExpenseModal() {
  if (expenseModal) expenseModal.style.display = 'none';
  if (expenseForm) expenseForm.reset();
  editingExpenseId = null;
  if (expenseModalTitle) expenseModalTitle.textContent = 'Add Expense';
}

// Modal close
if (closeExpenseModal) {
  closeExpenseModal.onclick = hideExpenseModal;
}
window.onclick = function(event) {
  if (event.target === expenseModal) hideExpenseModal();
}

// Add Expense button
if (addExpenseBtn) {
  addExpenseBtn.onclick = function() {
    editingExpenseId = null;
    if (expenseForm) expenseForm.reset();
    if (expenseModalTitle) expenseModalTitle.textContent = 'Add Expense';
    showExpenseModal();
  };
}

// Expense form submit
if (expenseForm) {
  expenseForm.onsubmit = async function(e) {
    e.preventDefault();
    const data = {
      date: expenseForm.elements['date'].value,
      category: expenseForm.elements['category'].value,
      description: expenseForm.elements['description'].value,
      amount: expenseForm.elements['amount'].value
    };
    let url = 'https://pioneer-pressure-washing.onrender.com/api/admin/expenses';
    let method = 'POST';
    if (editingExpenseId) {
      url += `/${editingExpenseId}`;
      method = 'PATCH';
    }
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Failed to save expense');
      hideExpenseModal();
      await loadExpenses();
    } catch (err) {
      alert('Error saving expense: ' + err.message);
    }
  };
}

// END EXPENSES

function logout() {
  localStorage.removeItem('authToken');
  location.href = '/';
}