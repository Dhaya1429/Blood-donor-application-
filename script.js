/* =========================================================
   BLOOD DONOR APP - script.js
   Vanilla JS, localStorage-backed, no dependencies.
========================================================= */

/* ---------- CONSTANTS ---------- */
const KEYS = {
  donors: 'bd_donors',
  requests: 'bd_requests',
  notifs: 'bd_notifications',
  user: 'bd_currentUser',
  seeded: 'bd_seeded_v1'
};

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const DEMO_USERS = {
  patient: { username: 'user', password: 'user123', role: 'patient' },
  donor: { username: 'donor', password: 'donor123', role: 'donor', donorId: 'seed-donor-1' },
  admin: { username: 'admin', password: 'admin123', role: 'admin' }
};

/* ---------- STATE ---------- */
let selectedRole = 'patient';
let adminTab = 'donors';
let profileEditMode = false;
let toastTimer = null;

/* ---------- STORAGE HELPERS ---------- */
function getDonors() {
  try { return JSON.parse(localStorage.getItem(KEYS.donors)) || []; }
  catch (e) { return []; }
}
function saveDonors(arr) { localStorage.setItem(KEYS.donors, JSON.stringify(arr)); }

function getRequests() {
  try { return JSON.parse(localStorage.getItem(KEYS.requests)) || []; }
  catch (e) { return []; }
}
function saveRequests(arr) { localStorage.setItem(KEYS.requests, JSON.stringify(arr)); }

function getNotifs() {
  try { return JSON.parse(localStorage.getItem(KEYS.notifs)) || []; }
  catch (e) { return []; }
}
function saveNotifs(arr) { localStorage.setItem(KEYS.notifs, JSON.stringify(arr)); }

function getCurrentUser() {
  try { return JSON.parse(localStorage.getItem(KEYS.user)) || null; }
  catch (e) { return null; }
}
function setCurrentUser(u) { localStorage.setItem(KEYS.user, JSON.stringify(u)); }
function clearCurrentUser() { localStorage.removeItem(KEYS.user); }

/* ---------- UTILITIES ---------- */
function uid(prefix) {
  return prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
}

function escapeHtml(str) {
  return String(str == null ? '' : str).replace(/[&<>"']/g, function (m) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
  });
}

function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return mins + 'm ago';
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + 'h ago';
  const days = Math.floor(hrs / 24);
  return days + 'd ago';
}

function showToast(msg, duration) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () { t.classList.add('hidden'); }, duration || 2200);
}

function getDonorForUser(cu) {
  if (!cu || !cu.donorId) return null;
  return getDonors().find(function (d) { return d.id === cu.donorId; }) || null;
}

function getUnreadCount() {
  return getNotifs().filter(function (n) { return !n.read; }).length;
}

function addNotification(text, type) {
  const notifs = getNotifs();
  notifs.unshift({ id: uid('notif'), text: text, type: type || 'general', read: false, date: new Date().toISOString() });
  saveNotifs(notifs);
  updateNotifBadge();
}

function updateNotifBadge() {
  const count = getUnreadCount();
  const badge = document.getElementById('notifBadge');
  if (count > 0) {
    badge.textContent = count > 9 ? '9+' : String(count);
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }
}

