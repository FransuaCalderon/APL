// ~/js/Opciones/Opciones.js

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
    console.log("=== INICIO DE CARGA - Opciones (Estructura Post-REST) ===");

    $.get("/config", function (config) {
        window.apiBaseUrl = config.apiBaseUrl;
        const idOpcionActual = window.obtenerIdOpcionActual();
        const usuario = obtenerUsuarioActual();

        if (!idOpcionActual) {
            Swal.fire({
                icon: 'error',
                title: 'Error de Navegación',
                text: 'No se detectó el ID de opción. Por favor, use el menú lateral.'
            });
            return;
        }

        // Carga inicial de la tabla
        cargarOpcionesLista(usuario);
    });

    // Delegación de eventos para botones dinámicos
    $('body').on('click', '#btnAgregarNuevo', () => abrirModalCrear());

    $('body').on('click', '#btnLimpiar', function () {
        if (tabla) {
            tabla.search('').draw();
            limpiarSeleccion('#tabla-curso');
        }
    });

    // Evento de guardado (Insert/Update)
    $("#btnGuardarCambios").on("click", function (e) {
        e.preventDefault();
        ejecutarGuardado();
    });
});

// ===================================================================
// LÓGICA DE DATOS (API)
// ===================================================================

function cargarOpcionesLista(usuario) {
    const idOpcionActual = window.obtenerIdOpcionActual();

    $.ajax({
        url: `${window.apiBaseUrl}/api/Opciones/listar/${usuario}`,
        method: "GET",
        headers: {
            "idopcion": String(idOpcionActual),
            "usuario": usuario
        },
        success: function (response) {
            // Adaptación al nuevo esquema: response.json_response.data es el array
            if (response && response.code_status === 200) {
                console.log("Datos recibidos:", response.json_response.data);
                crearListado(response.json_response.data);
            }
        },
        error: (xhr) => manejarErrorGlobal(xhr, "cargar la lista")
    });
}

function ejecutarGuardado() {
    const id = $("#modal-idOpcion").val();
    const idOpcionActual = window.obtenerIdOpcionActual();
    const usuario = obtenerUsuarioActual();

    // Construcción del objeto según tu esquema de BD
    const payload = {
        idopcion: id ? parseInt(id) : 0,
        nombre: $("#modal-nombre").val().toUpperCase(),
        descripcion: $("#modal-descripcion").val(),
        idgrupo: parseInt($("#modal-tipo-grupo").val()),
        vista: $("#modal-vista").val() || "sin vista",
        idestado: $("#modal-activo").is(":checked") ? 1 : 0,
        idtiposervicio: parseInt($("#modal-tipo-servicio").val()),
        idUsuarioModificacion: 1, // Ajustar según lógica de sesión
        fechaModificacion: new Date().toISOString()
    };

    // NUEVA REGLA: Tanto insertar como actualizar usan POST
    const url = id
        ? `${window.apiBaseUrl}/api/Opciones/actualizar/${id}`
        : `${window.apiBaseUrl}/api/Opciones/insertar`;

    $.ajax({
        url: url,
        type: "POST", // <--- Cambio a POST obligatorio
        contentType: "application/json",
        data: JSON.stringify(payload),
        headers: {
            "idopcion": String(idOpcionActual),
            "usuario": usuario
        },
        success: function (response) {
            if (response.code_status === 200) {
                $("#editarModal").modal("hide");
                Swal.fire({
                    icon: 'success',
                    title: '¡Operación Exitosa!',
                    text: response.json_response.data.mensaje || 'Registro procesado',
                    showConfirmButton: false,
                    timer: 1500
                }).then(() => window.location.reload());
            }
        },
        error: (xhr) => manejarErrorGlobal(xhr, "guardar cambios")
    });
}

