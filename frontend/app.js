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

const routeByRole = {
  farmer: "/dashboard/farmer",
  landlord: "/dashboard/landlord",
  industry: "/dashboard/buyer",
};

const dashboardCopy = {
  farmer: {
    title: "Farmer Dashboard",
    subtitle: "Manage crop plans, track your bookings, and scan the best land opportunities.",
    actionTitle: "Publish a crop plan or rent land",
    feedOneTitle: "Available Land",
    feedTwoTitle: "My Farming Activity",
    insightTitle: "Farmer Insights",
    insights: [
      "Use this dashboard to compare open land before booking a seasonal cycle.",
      "Publishing crop plans early helps buyers see your expected yield sooner.",
      "Track your own bookings and crop pipeline from one place.",
    ],
  },
  landlord: {
    title: "Landlord Dashboard",
    subtitle: "Publish land inventory, track demand, and monitor leasing activity.",
    actionTitle: "Publish land with lease duration and seasonal cycle",
    feedOneTitle: "My Land Listings",
    feedTwoTitle: "Marketplace Bookings",
    insightTitle: "Landlord Insights",
    insights: [
      "Keep location and acreage clear so farmers can evaluate listings quickly.",
      "Availability cycles are easiest to convert when they match seasonal planning windows.",
      "Use pricing and description fields to position premium or well-serviced land.",
      "Lease duration and Jan-Jun or Jul-Dec cycle together help farmers judge fit faster.",
    ],
  },
  industry: {
    title: "Buyer Dashboard",
    subtitle: "Review crop supply, place purchase orders, and keep agro procurement moving.",
    actionTitle: "Place a crop purchase order",
    feedOneTitle: "Available Crops",
    feedTwoTitle: "My Orders",
    insightTitle: "Buyer Insights",
    insights: [
      "Use crop listings to compare expected yield before sending offers.",
      "Orders stay tied to your account, so procurement tracking stays clean.",
      "The support panel on the right is there for account, marketplace, and onboarding help.",
    ],
  },
};

const state = {
  token: window.localStorage.getItem("land2farm_token"),
  user: JSON.parse(window.localStorage.getItem("land2farm_user") || "null"),
  data: {
    users: [],
    lands: [],
    bookings: [],
    crops: [],
    orders: [],
  },
};

const toast = document.getElementById("toast");
const landingView = document.getElementById("landing-view");
const dashboardView = document.getElementById("dashboard-view");
const dashboardTitle = document.getElementById("dashboard-title");
const dashboardSubtitle = document.getElementById("dashboard-subtitle");
const dashboardRoute = document.getElementById("dashboard-route");
const authTitle = document.getElementById("auth-title");
const authCopy = document.getElementById("auth-copy");
const showLoginBtn = document.getElementById("show-login-btn");
const showSignupBtn = document.getElementById("show-signup-btn");
const inlineShowSignupBtn = document.getElementById("inline-show-signup-btn");
const inlineShowLoginBtn = document.getElementById("inline-show-login-btn");
const forgotPasswordBtn = document.getElementById("forgot-password-btn");
const loginForm = document.getElementById("login-form");
const userForm = document.getElementById("user-form");
const leaseDurationSelect = document.getElementById("lease-duration-select");
const leaseCycleSelect = document.getElementById("lease-cycle-select");
const startMonthSelect = document.getElementById("start-month-select");
const sessionName = document.getElementById("session-name");
const sessionMeta = document.getElementById("session-meta");
const roleBadge = document.getElementById("role-badge");
const actionTitle = document.getElementById("action-title");
const feedOneTitle = document.getElementById("feed-one-title");
const feedTwoTitle = document.getElementById("feed-two-title");
const insightTitle = document.getElementById("insight-title");
const insightList = document.getElementById("insight-list");
const statPrimary = document.getElementById("stat-primary");
const statSecondary = document.getElementById("stat-secondary");
const statTertiary = document.getElementById("stat-tertiary");
const statPrimaryCopy = document.getElementById("stat-primary-copy");
const statSecondaryCopy = document.getElementById("stat-secondary-copy");
const statTertiaryCopy = document.getElementById("stat-tertiary-copy");

const actionForms = {
  farmer: ["booking-form", "crop-form"],
  landlord: ["land-form"],
  industry: ["order-form"],
};