/* ---------- SEED DATA ---------- */
function seedIfNeeded() {
  if (localStorage.getItem(KEYS.seeded)) return;

  const donors = [
    { id: 'seed-donor-1', name: 'Alex Morgan', age: 29, gender: 'Male', bloodGroup: 'O+', phone: '9876500001', email: 'demo.donor@example.com', city: 'Springfield', lastDonation: '2026-05-12', availability: 'Available', verified: true, createdAt: new Date().toISOString() },
    { id: uid('donor'), name: 'Priya Sharma', age: 34, gender: 'Female', bloodGroup: 'A+', phone: '9876500002', email: 'priya.sharma@example.com', city: 'Riverside', lastDonation: '2026-06-02', availability: 'Available', verified: true, createdAt: new Date().toISOString() },
    { id: uid('donor'), name: 'Daniel Kim', age: 41, gender: 'Male', bloodGroup: 'B+', phone: '9876500003', email: 'daniel.kim@example.com', city: 'Springfield', lastDonation: '2026-01-20', availability: 'Not Available', verified: false, createdAt: new Date().toISOString() },
    { id: uid('donor'), name: 'Fatima Noor', age: 26, gender: 'Female', bloodGroup: 'O-', phone: '9876500004', email: 'fatima.noor@example.com', city: 'Lakeview', lastDonation: '2026-07-15', availability: 'Available', verified: true, createdAt: new Date().toISOString() },
    { id: uid('donor'), name: 'Carlos Mendes', age: 38, gender: 'Male', bloodGroup: 'AB+', phone: '9876500005', email: 'carlos.mendes@example.com', city: 'Riverside', lastDonation: '', availability: 'Available', verified: false, createdAt: new Date().toISOString() },
    { id: uid('donor'), name: 'Grace Lin', age: 31, gender: 'Female', bloodGroup: 'A-', phone: '9876500006', email: 'grace.lin@example.com', city: 'Hilltown', lastDonation: '2026-04-08', availability: 'Available', verified: true, createdAt: new Date().toISOString() },
    { id: uid('donor'), name: 'Omar Farouk', age: 45, gender: 'Male', bloodGroup: 'B-', phone: '9876500007', email: 'omar.farouk@example.com', city: 'Lakeview', lastDonation: '2025-12-01', availability: 'Not Available', verified: true, createdAt: new Date().toISOString() },
    { id: uid('donor'), name: 'Nina Petrova', age: 23, gender: 'Female', bloodGroup: 'AB-', phone: '9876500008', email: 'nina.petrova@example.com', city: 'Springfield', lastDonation: '2026-08-01', availability: 'Available', verified: false, createdAt: new Date().toISOString() },
    { id: uid('donor'), name: 'Jamal Wright', age: 36, gender: 'Male', bloodGroup: 'O+', phone: '9876500009', email: 'jamal.wright@example.com', city: 'Hilltown', lastDonation: '2026-03-19', availability: 'Available', verified: true, createdAt: new Date().toISOString() },
    { id: uid('donor'), name: 'Sara Ahmed', age: 28, gender: 'Female', bloodGroup: 'A+', phone: '9876500010', email: 'sara.ahmed@example.com', city: 'Lakeview', lastDonation: '2026-06-28', availability: 'Available', verified: false, createdAt: new Date().toISOString() }
  ];

  const requests = [
    { id: uid('req'), patientName: 'Robert Chen', bloodGroup: 'O+', units: 2, hospital: 'City General Hospital', city: 'Springfield', requiredDate: '2026-09-14', contact: '9876511001', status: 'pending', createdAt: new Date().toISOString(), acceptedBy: null },
    { id: uid('req'), patientName: 'Maria Gonzalez', bloodGroup: 'A-', units: 1, hospital: 'Riverside Medical Center', city: 'Riverside', requiredDate: '2026-09-12', contact: '9876511002', status: 'accepted', createdAt: new Date().toISOString(), acceptedBy: 'Grace Lin' },
    { id: uid('req'), patientName: 'Tom Okafor', bloodGroup: 'B+', units: 3, hospital: 'Lakeview Hospital', city: 'Lakeview', requiredDate: '2026-09-20', contact: '9876511003', status: 'pending', createdAt: new Date().toISOString(), acceptedBy: null },
    { id: uid('req'), patientName: 'Elena Popescu', bloodGroup: 'AB+', units: 1, hospital: 'Hilltown Clinic', city: 'Hilltown', requiredDate: '2026-08-30', contact: '9876511004', status: 'completed', createdAt: new Date().toISOString(), acceptedBy: 'Carlos Mendes' }
  ];

  const notifs = [
    { id: uid('notif'), text: 'New blood request: O+ needed at City General Hospital.', type: 'request', read: false, date: new Date().toISOString() },
    { id: uid('notif'), text: 'Your blood request was accepted by Grace Lin.', type: 'accepted', read: false, date: new Date(Date.now() - 3600 * 1000).toISOString() },
    { id: uid('notif'), text: "It's been a while since your last donation. Consider donating again soon!", type: 'reminder', read: true, date: new Date(Date.now() - 86400 * 1000 * 2).toISOString() },
    { id: uid('notif'), text: 'Welcome to Blood Donor! Complete your profile to get started.', type: 'general', read: true, date: new Date(Date.now() - 86400 * 1000 * 5).toISOString() }
  ];

  saveDonors(donors);
  saveRequests(requests);
  saveNotifs(notifs);
  localStorage.setItem(KEYS.seeded, '1');
}

/* ---------- DONOR CARD TEMPLATE ---------- */
function donorCardHTML(d) {
  return '' +
    '<div class="donor-card">' +
      '<div class="donor-card-top">' +
        '<p class="donor-name">' + escapeHtml(d.name) + '</p>' +
        '<span class="bg-tag">' + d.bloodGroup + '</span>' +
      '</div>' +
      '<p class="donor-meta">📍 ' + escapeHtml(d.city) + '</p>' +
      '<p class="donor-meta">🗓 Last donation: ' + (d.lastDonation ? formatDate(d.lastDonation) : 'N/A') + '</p>' +
      '<span class="status-pill ' + (d.availability === 'Available' ? 'status-available' : 'status-unavailable') + '">' + d.availability + '</span>' +
      '<div class="card-actions">' +
        '<button class="btn btn-outline btn-sm" data-action="contact" data-id="' + d.id + '">Contact</button>' +
        '<button class="btn btn-primary btn-sm" data-action="request" data-id="' + d.id + '">Request</button>' +
      '</div>' +
    '</div>';
}

/* ---------- CONTACT MODAL ---------- */
function openContactModal(donor) {
  const body = document.getElementById('contactModalBody');
  body.innerHTML = '' +
    '<h3>Contact ' + escapeHtml(donor.name) + '</h3>' +
    '<a class="modal-contact-row" href="tel:' + escapeHtml(donor.phone) + '">📞 ' + escapeHtml(donor.phone) + '</a>' +
    '<a class="modal-contact-row" href="mailto:' + escapeHtml(donor.email) + '">✉️ ' + escapeHtml(donor.email) + '</a>';
  document.getElementById('contactModal').classList.remove('hidden');
}
function closeContactModal() {
  document.getElementById('contactModal').classList.add('hidden');
}

/* ---------- REQUEST FORM HELPERS ---------- */
function openRequestForm(prefillGroup) {
  goToPage('requests');
  const form = document.getElementById('requestForm');
  form.classList.remove('hidden');
  document.getElementById('newRequestToggle').textContent = 'Cancel';
  if (prefillGroup) {
    document.getElementById('reqBloodGroup').value = prefillGroup;
  }
}
function resetRequestForm() {
  document.getElementById('requestForm').reset();
  ['reqPatientName', 'reqBloodGroup', 'reqUnits', 'reqDate', 'reqHospital', 'reqCity', 'reqContact'].forEach(function (id) {
    setFieldError(id, '');
  });
  document.getElementById('requestSuccess').classList.add('hidden');
}

