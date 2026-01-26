// ~/js/Fondo/InactivarFondo.js

// ===============================================================
// Variables globales y Helpers
// ===============================================================
let tabla;
let ultimaFilaModificada = null;
let datosModal = null;

function obtenerUsuarioActual() {
    return window.usuarioActual || sessionStorage.getItem('usuarioActual') || "admin";
}

const SwalConfig = { customClass: { container: 'swal2-container-high-z' } };

// ===================================================================
// ===== DOCUMENT READY ==============================================
// ===================================================================
$(document).ready(function () {
    console.log("=== INICIO DE CARGA - InactivarFondo (Post-REST Schema) ===");

    $.get("/config", function (config) {
        window.apiBaseUrl = config.apiBaseUrl;
        recargarTablaFondos();
    });

    $('body').on('click', '#btnLimpiar', function () {
        if (tabla) {
            tabla.search('').draw();
            limpiarSeleccion('#tabla-principal');
        }
    });
});

// ===================================================================
// ===== LÓGICA DE DATOS (API) =======================================
// ===================================================================

function recargarTablaFondos() {
    const idOpcionActual = window.obtenerIdOpcionActual();
    const usuario = obtenerUsuarioActual();

    if (!idOpcionActual) return;

    $.ajax({
        url: `${window.apiBaseUrl}/api/Fondo/bandeja-inactivacion`,
        method: "GET",
        headers: { "idopcion": String(idOpcionActual), "usuario": usuario },
        success: function (response) {
            // ✅ Adaptación al nuevo esquema: json_response.data
            if (response && response.code_status === 200) {
                crearListado(response.json_response.data || []);
            }
        },
        error: (xhr) => manejarErrorGlobal(xhr, "recargar la tabla")
    });
}

function abrirModalEditar(id) {
    const idOpcionActual = window.obtenerIdOpcionActual();
    const usuario = obtenerUsuarioActual();

    if (typeof cargarAcuerdoFondo === 'function') cargarAcuerdoFondo(id);

    $.ajax({
        url: `${window.apiBaseUrl}/api/Fondo/bandeja-inactivacion-id/${id}`,
        method: "GET",
        headers: { "idopcion": String(idOpcionActual), "usuario": usuario },
        success: function (response) {
            if (response && response.code_status === 200) {
                const data = response.json_response.data; // Unwrapping

                const idProv = data.proveedor || '';
                const nomProv = data.nombre_proveedor || '';

                datosModal = {
                    idfondo: data.idfondo,
                    descripcion: data.descripcion,
                    proveedor: (idProv && nomProv) ? `${idProv} - ${nomProv}` : (idProv || nomProv),
                    tipo_fondo: data.nombre_tipo_fondo,
                    valor_disponible: formatearMoneda(data.valor_disponible),
                    valor_comprometido: formatearMoneda(data.valor_comprometido),
                    valor_liquidado: formatearMoneda(data.valor_liquidado),
                    valor_fondo: formatearMoneda(data.valor_fondo),
                    fecha_inicio: formatDateForInput(data.fecha_inicio),
                    fecha_fin: formatDateForInput(data.fecha_fin),
                    estado: data.estado
                };

                renderizarModalFondo(datosModal);
            }
        },
        error: (xhr) => manejarErrorGlobal(xhr, "obtener datos del fondo")
    });
}

function ejecutarInactivacion(idFondo) {
    const idOpcionActual = window.obtenerIdOpcionActual();
    const usuario = obtenerUsuarioActual();

    const requestBody = {
        idfondo: parseInt(idFondo),
        nombreusuarioingreso: usuario,
        idopcion: idOpcionActual,
        idcontrolinterfaz: "BTNINACTIVAR",
        idevento: "EVCLICK",
        nombreusuario: usuario
    };

    Swal.fire({ title: 'Procesando...', allowOutsideClick: false, didOpen: () => Swal.showLoading(), ...SwalConfig });

    $.ajax({
        url: `${window.apiBaseUrl}/api/Fondo/inactivar-fondo`,
        method: "POST", // ✅ Todos los cambios ahora son POST
        contentType: "application/json",
        headers: { "idopcion": String(idOpcionActual), "usuario": usuario },
        data: JSON.stringify(requestBody),
        success: function (response) {
            if (response && response.code_status === 200) {
                Swal.fire({ icon: 'success', title: 'Éxito', text: response.json_response.data.mensaje || 'Fondo inactivado', ...SwalConfig });
                cerrarModalFondo();
                recargarTablaFondos();
            }
        },
        error: function (xhr) {
            const errorData = xhr.responseJSON?.json_response?.data || {};
            const mensaje = errorData.mensaje || "No se pudo completar la acción.";

            // Caso pendiente de aprobación
            const icon = mensaje.toLowerCase().includes("pendiente") ? 'info' : 'error';
            Swal.fire({ icon: icon, title: 'Atención', text: mensaje, ...SwalConfig }).then(() => {
                if (icon === 'info') { cerrarModalFondo(); recargarTablaFondos(); }
            });
        }
    });
}

