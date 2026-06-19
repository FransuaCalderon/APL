const BFF = "https://localhost:5443";
let user = null;            // /api/me (claims SAML)
let usuarios = [];          // resultado de /api/consultar-usuario (lista de Columns)
let legacyUser = null;      // usuario seleccionado en el combo (+ datos de obtener-usuario)
let accesos = [];           // resultado de /api/accesos (lista de Columns)
let dropdownOpen = false;

// Carga inicial: ¿hay sesión?
$(function () {
    loadUser();
});

function loadUser() {
    $.ajax({
        url: BFF + "/api/me",
        method: "GET",
        xhrFields: { withCredentials: true }
    })
        .done(function (data) {
            user = data;
            // Ya autenticado en Azure: consultamos el usuario legado por email.
            consultarUsuario();
        })
        .fail(function () {
            showLogin();
        });
}

// PASO 1: con la sesión SAML activa, obtener el usuario legado por email.
function consultarUsuario() {
    $("#app").html(spinner("Consultando usuario..."));
    $.ajax({
        url: BFF + "/api/consultar-usuario",
        method: "GET",
        xhrFields: { withCredentials: true }
    })
        .done(function (lista) {
            usuarios = lista || [];
            if (usuarios.length === 0) {
                showError("No se encontró un usuario para el email.");
            } else {
                showStep2();
            }
        })
        .fail(function (xhr) {
            showError("No se pudo consultar el usuario.", xhr);
        });
}

function showLogin() {
    const html = `
    <div class="login-wrap">
        <div class="login-card">
            <div class="brand">
                <div class="badge-bm">BM</div>
                <h1>APL System</h1>
            </div>

            <form id="loginForm">
                <div class="mb-3">
                    <label class="form-label">País</label>
                    <select class="form-select" disabled>
                        <option selected>EC - Ecuador</option>
                    </select>
                </div>

                <div class="mb-3">
                    <label class="form-label">Empresa</label>
                    <input type="text" class="form-control" value="Artefacta" disabled />
                </div>

                <button type="submit" class="btn btn-primary btn-ingresar w-100">Iniciar sesión</button>
            </form>
        </div>
    </div>`;

    $("#app").html(html);

    $("#loginForm").on("submit", function (e) {
        e.preventDefault();
        // Dispara el login SAML contra Azure.
        login();
    });
}

// PASO 2: segunda pantalla con el usuario legado en combo + contraseña.
function showStep2() {
    const options = usuarios.map(function (u) {
        return `<option value="${escapeAttr(u.CodigoUsuario)}">${escapeHtml(u.NombreUsuario)}</option>`;
    }).join("");

    const html = `
    <div class="login-wrap">
        <div class="login-card">
            <div class="brand">
                <div class="badge-bm">BM</div>
                <h1>APL System</h1>
            </div>

            <form id="step2Form">
                <div class="mb-3">
                    <label class="form-label">País</label>
                    <select class="form-select" disabled>
                        <option selected>EC - Ecuador</option>
                    </select>
                </div>

                <div class="mb-3">
                    <label class="form-label">Empresa</label>
                    <input type="text" class="form-control" value="Artefacta" disabled />
                </div>

                <div class="mb-3">
                    <label class="form-label">Usuario</label>
                    <select id="usuario" class="form-select">
                        ${options}
                    </select>
                </div>

                <div class="mb-4">
                    <label class="form-label">Contraseña</label>
                    <input id="password" type="password" class="form-control" autocomplete="current-password" required />
                </div>

                <div id="step2Error" class="alert alert-danger py-2 d-none"></div>

                <button type="submit" class="btn btn-primary btn-ingresar w-100">Ingresar</button>
            </form>
        </div>
    </div>`;

    $("#app").html(html);

    $("#step2Form").on("submit", function (e) {
        e.preventDefault();
        const codigo = $("#usuario").val();
        const password = $("#password").val();
        legacyUser = usuarios.find(function (u) { return String(u.CodigoUsuario) === String(codigo); }) || null;
        obtenerUsuario(codigo, password);
    });
}

// PASO 3: validar credenciales contra el legado (password se hashea en el server).
function obtenerUsuario(codigoUsuario, password) {
    $("#step2Error").addClass("d-none");
    const $btn = $("#step2Form button[type=submit]").prop("disabled", true).text("Validando...");

    console.log("obtener-usuario → enviando uslogin (CodigoUsuario):", codigoUsuario);

    $.ajax({
        url: BFF + "/api/obtener-usuario",
        method: "POST",
        contentType: "application/json",
        xhrFields: { withCredentials: true },
        data: JSON.stringify({ codigoUsuario: codigoUsuario, password: password })
    })
        .done(function (columns) {
            // columns.UsuarioID es lo que nos interesa para cargar los accesos.
            legacyUser = $.extend({}, legacyUser, columns);
            cargarAccesos(legacyUser.UsuarioID);
        })
        .fail(function (xhr) {
            const json = xhr.responseJSON;
            const msg = (json && json.error) || "Usuario o contraseña inválidos.";
            const raw = (json && json.raw) || "";
            if (raw) console.log("Respuesta legado (obtener-usuario):", raw);
            $("#step2Error")
                .html(escapeHtml(msg) + (raw ? `<details class="mt-2"><summary>Detalle</summary><pre style="white-space:pre-wrap;margin:0">${escapeHtml(raw)}</pre></details>` : ""))
                .removeClass("d-none");
            $btn.prop("disabled", false).text("Ingresar");
        });
}