/* ---------- FIELD ERROR HELPERS ---------- */
function setFieldError(id, msg) {
  const el = document.getElementById('err-' + id);
  if (el) el.textContent = msg || '';
}
function clearFieldErrors(ids) { ids.forEach(function (id) { setFieldError(id, ''); }); }

/* ---------- ROUTER ---------- */
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(function (s) { s.classList.remove('active'); });
  document.getElementById(id).classList.add('active');
}

function goToPage(pageKey) {
  const cu = getCurrentUser();
  document.querySelectorAll('.page').forEach(function (p) { p.classList.remove('active'); });

  let targetId = 'page-' + pageKey;
  if (pageKey === 'home' && cu && cu.role === 'admin') targetId = 'page-admin';

  const el = document.getElementById(targetId);
  if (el) el.classList.add('active');

  document.querySelectorAll('.nav-btn').forEach(function (b) {
    b.classList.toggle('active', b.dataset.page === pageKey);
  });

  if (pageKey === 'home') {
    if (cu && cu.role === 'admin') renderAdmin(); else renderHome();
  } else if (pageKey === 'find') {
    renderFind();
  } else if (pageKey === 'requests') {
    renderRequestsList();
  } else if (pageKey === 'profile') {
    profileEditMode = false;
    renderProfile();
  } else if (pageKey === 'notifications') {
    renderNotifications();
  } else if (pageKey === 'register') {
    document.getElementById('registerSuccess').classList.add('hidden');
  }

  document.getElementById('pageContainer').scrollTop = 0;
  window.scrollTo(0, 0);
}

/* ---------- HOME PAGE ---------- */
function renderHome() {
  const cu = getCurrentUser();
  const donors = getDonors();
  const requests = getRequests();
  const total = donors.length;
  const available = donors.filter(function (d) { return d.availability === 'Available'; }).length;

  const donorProfile = getDonorForUser(cu);
  const displayName = donorProfile ? donorProfile.name : (cu ? cu.username : 'Guest');

  const nearby = donors.filter(function (d) { return d.availability === 'Available'; }).slice(0, 3);

  let html = '' +
    '<div class="hero-card">' +
      '<span class="hero-drop">🩸</span>' +
      '<h2>Hi, ' + escapeHtml(displayName) + ' 👋</h2>' +
      '<p>Your donation can save up to 3 lives.</p>' +
    '</div>' +

    '<div class="quick-actions">' +
      '<button class="action-card" data-action="goto" data-target="find"><span class="action-icon">🔍</span><span class="action-title">Find Blood Donor</span><span class="action-sub">Search by group &amp; city</span></button>' +
      '<button class="action-card" data-action="goto" data-target="register"><span class="action-icon">📝</span><span class="action-title">Register as Donor</span><span class="action-sub">Join our donor list</span></button>' +
      '<button class="action-card" data-action="emergency"><span class="action-icon">🆘</span><span class="action-title">Emergency Request</span><span class="action-sub">Request blood now</span></button>' +
      '<button class="action-card" data-action="goto" data-target="notifications"><span class="action-icon">🔔</span><span class="action-title">Notifications</span><span class="action-sub">' + getUnreadCount() + ' unread</span></button>' +
    '</div>' +

    '<div class="stats-grid">' +
      '<div class="stat-card"><span class="stat-num">' + total + '</span><span class="stat-label">Total Donors</span></div>' +
      '<div class="stat-card"><span class="stat-num">' + available + '</span><span class="stat-label">Available</span></div>' +
      '<div class="stat-card"><span class="stat-num">' + requests.length + '</span><span class="stat-label">Requests</span></div>' +
    '</div>' +

    '<h3 class="section-subtitle">Blood Group Overview</h3>' +
    '<div class="bg-overview-grid">' +
      BLOOD_GROUPS.map(function (bg) {
        const count = donors.filter(function (d) { return d.bloodGroup === bg; }).length;
        return '<div class="bg-chip"><span class="bg-name">' + bg + '</span><span class="bg-count">' + count + ' donors</span></div>';
      }).join('') +
    '</div>' +

    '<h3 class="section-subtitle">Nearby Donors</h3>' +
    '<div class="card-list">' +
      (nearby.length ? nearby.map(donorCardHTML).join('') : '<div class="no-results"><span class="nr-icon">🩸</span>No available donors yet.</div>') +
    '</div>';

  document.getElementById('homeContent').innerHTML = html;
}

function handleHomeContentClick(e) {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const action = btn.dataset.action;
  if (action === 'goto') {
    goToPage(btn.dataset.target);
  } else if (action === 'emergency') {
    openRequestForm();
  } else if (action === 'contact') {
    const d = getDonors().find(function (x) { return x.id === btn.dataset.id; });
    if (d) openContactModal(d);
  } else if (action === 'request') {
    const d = getDonors().find(function (x) { return x.id === btn.dataset.id; });
    if (d) { openRequestForm(d.bloodGroup); showToast('Blood group pre-filled: ' + d.bloodGroup); }
  }
}

/* ---------- FIND DONOR PAGE ---------- */
function renderFind() {
  const group = document.getElementById('findBloodGroup').value;
  const city = document.getElementById('findCity').value.trim().toLowerCase();
  const donors = getDonors().filter(function (d) {
    return (!group || d.bloodGroup === group) && (!city || d.city.toLowerCase().indexOf(city) !== -1);
  });
  const container = document.getElementById('findResults');
  container.innerHTML = donors.length
    ? donors.map(donorCardHTML).join('')
    : '<div class="no-results"><span class="nr-icon">🔍</span>No donors found matching your search.</div>';
}

