// ~/js/Fondo/ConsultarFondo.js

// ===============================================================
// Variables globales
// ===============================================================
let tabla;
let ultimaFilaModificada = null;

// ===============================================================
// FUNCIÓN HELPER PARA OBTENER USUARIO
// ===============================================================
function obtenerUsuarioActual() {
    return window.usuarioActual || sessionStorage.getItem('usuarioActual') || "admin";
}

// ===============================================================
// DOCUMENT READY
// ===============================================================
$(document).ready(function () {
    console.log("=== INICIO DE CARGA - ConsultarFondo (Post-REST Schema) ===");

    $.get("/config", function (config) {
        window.apiBaseUrl = config.apiBaseUrl;
        cargarTipoFondo();
        cargarBandeja();
    });

    $('body').on('click', '#btnLimpiar', function () {
        if (tabla) {
            tabla.search('').draw();
            limpiarSeleccion('#tabla-principal');
        }
    });

    $('#modalConsultaProveedor').on('show.bs.modal', function () {
        consultarProveedor();
    });

    $("#btnAceptarProveedorModificar").on("click", function () {
        const $selected = $("#tablaProveedores tbody input[name='selectProveedor']:checked");
        if ($selected.length > 0) {
            const nombre = $selected.data("nombre");
            const ruc = $selected.data("ruc");
            $("#modal-fondo-proveedor").val(`${ruc} - ${nombre}`);
            $("#modal-fondo-idproveedor-hidden").val(ruc);
            $('#modalConsultaProveedor').modal('hide');
        } else {
            Swal.fire('Atención', 'Por favor, seleccione un proveedor.', 'info');
        }
    });
});

// ===================================================================
// LÓGICA DE DATOS (API)
// ===================================================================

function cargarBandeja() {
    const idOpcionActual = window.obtenerIdOpcionActual();
    const usuario = obtenerUsuarioActual();

    if (!idOpcionActual) return;

    $.ajax({
        url: `${window.apiBaseUrl}/api/Fondo/listar`,
        method: "GET",
        headers: {
            "idopcion": String(idOpcionActual),
            "nombreusuario": usuario,
            "idcontrolinterfaz": "BTNCONSULTAR",
            "idevento": "EVCLICK"
        },
        success: function (response) {
            // ✅ Adaptación al nuevo esquema de respuesta
            if (response && response.code_status === 200) {
                crearListado(response.json_response.data || []);
            }
        },
        error: (xhr) => manejarErrorGlobal(xhr, "cargar los fondos")
    });
}

function cargarTipoFondo() {
    const idOpcionActual = window.obtenerIdOpcionActual();
    const usuario = obtenerUsuarioActual();

    $.ajax({
        url: `${window.apiBaseUrl}/api/Opciones/ConsultarCombos/TIPOFONDO`,
        method: "GET",
        headers: { "idopcion": String(idOpcionActual), "usuario": usuario },
        success: function (response) {
            if (response && response.code_status === 200) {
                const data = response.json_response.data || [];
                const $select = $("#modal-fondo-tipofondo").empty();
                $select.append('<option value="">Seleccione...</option>');
                data.forEach(item => {
                    $select.append(new Option(item.nombre_catalogo, item.idcatalogo));
                });
            }
        }
    });
}

// ===================================================================
// UI Y RENDERIZADO
// ===================================================================

