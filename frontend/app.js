const API_BASE = window.LAND2FARM_API_BASE || "http://127.0.0.1:8000";

const endpoints = {
  users: `${API_BASE}/auth/users`,
  login: `${API_BASE}/auth/login`,
  logout: `${API_BASE}/auth/logout`,
  me: `${API_BASE}/auth/me`,
  lands: `${API_BASE}/lands`,
  bookings: `${API_BASE}/farmers/bookings`,
  crops: `${API_BASE}/farmers/crops`,
  orders: `${API_BASE}/industries/orders`,
  industryCrops: `${API_BASE}/industries/crops`,
};

const toast = document.getElementById("toast");
const sessionName = document.getElementById("session-name");
const sessionMeta = document.getElementById("session-meta");
const logoutBtn = document.getElementById("logout-btn");
const formRoles = {
  "land-form": ["landlord"],
  "booking-form": ["farmer"],
  "crop-form": ["farmer"],
  "order-form": ["industry"],
};

let session = {
  token: window.localStorage.getItem("land2farm_token"),
  user: JSON.parse(window.localStorage.getItem("land2farm_user") || "null"),
};

function showToast(message, isError = false) {
  toast.textContent = message;
  toast.classList.remove("hidden");
  toast.style.background = isError ? "#8f2d2d" : "#223626";
  window.clearTimeout(showToast.timeoutId);
  showToast.timeoutId = window.setTimeout(() => {
    toast.classList.add("hidden");
  }, 2800);
}