function handleFindResultsClick(e) {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const action = btn.dataset.action;
  const d = getDonors().find(function (x) { return x.id === btn.dataset.id; });
  if (!d) return;
  if (action === 'contact') openContactModal(d);
  else if (action === 'request') { openRequestForm(d.bloodGroup); showToast('Blood group pre-filled: ' + d.bloodGroup); }
}

/* ---------- REGISTER DONOR ---------- */
function handleRegisterSubmit(e) {
  e.preventDefault();
  const fields = ['regName', 'regAge', 'regGender', 'regBloodGroup', 'regPhone', 'regEmail', 'regCity'];
  clearFieldErrors(fields);
  let valid = true;

  const name = document.getElementById('regName').value.trim();
  const ageRaw = document.getElementById('regAge').value.trim();
  const ageNum = Number(ageRaw);
  const gender = document.getElementById('regGender').value;
  const bloodGroup = document.getElementById('regBloodGroup').value;
  const phone = document.getElementById('regPhone').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const city = document.getElementById('regCity').value.trim();
  const lastDonation = document.getElementById('regLastDonation').value;
  const availability = document.getElementById('regAvailability').value;

  if (name.length < 3) { setFieldError('regName', 'Enter full name (min 3 characters)'); valid = false; }
  if (!ageRaw || isNaN(ageNum) || ageNum < 18 || ageNum > 65) { setFieldError('regAge', 'Age must be between 18 and 65'); valid = false; }
  if (!gender) { setFieldError('regGender', 'Select gender'); valid = false; }
  if (!bloodGroup) { setFieldError('regBloodGroup', 'Select blood group'); valid = false; }
  if (!/^\d{10}$/.test(phone)) { setFieldError('regPhone', 'Enter a valid 10-digit number'); valid = false; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setFieldError('regEmail', 'Enter a valid email address'); valid = false; }
  if (city.length < 2) { setFieldError('regCity', 'Enter city / area'); valid = false; }

  if (!valid) return;

  const donors = getDonors();
  const newDonor = {
    id: uid('donor'), name: name, age: ageNum, gender: gender, bloodGroup: bloodGroup,
    phone: phone, email: email, city: city, lastDonation: lastDonation || '',
    availability: availability, verified: false, createdAt: new Date().toISOString()
  };
  donors.unshift(newDonor);
  saveDonors(donors);
  addNotification('New donor registered: ' + name + ' (' + bloodGroup + ')', 'donor');

  const cu = getCurrentUser();
  if (cu && cu.role !== 'admin') {
    cu.donorId = newDonor.id;
    setCurrentUser(cu);
  }

  document.getElementById('registerSuccess').classList.remove('hidden');
  showToast('Registration successful!');
  document.getElementById('registerForm').reset();

  setTimeout(function () {
    document.getElementById('registerSuccess').classList.add('hidden');
    goToPage('profile');
  }, 1400);
}

/* ---------- EMERGENCY REQUEST ---------- */
function handleRequestSubmit(e) {
  e.preventDefault();
  const fields = ['reqPatientName', 'reqBloodGroup', 'reqUnits', 'reqDate', 'reqHospital', 'reqCity', 'reqContact'];
  clearFieldErrors(fields);
  let valid = true;

  const patientName = document.getElementById('reqPatientName').value.trim();
  const bloodGroup = document.getElementById('reqBloodGroup').value;
  const unitsRaw = document.getElementById('reqUnits').value.trim();
  const units = Number(unitsRaw);
  const requiredDate = document.getElementById('reqDate').value;
  const hospital = document.getElementById('reqHospital').value.trim();
  const city = document.getElementById('reqCity').value.trim();
  const contact = document.getElementById('reqContact').value.trim();

  if (patientName.length < 2) { setFieldError('reqPatientName', 'Enter patient name'); valid = false; }
  if (!bloodGroup) { setFieldError('reqBloodGroup', 'Select blood group'); valid = false; }
  if (!unitsRaw || isNaN(units) || units < 1) { setFieldError('reqUnits', 'Enter valid number of units'); valid = false; }
  if (!requiredDate) { setFieldError('reqDate', 'Select required date'); valid = false; }
  if (hospital.length < 2) { setFieldError('reqHospital', 'Enter hospital name'); valid = false; }
  if (city.length < 2) { setFieldError('reqCity', 'Enter city / area'); valid = false; }
  if (!/^\d{10}$/.test(contact)) { setFieldError('reqContact', 'Enter a valid 10-digit number'); valid = false; }

  if (!valid) return;

  const requests = getRequests();
  const newReq = {
    id: uid('req'), patientName: patientName, bloodGroup: bloodGroup, units: units,
    hospital: hospital, city: city, requiredDate: requiredDate, contact: contact,
    status: 'pending', createdAt: new Date().toISOString(), acceptedBy: null
  };
  requests.unshift(newReq);
  saveRequests(requests);
  addNotification('New blood request: ' + bloodGroup + ' needed at ' + hospital, 'request');

  document.getElementById('requestSuccess').classList.remove('hidden');
  showToast('Request submitted successfully!');
  document.getElementById('requestForm').reset();

  setTimeout(function () {
    document.getElementById('requestForm').classList.add('hidden');
    document.getElementById('newRequestToggle').textContent = '+ New Emergency Request';
    document.getElementById('requestSuccess').classList.add('hidden');
    renderRequestsList();
  }, 1200);
}