// ===================================================================
// ===== UI Y RENDERIZADO ============================================
// ===================================================================

function crearListado(data) {
    if (tabla) tabla.destroy();

    let html = `
        <table id='tabla-principal' class='table table-bordered table-striped table-hover'>
            <thead>
                <tr>
                    <th colspan='13' style='background-color: #CC0000 !important; color: white; text-align: center; font-weight: bold; padding: 12px; font-size: 1.1rem;'>
                        BANDEJA DE INACTIVACIÓN DE FONDOS
                    </th>
                </tr>
                <tr>
                    <th>Acción</th><th>ID</th><th>Descripción</th><th>RUC</th><th>Proveedor</th>
                    <th>Tipo</th><th>$ Fondo</th><th>Inicio</th><th>Fin</th>
                    <th>$ Disp.</th><th>$ Compr.</th><th>$ Liq.</th><th>Estado</th>
                </tr>
            </thead>
            <tbody>`;

    data.forEach(f => {
        const btn = `<button class="btn-action edit-btn" onclick="abrirModalEditar(${f.idfondo})"><i class="fa-regular fa-pen-to-square"></i></button>`;
        html += `
            <tr>
                <td class='text-center'>${btn}</td>
                <td class='text-center'>${f.idfondo}</td>
                <td>${f.descripcion || ''}</td>
                <td>${f.proveedor || ''}</td>
                <td>${f.nombre_proveedor || ''}</td>
                <td>${f.nombre_tipo_fondo || ''}</td>
                <td class='text-end'>${formatearMoneda(f.valor_fondo)}</td>
                <td class='text-center'>${formatearFecha(f.fecha_inicio)}</td>
                <td class='text-center'>${formatearFecha(f.fecha_fin)}</td>
                <td class='text-end'>${formatearMoneda(f.valor_disponible)}</td>
                <td class='text-end'>${formatearMoneda(f.valor_comprometido)}</td>
                <td class='text-end'>${formatearMoneda(f.valor_liquidado)}</td>
                <td>${f.estado || ''}</td>
            </tr>`;
    });

    $('#tabla').html(html + "</tbody></table>");
    tabla = $('#tabla-principal').DataTable({ pageLength: 10, order: [[1, 'desc']], language: { url: "//cdn.datatables.net/plug-ins/1.10.25/i18n/Spanish.json" } });
    if (typeof inicializarMarcadoFilas === 'function') inicializarMarcadoFilas('#tabla-principal');
}

function renderizarModalFondo(datos) {
    const map = { 'id': 'idfondo', 'descripcion': 'descripcion', 'proveedor': 'proveedor', 'tipofondo': 'tipo_fondo', 'fechainicio': 'fecha_inicio', 'fechafin': 'fecha_fin', 'valor': 'valor_fondo', 'estado': 'estado', 'disponible': 'valor_disponible', 'comprometido': 'valor_comprometido', 'liquidado': 'valor_liquidado' };

    Object.keys(map).forEach(key => {
        const el = document.getElementById(`modal-fondo-${key}`);
        if (el) el.value = datos[map[key]] || '';
    });

    document.getElementById('modalVisualizarFondo').classList.add('active');
    document.body.style.overflow = 'hidden';
}

// ===================================================================
// ===== UTILITARIOS =================================================
// ===================================================================

function cerrarModalFondo() {
    document.getElementById('modalVisualizarFondo').classList.remove('active');
    document.body.style.overflow = 'auto';
    if ($.fn.DataTable.isDataTable('#tabla-acuerdo')) $('#tabla-acuerdo').DataTable().destroy();
    $('#tabla-acuerdo-fondo').empty();
}

function formatearMoneda(v) {
    return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(v || 0);
}

function formatearFecha(s) {
    if (!s) return '';
    const d = new Date(s);
    return isNaN(d) ? s : d.toLocaleDateString('es-EC');
}

function formatDateForInput(s) { return s ? s.split('T')[0] : ""; }

function manejarErrorGlobal(xhr, accion) {
    const msg = xhr.responseJSON?.json_response?.result?.message || xhr.statusText;
    Swal.fire({ icon: 'error', title: 'Error', text: `No se pudo ${accion}: ${msg}`, ...SwalConfig });
}

// Autor: JEAN FRANCOIS CALDERON VEAS | Empresa: BMTECSA | Proyecto: SOFTWARE APL