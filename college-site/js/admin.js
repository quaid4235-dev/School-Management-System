document.addEventListener('DOMContentLoaded', async function () {
  // Guard: must be logged in — verify against the real backend session
  let currentUser;
  try {
    currentUser = await Api.me();
  } catch (e) {
    window.location.href = 'admin-login.html';
    return;
  }
  document.getElementById('admin-username').textContent = currentUser.username;

  // ---------------------------------------------
  // Panel navigation
  // ---------------------------------------------
  var links = document.querySelectorAll('.dash-link');
  var panels = document.querySelectorAll('.dash-panel');

  links.forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      links.forEach(function (l) { l.classList.remove('active'); });
      panels.forEach(function (p) { p.classList.remove('active'); });
      link.classList.add('active');
      document.getElementById('panel-' + link.dataset.panel).classList.add('active');
    });
  });

  // ---------------------------------------------
  // Toast helper
  // ---------------------------------------------
  function toast(msg) {
    var t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(function () { t.classList.remove('show'); }, 2200);
  }

  // ---------------------------------------------
  // Logout
  // ---------------------------------------------
  document.getElementById('logout-btn').addEventListener('click', async function () {
    try { await Api.logout(); } catch (e) { /* ignore */ }
    window.location.href = 'admin-login.html';
  });

  // ---------------------------------------------
  // Content editor
  // ---------------------------------------------
  var content;
  try {
    content = await Api.getContent();
  } catch (e) {
    toast('Could not load site content from the server.');
    content = {};
  }

  document.getElementById('c-eyebrow').value = content.heroEyebrow || '';
  document.getElementById('c-title').value = content.heroTitle || '';
  document.getElementById('c-lede').value = content.heroLede || '';
  document.getElementById('c-mission').value = content.missionText || '';
  document.getElementById('c-students').value = content.statStudents || '';
  document.getElementById('c-faculty').value = content.statFaculty || '';
  document.getElementById('c-departments').value = content.statDepartments || '';
  document.getElementById('c-library').value = content.statLibrary || '';

  // News items are managed via the Notices API, not the content blob
  var newsList = [];
  try {
    var notices = await Api.getNotices(50);
    newsList = notices.map(function (n) {
      return { id: n.id, title: n.title, date: new Date(n.published_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }), raw: n.published_at };
    });
  } catch (e) { /* leave empty */ }

  function renderNewsEditor() {
    var wrap = document.getElementById('news-editor-list');
    wrap.innerHTML = '';
    newsList.forEach(function (item, index) {
      var row = document.createElement('div');
      row.className = 'news-editor-item';
      row.innerHTML =
        '<span style="flex:1;">' + item.title + '</span>' +
        '<span class="news-editor-date">' + item.date + '</span>' +
        '<button type="button" class="icon-btn danger" data-remove-notice="' + item.id + '">Remove</button>';
      wrap.appendChild(row);
    });

    wrap.querySelectorAll('[data-remove-notice]').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        try {
          await Api.deleteNotice(btn.dataset.removeNotice);
          newsList = newsList.filter(function (n) { return String(n.id) !== btn.dataset.removeNotice; });
          renderNewsEditor();
          toast('News item removed.');
        } catch (e) {
          toast(e.message || 'Could not remove item.');
        }
      });
    });
  }

  renderNewsEditor();

  document.getElementById('add-news-btn').addEventListener('click', async function () {
    var title = prompt('News headline:');
    if (!title) return;
    try {
      var result = await Api.createNotice(title, '', new Date().toISOString().slice(0, 10));
      newsList.unshift({ id: result.id, title: title, date: 'Just now' });
      renderNewsEditor();
      toast('News item added.');
    } catch (e) {
      toast(e.message || 'Could not add news item.');
    }
  });

  document.getElementById('save-content-btn').addEventListener('click', async function () {
    var updated = {
      heroEyebrow: document.getElementById('c-eyebrow').value,
      heroTitle: document.getElementById('c-title').value,
      heroLede: document.getElementById('c-lede').value,
      missionText: document.getElementById('c-mission').value,
      statStudents: document.getElementById('c-students').value,
      statFaculty: document.getElementById('c-faculty').value,
      statDepartments: document.getElementById('c-departments').value,
      statLibrary: document.getElementById('c-library').value
    };
    try {
      await Api.saveContent(updated);
      toast('Content saved — refresh the homepage to see it live.');
    } catch (e) {
      toast(e.message || 'Could not save content.');
    }
  });

  // ---------------------------------------------
  // Applications management
  // ---------------------------------------------
  var allApps = [];

  async function renderApplications() {
    var statusFilter = document.getElementById('filter-status').value;
    var classFilter = document.getElementById('filter-class').value;

    try {
      allApps = await Api.getApplications();
    } catch (e) {
      toast(e.message || 'Could not load applications.');
      return;
    }

    // Populate class filter options once
    var classSelect = document.getElementById('filter-class');
    if (classSelect.options.length === 1) {
      var classes = Array.from(new Set(allApps.map(function (a) { return a.class_applying; })));
      classes.forEach(function (c) {
        var opt = document.createElement('option');
        opt.value = c;
        opt.textContent = c;
        classSelect.appendChild(opt);
      });
    }

    var filtered = allApps.filter(function (a) {
      var statusOk = statusFilter === 'all' || a.status === statusFilter;
      var classOk = classFilter === 'all' || a.class_applying === classFilter;
      return statusOk && classOk;
    });

    document.getElementById('ov-total').textContent = allApps.length;
    document.getElementById('ov-pending').textContent = allApps.filter(function (a) { return a.status === 'pending'; }).length;
    document.getElementById('ov-approved').textContent = allApps.filter(function (a) { return a.status === 'approved'; }).length;

    var tbody = document.getElementById('applications-tbody');
    var emptyState = document.getElementById('applications-empty');
    tbody.innerHTML = '';

    if (filtered.length === 0) {
      emptyState.style.display = 'block';
      return;
    }
    emptyState.style.display = 'none';

    filtered.forEach(function (app) {
      var tr = document.createElement('tr');
      var date = new Date(app.submitted_at).toLocaleDateString();
      tr.innerHTML =
        '<td><input type="checkbox" class="app-check" value="' + app.id + '"> ' + app.student_name + '</td>' +
        '<td>' + app.class_applying + '</td>' +
        '<td>' + app.parent_name + '</td>' +
        '<td>' + app.phone + '<br><span style="color:#6b7280; font-size:0.8rem;">' + (app.email || '') + '</span></td>' +
        '<td>' + date + '</td>' +
        '<td><span class="status-pill status-' + app.status + '">' + app.status + '</span></td>' +
        '<td>' +
          '<button class="icon-btn" data-approve="' + app.id + '">Approve</button> ' +
          '<button class="icon-btn" data-reject="' + app.id + '">Reject</button> ' +
          '<button class="icon-btn" data-waitlist="' + app.id + '">Waitlist</button> ' +
          '<button class="icon-btn" data-convert="' + app.id + '">Make Student</button> ' +
          '<button class="icon-btn danger" data-delete="' + app.id + '">Delete</button>' +
        '</td>';
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('[data-approve]').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        await Api.updateApplicationStatus(btn.dataset.approve, 'approved');
        toast('Application approved.');
        renderApplications();
      });
    });
    tbody.querySelectorAll('[data-reject]').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        await Api.updateApplicationStatus(btn.dataset.reject, 'rejected');
        toast('Application rejected.');
        renderApplications();
      });
    });
    tbody.querySelectorAll('[data-waitlist]').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        await Api.updateApplicationStatus(btn.dataset.waitlist, 'waitlisted');
        toast('Application waitlisted.');
        renderApplications();
      });
    });
    tbody.querySelectorAll('[data-convert]').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        var rollNumber = prompt('Assign a roll number for this student:');
        if (!rollNumber) return;
        var section = prompt('Section (optional):') || '';
        try {
          await Api.convertToStudent(btn.dataset.convert, rollNumber, section);
          toast('Student record created.');
          renderApplications();
        } catch (e) {
          toast(e.message || 'Could not create student record.');
        }
      });
    });
    tbody.querySelectorAll('[data-delete]').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        if (confirm('Delete this application permanently?')) {
          await Api.deleteApplication(btn.dataset.delete);
          toast('Application deleted.');
          renderApplications();
        }
      });
    });
  }

  document.getElementById('filter-status').addEventListener('change', renderApplications);
  document.getElementById('filter-class').addEventListener('change', renderApplications);

  // Bulk action bar
  var bulkBar = document.createElement('div');
  bulkBar.style.cssText = 'margin-bottom:12px; display:flex; gap:10px; align-items:center;';
  bulkBar.innerHTML =
    '<button class="icon-btn" id="bulk-approve">Approve selected</button>' +
    '<button class="icon-btn" id="bulk-reject">Reject selected</button>' +
    '<a class="icon-btn" id="export-csv" href="' + Api.exportApplicationsCsvUrl() + '" style="text-decoration:none; display:inline-block;">Export CSV</a>';
  document.getElementById('panel-applications').insertBefore(bulkBar, document.querySelector('.app-table-wrap'));

  document.getElementById('bulk-approve').addEventListener('click', async function () {
    var ids = Array.from(document.querySelectorAll('.app-check:checked')).map(function (c) { return parseInt(c.value, 10); });
    if (!ids.length) return toast('Select at least one application first.');
    await Api.bulkUpdateApplications(ids, 'approved');
    toast(ids.length + ' application(s) approved.');
    renderApplications();
  });
  document.getElementById('bulk-reject').addEventListener('click', async function () {
    var ids = Array.from(document.querySelectorAll('.app-check:checked')).map(function (c) { return parseInt(c.value, 10); });
    if (!ids.length) return toast('Select at least one application first.');
    await Api.bulkUpdateApplications(ids, 'rejected');
    toast(ids.length + ' application(s) rejected.');
    renderApplications();
  });

  renderApplications();

  // ---------------------------------------------
  // Settings — note: real backend manages credentials via
  // `npm run create-admin` on the server for security, so this
  // panel just explains that instead of storing a password in the browser.
  // ---------------------------------------------
  document.getElementById('s-username').value = currentUser.username;
  document.querySelector('#panel-settings .form-note').textContent =
    'To change the admin password, run "npm run create-admin" on the backend server — this keeps password changes off the browser for security.';
  document.getElementById('save-credentials-btn').style.display = 'none';
  document.getElementById('s-password').closest('.field').style.display = 'none';
});