function requestCardHTML(r) {
  const cu = getCurrentUser();
  const statusClass = 'status-' + r.status;
  let actions = '<div class="card-actions">' +
    '<a class="btn btn-outline btn-sm" href="tel:' + escapeHtml(r.contact) + '">📞 Contact</a>';

  if (cu && cu.role === 'donor' && r.status === 'pending') {
    actions += '<button class="btn btn-primary btn-sm" data-action="accept" data-id="' + r.id + '">Accept</button>';
  }
  if (cu && cu.role === 'admin') {
    actions += '' +
      '<select class="status-select" data-action="admin-change-status" data-id="' + r.id + '">' +
        ['pending', 'accepted', 'completed', 'cancelled'].map(function (s) {
          return '<option value="' + s + '" ' + (r.status === s ? 'selected' : '') + '>' + capitalize(s) + '</option>';
        }).join('') +
      '</select>' +
      '<button class="btn btn-ghost btn-sm" data-action="admin-delete-request" data-id="' + r.id + '">✕</button>';
  }
  actions += '</div>';

  return '' +
    '<div class="request-card">' +
      '<div class="request-card-top">' +
        '<p class="req-patient">' + escapeHtml(r.patientName) + '</p>' +
        '<span class="bg-tag">' + r.bloodGroup + '</span>' +
      '</div>' +
      '<p class="req-meta">🏥 ' + escapeHtml(r.hospital) + ', ' + escapeHtml(r.city) + '</p>' +
      '<p class="req-meta">🩸 ' + r.units + ' unit(s) needed · Required by ' + formatDate(r.requiredDate) + '</p>' +
      (r.acceptedBy ? '<p class="req-meta">✅ Accepted by ' + escapeHtml(r.acceptedBy) + '</p>' : '') +
      '<span class="status-pill ' + statusClass + '">' + capitalize(r.status) + '</span>' +
      actions +
    '</div>';
}

function renderRequestsList() {
  const requests = getRequests().slice().sort(function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });
  const container = document.getElementById('requestsList');
  container.innerHTML = requests.length
    ? requests.map(requestCardHTML).join('')
    : '<div class="no-results"><span class="nr-icon">🆘</span>No active requests right now.</div>';
}

function handleRequestsListClick(e) {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const action = btn.dataset.action;
  const id = btn.dataset.id;

  if (action === 'accept') {
    const requests = getRequests();
    const req = requests.find(function (r) { return r.id === id; });
    if (req && req.status === 'pending') {
      const cu = getCurrentUser();
      const donor = getDonorForUser(cu);
      const donorName = donor ? donor.name : (cu ? cu.username : 'A donor');
      req.status = 'accepted';
      req.acceptedBy = donorName;
      saveRequests(requests);
      addNotification('Request for ' + req.bloodGroup + ' at ' + req.hospital + ' was accepted by ' + donorName + '.', 'accepted');
      showToast('You accepted this request. Thank you!');
      renderRequestsList();
    }
  } else if (action === 'admin-delete-request') {
    if (confirm('Delete this blood request?')) {
      let requests = getRequests();
      requests = requests.filter(function (r) { return r.id !== id; });
      saveRequests(requests);
      showToast('Request deleted.');
      renderRequestsList();
    }
  }
}

function handleRequestsListChange(e) {
  const sel = e.target.closest('[data-action="admin-change-status"]');
  if (!sel) return;
  const requests = getRequests();
  const req = requests.find(function (r) { return r.id === sel.dataset.id; });
  if (req) {
    req.status = sel.value;
    saveRequests(requests);
    showToast('Request status updated to ' + capitalize(sel.value) + '.');
    renderRequestsList();
  }
}

