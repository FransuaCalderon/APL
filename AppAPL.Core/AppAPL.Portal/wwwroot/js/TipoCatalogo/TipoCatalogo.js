// ~/js/TipoCatalogo/TipoCatalogo.js

// ===============================================================
// Variables globales
// ===============================================================
let tabla;
let ultimaFilaModificada = null;

// ===============================================================
// FUNCIÓN HELPER PARA OBTENER USUARIO
// ===============================================================
function obtenerUsuarioActual() {
    return window.usuarioActual
        || sessionStorage.getItem('usuarioActual')
        || "admin";
}

// ===============================================================
// DOCUMENT READY
// ===============================================================
$(document).ready(function () {
    console.log("=== INICIO DE CARGA - TipoCatalogo (Estructura Post-REST) ===");

    $.get("/config", function (config) {
        window.apiBaseUrl = config.apiBaseUrl;
        const idOpcionActual = window.obtenerIdOpcionActual();

        if (!idOpcionActual) {
            Swal.fire({
                icon: 'error',
                title: 'Error de Contexto',
                text: 'No se detectó el ID de opción. Acceda desde el menú lateral.'
            });
            return;
        }

        // Carga inicial de la tabla
        cargarListadoPrincipal();
    });

    // Delegación para el botón "Agregar Nuevo"
    $('body').on('click', '#btnAgregarNuevo', () => abrirModalCrear());

    // Botón Limpiar Filtros
    $('body').on('click', '#btnLimpiar', function () {
        if (tabla) {
            tabla.search('').draw();
            limpiarSeleccion('#tabla-curso');
        }
    });

    // Acción de Guardar (Crear/Editar)
    $("#btnGuardarCambios").on("click", function (e) {
        e.preventDefault();
        ejecutarGuardado();
    });
});

// ===================================================================
// LÓGICA DE DATOS (API)
// ===================================================================

function cargarListadoPrincipal() {
    const payload = {
        code_app: "APP20260128155212346",
        http_method: "GET",
        endpoint_path: "api/CatalogoTipo/listar",
        client: "APL",
        endpoint_query_params: ""
    };

    $.ajax({
        url: "/api/apigee-router-proxy",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(payload),
        success: function (response) {
            if (response && response.code_status === 200) {
                console.log("Tipos de catálogo recibidos:", response.json_response);
                crearListado(response.json_response);
            }
        },
        error: (xhr) => manejarErrorGlobal(xhr, "obtener tipos de catálogo")
    });
}

function ejecutarGuardado() {
    const id = $("#modal-idCatalogoTipo").val();
    const isCrear = !id;

    const body = {
        nombre: $("#modal-nombre").val().toUpperCase(),
        descripcion: $("#modal-descripcion").val(),
        idusuariocreacion: 1,
        fechacreacion: new Date().toISOString(),
        idusuariomodificacion: 1,
        fechamodificacion: new Date().toISOString(),
        idestado: $("#modal-activo").is(":checked") ? 1 : 0,
        idetiqueta: $("#modal-etiqueta").val() || "SIN_ETIQUETA"
    };

    const url = id
        ? "api/CatalogoTipo/actualizar"
        : "api/CatalogoTipo/insertar";

    const payload = {
        code_app: "APP20260128155212346",
        http_method: "POST",
        endpoint_path: url,
        client: "APL",
        body_request: body
    };

    if (id) {
        payload.endpoint_query_params = `/${id}`;
    }

    $.ajax({
        url: "/api/apigee-router-proxy",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(payload),
        success: function (response) {
            if (response.code_status === 200) {
                $("#editarModal").modal("hide");
                Swal.fire({
                    icon: 'success',
                    title: '¡Operación Exitosa!',
                    text: response.json_response.mensaje || 'Registro procesado correctamente.',
                    showConfirmButton: false,
                    timer: 1500
                }).then(() => {
                    if (!isCrear) ultimaFilaModificada = id;
                    cargarListadoPrincipal();
                });
            }
        },
        error: (xhr) => manejarErrorGlobal(xhr, "guardar el registro")
    });
}