function confirmDelete(id) {
    const idOpcionActual = window.obtenerIdOpcionActual();
    const usuario = obtenerUsuarioActual();

    Swal.fire({
        title: '¿Confirmar eliminación?',
        text: `Se eliminará el registro con ID: ${id}`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#009845',
        confirmButtonText: 'Sí, Eliminar'
    }).then((result) => {
        if (result.isConfirmed) {
            $.ajax({
                url: `${window.apiBaseUrl}/api/Opciones/eliminar/${id}`,
                type: "POST", // <--- Cambio a POST obligatorio según tu nuevo backend
                headers: {
                    "idopcion": String(idOpcionActual),
                    "usuario": usuario
                },
                success: function (response) {
                    if (response.code_status === 200) {
                        Swal.fire('¡Eliminado!', response.json_response.data.mensaje, 'success');
                        cargarOpcionesLista(usuario);
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

    let html = `
        <table id='tabla-curso' class='table table-striped display'>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Descripción</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>`;

    if (data && data.length > 0) {
        data.forEach(c => {
            html += `
                <tr>
                    <td>${c.idopcion}</td>
                    <td>${c.nombre || ''}</td>
                    <td>${c.descripcion || ''}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn-action edit-btn" title="Editar" onclick="abrirModalEditar(${c.idopcion})">
                                <i class="fa-regular fa-pen-to-square"></i>
                            </button>
                            <button class="btn-action delete-btn" title="Eliminar" onclick="confirmDelete(${c.idopcion})">
                                <i class="fa-regular fa-trash-can"></i>
                            </button>
                        </div>
                    </td>
                </tr>`;
        });
    }

    html += `</tbody></table>`;
    $('#tabla').html(html);

    tabla = $('#tabla-curso').DataTable({
        pageLength: 5,
        language: { url: "https://cdn.datatables.net/plug-ins/1.10.25/i18n/Spanish.json" },
        drawCallback: function () {
            if (ultimaFilaModificada && typeof marcarFilaPorId === 'function') {
                marcarFilaPorId('#tabla-curso', ultimaFilaModificada);
            }
        }
    });

    // Botón Agregar en el header del DataTable
    const addButtonHtml = `
        <button type="button" class="btn btn-primary ms-2" id="btnAgregarNuevo" style="height: 38px;">
            <i class="fa-solid fa-plus"></i>
        </button>`;
    $('#tabla-curso_length').prepend(addButtonHtml).css('display', 'flex').css('align-items', 'center');

    if (typeof inicializarMarcadoFilas === 'function') inicializarMarcadoFilas('#tabla-curso');
}

function abrirModalEditar(id) {
    const idOpcionActual = window.obtenerIdOpcionActual();
    const usuario = obtenerUsuarioActual();

    // Reset UI
    $('#formEditar')[0].reset();
    $('#modal-idOpcion').val(id);
    $('#editarModalLabel').text('Editar Opción');
    $('#btnGuardarCambios').html('<i class="fa-solid fa-save me-2"></i> Modificar').addClass('btn-primary').removeClass('btn-success');

    // Cargar combos secuencialmente (Promesas o callbacks)
    cargarTiposServicio(() => {
        cargarTipoGrupo(() => {
            $.ajax({
                url: `${window.apiBaseUrl}/api/Opciones/obtener/${id}`,
                method: "GET",
                headers: { "idopcion": String(idOpcionActual), "usuario": usuario },
                success: function (response) {
                    // Nota: 'obtener' suele devolver el objeto directo o dentro de data
                    const d = response.json_response.data;
                    $("#modal-nombre").val(d.nombre);
                    $("#modal-descripcion").val(d.descripcion);
                    $("#modal-activo").prop("checked", d.idestado === 1);
                    $("#modal-vista").val(d.vista);
                    $("#modal-tipo-servicio").val(d.idtiposervicio);
                    $("#modal-tipo-grupo").val(d.idgrupo);

                    new bootstrap.Modal(document.getElementById('editarModal')).show();
                }
            });
        });
    });
}

function abrirModalCrear() {
    $('#formEditar')[0].reset();
    $('#modal-idOpcion').val('');
    $('#editarModalLabel').text('Crear Nueva Opción');
    $('#btnGuardarCambios').html('<i class="fa-solid fa-plus me-2"></i> Crear').addClass('btn-success').removeClass('btn-primary');

    cargarTiposServicio(() => {
        cargarTipoGrupo(() => {
            new bootstrap.Modal(document.getElementById('editarModal')).show();
        });
    });
}

// ===================================================================
// COMBOS Y HELPERS
// ===================================================================

function cargarTiposServicio(callback) {
    const idOpcion = window.obtenerIdOpcionActual();
    $.ajax({
        url: `${window.apiBaseUrl}/api/Opciones/ConsultarCombos/TIPOSERVICIO`,
        headers: { "idopcion": String(idOpcion), "usuario": obtenerUsuarioActual() },
        success: (res) => {
            const data = res.json_response.data; // Ajustado al nuevo formato
            const $select = $("#modal-tipo-servicio").empty();
            data.forEach(item => $select.append(new Option(item.nombre_catalogo, item.idcatalogo)));
            if (callback) callback();
        }
    });
}

function cargarTipoGrupo(callback) {
    const idOpcion = window.obtenerIdOpcionActual();
    $.ajax({
        url: `${window.apiBaseUrl}/api/Opciones/ConsultarCombos/GRUPOOPCION`,
        headers: { "idopcion": String(idOpcion), "usuario": obtenerUsuarioActual() },
        success: (res) => {
            const data = res.json_response.data; // Ajustado al nuevo formato
            const $select = $("#modal-tipo-grupo").empty();
            data.forEach(item => $select.append(new Option(item.nombre_catalogo, item.idcatalogo)));
            if (callback) callback();
        }
    });
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