async function request(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (session.token) {
    headers.Authorization = `Bearer ${session.token}`;
  }

  const response = await fetch(path, {
    headers,
    ...options,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.detail || "Request failed");
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

function formToJson(form) {
  const formData = new FormData(form);
  const raw = Object.fromEntries(formData.entries());

  for (const [key, value] of Object.entries(raw)) {
    if (value === "") {
      raw[key] = null;
    }
  }

  ["landlord_id", "farmer_id", "land_id"].forEach((key) => {
    if (raw[key] !== null && raw[key] !== undefined) {
      raw[key] = Number(raw[key]);
    }
  });

  ["total_acres", "price_per_acre", "acres_requested", "expected_yield_tons", "quantity", "price"].forEach((key) => {
    if (raw[key] !== null && raw[key] !== undefined) {
      raw[key] = Number(raw[key]);
    }
  });

  return raw;
}

function persistSession() {
  if (session.token && session.user) {
    window.localStorage.setItem("land2farm_token", session.token);
    window.localStorage.setItem("land2farm_user", JSON.stringify(session.user));
    return;
  }

  window.localStorage.removeItem("land2farm_token");
  window.localStorage.removeItem("land2farm_user");
}

function updateSessionUI() {
  if (!session.user) {
    sessionName.textContent = "Not logged in";
    sessionMeta.textContent = "Login is required before using marketplace actions.";
    logoutBtn.disabled = true;
    Object.keys(formRoles).forEach((id) => {
      document.querySelectorAll(`#${id} input, #${id} select, #${id} textarea, #${id} button`).forEach((el) => {
        el.disabled = true;
      });
    });
    return;
  }

  sessionName.textContent = `${session.user.name} (#${session.user.id})`;
  sessionMeta.textContent = `${session.user.role} • ${session.user.email}`;
  logoutBtn.disabled = false;
  Object.entries(formRoles).forEach(([id, roles]) => {
    const enabled = roles.includes(session.user.role);
    document.querySelectorAll(`#${id} input, #${id} select, #${id} textarea, #${id} button`).forEach((el) => {
      el.disabled = !enabled;
    });
  });
}

function renderList(elementId, items, formatter) {
  const container = document.getElementById(elementId);
  if (!items.length) {
    container.innerHTML = `<div class="card"><strong>No data yet</strong><span class="meta">Use the forms above to add records.</span></div>`;
    return;
  }

  container.innerHTML = items.map(formatter).join("");
}

async function refreshData() {
  try {
    const requests = [request(endpoints.users), request(endpoints.lands)];
    if (session.user) {
      const cropSource = session.user.role === "industry" ? endpoints.industryCrops : endpoints.crops;
      const orderSource = session.user.role === "industry" ? endpoints.orders : null;
      requests.push(request(endpoints.bookings), request(cropSource), orderSource ? request(orderSource) : Promise.resolve([]));
    } else {
      requests.push(Promise.resolve([]), Promise.resolve([]), Promise.resolve([]));
    }

    const [users, lands, bookings, crops, orders] = await Promise.all(requests);

    renderList(
      "users-list",
      users,
      (user) => `
        <div class="card">
          <strong>#${user.id} ${user.name}</strong>
          <div class="meta">${user.role} • ${user.email}</div>
        </div>
      `,
    );

    renderList(
      "lands-list",
      lands,
      (land) => `
        <div class="card">
          <strong>#${land.id} ${land.title}</strong>
          <div class="meta">${land.location} • ${land.total_acres} acres • ${land.availability_period}</div>
        </div>
      `,
    );

    renderList(
      "bookings-list",
      bookings,
      (booking) => `
        <div class="card">
          <strong>Booking #${booking.id}</strong>
          <div class="meta">Land ${booking.land_id} • Farmer ${booking.farmer_id} • ${booking.acres_requested} acres</div>
        </div>
      `,
    );

    renderList(
      "crops-list",
      crops,
      (crop) => `
        <div class="card">
          <strong>#${crop.id} ${crop.name}</strong>
          <div class="meta">${crop.season} • ${crop.expected_yield_tons} tons expected</div>
        </div>
      `,
    );

    renderList(
      "orders-list",
      orders,
      (order) => `
        <div class="card">
          <strong>Order #${order.id}</strong>
          <div class="meta">Crop ${order.crop_id} • Qty ${order.quantity} • Price ${order.price}</div>
        </div>
      `,
    );
  } catch (error) {
    showToast(error.message, true);
  }
}

async function submitForm(formId, endpoint, method = "POST") {
  const form = document.getElementById(formId);
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const payload = formToJson(form);
      if (formId === "land-form" && session.user) {
        payload.landlord_id = session.user.id;
      }
      if ((formId === "booking-form" || formId === "crop-form") && session.user) {
        payload.farmer_id = session.user.id;
      }
      if (formId === "order-form" && session.user) {
        payload.industry_id = session.user.id;
      }

      await request(endpoint, {
        method,
        body: JSON.stringify(payload),
      });
      form.reset();
      showToast("Saved successfully.");
      refreshData();
    } catch (error) {
      showToast(error.message, true);
    }
  });
}

async function restoreSession() {
  if (!session.token) {
    updateSessionUI();
    return;
  }

  try {
    session.user = await request(endpoints.me);
    persistSession();
  } catch (error) {
    session = { token: null, user: null };
    persistSession();
  }
  updateSessionUI();
}

document.getElementById("login-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  try {
    const payload = formToJson(form);
    const result = await request(endpoints.login, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    session = {
      token: result.access_token,
      user: result.user,
    };
    persistSession();
    updateSessionUI();
    form.reset();
    showToast("Login successful.");
    refreshData();
  } catch (error) {
    showToast(error.message, true);
  }
});

logoutBtn.addEventListener("click", async () => {
  try {
    await request(endpoints.logout, { method: "POST" });
  } catch (error) {
    // Clear local state even if the server-side session is already gone.
  }
  session = { token: null, user: null };
  persistSession();
  updateSessionUI();
  showToast("Logged out.");
  refreshData();
});

submitForm("user-form", `${API_BASE}/auth/register`);
submitForm("land-form", endpoints.lands);
submitForm("booking-form", endpoints.bookings);
submitForm("crop-form", endpoints.crops);
submitForm("order-form", endpoints.orders);

document.getElementById("refresh-btn").addEventListener("click", refreshData);

restoreSession().then(refreshData);