/* ---------- PROFILE PAGE ---------- */
function renderProfile() {
  const cu = getCurrentUser();
  const container = document.getElementById('profileContent');

  if (!cu) { container.innerHTML = ''; return; }

  if (cu.role === 'admin') {
    container.innerHTML = '' +
      '<div class="profile-header">' +
        '<div class="profile-avatar">🛡️</div>' +
        '<h2>Administrator</h2>' +
        '<p>@' + escapeHtml(cu.username) + '</p>' +
      '</div>' +
      '<div class="info-list">' +
        '<div class="info-row"><span class="info-label">Role</span><span class="info-value">Admin</span></div>' +
        '<div class="info-row"><span class="info-label">Total Donors</span><span class="info-value">' + getDonors().length + '</span></div>' +
        '<div class="info-row"><span class="info-label">Total Requests</span><span class="info-value">' + getRequests().length + '</span></div>' +
      '</div>' +
      '<button class="btn btn-outline btn-block" data-action="logout">Logout</button>';
    return;
  }

  const donor = getDonorForUser(cu);

  if (!donor) {
    container.innerHTML = '' +
      '<div class="profile-header">' +
        '<div class="profile-avatar">👤</div>' +
        '<h2>' + escapeHtml(cu.username) + '</h2>' +
        '<p>' + capitalize(cu.role) + ' account</p>' +
      '</div>' +
      '<div class="card" style="text-align:center; margin-top:12px;">' +
        '<p style="margin:0 0 12px; color:var(--ink-soft); font-size:13.5px;">You haven\'t registered as a donor yet. Register now to help save lives.</p>' +
        '<button class="btn btn-primary btn-block" data-action="register-donor">Register as Donor</button>' +
      '</div>' +
      '<button class="btn btn-outline btn-block" data-action="logout" style="margin-top:12px;">Logout</button>';
    return;
  }

  if (profileEditMode) {
    container.innerHTML = '' +
      '<h2 class="page-title">Edit Profile</h2>' +
      '<div class="form">' +
        '<div class="field"><label>Full Name</label><input type="text" id="editName" value="' + escapeHtml(donor.name) + '"></div>' +
        '<div class="field-row">' +
          '<div class="field"><label>Phone</label><input type="tel" id="editPhone" value="' + escapeHtml(donor.phone) + '"></div>' +
          '<div class="field"><label>Email</label><input type="email" id="editEmail" value="' + escapeHtml(donor.email) + '"></div>' +
        '</div>' +
        '<div class="field"><label>City / Area</label><input type="text" id="editCity" value="' + escapeHtml(donor.city) + '"></div>' +
        '<div class="field"><label>Last Donation Date</label><input type="date" id="editLastDonation" value="' + escapeHtml(donor.lastDonation) + '"></div>' +
        '<div class="field"><label>Availability</label>' +
          '<select id="editAvailability">' +
            '<option value="Available" ' + (donor.availability === 'Available' ? 'selected' : '') + '>Available</option>' +
            '<option value="Not Available" ' + (donor.availability === 'Not Available' ? 'selected' : '') + '>Not Available</option>' +
          '</select>' +
        '</div>' +
        '<div class="card-actions">' +
          '<button class="btn btn-ghost" data-action="cancel-edit">Cancel</button>' +
          '<button class="btn btn-primary" data-action="save-profile">Save Changes</button>' +
        '</div>' +
      '</div>';
    return;
  }

  container.innerHTML = '' +
    '<div class="profile-header">' +
      '<div class="profile-avatar">🩸</div>' +
      '<h2>' + escapeHtml(donor.name) + '</h2>' +
      '<p>' + donor.bloodGroup + ' · ' + escapeHtml(donor.city) + '</p>' +
    '</div>' +
    '<div class="toggle-row">' +
      '<span>Available to donate</span>' +
      '<label class="switch"><input type="checkbox" id="availToggle" ' + (donor.availability === 'Available' ? 'checked' : '') + '><span class="slider"></span></label>' +
    '</div>' +
    '<div class="info-list">' +
      '<div class="info-row"><span class="info-label">Age</span><span class="info-value">' + donor.age + '</span></div>' +
      '<div class="info-row"><span class="info-label">Gender</span><span class="info-value">' + escapeHtml(donor.gender) + '</span></div>' +
      '<div class="info-row"><span class="info-label">Phone</span><span class="info-value">' + escapeHtml(donor.phone) + '</span></div>' +
      '<div class="info-row"><span class="info-label">Email</span><span class="info-value">' + escapeHtml(donor.email) + '</span></div>' +
      '<div class="info-row"><span class="info-label">Last Donation</span><span class="info-value">' + (donor.lastDonation ? formatDate(donor.lastDonation) : 'N/A') + '</span></div>' +
      '<div class="info-row"><span class="info-label">Verified</span><span class="info-value">' + (donor.verified ? '✔ Yes' : 'Pending') + '</span></div>' +
    '</div>' +
    '<div class="card-actions">' +
      '<button class="btn btn-secondary" data-action="request-blood">Request Blood</button>' +
      '<button class="btn btn-primary" data-action="edit-profile">Edit Profile</button>' +
    '</div>' +
    '<button class="btn btn-outline btn-block" data-action="logout" style="margin-top:12px;">Logout</button>';
}

function handleProfileContentClick(e) {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const action = btn.dataset.action;

  if (action === 'edit-profile') { profileEditMode = true; renderProfile(); }
  else if (action === 'cancel-edit') { profileEditMode = false; renderProfile(); }
  else if (action === 'request-blood') { openRequestForm(); }
  else if (action === 'register-donor') { goToPage('register'); }
  else if (action === 'logout') { performLogout(); }
  else if (action === 'save-profile') {
    const cu = getCurrentUser();
    const donors = getDonors();
    const donor = donors.find(function (d) { return d.id === cu.donorId; });
    if (!donor) return;
    const name = document.getElementById('editName').value.trim();
    const phone = document.getElementById('editPhone').value.trim();
    const email = document.getElementById('editEmail').value.trim();
    const city = document.getElementById('editCity').value.trim();
    const lastDonation = document.getElementById('editLastDonation').value;
    const availability = document.getElementById('editAvailability').value;

    if (name.length < 3 || !/^\d{10}$/.test(phone) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || city.length < 2) {
      showToast('Please fill all fields correctly.');
      return;
    }

    donor.name = name; donor.phone = phone; donor.email = email; donor.city = city;
    donor.lastDonation = lastDonation; donor.availability = availability;
    saveDonors(donors);
    profileEditMode = false;
    renderProfile();
    showToast('Profile updated successfully!');
  }
}

function handleProfileContentChange(e) {
  if (e.target.id !== 'availToggle') return;
  const cu = getCurrentUser();
  const donors = getDonors();
  const donor = donors.find(function (d) { return d.id === cu.donorId; });
  if (!donor) return;
  donor.availability = e.target.checked ? 'Available' : 'Not Available';
  saveDonors(donors);
  showToast('Availability updated: ' + donor.availability);
  renderProfile();
}

/* ---------- NOTIFICATIONS PAGE ---------- */
const NOTIF_ICONS = { request: '🆘', accepted: '✅', reminder: '⏰', donor: '🩸', general: '🔔' };

