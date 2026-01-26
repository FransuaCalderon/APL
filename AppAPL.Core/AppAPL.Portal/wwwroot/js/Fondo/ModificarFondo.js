// ~/js/Fondo/ModificarFondo.js

// ===============================================================
// Variables globales
// ===============================================================
let tabla;
let ultimaFilaModificada = null;

// ===============================================================
// FUNCIONES DE CARGA DE DATOS (API)
// ===============================================================

function cargarBandeja() {
    const idOpcionActual = window.obtenerIdOpcionActual();
    const usuario = window.usuarioActual || "admin";

    if (!idOpcionActual) return;

    $.ajax({
        url: `${window.apiBaseUrl}/api/Fondo/bandeja-modificacion`,
        method: "GET",
        headers: { "idopcion": String(idOpcionActual), "usuario": usuario },
        success: function (response) {
            // ✅ Adaptación al nuevo esquema del response body
            if (response && response.code_status === 200) {
                const data = response.json_response.data || [];
                crearListado(data);
            }
        },
        error: (xhr) => manejarErrorGlobal(xhr, "cargar la bandeja")
    });
}

function cargarTipoFondo() {
    const idOpcionActual = window.obtenerIdOpcionActual();
    const usuario = window.usuarioActual || "admin";

    $.ajax({
        url: `${window.apiBaseUrl}/api/Opciones/ConsultarCombos/TIPOFONDO`,
        method: "GET",
        headers: { "idopcion": String(idOpcionActual), "usuario": usuario },
        success: function (response) {
            if (response && response.code_status === 200) {
                const data = response.json_response.data || [];
                const $select = $("#modal-fondo-tipofondo");
                $select.empty().append('<option value="">Seleccione...</option>');
                data.forEach(item => {
                    $select.append(new Option(item.nombre_catalogo, item.idcatalogo));
                });
            }
        }
    });
}

// ===============================================================
// UI Y RENDERIZADO
// ===============================================================

function crearListado(data) {
    if (tabla) tabla.destroy();

    let html = `
        <table id='tabla-principal' class='table table-bordered table-striped table-hover'>
            <thead>
                <tr>
                    <th colspan='13' style='background-color: #CC0000 !important; color: white; text-align: center; font-weight: bold; padding: 12px; font-size: 1.1rem;'>
                        BANDEJA DE MODIFICACIÓN DE FONDOS
                    </th>
                </tr>
                <tr>
                    <th>Acción</th><th>IDFondo</th><th>Descripción</th><th>RUC</th><th>Proveedor</th>
                    <th>Tipo Fondo</th><th>$ Fondo</th><th>Inicio</th><th>Fin</th>
                    <th>$ Disp.</th><th>$ Compr.</th><th>$ Liq.</th><th>Estado</th>
                </tr>
            </thead>
            <tbody>`;

    (data || []).forEach(fondo => {
        const btnEdit = `<button type="button" class="btn-action edit-btn" onclick="abrirModalEditar(${fondo.idfondo})"><i class="fa-regular fa-pen-to-square"></i></button>`;
        html += `
            <tr>
                <td class='text-center'>${btnEdit}</td>
                <td class='text-center'>${fondo.idfondo}</td>
                <td>${fondo.descripcion || ''}</td>
                <td>${fondo.proveedor || ''}</td>
                <td>${fondo.nombre_proveedor || ''}</td>
                <td>${fondo.nombre_tipo_fondo || ''}</td>
                <td class='text-end'>${formatearMoneda(fondo.valor_fondo)}</td>
                <td class='text-center'>${formatearFecha(fondo.fecha_inicio)}</td>
                <td class='text-center'>${formatearFecha(fondo.fecha_fin)}</td>
                <td class='text-end'>${formatearMoneda(fondo.valor_disponible)}</td>
                <td class='text-end'>${formatearMoneda(fondo.valor_comprometido)}</td>
                <td class='text-end'>${formatearMoneda(fondo.valor_liquidado)}</td>
                <td>${fondo.estado || ''}</td>
            </tr>`;
    });

    html += "</tbody></table>";
    $('#tabla').html(html);

    tabla = $('#tabla-principal').DataTable({
        pageLength: 10,
        order: [[1, 'desc']],
        language: { url: "https://cdn.datatables.net/plug-ins/1.10.25/i18n/Spanish.json" }
    });

    if (typeof inicializarMarcadoFilas === 'function') inicializarMarcadoFilas('#tabla-principal');
}

