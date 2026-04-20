const state = {
  config: null,
  activeModal: null,
  wardPlanLoaded: false,
  submittingSignup: false
};

const refs = {
  mapContainer: document.getElementById('mapContainer'),
  configError: document.getElementById('configError'),
  openSignup: document.getElementById('openSignup'),
  openInfo: document.getElementById('openInfo'),
  signupModal: document.getElementById('signupModal'),
  infoModal: document.getElementById('infoModal'),
  signupContent: document.getElementById('signupContent'),
  wardPlanContent: document.getElementById('wardPlanContent')
};

function showConfigError(message) {
  refs.configError.textContent = message;
  refs.configError.hidden = false;
}

function openModal(modal) {
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  state.activeModal = modal;
}

function closeModal(modal) {
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  if (state.activeModal === modal) state.activeModal = null;
}

function sanitizeHTML(rawHTML) {
  const parser = new DOMParser();
  const parsed = parser.parseFromString(rawHTML, 'text/html');

  parsed.querySelectorAll('script, style, link, meta, iframe, object, embed, form, button, input, textarea, select').forEach((node) => node.remove());

  // Remove common Google Docs published-page chrome
  parsed.querySelectorAll([
    '#header',
    '#footer',
    '.docs-titlebar',
    '.docs-texteventtarget-iframe',
    '.ndfHFb-c4YZDc-Wrql6b',
    '.doc-content + div',
    '[aria-label="Google Docs"]'
  ].join(',')).forEach((node) => node.remove());

  // Remove obvious text-only junk blocks Google adds
  const junkPhrases = [
    'Published using Google Docs',
    'Report abuse',
    'Learn more',
    'Updated automatically every 5 minutes'
  ];

  Array.from(parsed.body.querySelectorAll('*')).forEach((node) => {
    const text = (node.textContent || '').trim();
    if (junkPhrases.includes(text)) {
      node.remove();
    }
  });

  // If Google Docs wrapper exists, prefer the actual document content
  const docContent =
    parsed.querySelector('.doc-content') ||
    parsed.querySelector('#contents') ||
    parsed.body;

  const workingRoot = docContent.cloneNode(true);

  const allowedTags = new Set([
    'div', 'section', 'article', 'header', 'main', 'footer',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'br', 'hr', 'strong', 'em', 'b', 'i', 'u',
    'ul', 'ol', 'li', 'blockquote', 'code', 'pre',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'a', 'span'
  ]);

  const allowedAttrs = new Set(['href', 'title', 'target', 'rel', 'colspan', 'rowspan']);

  const allNodes = Array.from(workingRoot.querySelectorAll('*'));
  for (const node of allNodes) {
    const tag = node.tagName.toLowerCase();

    if (!allowedTags.has(tag)) {
      node.replaceWith(...node.childNodes);
      continue;
    }

    for (const attr of Array.from(node.attributes)) {
      const key = attr.name.toLowerCase();
      const value = attr.value || '';
      const isUnsafeLink = key === 'href' && /^\s*javascript:/i.test(value);

      if (key.startsWith('on') || !allowedAttrs.has(key) || isUnsafeLink) {
        node.removeAttribute(attr.name);
      }
    }

    if (tag === 'a') {
      node.setAttribute('target', '_blank');
      node.setAttribute('rel', 'noopener noreferrer');
    }
  }

  const fragment = document.createDocumentFragment();
  Array.from(workingRoot.childNodes).forEach((node) => {
    fragment.appendChild(node.cloneNode(true));
  });

  return fragment;
}