function renderNotifications() {
  const notifs = getNotifs().slice().sort(function (a, b) { return new Date(b.date) - new Date(a.date); });
  const container = document.getElementById('notifList');
  container.innerHTML = notifs.length
    ? notifs.map(function (n) {
        return '' +
          '<div class="notif-card ' + (n.read ? '' : 'unread') + '" data-action="mark-read" data-id="' + n.id + '">' +
            '<span class="notif-icon">' + (NOTIF_ICONS[n.type] || '🔔') + '</span>' +
            '<div class="notif-body">' +
              '<p class="notif-text">' + escapeHtml(n.text) + '</p>' +
              '<span class="notif-date">' + timeAgo(n.date) + '</span>' +
            '</div>' +
            (n.read ? '' : '<span class="notif-dot"></span>') +
          '</div>';
      }).join('')
    : '<div class="no-results"><span class="nr-icon">🔔</span>No notifications yet.</div>';
  updateNotifBadge();
}

function handleNotifListClick(e) {
  const card = e.target.closest('[data-action="mark-read"]');
  if (!card) return;
  const notifs = getNotifs();
  const n = notifs.find(function (x) { return x.id === card.dataset.id; });
  if (n && !n.read) {
    n.read = true;
    saveNotifs(notifs);
    renderNotifications();
  }
}

/* ---------- ADMIN DASHBOARD ---------- */
function renderAdmin() {
  const donors = getDonors();
  const requests = getRequests();
  const totalDonors = donors.length;
  const availableDonors = donors.filter(function (d) { return d.availability === 'Available'; }).length;
  const totalRequests = requests.length;
  const pendingRequests = requests.filter(function (r) { return r.status === 'pending'; }).length;

  let html = '' +
    '<h2 class="page-title">Admin Dashboard</h2>' +
    '<div class="stats-grid stats-grid-2">' +
      '<div class="stat-card"><span class="stat-num">' + totalDonors + '</span><span class="stat-label">Total Donors</span></div>' +
      '<div class="stat-card"><span class="stat-num">' + availableDonors + '</span><span class="stat-label">Available Donors</span></div>' +
      '<div class="stat-card"><span class="stat-num">' + totalRequests + '</span><span class="stat-label">Blood Requests</span></div>' +
      '<div class="stat-card"><span class="stat-num">' + pendingRequests + '</span><span class="stat-label">Pending Requests</span></div>' +
    '</div>' +

    '<div class="admin-tabs">' +
      '<button class="admin-tab ' + (adminTab === 'donors' ? 'active' : '') + '" data-tab="donors">Manage Donors</button>' +
      '<button class="admin-tab ' + (adminTab === 'requests' ? 'active' : '') + '" data-tab="requests">Manage Requests</button>' +
    '</div>' +

    '<div class="admin-panel ' + (adminTab === 'donors' ? 'active' : '') + '" id="adminDonorsPanel">' +
      (donors.length ? donors.map(function (d) {
        return '' +
          '<div class="admin-row">' +
            '<div class="admin-row-info">' +
              '<p class="arow-title">' + escapeHtml(d.name) + ' · ' + d.bloodGroup + '</p>' +
              '<p class="arow-sub">' + escapeHtml(d.city) + ' · ' + d.availability + (d.verified ? ' · <span class="verified-tag">✔ Verified</span>' : '') + '</p>' +
            '</div>' +
            '<div class="admin-row-actions">' +
              (!d.verified ? '<button class="btn btn-outline btn-sm" data-action="verify-donor" data-id="' + d.id + '">Verify</button>' : '') +
              '<button class="btn btn-ghost btn-sm" data-action="remove-donor" data-id="' + d.id + '">Remove</button>' +
            '</div>' +
          '</div>';
      }).join('') : '<div class="no-results">No donors registered yet.</div>') +
    '</div>' +

    '<div class="admin-panel ' + (adminTab === 'requests' ? 'active' : '') + '" id="adminRequestsPanel">' +
      (requests.length ? requests.map(function (r) {
        return '' +
          '<div class="admin-row">' +
            '<div class="admin-row-info">' +
              '<p class="arow-title">' + escapeHtml(r.patientName) + ' · ' + r.bloodGroup + '</p>' +
              '<p class="arow-sub">' + escapeHtml(r.hospital) + ', ' + escapeHtml(r.city) + ' · ' + formatDate(r.requiredDate) + '</p>' +
            '</div>' +
            '<div class="admin-row-actions">' +
              '<select class="status-select" data-action="admin-change-status" data-id="' + r.id + '">' +
                ['pending', 'accepted', 'completed', 'cancelled'].map(function (s) {
                  return '<option value="' + s + '" ' + (r.status === s ? 'selected' : '') + '>' + capitalize(s) + '</option>';
                }).join('') +
              '</select>' +
              '<button class="btn btn-ghost btn-sm" data-action="admin-delete-request" data-id="' + r.id + '">✕</button>' +
            '</div>' +
          '</div>';
      }).join('') : '<div class="no-results">No blood requests yet.</div>') +
    '</div>';

  document.getElementById('adminContent').innerHTML = html;
}

function handleAdminClick(e) {
  const tabBtn = e.target.closest('.admin-tab');
  if (tabBtn) {
    adminTab = tabBtn.dataset.tab;
    renderAdmin();
    return;
  }

  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const action = btn.dataset.action;
  const id = btn.dataset.id;

  if (action === 'verify-donor') {
    const donors = getDonors();
    const d = donors.find(function (x) { return x.id === id; });
    if (d) {
      d.verified = true;
      saveDonors(donors);
      addNotification(d.name + ' has been verified by admin.', 'donor');
      showToast('Donor verified.');
      renderAdmin();
    }
  } else if (action === 'remove-donor') {
    if (confirm('Remove this donor from the list?')) {
      let donors = getDonors();
      donors = donors.filter(function (x) { return x.id !== id; });
      saveDonors(donors);
      showToast('Donor removed.');
      renderAdmin();
    }
  } else if (action === 'admin-delete-request') {
    if (confirm('Delete this blood request?')) {
      let requests = getRequests();
      requests = requests.filter(function (x) { return x.id !== id; });
      saveRequests(requests);
      showToast('Request deleted.');
      renderAdmin();
    }
  }
}