function abrirModalEditar(id) {
    const idOpcionActual = window.obtenerIdOpcionActual();
    const usuario = window.usuarioActual || "admin";

    $.ajax({
        url: `${window.apiBaseUrl}/api/Fondo/bandeja-modificacion-id/${id}`,
        method: "GET",
        headers: { "idopcion": String(idOpcionActual), "usuario": usuario },
        success: function (response) {
            if (response && response.code_status === 200) {
                const data = response.json_response.data; // Unwrapping

                // Mapeo a inputs del modal
                document.getElementById('modal-fondo-id').value = data.idfondo;
                document.getElementById('modal-fondo-descripcion').value = data.descripcion || '';
                document.getElementById('modal-fondo-idproveedor-hidden').value = data.proveedor || '';
                document.getElementById('modal-fondo-proveedor').value = data.proveedor ? `${data.proveedor} - ${data.nombre_proveedor}` : 'Seleccione...';

                // Setear Select de Tipo Fondo
                $("#modal-fondo-tipofondo option").filter(function () {
                    return $(this).text() === data.nombre_tipo_fondo;
                }).prop('selected', true);

                document.getElementById('modal-fondo-fechainicio').value = formatDateForInput(data.fecha_inicio);
                document.getElementById('modal-fondo-fechafin').value = formatDateForInput(data.fecha_fin);
                document.getElementById('modal-fondo-valor').value = data.valor_fondo || 0;
                document.getElementById('modal-fondo-estado').value = data.estado || '';
                document.getElementById('modal-fondo-disponible').value = formatearMoneda(data.valor_disponible);
                document.getElementById('modal-fondo-comprometido').value = formatearMoneda(data.valor_comprometido);
                document.getElementById('modal-fondo-liquidado').value = formatearMoneda(data.valor_liquidado);

                document.getElementById('modalEditarFondo').classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        },
        error: (xhr) => manejarErrorGlobal(xhr, "obtener detalle del fondo")
    });
}

// ===============================================================
// ACCIONES DE PERSISTENCIA (GUARDAR)
// ===============================================================

function guardarCambiosFondo() {
    const idOpcionActual = window.obtenerIdOpcionActual();
    const usuario = window.usuarioActual || "admin";
    const id = $("#modal-idcatalogotipo").val() || $("#modal-fondo-id").val(); // Compatibilidad de IDs

    const payload = {
        descripcion: $("#modal-fondo-descripcion").val(),
        idproveedor: $("#modal-fondo-idproveedor-hidden").val(),
        idtipofondo: parseInt($("#modal-fondo-tipofondo").val()),
        valorfondo: parseFloat($("#modal-fondo-valor").val()),
        fechainiciovigencia: $("#modal-fondo-fechainicio").val(),
        fechafinvigencia: $("#modal-fondo-fechafin").val(),
        idusuariomodifica: usuario,
        nombreusuariomodifica: usuario,
        idopcion: idOpcionActual,
        idcontrolinterfaz: "BTNMODIFICAR",
        idevento: "EVCLICK",
        nombreusuario: usuario
    };

    $.ajax({
        url: `${window.apiBaseUrl}/api/Fondo/actualizar/${id}`,
        method: "POST", // ✅ CAMBIADO DE PUT A POST
        contentType: "application/json",
        headers: { "idopcion": String(idOpcionActual), "usuario": usuario },
        data: JSON.stringify(payload),
        success: function (response) {
            if (response.code_status === 200) {
                Swal.fire('Éxito', response.json_response.data.mensaje || 'Fondo actualizado', 'success');
                cerrarModalFondo();
                cargarBandeja();
            }
        },
        error: (xhr) => manejarErrorGlobal(xhr, "actualizar el fondo")
    });
}

// ===============================================================
// READY & EVENTOS
// ===============================================================

$(document).ready(function () {
    $.get("/config", function (config) {
        window.apiBaseUrl = config.apiBaseUrl;
        cargarTipoFondo();
        cargarBandeja();
    });

    // Guardar cambios
    $("#btnGuardarCambiosFondo").on("click", function (e) {
        e.preventDefault();
        guardarCambiosFondo();
    });
});

function cerrarModalFondo() {
    document.getElementById('modalEditarFondo').classList.remove('active');
    document.body.style.overflow = 'auto';
    document.getElementById('formEditarFondo').reset();
}

// Helpers de utilidad (se asumen cargados o definidos)
function manejarErrorGlobal(xhr, accion) {
    const errorMsg = xhr.responseJSON?.json_response?.data?.mensaje || xhr.statusText;
    Swal.fire('Error', `No se pudo ${accion}: ${errorMsg}`, 'error');
}

function formatearMoneda(v) { return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(v || 0); }
function formatearFecha(s) { if (!s) return ''; const d = new Date(s); return isNaN(d) ? s : d.toLocaleDateString('es-EC'); }
function formatDateForInput(s) { return s ? s.split('T')[0] : ""; }

// Autor: JEAN FRANCOIS CALDERON VEAS | Empresa: BMTECSA | Proyecto: SOFTWARE APL