// PASO 4: con el UsuarioID, cargar la lista de accesos/opciones del usuario.
function cargarAccesos(usuarioId) {
    $("#app").html(spinner("Cargando accesos..."));
    $.ajax({
        url: BFF + "/api/accesos",
        method: "POST",
        contentType: "application/json",
        xhrFields: { withCredentials: true },
        data: JSON.stringify({ usuarioId: usuarioId })
    })
        .done(function (lista) {
            accesos = lista || [];
            showHome();
        })
        .fail(function (xhr) {
            showError("No se pudieron cargar los accesos.", xhr);
        });
}

function showHome() {
    const name = (legacyUser && legacyUser.NombreUsuario) || getClaim("displayname") || user.name;
    const email = getClaim("emailaddress");

    $("#app").html(`
        <div class="app-header">
            <img src="/logo.png" class="app-logo" />
            <div id="userBox" class="user-box"></div>
        </div>
        <div class="container py-4">
            <h4 class="mb-3">Opciones disponibles</h4>
            ${renderAccesos()}
        </div>`);

    renderUserBox(name, email);

    $("#userBox").on("click", function (e) {
        e.stopPropagation();
        dropdownOpen = !dropdownOpen;
        renderUserBox(name, email);
    });

    $(document).on("click", function () {
        dropdownOpen = false;
        renderUserBox(name, email);
    });
}

function renderAccesos() {
    if (!accesos || accesos.length === 0) {
        return `<div class="alert alert-info">El usuario no tiene opciones configuradas.</div>`;
    }

    let rows = "";
    accesos.forEach(function (a) {
        rows += `
            <tr>
                <td>${escapeHtml(a.SistemaDescripcion)}</td>
                <td>${escapeHtml(a.ModuloDescripcion)}</td>
                <td>${escapeHtml(a.MenuDescripcion)}</td>
                <td>${escapeHtml(a.ProcesoDescripcion)}</td>
                <td>${escapeHtml(a.ProgramaDescripcion)}</td>
                <td><code>${escapeHtml(a.RutaSistema)}</code></td>
            </tr>`;
    });

    return `
    <div class="table-responsive bg-white rounded shadow-sm">
        <table class="table table-hover align-middle mb-0">
            <thead class="table-light">
                <tr>
                    <th>Sistema</th><th>Módulo</th><th>Menú</th>
                    <th>Proceso</th><th>Programa</th><th>Ruta</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
    </div>`;
}

function renderUserBox(name, email) {
    let html = name + " ▼";
    if (dropdownOpen) {
        html += `
            <div class="dropdown-panel">
                <div class="fw-bold">${escapeHtml(name)}</div>
                <div class="text-muted mb-2">${escapeHtml(email || "")}</div>
                <button id="logoutBtn" class="btn btn-outline-secondary btn-sm w-100">Cerrar sesión</button>
            </div>`;
    }
    $("#userBox").html(html);
    $("#logoutBtn").on("click", logout);
}

function getClaim(name) {
    if (!user || !user.claims) return null;
    const c = user.claims.find(function (x) {
        return x.type.toLowerCase().indexOf(name) !== -1;
    });
    return c ? c.value : null;
}

function escapeHtml(s) {
    return $("<div>").text(s == null ? "" : s).html();
}

function escapeAttr(s) {
    return String(s == null ? "" : s).replace(/"/g, "&quot;");
}

function spinner(text) {
    return `
    <div class="login-wrap">
        <div class="text-center text-muted">
            <div class="spinner-border mb-3" role="status"></div>
            <div>${escapeHtml(text || "Cargando...")}</div>
        </div>
    </div>`;
}

function showError(message, xhr) {
    const json = xhr && xhr.responseJSON;
    const detail = (json && json.error) || (xhr && xhr.statusText) || "";
    const raw = (json && json.raw) || (xhr && xhr.responseText) || "";
    $("#app").html(`
    <div class="login-wrap">
        <div class="login-card" style="max-width:640px">
            <div class="brand"><div class="badge-bm">BM</div><h1>APL System</h1></div>
            <div class="alert alert-danger">${escapeHtml(message)} ${escapeHtml(detail)}</div>
            ${raw ? `<details class="mb-3"><summary>Detalle del servicio</summary><pre style="white-space:pre-wrap">${escapeHtml(raw)}</pre></details>` : ""}
            <button class="btn btn-outline-secondary w-100" onclick="logout()">Volver a iniciar sesión</button>
        </div>
    </div>`);
}

function login() {
    window.location.href = BFF + "/auth/login?returnUrl=" + encodeURIComponent(window.location.origin);
}

function logout() {
    window.location.href = BFF + "/auth/logout?returnUrl=" + encodeURIComponent(window.location.origin);
}