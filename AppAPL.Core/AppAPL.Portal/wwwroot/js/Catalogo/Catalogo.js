// ~/js/Catalogo/Catalogo.js

// ===============================================================
// Variables globales
// ===============================================================
let tabla;
let ultimaFilaModificada = null;
let tiposCatalogo = [];
let tipoCatalogoSeleccionado = null;

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
    console.log("=== INICIO DE CARGA - Catalogo (Post-REST Schema) ===");

    $.get("/config", function (config) {
        window.apiBaseUrl = config.apiBaseUrl;
        const idOpcionActual = window.obtenerIdOpcionActual();
        const usuario = obtenerUsuarioActual();

        if (!idOpcionActual) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'ID de opción no detectado.' });
            return;
        }

        // Carga inicial del combo de tipos
        cargarTiposCatalogo(idOpcionActual, usuario);
    });

    // Evento al cambiar el tipo de catálogo
    $('#selectTipoCatalogo').on('change', function () {
        const idTipoCatalogo = $(this).val();
        if (!idTipoCatalogo) {
            tipoCatalogoSeleccionado = null;
            mostrarTablaVaciaInicial();
            return;
        }
        tipoCatalogoSeleccionado = idTipoCatalogo;
        cargarCatalogosPorTipo(idTipoCatalogo);
    });

    $('body').on('click', '#btnAgregarNuevo', function () {
        if (!tipoCatalogoSeleccionado) {
            Swal.fire({ icon: 'warning', title: 'Atención', text: 'Seleccione un Tipo de Catálogo primero.' });
            return;
        }
        abrirModalCrear();
    });

    $('body').on('click', '#btnLimpiar', function () {
        if (tabla) {
            tabla.search('').draw();
            limpiarSeleccion('#tabla-curso');
        }
    });

    $("#btnGuardarCambios").on("click", function (e) {
        e.preventDefault();
        ejecutarGuardado();
    });
});

// ===================================================================
// LÓGICA DE DATOS (API)
// ===================================================================

/**
 * Carga los tipos de catálogo para el combo inicial.
 */
function cargarTiposCatalogo(idOpcionActual, usuario) {
    $.ajax({
        url: `${window.apiBaseUrl}/api/CatalogoTipo/listar`,
        method: "GET",
        headers: { "idopcion": String(idOpcionActual), "usuario": usuario },
        success: function (response) {
            // Acceso al nuevo esquema: response.json_response.data
            if (response && response.code_status === 200) {
                const data = response.json_response.data || [];
                tiposCatalogo = data.sort((a, b) => a.idcatalogotipo - b.idcatalogotipo);

                const $select = $('#selectTipoCatalogo');
                $select.empty().append('<option value="">-- Seleccione --</option>');

                tiposCatalogo.forEach(tipo => {
                    $select.append(`<option value="${tipo.idcatalogotipo}">${tipo.nombre}</option>`);
                });
                mostrarTablaVaciaInicial();
            }
        },
        error: (xhr) => manejarErrorGlobal(xhr, "cargar tipos de catálogo")
    });
}

/**
 * Carga los catálogos pertenecientes al tipo seleccionado.
 */
function cargarCatalogosPorTipo(idTipoCatalogo) {
    const idOpcionActual = window.obtenerIdOpcionActual();
    const usuario = obtenerUsuarioActual();

    $.ajax({
        url: `${window.apiBaseUrl}/api/Catalogo/FiltrarPorTipo/${idTipoCatalogo}`,
        method: "GET",
        headers: { "idopcion": String(idOpcionActual), "usuario": usuario },
        success: function (response) {
            if (response && response.code_status === 200) {
                const lista = response.json_response.data || [];
                const dataArray = Array.isArray(lista) ? lista : [lista];
                crearListado(dataArray);
            }
        },
        error: function (xhr) {
            if (xhr.status === 404) crearListado([]);
            else manejarErrorGlobal(xhr, "filtrar catálogos");
        }
    });
}

function ejecutarGuardado() {
    const idOpcionActual = window.obtenerIdOpcionActual();
    const usuario = obtenerUsuarioActual();
    const id = $("#modal-idCatalogo").val();

    const payload = {
        idcatalogo: id ? parseInt(id) : 0,
        nombre: $("#modal-nombre").val().toUpperCase(),
        adicional: $("#modal-adicional").val(),
        abreviatura: $("#modal-abreviatura").val(),
        idcatalogotipo: parseInt(tipoCatalogoSeleccionado),
        idusuariomodificacion: 1,
        fechamodificacion: new Date().toISOString(),
        idestado: $("#modal-activo").is(":checked") ? 1 : 0,
        idetiqueta: $("#modal-etiqueta").val()
    };

    if (!id) { // Es Crear
        payload.idusuariocreacion = 1;
        payload.fechacreacion = new Date().toISOString();
    }

    const url = id
        ? `${window.apiBaseUrl}/api/Catalogo/actualizar/${id}`
        : `${window.apiBaseUrl}/api/Catalogo/insertar`;

    $.ajax({
        url: url,
        type: "POST", // <--- Migrado a POST
        contentType: "application/json",
        data: JSON.stringify(payload),
        headers: { "idopcion": String(idOpcionActual), "usuario": usuario },
        success: function (response) {
            if (response.code_status === 200) {
                $("#editarModal").modal("hide");
                Swal.fire({
                    icon: 'success',
                    title: '¡Éxito!',
                    text: response.json_response.data.mensaje || 'Registro guardado.',
                    timer: 1500,
                    showConfirmButton: false
                });
                if (id) ultimaFilaModificada = id;
                cargarCatalogosPorTipo(tipoCatalogoSeleccionado);
            }
        },
        error: (xhr) => manejarErrorGlobal(xhr, "guardar catálogo")
    });
}