function renderMap(mapAsset) {
  refs.mapContainer.innerHTML = '';

  if (!mapAsset) {
    refs.mapContainer.innerHTML = '<p class="loading">No map asset is configured.</p>';
    return;
  }

  const normalized = mapAsset.trim().toLowerCase();
  const isHtmlAsset = normalized.endsWith('.html') || normalized.endsWith('/');
  const isImage = /\.(png|jpg|jpeg|gif|webp|avif|svg)$/.test(normalized);

  if (isHtmlAsset) {
    const iframe = document.createElement('iframe');
    iframe.className = 'map-frame';
    iframe.src = mapAsset;
    iframe.title = 'Ward emergency map';
    refs.mapContainer.appendChild(iframe);
    return;
  }

  if (isImage) {
    if (normalized.endsWith('.svg')) {
      const object = document.createElement('object');
      object.className = 'map-object';
      object.data = mapAsset;
      object.type = 'image/svg+xml';
      object.setAttribute('aria-label', 'Ward emergency map');
      refs.mapContainer.appendChild(object);
      return;
    }

    const img = document.createElement('img');
    img.className = 'map-image';
    img.src = mapAsset;
    img.alt = 'Ward emergency map';
    refs.mapContainer.appendChild(img);
    return;
  }

  refs.mapContainer.innerHTML = `<p class="loading">Unsupported map asset path: <code>${mapAsset}</code></p>`;
}

function normalizeWhitespace(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function setSignupStatus(message, tone = 'info') {
  const statusEl = document.getElementById('signupStatus');
  if (!statusEl) return;

  statusEl.textContent = message;
  statusEl.classList.remove('is-hidden', 'signup-status--success', 'signup-status--error', 'signup-status--info');
  statusEl.classList.add(`signup-status--${tone}`);
}

function clearSignupStatus() {
  const statusEl = document.getElementById('signupStatus');
  if (!statusEl) return;

  statusEl.textContent = '';
  statusEl.classList.add('is-hidden');
  statusEl.classList.remove('signup-status--success', 'signup-status--error', 'signup-status--info');
}

function getSignupPayload(formEl) {
  const formData = new FormData(formEl);
  const streetAddress = normalizeWhitespace(formData.get('street_address'));
  const address = streetAddress;

  return {
    full_name: normalizeWhitespace(formData.get('full_name')),
    street_address: streetAddress,
    address,
    phone: normalizeWhitespace(formData.get('phone'))
  };
}

function validateSignupPayload(payload) {
  const missingFields = [];
  if (!payload.full_name) missingFields.push('Full name');
  if (!payload.street_address) missingFields.push('Street address');
  if (!payload.phone) missingFields.push('Phone');

  if (missingFields.length > 0) {
    return `Please fill out all required fields: ${missingFields.join(', ')}.`;
  }

  return null;
}

async function submitSignup(payload, signupConfig) {
  const endpointURL = signupConfig?.endpoint_url?.trim();
  if (!endpointURL) {
    throw new Error('Sign-up endpoint URL is missing. Add signup_form.endpoint_url in config.json.');
  }

  const formBody = new URLSearchParams();
  formBody.append('full_name', payload.full_name);
  formBody.append('address', payload.address);
  formBody.append('phone', payload.phone);
  formBody.append('sheet_tab_name', signupConfig.sheet_tab_name || 'House List');

  const response = await fetch(endpointURL, {
    method: 'POST',
    body: formBody
  });

  const responseText = await response.text();

  let responseJSON = null;
  try {
    responseJSON = responseText ? JSON.parse(responseText) : null;
  } catch (error) {
    responseJSON = null;
  }

  if (!response.ok) {
    throw new Error(responseJSON?.message || responseText || `Request failed (${response.status})`);
  }

  return responseJSON;
}

function renderSignupResult(result) {
  if (!result) {
    setSignupStatus('Sign-up submitted successfully.', 'success');
    return;
  }

  if (typeof result.message === 'string' && result.message.trim()) {
    const tone = result.success === false ? 'error' : 'success';
    setSignupStatus(result.message, tone);
    return;
  }

  if (result.queued_for_review) {
    setSignupStatus('Your sign-up was received and queued for review due to a data conflict.', 'info');
    return;
  }

  setSignupStatus('Sign-up submitted successfully.', 'success');
}

function renderSignupForm(signupForm) {
  refs.signupContent.innerHTML = '';

  const sourceType = signupForm?.source_type?.trim();
  if (sourceType !== 'apps_script_endpoint') {
    refs.signupContent.innerHTML = '<p class="loading">Unsupported sign-up source type in config.</p>';
    return;
  }

  refs.signupContent.innerHTML = `
    <form id="signupForm" class="signup-form" novalidate>
      <label class="form-field">
        <span>Full name *</span>
        <input type="text" name="full_name" autocomplete="name" required>
      </label>

      <label class="form-field">
        <span>Street address *</span>
        <input type="text" name="street_address" autocomplete="street-address" required>
      </label>

      <label class="form-field">
        <span>Phone *</span>
        <input type="tel" name="phone" autocomplete="tel" required>
      </label>

      <button id="signupSubmit" class="action-btn" type="submit">Submit</button>
      <p id="signupStatus" class="signup-status is-hidden" role="status" aria-live="polite"></p>
    </form>
  `;

  const formEl = document.getElementById('signupForm');
  const submitBtn = document.getElementById('signupSubmit');

  formEl.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearSignupStatus();

    if (state.submittingSignup) return;

    const payload = getSignupPayload(formEl);
    formEl.full_name.value = payload.full_name;
    formEl.street_address.value = payload.street_address;
    formEl.phone.value = payload.phone;

    const validationMessage = validateSignupPayload(payload);
    if (validationMessage) {
      setSignupStatus(validationMessage, 'error');
      return;
    }

    state.submittingSignup = true;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting…';

    try {
      const result = await submitSignup(payload, signupForm);
      renderSignupResult(result);
      formEl.reset();
    } catch (error) {
      setSignupStatus(`Sign-up failed: ${error.message}`, 'error');
    } finally {
      state.submittingSignup = false;
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit';
    }
  });
}