function setAuthMode(mode) {
  const isLogin = mode === "login";
  loginForm.classList.toggle("hidden", !isLogin);
  userForm.classList.toggle("hidden", isLogin);
  showLoginBtn.classList.toggle("active", isLogin);
  showSignupBtn.classList.toggle("active", !isLogin);
  authTitle.textContent = isLogin ? "Sign In" : "Sign Up";
  authCopy.textContent = isLogin
    ? "Continue to your role dashboard with your existing account."
    : "Create a farmer, landlord, or buyer account to unlock your dashboard.";
}

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
  if (state.token) {
    headers.Authorization = `Bearer ${state.token}`;
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

function persistSession() {
  if (state.token && state.user) {
    window.localStorage.setItem("land2farm_token", state.token);
    window.localStorage.setItem("land2farm_user", JSON.stringify(state.user));
    return;
  }

  window.localStorage.removeItem("land2farm_token");
  window.localStorage.removeItem("land2farm_user");
}

function formToJson(form) {
  const raw = Object.fromEntries(new FormData(form).entries());
  Object.keys(raw).forEach((key) => {
    if (raw[key] === "") {
      raw[key] = null;
    }
  });

  ["landlord_id", "farmer_id", "land_id", "industry_id", "crop_id"].forEach((key) => {
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

function updateLeaseFields() {
  if (!leaseDurationSelect || !leaseCycleSelect || !startMonthSelect) {
    return;
  }

  const isShortLease = leaseDurationSelect.value === "less-than-1";
  leaseCycleSelect.classList.toggle("hidden", !isShortLease);
  startMonthSelect.classList.toggle("hidden", isShortLease);

  leaseCycleSelect.required = isShortLease;
  startMonthSelect.required = !isShortLease;

  if (isShortLease) {
    startMonthSelect.value = "";
  } else {
    leaseCycleSelect.value = "";
  }
}

function currentDashboardRole() {
  if (!state.user) {
    return null;
  }
  return state.user.role;
}

function navigate(path, replace = false) {
  if (replace) {
    window.history.replaceState({}, "", path);
  } else {
    window.history.pushState({}, "", path);
  }
  renderApp();
}

function roleFromPath(pathname) {
  if (pathname === "/dashboard/farmer") return "farmer";
  if (pathname === "/dashboard/landlord") return "landlord";
  if (pathname === "/dashboard/buyer") return "industry";
  return null;
}

function renderList(elementId, items, formatter, emptyMessage) {
  const container = document.getElementById(elementId);
  if (!items.length) {
    container.innerHTML = `<div class="card"><strong>No data yet</strong><span class="meta">${emptyMessage}</span></div>`;
    return;
  }
  container.innerHTML = items.map(formatter).join("");
}

function formatLease(item) {
  let durationLabel = "Less than 1 year";
  if (item.lease_duration === "more-than-5") {
    durationLabel = "More than 5 years";
  } else if (item.lease_duration !== "less-than-1") {
    durationLabel = `${item.lease_duration} year${item.lease_duration === "1" ? "" : "s"}`;
  }

  if (item.lease_duration === "less-than-1") {
    return `${durationLabel} • ${item.availability_period}`;
  }
  return `${durationLabel} • Starts in ${item.start_month}`;
}

function updateInsights(role) {
  const config = dashboardCopy[role];
  insightTitle.textContent = config.insightTitle;
  insightList.innerHTML = config.insights
    .map(
      (item) => `
        <article class="insight-item">
          <strong>${config.title}</strong>
          <p class="meta">${item}</p>
        </article>
      `,
    )
    .join("");
}

function visibleActionForms(role) {
  document.querySelectorAll("#dashboard-view form").forEach((form) => form.classList.add("hidden"));
  actionForms[role].forEach((id) => document.getElementById(id).classList.remove("hidden"));
}

function dashboardMetrics(role) {
  const { lands, bookings, crops, orders, users } = state.data;

  if (role === "farmer") {
    const myBookings = bookings.filter((item) => item.farmer_id === state.user.id);
    const myCrops = crops.filter((item) => item.farmer_id === state.user.id);
    return {
      primary: String(myBookings.length + myCrops.length),
      primaryCopy: "Bookings plus crop plans linked to your account",
      secondary: String(lands.filter((item) => item.is_available).length),
      secondaryCopy: "Open land listings available to review",
      tertiary: String(users.filter((item) => item.role === "industry").length),
      tertiaryCopy: "Active buyers on the platform",
    };
  }

  if (role === "landlord") {
    const myLands = lands.filter((item) => item.landlord_id === state.user.id);
    return {
      primary: String(myLands.length),
      primaryCopy: "Land listings published under your account",
      secondary: String(myLands.filter((item) => item.is_available).length),
      secondaryCopy: "Listings still open for leasing",
      tertiary: String(bookings.length),
      tertiaryCopy: "Bookings visible in the active market",
    };
  }

  return {
    primary: String(orders.length),
    primaryCopy: "Orders currently linked to your buyer account",
    secondary: String(crops.length),
    secondaryCopy: "Crop opportunities available for review",
    tertiary: String(users.filter((item) => item.role === "farmer").length),
    tertiaryCopy: "Farmers active on the platform",
  };
}

function updateStats(role) {
  const metrics = dashboardMetrics(role);
  statPrimary.textContent = metrics.primary;
  statPrimaryCopy.textContent = metrics.primaryCopy;
  statSecondary.textContent = metrics.secondary;
  statSecondaryCopy.textContent = metrics.secondaryCopy;
  statTertiary.textContent = metrics.tertiary;
  statTertiaryCopy.textContent = metrics.tertiaryCopy;
}

function renderDashboardFeeds(role) {
  const { lands, bookings, crops, orders } = state.data;

  if (role === "farmer") {
    renderList(
      "feed-one",
      lands.filter((item) => item.is_available),
      (item) => `<div class="card"><strong>${item.title}</strong><div class="meta">${item.location} • ${item.total_acres} acres • ${formatLease(item)}</div></div>`,
      "Available land listings will appear here.",
    );
    renderList(
      "feed-two",
      [
        ...bookings
          .filter((item) => item.farmer_id === state.user.id)
          .map((item) => ({ title: `Booking #${item.id}`, copy: `Land ${item.land_id} • ${item.status}` })),
        ...crops
          .filter((item) => item.farmer_id === state.user.id)
          .map((item) => ({ title: item.name, copy: `${item.season} • ${item.expected_yield_tons} tons expected` })),
      ],
      (item) => `<div class="card"><strong>${item.title}</strong><div class="meta">${item.copy}</div></div>`,
      "Your bookings and crop plans will appear here.",
    );
    return;
  }

  if (role === "landlord") {
    renderList(
      "feed-one",
      lands.filter((item) => item.landlord_id === state.user.id),
      (item) => `<div class="card"><strong>${item.title}</strong><div class="meta">${item.location} • ${item.total_acres} acres • ${formatLease(item)} • ${item.is_available ? "Available" : "Booked"}</div></div>`,
      "Your land listings will appear here.",
    );
    renderList(
      "feed-two",
      bookings,
      (item) => `<div class="card"><strong>Booking #${item.id}</strong><div class="meta">Land ${item.land_id} • Farmer ${item.farmer_id} • ${item.status}</div></div>`,
      "Active bookings will appear here.",
    );
    return;
  }

  renderList(
    "feed-one",
    crops,
    (item) => `<div class="card"><strong>${item.name}</strong><div class="meta">${item.season} • ${item.expected_yield_tons} tons expected</div></div>`,
    "Crop opportunities will appear here.",
  );
  renderList(
    "feed-two",
    orders,
    (item) => `<div class="card"><strong>Order #${item.id}</strong><div class="meta">Crop ${item.crop_id} • Qty ${item.quantity} • ${item.status}</div></div>`,
    "Your crop purchase orders will appear here.",
  );
}

function renderDashboard() {
  const role = currentDashboardRole();
  const config = dashboardCopy[role];

  dashboardTitle.textContent = config.title;
  dashboardSubtitle.textContent = config.subtitle;
  dashboardRoute.textContent = routeByRole[role];
  sessionName.textContent = state.user.name;
  sessionMeta.textContent = `${state.user.email} • ${state.user.role}`;
  roleBadge.textContent = state.user.role === "industry" ? "Buyer Account" : `${state.user.role} account`;
  actionTitle.textContent = config.actionTitle;
  feedOneTitle.textContent = config.feedOneTitle;
  feedTwoTitle.textContent = config.feedTwoTitle;

  updateInsights(role);
  visibleActionForms(role);
  updateStats(role);
  renderDashboardFeeds(role);
}

function renderApp() {
  const requestedRole = roleFromPath(window.location.pathname);
  const loggedInRole = currentDashboardRole();

  if (!loggedInRole) {
    landingView.classList.remove("hidden");
    dashboardView.classList.add("hidden");
    if (requestedRole) {
      navigate("/", true);
    }
    return;
  }

  const expectedPath = routeByRole[loggedInRole];
  if (window.location.pathname !== expectedPath) {
    navigate(expectedPath, true);
    return;
  }

  landingView.classList.add("hidden");
  dashboardView.classList.remove("hidden");
  renderDashboard();
}

async function refreshData() {
  try {
    const requests = [request(endpoints.users), request(endpoints.lands)];

    if (state.user) {
      if (state.user.role === "industry") {
        requests.push(Promise.resolve([]), request(endpoints.industryCrops), request(endpoints.orders));
      } else {
        requests.push(request(endpoints.bookings), request(endpoints.crops), Promise.resolve([]));
      }
    } else {
      requests.push(Promise.resolve([]), Promise.resolve([]), Promise.resolve([]));
    }

    const [users, lands, bookings, crops, orders] = await Promise.all(requests);
    state.data = { users, lands, bookings, crops, orders };
    if (state.user) {
      renderDashboard();
    }
  } catch (error) {
    showToast(error.message, true);
  }
}

async function restoreSession() {
  if (!state.token) {
    renderApp();
    return;
  }

  try {
    state.user = await request(endpoints.me);
    persistSession();
  } catch (error) {
    state.token = null;
    state.user = null;
    persistSession();
  }

  renderApp();
}

function wireForm(formId, endpoint, enrichPayload) {
  const form = document.getElementById(formId);
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const payload = enrichPayload(formToJson(form));
      await request(endpoint, {
        method: "POST",
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

userForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  try {
    await request(`${API_BASE}/auth/register`, {
      method: "POST",
      body: JSON.stringify(formToJson(form)),
    });
    form.reset();
    setAuthMode("login");
    showToast("Account created successfully. You can sign in now.");
  } catch (error) {
    showToast(error.message, true);
  }
});

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  try {
    const result = await request(endpoints.login, {
      method: "POST",
      body: JSON.stringify(formToJson(form)),
    });
    state.token = result.access_token;
    state.user = result.user;
    persistSession();
    form.reset();
    navigate(routeByRole[state.user.role]);
    showToast("Login successful.");
    refreshData();
  } catch (error) {
    showToast(error.message, true);
  }
});

showLoginBtn.addEventListener("click", () => setAuthMode("login"));
showSignupBtn.addEventListener("click", () => setAuthMode("signup"));
inlineShowSignupBtn.addEventListener("click", () => setAuthMode("signup"));
inlineShowLoginBtn.addEventListener("click", () => setAuthMode("login"));
forgotPasswordBtn.addEventListener("click", () => {
  showToast("Password reset can be added next. For now, please contact support or create a new test account.");
});

document.getElementById("logout-btn").addEventListener("click", async () => {
  try {
    await request(endpoints.logout, { method: "POST" });
  } catch (error) {
    // Clear local session even if backend session is already gone.
  }
  state.token = null;
  state.user = null;
  state.data = { users: [], lands: [], bookings: [], crops: [], orders: [] };
  persistSession();
  navigate("/", true);
  showToast("Logged out.");
});

document.getElementById("back-home-btn").addEventListener("click", () => navigate("/"));
document.getElementById("refresh-btn").addEventListener("click", refreshData);
window.addEventListener("popstate", renderApp);

wireForm("land-form", endpoints.lands, (payload) => ({ ...payload, landlord_id: state.user.id }));
wireForm("booking-form", endpoints.bookings, (payload) => ({ ...payload, farmer_id: state.user.id }));
wireForm("crop-form", endpoints.crops, (payload) => ({ ...payload, farmer_id: state.user.id }));
wireForm("order-form", endpoints.orders, (payload) => ({ ...payload, industry_id: state.user.id }));

restoreSession().then(refreshData);
setAuthMode("login");
updateLeaseFields();

if (leaseDurationSelect) {
  leaseDurationSelect.addEventListener("change", updateLeaseFields);
}
