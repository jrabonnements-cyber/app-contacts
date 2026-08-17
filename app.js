// ===== CONFIGURATION =====
const API_URL = 'https://script.google.com/macros/s/AKfycbyIlrxubIgf1EheRdLFQx4BSASVmTybQ9BTphYodJ7bzdtebb_BWZdgoyHqpA1GekyJ/exec';
const APP_TOKEN = 'Ce6EstLeMotDePasseFormidaBle2026';
const GOOGLE_CLIENT_ID = '846153745463-l6bbrlkofgic40g4kaihouhnkmeqj9ho.apps.googleusercontent.com';

let currentIdToken = null;
let currentEmail = null;
let allContacts = [];

// ===== INITIALISATION GOOGLE SIGN-IN =====
window.onload = function () {
  google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: handleCredentialResponse
  });
  google.accounts.id.renderButton(
    document.getElementById('g_id_signin'),
    { theme: 'outline', size: 'medium' }
  );
};

function handleCredentialResponse(response) {
  currentIdToken = response.credential;
  const payload = JSON.parse(atob(response.credential.split('.')[1]));
  currentEmail = payload.email;

  document.getElementById('g_id_signin').classList.add('hidden');
  document.getElementById('user-info').classList.remove('hidden');
  document.getElementById('user-email').textContent = currentEmail;
  document.getElementById('app').classList.remove('hidden');

  loadContacts();
}

document.getElementById('logout-btn').addEventListener('click', () => {
  currentIdToken = null;
  currentEmail = null;
  document.getElementById('g_id_signin').classList.remove('hidden');
  document.getElementById('user-info').classList.add('hidden');
  document.getElementById('app').classList.add('hidden');
});

// ===== CHARGEMENT DES CONTACTS =====
async function loadContacts() {
  const res = await fetch(`${API_URL}?token=${APP_TOKEN}`);
  const json = await res.json();
  if (!json.success) { alert('Erreur: ' + json.error); return; }
  allContacts = json.data;
  renderList(allContacts);
}

function renderList(list) {
  const ul = document.getElementById('contact-list');
  ul.innerHTML = '';
  list.forEach(c => {
    const li = document.createElement('li');
    li.innerHTML = `<div class="nom">${escapeHtml(c.Nom)}</div>
      <div class="details">${escapeHtml(c.Telephone || '')} ${c.Email_contact ? '- ' + escapeHtml(c.Email_contact) : ''}</div>`;
    li.addEventListener('click', () => openModal(c));
    ul.appendChild(li);
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

// ===== RECHERCHE =====
document.getElementById('search-input').addEventListener('input', (e) => {
  const q = e.target.value.toLowerCase();
  const filtered = allContacts.filter(c =>
    (c.Nom || '').toLowerCase().includes(q) ||
    (c.Telephone || '').toLowerCase().includes(q)
  );
  renderList(filtered);
});

// ===== MODAL =====
const modal = document.getElementById('modal');

document.getElementById('add-btn').addEventListener('click', () => openModal(null));
document.getElementById('cancel-btn').addEventListener('click', closeModal);

function openModal(contact) {
  document.getElementById('form-error').classList.add('hidden');
  document.getElementById('admin-zone').classList.add('hidden');
  document.getElementById('input-admin-code').value = '';

  if (contact) {
    document.getElementById('modal-title').textContent = 'Modifier le contact';
    document.getElementById('contact-id').value = contact.ID;
    document.getElementById('input-nom').value = contact.Nom || '';
    document.getElementById('input-telephone').value = contact.Telephone || '';
    document.getElementById('input-email').value = contact.Email_contact || '';
    document.getElementById('delete-btn').classList.remove('hidden');

    if (contact.cree_par !== currentEmail) {
      document.getElementById('admin-zone').classList.remove('hidden');
    }
  } else {
    document.getElementById('modal-title').textContent = 'Nouveau contact';
    document.getElementById('contact-id').value = '';
    document.getElementById('input-nom').value = '';
    document.getElementById('input-telephone').value = '';
    document.getElementById('input-email').value = '';
    document.getElementById('delete-btn').classList.add('hidden');
  }
  modal.classList.remove('hidden');
}

function closeModal() {
  modal.classList.add('hidden');
}

// ===== ENREGISTRER (creation ou modification) =====
document.getElementById('save-btn').addEventListener('click', async () => {
  const id = document.getElementById('contact-id').value;
  const body = {
    token: APP_TOKEN,
    id_token: currentIdToken,
    action: id ? 'update' : 'create',
    id: id,
    nom: document.getElementById('input-nom').value,
    telephone: document.getElementById('input-telephone').value,
    email_contact: document.getElementById('input-email').value,
    admin_code: document.getElementById('input-admin-code').value
  };

  const res = await fetch(API_URL, {
    method: 'POST',
    body: JSON.stringify(body)
  });
  const json = await res.json();

  if (!json.success) {
    document.getElementById('form-error').textContent = json.error;
    document.getElementById('form-error').classList.remove('hidden');
    return;
  }
  closeModal();
  loadContacts();
});

// ===== SUPPRIMER =====
document.getElementById('delete-btn').addEventListener('click', async () => {
  if (!confirm('Supprimer ce contact ?')) return;
  const id = document.getElementById('contact-id').value;
  const body = {
    token: APP_TOKEN,
    id_token: currentIdToken,
    action: 'delete',
    id: id,
    admin_code: document.getElementById('input-admin-code').value
  };

  const res = await fetch(API_URL, {
    method: 'POST',
    body: JSON.stringify(body)
  });
  const json = await res.json();

  if (!json.success) {
    document.getElementById('form-error').textContent = json.error;
    document.getElementById('form-error').classList.remove('hidden');
    return;
  }
  closeModal();
  loadContacts();
});

// ===== SERVICE WORKER =====
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js');
}