async function fetchWardPlanHTML(planConfig) {
  if (!planConfig?.url) throw new Error('Ward plan URL is missing in config.json');

  if (planConfig.source_type === 'google_doc_html' || planConfig.source_type === 'local_html') {
    const separator = planConfig.url.includes('?') ? '&' : '?';
    const freshURL = `${planConfig.url}${separator}_=${Date.now()}`;
    const response = await fetch(freshURL, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Failed to fetch ward plan (${response.status})`);
    return response.text();
  }

  throw new Error(`Unsupported ward_plan source type: ${planConfig.source_type}`);
}

async function loadWardPlan() {
  refs.wardPlanContent.innerHTML = '<p class="loading">Loading ward plan…</p>';

  try {
    const html = await fetchWardPlanHTML(state.config.ward_plan);
    const clean = sanitizeHTML(html);
    refs.wardPlanContent.innerHTML = '';
    refs.wardPlanContent.appendChild(clean);
  } catch (error) {
    refs.wardPlanContent.innerHTML = `
      <p>We could not load the ward emergency response plan right now.</p>
      <p><strong>Details:</strong> ${error.message}</p>
    `;
  }
}

async function loadConfig() {
  const response = await fetch('./config.json', { cache: 'no-store' });
  if (!response.ok) throw new Error(`Could not load config.json (${response.status})`);
  return response.json();
}

async function bootstrap() {
  try {
    state.config = await loadConfig();
  } catch (error) {
    showConfigError(`Configuration error: ${error.message}. Add a valid config.json file (you can copy config.json.example).`);
    refs.mapContainer.innerHTML = '<p class="loading">Map unavailable until config is fixed.</p>';
    refs.wardPlanContent.innerHTML = '<p class="loading">Ward plan unavailable until config is fixed.</p>';
    refs.signupContent.innerHTML = '<p class="loading">Sign-up form unavailable until config is fixed.</p>';
    return;
  }

  document.title = state.config.site_title || document.title;
  renderMap(state.config.map_asset);
  renderSignupForm(state.config.signup_form);
}

refs.openSignup.addEventListener('click', () => openModal(refs.signupModal));
refs.openInfo.addEventListener('click', async () => {
  openModal(refs.infoModal);
  await loadWardPlan();
});

document.addEventListener('click', (event) => {
  const closeTarget = event.target.closest('[data-close-modal]');
  if (!closeTarget) return;
  const id = closeTarget.getAttribute('data-close-modal');
  const modal = document.getElementById(id);
  if (modal) closeModal(modal);
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && state.activeModal) closeModal(state.activeModal);
});

bootstrap();