function confirmDelete(id) {
    Swal.fire({
        title: '¿Confirmar Eliminación?',
        text: `¿Desea eliminar el Tipo de Catálogo con ID: ${id}?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#009845',
        confirmButtonText: 'Sí, Eliminar'
    }).then((result) => {
        if (result.isConfirmed) {
            const payload = {
                code_app: "APP20260128155212346",
                http_method: "POST",
                endpoint_path: "api/CatalogoTipo/eliminar",
                client: "APL",
                endpoint_query_params: `/${id}`
            };

            $.ajax({
                url: "/api/apigee-router-proxy",
                method: "POST",
                contentType: "application/json",
                data: JSON.stringify(payload),
                success: function (response) {
                    if (response.code_status === 200) {
                        Swal.fire('¡Eliminado!', response.json_response.mensaje, 'success');
                        cargarListadoPrincipal();
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
        const id = c.idcatalogotipo;
        rows += `
            <tr>
                <td>${id}</td>
                <td>${c.nombre || ''}</td>
                <td>${c.descripcion || ''}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-action edit-btn" title="Editar" onclick="abrirModalEditar(${id})">
                            <i class="fa-regular fa-pen-to-square"></i>
                        </button>
                        <button class="btn-action delete-btn" title="Eliminar" onclick="confirmDelete(${id})">
                            <i class="fa-regular fa-trash-can"></i>
                        </button>
                    </div>
                </td>
            </tr>`;
    });

    $('#tabla').html(`
        <table id='tabla-curso' class='table table-striped display'>
            <thead>
                <tr><th>ID</th><th>Nombre</th><th>Descripción</th><th>Acciones</th></tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
    `);

    tabla = $('#tabla-curso').DataTable({
        pageLength: 5,
        columnDefs: [
            { targets: 0, width: "5%" },
            { targets: 3, width: "10%", orderable: false, className: "dt-center" }
        ],
        language: { url: "https://cdn.datatables.net/plug-ins/1.10.25/i18n/Spanish.json" },
        drawCallback: function () {
            if (ultimaFilaModificada && typeof marcarFilaPorId === 'function') {
                marcarFilaPorId('#tabla-curso', ultimaFilaModificada);
            }
        }
    });

    // Inyección del botón agregar
    const addButtonHtml = `
        <button type="button" class="btn btn-primary ms-2" id="btnAgregarNuevo" style="height: 38px;">
            <i class="fa-solid fa-plus"></i>
        </button>`;
    $('#tabla-curso_length').prepend(addButtonHtml).css('display', 'flex').css('align-items', 'center');

    if (typeof inicializarMarcadoFilas === 'function') inicializarMarcadoFilas('#tabla-curso');
}

function abrirModalEditar(id) {
    console.log("Ejecutando abrirModalEditar para ID:", id);

    $('#formEditar')[0].reset();
    $('#modal-idCatalogoTipo').val(id);
    $('#editarModalLabel').text('Editar Tipo de Catálogo');
    $('#btnGuardarCambios').html('<i class="fa-solid fa-save me-2"></i> Modificar').addClass('btn-primary').removeClass('btn-success');

    const payload = {
        code_app: "APP20260128155212346",
        http_method: "GET",
        endpoint_path: "api/CatalogoTipo/obtener",
        client: "APL",
        endpoint_query_params: `/${id}`
    };

    $.ajax({
        url: "/api/apigee-router-proxy",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(payload),
        success: function (response) {
            if (response && response.code_status === 200) {
                const d = response.json_response;
                $("#modal-nombre").val(d.nombre);
                $("#modal-descripcion").val(d.descripcion);
                $("#modal-activo").prop("checked", d.idestado === 1);
                $("#modal-etiqueta").val(d.idetiqueta);

                new bootstrap.Modal(document.getElementById('editarModal')).show();
            }
        },
        error: (xhr) => manejarErrorGlobal(xhr, "obtener datos del tipo de catálogo")
    });
}

function abrirModalCrear() {
    $('#formEditar')[0].reset();
    $('#modal-idCatalogoTipo').val('');
    $('#editarModalLabel').text('Crear Nuevo Tipo de Catálogo');
    $('#btnGuardarCambios').html('<i class="fa-solid fa-plus me-2"></i> Crear').addClass('btn-success').removeClass('btn-primary');
    new bootstrap.Modal(document.getElementById('editarModal')).show();
}

function manejarErrorGlobal(xhr, accion) {
    console.error(`QA Report - Error al ${accion}:`, xhr.responseText);
    Swal.fire({
        icon: 'error',
        title: 'Error de Comunicación',
        text: `No se pudo completar la acción: ${accion}.`
    });
}

// Autor: JEAN FRANCOIS CALDERON VEAS | Empresa: BMTECSA | Proyecto: SOFTWARE APL