function confirmDelete(id) {
    const idOpcionActual = window.obtenerIdOpcionActual();
    const usuario = obtenerUsuarioActual();

    Swal.fire({
        title: '¿Eliminar registro?',
        text: `ID: ${id}`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, Eliminar'
    }).then((result) => {
        if (result.isConfirmed) {
            $.ajax({
                url: `${window.apiBaseUrl}/api/Catalogo/eliminar/${id}`,
                type: "POST", // <--- Migrado a POST
                headers: { "idopcion": String(idOpcionActual), "usuario": usuario },
                success: function (response) {
                    if (response.code_status === 200) {
                        Swal.fire('¡Eliminado!', response.json_response.data.mensaje, 'success');
                        cargarCatalogosPorTipo(tipoCatalogoSeleccionado);
                    }
                },
                error: (xhr) => manejarErrorGlobal(xhr, "eliminar")
            });
        }
    });
}

// ===================================================================
// UI Y RENDERIZADO
// ===================================================================

function crearListado(data) {
    if (tabla) tabla.destroy();

    let rows = "";
    (data || []).forEach(c => {
        rows += `
            <tr>
                <td>${c.idcatalogo}</td>
                <td>${c.nombre || ''}</td>
                <td>${c.adicional || ''}</td>
                <td>${c.abreviatura || ''}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-action edit-btn" onclick="abrirModalEditar(${c.idcatalogo})">
                            <i class="fa-regular fa-pen-to-square"></i>
                        </button>
                        <button class="btn-action delete-btn" onclick="confirmDelete(${c.idcatalogo})">
                            <i class="fa-regular fa-trash-can"></i>
                        </button>
                    </div>
                </td>
            </tr>`;
    });

    $('#tabla').html(`
        <table id='tabla-curso' class='table table-striped display'>
            <thead><tr><th>ID</th><th>Nombre</th><th>Adicional</th><th>Abreviatura</th><th>Opciones</th></tr></thead>
            <tbody>${rows}</tbody>
        </table>
    `);

    tabla = $('#tabla-curso').DataTable({
        pageLength: 5,
        columnDefs: [
            { targets: 0, width: "5%" },
            { targets: 4, orderable: false, className: "dt-center" }
        ],
        language: { url: "https://cdn.datatables.net/plug-ins/1.10.25/i18n/Spanish.json" },
        drawCallback: function () {
            if (ultimaFilaModificada && typeof marcarFilaPorId === 'function') {
                marcarFilaPorId('#tabla-curso', ultimaFilaModificada);
            }
        }
    });

    const addButton = `<button type="button" class="btn btn-primary ms-2" id="btnAgregarNuevo" style="height: 38px;"><i class="fa-solid fa-plus"></i></button>`;
    $('#tabla-curso_length').prepend(addButton).css('display', 'flex').css('align-items', 'center');

    if (typeof inicializarMarcadoFilas === 'function') inicializarMarcadoFilas('#tabla-curso');
}

function mostrarTablaVaciaInicial() {
    crearListado([]);
    if (tabla) {
        $(tabla.table().container()).find('.dataTables_empty').text("Seleccione un Tipo de Catálogo para ver los registros");
    }
}

function abrirModalEditar(id) {
    const idOpcionActual = window.obtenerIdOpcionActual();
    const usuario = obtenerUsuarioActual();

    $('#formEditar')[0].reset();
    $('#modal-idCatalogo').val(id);
    $('#editarModalLabel').text('Editar Catálogo');
    $('#btnGuardarCambios').html('<i class="fa-solid fa-save me-2"></i> Modificar').addClass('btn-primary').removeClass('btn-success');

    $.ajax({
        url: `${window.apiBaseUrl}/api/Catalogo/obtener/${id}`,
        method: "GET",
        headers: { "idopcion": String(idOpcionActual), "usuario": usuario },
        success: function (response) {
            const d = response.json_response.data;
            $("#modal-nombre").val(d.nombre);
            $("#modal-adicional").val(d.adicional);
            $("#modal-abreviatura").val(d.abreviatura);
            $("#modal-activo").prop("checked", d.idestado === 1);
            $("#modal-etiqueta").val(d.idetiqueta);

            new bootstrap.Modal(document.getElementById('editarModal')).show();
        },
        error: (xhr) => manejarErrorGlobal(xhr, "obtener datos")
    });
}

function abrirModalCrear() {
    $('#formEditar')[0].reset();
    $('#modal-idCatalogo').val('');
    $('#editarModalLabel').text('Crear Nuevo Catálogo');
    $('#btnGuardarCambios').html('<i class="fa-solid fa-plus me-2"></i> Crear').addClass('btn-success').removeClass('btn-primary');
    new bootstrap.Modal(document.getElementById('editarModal')).show();
}

function manejarErrorGlobal(xhr, accion) {
    console.error(`Error al ${accion}:`, xhr.responseText);
    Swal.fire('Error', `No se pudo completar la acción: ${accion}.`, 'error');
}

// Autor: JEAN FRANCOIS CALDERON VEAS | Empresa: BMTECSA | Proyecto: SOFTWARE APL