function crearListado(data) {
    if (tabla) tabla.destroy();

    let html = `
        <table id='tabla-principal' class='table table-bordered table-striped table-hover w-100'>
            <thead>
                <tr>
                    <th colspan='13' style='background-color: #CC0000 !important; color: white; text-align: center; font-weight: bold; padding: 12px; font-size: 1.1rem;'>
                        BANDEJA DE CONSULTA DE FONDOS
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
        const btnView = `<button class="btn-action edit-btn" onclick="abrirModalEditar(${f.idfondo})"><i class="fa-regular fa-eye"></i></button>`;
        html += `
            <tr>
                <td class='text-center'>${btnView}</td>
                <td class='text-center'>${f.idfondo}</td>
                <td>${f.descripcion || ''}</td>
                <td>${f.idproveedor || ''}</td>
                <td>${f.nombre_proveedor || ''}</td>
                <td>${f.nombre_tipo_fondo || ''}</td>
                <td class='text-end'>${formatearMoneda(f.valorfondo)}</td>
                <td class='text-center'>${formatearFecha(f.fechainiciovigencia)}</td>
                <td class='text-center'>${formatearFecha(f.fechafinvigencia)}</td>
                <td class='text-end'>${formatearMoneda(f.valordisponible)}</td>
                <td class='text-end'>${formatearMoneda(f.valorcomprometido)}</td>
                <td class='text-end'>${formatearMoneda(f.valorliquidado)}</td>
                <td>${f.estado_nombre || ''}</td>
            </tr>`;
    });

    $('#tabla').html(html + "</tbody></table>");
    tabla = $('#tabla-principal').DataTable({
        pageLength: 10,
        order: [[1, 'desc']],
        language: { url: "//cdn.datatables.net/plug-ins/1.10.25/i18n/Spanish.json" }
    });

    if (typeof inicializarMarcadoFilas === 'function') inicializarMarcadoFilas('#tabla-principal');
}

function abrirModalEditar(id) {
    const idOpcionActual = window.obtenerIdOpcionActual();
    const usuario = obtenerUsuarioActual();

    if (typeof cargarAcuerdoFondo === 'function') cargarAcuerdoFondo(id);

    $.ajax({
        url: `${window.apiBaseUrl}/api/Fondo/obtener/${id}`,
        method: "GET",
        headers: { "idopcion": String(idOpcionActual), "usuario": usuario },
        success: function (response) {
            if (response && response.code_status === 200) {
                const data = response.json_response.data; // Unwrapping

                const provText = (data.proveedor && data.nombre_proveedor)
                    ? `${data.proveedor} - ${data.nombre_proveedor}`
                    : (data.proveedor || data.nombre_proveedor || '');

                const datosModal = {
                    idfondo: data.idfondo,
                    descripcion: data.descripcion,
                    proveedor: provText,
                    tipo_fondo: data.nombre_tipo_fondo,
                    valor_disponible: formatearMoneda(data.valor_disponible),
                    valor_comprometido: formatearMoneda(data.valor_comprometido),
                    valor_liquidado: formatearMoneda(data.valor_liquidado),
                    valor_fondo: formatearMoneda(data.valor_fondo),
                    fecha_inicio: formatDateForInput(data.fecha_inicio),
                    fecha_fin: formatDateForInput(data.fecha_fin),
                    estado: data.estado_nombre
                };

                renderizarModalFondo(datosModal);
            }
        },
        error: (xhr) => manejarErrorGlobal(xhr, "obtener detalle")
    });
}

function renderizarModalFondo(datos) {
    const fields = {
        'modal-fondo-id': datos.idfondo,
        'modal-fondo-descripcion': datos.descripcion,
        'modal-fondo-proveedor': datos.proveedor,
        'modal-fondo-tipofondo': datos.tipo_fondo,
        'modal-fondo-fechainicio': datos.fecha_inicio,
        'modal-fondo-fechafin': datos.fecha_fin,
        'modal-fondo-valor': datos.valor_fondo,
        'modal-fondo-estado': datos.estado,
        'modal-fondo-disponible': datos.valor_disponible,
        'modal-fondo-comprometido': datos.valor_comprometido,
        'modal-fondo-liquidado': datos.valor_liquidado
    };

    Object.keys(fields).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = fields[id] || '';
    });

    document.getElementById('modalVisualizarFondo').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function guardarCambiosFondo() {
    const idOpcionActual = window.obtenerIdOpcionActual();
    const usuario = obtenerUsuarioActual();
    const id = $("#modal-fondo-id").val();

    const payload = {
        descripcion: $("#modal-fondo-descripcion").val(),
        idproveedor: $("#modal-fondo-idproveedor-hidden").val(),
        idtipofondo: parseInt($("#modal-fondo-tipofondo").val()),
        valorfondo: parseFloat($("#modal-fondo-valor").val()),
        fechainiciovigencia: $("#modal-fondo-fechainicio").val(),
        fechafinvigencia: $("#modal-fondo-fechafin").val(),
        idusuariomodifica: usuario,
        idopcion: idOpcionActual,
        idcontrolinterfaz: 0,
        idevento: 29
    };

    $.ajax({
        url: `${window.apiBaseUrl}/api/Fondo/actualizar/${id}`,
        method: "POST", // ✅ Cambio a POST según nuevo estándar
        contentType: "application/json",
        headers: { "idopcion": String(idOpcionActual), "usuario": usuario },
        data: JSON.stringify(payload),
        success: function (response) {
            if (response.code_status === 200) {
                Swal.fire('Éxito', 'Fondo actualizado correctamente', 'success').then(() => {
                    cerrarModalFondo();
                    cargarBandeja();
                });
            }
        },
        error: (xhr) => manejarErrorGlobal(xhr, "actualizar")
    });
}

// ===================================================================
// UTILITARIOS
// ===================================================================

function cerrarModalFondo() {
    $('.active').removeClass('active');
    document.body.style.overflow = 'auto';
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
    Swal.fire('Error', `No se pudo ${accion}: ${msg}`, 'error');
}

// Autor: JEAN FRANCOIS CALDERON VEAS | Empresa: BMTECSA | Proyecto: SOFTWARE APL