function handleAdminChange(e) {
  const sel = e.target.closest('[data-action="admin-change-status"]');
  if (!sel) return;
  const requests = getRequests();
  const req = requests.find(function (r) { return r.id === sel.dataset.id; });
  if (req) {
    req.status = sel.value;
    saveRequests(requests);
    showToast('Request status updated to ' + capitalize(sel.value) + '.');
    renderAdmin();
  }
}

/* ---------- AUTH ---------- */
function performLogin(username, password) {
  const creds = DEMO_USERS[selectedRole];
  if (username === creds.username && password === creds.password) {
    const userObj = { role: creds.role, username: creds.username, donorId: creds.donorId || null };
    setCurrentUser(userObj);
    document.getElementById('loginError').classList.add('hidden');
    document.getElementById('loginForm').reset();
    showScreen('mainShell');
    adminTab = 'donors';
    goToPage('home');
    updateNotifBadge();
    showToast('Welcome, ' + creds.username + '!');
    return true;
  }
  document.getElementById('loginError').textContent = 'Invalid username or password for the selected role.';
  document.getElementById('loginError').classList.remove('hidden');
  return false;
}

function performLogout() {
  clearCurrentUser();
  showScreen('loginScreen');
  document.getElementById('loginForm').reset();
  document.getElementById('loginError').classList.add('hidden');
  selectedRole = 'patient';
  document.querySelectorAll('.role-tab').forEach(function (t) {
    t.classList.toggle('active', t.dataset.role === 'patient');
  });
  showToast('Logged out successfully.');
}

/* ---------- INIT ---------- */
document.addEventListener('DOMContentLoaded', function () {
  seedIfNeeded();

  /* Role tabs */
  document.querySelectorAll('.role-tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      document.querySelectorAll('.role-tab').forEach(function (t) { t.classList.remove('active'); });
      tab.classList.add('active');
      selectedRole = tab.dataset.role;
      document.getElementById('loginError').classList.add('hidden');
    });
  });

  /* Login form */
  document.getElementById('loginForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    performLogin(username, password);
  });

  /* Logout (top bar) */
  document.getElementById('logoutBtn').addEventListener('click', performLogout);

  /* Bottom nav */
  document.querySelectorAll('.nav-btn').forEach(function (btn) {
    btn.addEventListener('click', function () { goToPage(btn.dataset.page); });
  });

  /* Notifications */
  document.getElementById('notifBtn').addEventListener('click', function () { goToPage('notifications'); });
  document.getElementById('notifBackBtn').addEventListener('click', function () { goToPage('home'); });
  document.getElementById('markAllReadBtn').addEventListener('click', function () {
    const notifs = getNotifs();
    notifs.forEach(function (n) { n.read = true; });
    saveNotifs(notifs);
    renderNotifications();
    showToast('All notifications marked as read.');
  });
  document.getElementById('notifList').addEventListener('click', handleNotifListClick);

  /* Find donor */
  document.getElementById('findSearchBtn').addEventListener('click', renderFind);
  document.getElementById('findBloodGroup').addEventListener('change', renderFind);
  document.getElementById('findCity').addEventListener('keyup', function (e) { if (e.key === 'Enter') renderFind(); });
  document.getElementById('findResults').addEventListener('click', handleFindResultsClick);

  /* Register */
  document.getElementById('registerForm').addEventListener('submit', handleRegisterSubmit);

  /* Requests */
  document.getElementById('newRequestToggle').addEventListener('click', function () {
    const form = document.getElementById('requestForm');
    const isHidden = form.classList.contains('hidden');
    if (isHidden) {
      form.classList.remove('hidden');
      this.textContent = 'Cancel';
    } else {
      form.classList.add('hidden');
      this.textContent = '+ New Emergency Request';
      resetRequestForm();
    }
  });
  document.getElementById('requestForm').addEventListener('submit', handleRequestSubmit);
  document.getElementById('requestsList').addEventListener('click', handleRequestsListClick);
  document.getElementById('requestsList').addEventListener('change', handleRequestsListChange);

  /* Home */
  document.getElementById('homeContent').addEventListener('click', handleHomeContentClick);

  /* Profile */
  document.getElementById('profileContent').addEventListener('click', handleProfileContentClick);
  document.getElementById('profileContent').addEventListener('change', handleProfileContentChange);

  /* Admin */
  document.getElementById('adminContent').addEventListener('click', handleAdminClick);
  document.getElementById('adminContent').addEventListener('change', handleAdminChange);

  /* Contact modal */
  document.getElementById('contactModalClose').addEventListener('click', closeContactModal);
  document.getElementById('contactModal').addEventListener('click', function (e) {
    if (e.target.id === 'contactModal') closeContactModal();
  });

  /* Session check */
  const cu = getCurrentUser();
  if (cu) {
    selectedRole = cu.role;
    document.querySelectorAll('.role-tab').forEach(function (t) {
      t.classList.toggle('active', t.dataset.role === cu.role);
    });
    showScreen('mainShell');
    goToPage('home');
    updateNotifBadge();
  } else {
    showScreen('loginScreen');
  }
});
