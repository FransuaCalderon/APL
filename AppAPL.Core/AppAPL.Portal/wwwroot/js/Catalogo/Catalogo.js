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
    console.log("=== INICIO DE CARGA - Catalogo (Estructura Post-REST) ===");

    $.get("/config", function (config) {
        window.apiBaseUrl = config.apiBaseUrl;
        const idOpcionActual = window.obtenerIdOpcionActual();
        const usuario = obtenerUsuarioActual();

        if (!idOpcionActual) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'ID de opción no detectado.' });
            return;
        }

        // Carga inicial del combo de tipos
        cargarTiposCatalogo();
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
function cargarTiposCatalogo() {
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
                const data = response.json_response || [];
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
    const payload = {
        code_app: "APP20260128155212346",
        http_method: "GET",
        endpoint_path: "api/Catalogo/FiltrarPorTipo",
        client: "APL",
        endpoint_query_params: `/${idTipoCatalogo}`
    };

    $.ajax({
        url: "/api/apigee-router-proxy",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(payload),
        success: function (response) {
            if (response && response.code_status === 200) {
                console.log("Catálogos recibidos:", response.json_response);
                const lista = response.json_response || [];
                const dataArray = Array.isArray(lista) ? lista : [lista];
                crearListado(dataArray);
            }
        },
        error: function (xhr) {
            if (xhr.status === 404) {
                crearListado([]);
            } else {
                manejarErrorGlobal(xhr, "filtrar catálogos");
            }
        }
    });
}

function ejecutarGuardado() {
    const id = $("#modal-idCatalogo").val();

    const body = {
        nombre: $("#modal-nombre").val().toUpperCase(),
        adicional: $("#modal-adicional").val(),
        abreviatura: $("#modal-abreviatura").val(),
        idcatalogotipo: parseInt(tipoCatalogoSeleccionado),
        idusuariocreacion: 1,
        fechacreacion: new Date().toISOString(),
        idusuariomodificacion: 1,
        fechamodificacion: new Date().toISOString(),
        idestado: $("#modal-activo").is(":checked") ? 1 : 0,
        idetiqueta: $("#modal-etiqueta").val()
    };

    const url = id
        ? "api/Catalogo/actualizar"
        : "api/Catalogo/insertar";

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
                    text: response.json_response.mensaje || 'Registro procesado',
                    showConfirmButton: false,
                    timer: 1500
                }).then(() => {
                    if (id) ultimaFilaModificada = id;
                    cargarCatalogosPorTipo(tipoCatalogoSeleccionado);
                });
            }
        },
        error: (xhr) => manejarErrorGlobal(xhr, "guardar catálogo")
    });
}

function confirmDelete(id) {
    Swal.fire({
        title: '¿Confirmar eliminación?',
        text: `Se eliminará el registro con ID: ${id}`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#009845',
        confirmButtonText: 'Sí, Eliminar'
    }).then((result) => {
        if (result.isConfirmed) {
            const payload = {
                code_app: "APP20260128155212346",
                http_method: "POST",
                endpoint_path: "api/Catalogo/eliminar",
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
                        <button class="btn-action edit-btn" title="Editar" onclick="abrirModalEditar(${c.idcatalogo})">
                            <i class="fa-regular fa-pen-to-square"></i>
                        </button>
                        <button class="btn-action delete-btn" title="Eliminar" onclick="confirmDelete(${c.idcatalogo})">
                            <i class="fa-regular fa-trash-can"></i>
                        </button>
                    </div>
                </td>
            </tr>`;
    });

    $('#tabla').html(`
        <table id='tabla-curso' class='table table-striped display'>
            <thead><tr><th>ID</th><th>Nombre</th><th>Adicional</th><th>Abreviatura</th><th>Acciones</th></tr></thead>
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

    const addButtonHtml = `
        <button type="button" class="btn btn-primary ms-2" id="btnAgregarNuevo" style="height: 38px;">
            <i class="fa-solid fa-plus"></i>
        </button>`;
    $('#tabla-curso_length').prepend(addButtonHtml).css('display', 'flex').css('align-items', 'center');

    if (typeof inicializarMarcadoFilas === 'function') inicializarMarcadoFilas('#tabla-curso');
}

function mostrarTablaVaciaInicial() {
    crearListado([]);
    if (tabla) {
        $(tabla.table().container()).find('.dataTables_empty').text("Seleccione un Tipo de Catálogo para ver los registros");
    }
}

function abrirModalEditar(id) {
    console.log("Ejecutando abrirModalEditar para ID:", id);

    $('#formEditar')[0].reset();
    $('#modal-idCatalogo').val(id);
    $('#editarModalLabel').text('Editar Catálogo');
    $('#btnGuardarCambios').html('<i class="fa-solid fa-save me-2"></i> Modificar').addClass('btn-primary').removeClass('btn-success');

    const payload = {
        code_app: "APP20260128155212346",
        http_method: "GET",
        endpoint_path: "api/Catalogo/obtener",
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
                $("#modal-adicional").val(d.adicional);
                $("#modal-abreviatura").val(d.abreviatura);
                $("#modal-activo").prop("checked", d.idestado === 1);
                $("#modal-etiqueta").val(d.idetiqueta);

                new bootstrap.Modal(document.getElementById('editarModal')).show();
            }
        },
        error: (xhr) => manejarErrorGlobal(xhr, "obtener datos del catálogo")
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
    console.error(`QA Report - Error al ${accion}:`, xhr.responseText);
    Swal.fire({
        icon: 'error',
        title: 'Error de Comunicación',
        text: `No se pudo completar la acción: ${accion}.`
    });
}

// Autor: JEAN FRANCOIS CALDERON VEAS | Empresa: BMTECSA | Proyecto: SOFTWARE APL