const API = "http://127.0.0.1:8000";

// Redirigir si ya hay sesión activa
if (localStorage.getItem("token")) {
    window.location.href = "index.html";
}

// Tema al cargar
const savedTheme = localStorage.getItem("theme") || "dark";
document.body.setAttribute("data-theme", savedTheme);
updateThemeIcon();

function toggleTheme() {
    const current = document.body.getAttribute("data-theme");
    const next = current === "dark" ? "light" : "dark";
    document.body.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
    updateThemeIcon();
}

function updateThemeIcon() {
    const icon = document.querySelector(".theme-icon");
    if (!icon) return;
    const theme = document.body.getAttribute("data-theme");
    icon.textContent = theme === "dark" ? "☀" : "☾";
}

function switchTab(tab) {
    const tabLogin = document.getElementById("tab-login");
    const tabReg = document.getElementById("tab-register");
    const formLogin = document.getElementById("login-form");
    const formReg = document.getElementById("register-form");

    if (tab === "login") {
        tabLogin.classList.add("active");
        tabReg.classList.remove("active");
        formLogin.classList.remove("hidden");
        formReg.classList.add("hidden");
        document.getElementById("login-username").focus();
    } else {
        tabReg.classList.add("active");
        tabLogin.classList.remove("active");
        formReg.classList.remove("hidden");
        formLogin.classList.add("hidden");
        document.getElementById("reg-username").focus();
    }
}

async function login() {
    const username = document.getElementById("login-username").value.trim();
    const password = document.getElementById("login-password").value;
    const errorEl = document.getElementById("login-error");

    errorEl.classList.add("hidden");

    if (!username || !password) {
        showMsg(errorEl, "Por favor completa todos los campos");
        return;
    }

    const btn = document.querySelector("#login-form .btn-submit");
    btn.disabled = true;
    btn.querySelector("span").textContent = "Entrando...";

    try {
        const formData = new FormData();
        formData.append("username", username);
        formData.append("password", password);

        const res = await fetch(`${API}/users/login`, {
            method: "POST",
            body: formData
        });

        const data = await res.json();

        if (!res.ok) {
            showMsg(errorEl, data.detail || "Usuario o contraseña incorrectos");
            return;
        }

        localStorage.setItem("token", data.access_token);
        localStorage.setItem("username", username);
        window.location.href = "index.html";

    } catch {
        showMsg(errorEl, "No se pudo conectar con el servidor");
    } finally {
        btn.disabled = false;
        btn.querySelector("span").textContent = "Entrar";
    }
}

async function register() {
    const username = document.getElementById("reg-username").value.trim();
    const email = document.getElementById("reg-email").value.trim();
    const password = document.getElementById("reg-password").value;
    const errorEl = document.getElementById("register-error");
    const successEl = document.getElementById("register-success");

    errorEl.classList.add("hidden");
    successEl.classList.add("hidden");

    if (!username || !email || !password) {
        showMsg(errorEl, "Por favor completa todos los campos");
        return;
    }

    if (password.length < 6) {
        showMsg(errorEl, "La contraseña debe tener mínimo 6 caracteres");
        return;
    }

    const btn = document.querySelector("#register-form .btn-submit");
    btn.disabled = true;
    btn.querySelector("span").textContent = "Creando...";

    try {
        const res = await fetch(`${API}/users/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, email, password })
        });

        const data = await res.json();

        if (!res.ok) {
            showMsg(errorEl, data.detail || "Error al registrarse");
            return;
        }

        showMsg(successEl, "¡Cuenta creada! Iniciando sesión...", false);

        setTimeout(() => {
            document.getElementById("reg-username").value = "";
            document.getElementById("reg-email").value = "";
            document.getElementById("reg-password").value = "";
            switchTab("login");
            document.getElementById("login-username").value = username;
        }, 1200);

    } catch {
        showMsg(errorEl, "No se pudo conectar con el servidor");
    } finally {
        btn.disabled = false;
        btn.querySelector("span").textContent = "Crear cuenta";
    }
}

function showMsg(el, text, isError = true) {
    el.textContent = text;
    el.className = `msg ${isError ? "error" : "success"}`;
    el.classList.remove("hidden");
}

// Enter para enviar
document.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    const loginVisible = !document.getElementById("login-form").classList.contains("hidden");
    loginVisible ? login() : register();
});