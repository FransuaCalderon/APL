// ~/js/Opciones/Opciones.js

// ===============================================================
// Variables globales
// ===============================================================
let tabla; // GLOBAL
let ultimaFilaModificada = null; // Para recordar la última fila editada/eliminada

// ===============================================================
// FUNCIÓN HELPER PARA OBTENER USUARIO (Busca en múltiples lugares)
// ===============================================================
function obtenerUsuarioActual() {
    // Buscar en múltiples ubicaciones posibles
    const usuario = window.usuarioActual
        || sessionStorage.getItem('usuarioActual')
        || sessionStorage.getItem('usuario')
        || localStorage.getItem('usuarioActual')
        || localStorage.getItem('usuario')
        || "admin"; // Fallback final

    return usuario;
}

// ===============================================================
// DOCUMENT READY
// ===============================================================
$(document).ready(function () {

    console.log("=== INICIO DE CARGA DE PÁGINA - Opciones ===");
    console.log("");

    // 🔍 ===== DIAGNÓSTICO COMPLETO DEL USUARIO ===== 🔍
    console.log("🔍 DIAGNÓSTICO DE USUARIO:");
    console.log("  window.usuarioActual:", window.usuarioActual);
    console.log("  Tipo:", typeof window.usuarioActual);
    console.log("  sessionStorage.usuarioActual:", sessionStorage.getItem('usuarioActual'));
    console.log("  sessionStorage.usuario:", sessionStorage.getItem('usuario'));
    console.log("  localStorage.usuarioActual:", localStorage.getItem('usuarioActual'));
    console.log("  localStorage.usuario:", localStorage.getItem('usuario'));

    const usuarioFinal = obtenerUsuarioActual();
    console.log("  ✅ Usuario final obtenido:", usuarioFinal);
    console.log("");

    // ✅ LOGS DE VERIFICACIÓN DE IDOPCION
    console.log("🔍 DIAGNÓSTICO DE IDOPCION:");
    const infoOpcion = window.obtenerInfoOpcionActual();
    console.log("  Información de la opción actual:", {
        idOpcion: infoOpcion.idOpcion,
        nombre: infoOpcion.nombre,
        ruta: infoOpcion.ruta
    });

    // Verificación adicional
    if (!infoOpcion.idOpcion) {
        console.warn("  ⚠️ ADVERTENCIA: No se detectó un idOpcion al cargar la página.");
        console.warn("  Esto es normal si accediste directamente a la URL sin pasar por el menú.");
        console.warn("  Para que funcione correctamente, accede a esta página desde el menú.");
    } else {
        console.log("  ✅ idOpcion capturado correctamente:", infoOpcion.idOpcion);
    }

    console.log("");
    console.log("=== FIN DE VERIFICACIÓN INICIAL ===");
    console.log("");

    // Configuración inicial y carga de datos
    $.get("/config", function (config) {
        const apiBaseUrl = config.apiBaseUrl;
        window.apiBaseUrl = apiBaseUrl;

        console.log("API Base URL configurada:", apiBaseUrl);

        // ✅ OBTENER EL IDOPCION DINÁMICAMENTE
        const idOpcionActual = window.obtenerIdOpcionActual();
        const usuario = obtenerUsuarioActual();

        if (!idOpcionActual) {
            console.error("No se pudo obtener el idOpcion para listar opciones");
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo obtener el ID de la opción. Por favor, acceda nuevamente desde el menú.'
            });
            return;
        }

        console.log('Cargando opciones con idOpcion:', idOpcionActual, 'y usuario:', usuario);


        //llamar a la funcion aqui
        cargarOpcionesLista(usuario);
    });

    // Delegación de clic para el botón "Agregar Nuevo"
    $('body').on('click', '#btnAgregarNuevo', function () {
        abrirModalCrear();
    });

    // ===== BOTÓN LIMPIAR =====
    $('body').on('click', '#btnLimpiar', function () {
        if (tabla) {
            tabla.search('').draw();
            tabla.page(0).draw('page');
            ultimaFilaModificada = null;
            if (typeof limpiarSeleccion === 'function') {
                limpiarSeleccion('#tabla-curso');
            }
        }
    });

    // Lógica para manejar el cierre del modal
    $('#editarModal').on('hidden.bs.modal', function () {
        $('#editarModalLabel').text('Editar Opción');
        $('#btnGuardarCambios')
            .html('<i class="fa-solid fa-pen-to-square me-2"></i> Modificar')
            .removeClass('btn-success')
            .addClass('btn-primary');
    });

    // Lógica para guardar o crear
    $("#btnGuardarCambios").on("click", function (e) {
        e.preventDefault();

        // ✅ OBTENER EL IDOPCION DINÁMICAMENTE
        const idOpcionActual = window.obtenerIdOpcionActual();
        const usuario = obtenerUsuarioActual();

        if (!idOpcionActual) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo obtener el ID de la opción. Por favor, acceda nuevamente desde el menú.'
            });
            return;
        }

        const id = $("#modal-idOpcion").val();
        const isCrear = !id;

        console.log('Guardando/creando opción con idOpcion:', idOpcionActual, 'y usuario:', usuario);

        const data = {
            nombre: $("#modal-nombre").val(),
            descripcion: $("#modal-descripcion").val(),
            idgrupo: parseInt($("#modal-tipo-grupo").val()), // ✅ Usar el valor del combo
            vista: $("#modal-etiqueta").val() || "sin vista",
            idUsuarioCreacion: 1,
            fechaCreacion: new Date().toISOString(),
            idUsuarioModificacion: 1,
            fechaModificacion: new Date().toISOString(),
            idEstado: $("#modal-activo").is(":checked") ? 1 : 0,
            idtiposervicio: parseInt($("#modal-tipo-servicio").val())
        };

        if (isCrear) {
            data.idUsuarioCreacion = 1;
            data.fechaCreacion = new Date().toISOString();
        }

        const url = id ? `${window.apiBaseUrl}/api/Opciones/actualizar/${id}`
            : `${window.apiBaseUrl}/api/Opciones/insertar`;

        const method = id ? "PUT" : "POST";

        console.log("data antes de enviar: ", data);
        return;
        $.ajax({
            url: url,
            type: method,
            contentType: "application/json",
            data: JSON.stringify(data),
            headers: {
                "idopcion": String(idOpcionActual), // ✅ DINÁMICO
                "usuario": usuario                   // ✅ DINÁMICO
            },
            success: function (response) {
                $("#editarModal").modal("hide");

                Swal.fire({
                    icon: 'success',
                    title: '¡Guardado!',
                    text: 'El registro se ha guardado correctamente.',
                    showConfirmButton: false,
                    timer: 1500
                });

                if (!isCrear && id) {
                    ultimaFilaModificada = id;
                }

                // Recargar la lista con headers dinámicos
                cargarOpcionesLista(usuario);
            },
            error: function (xhr, status, error) {
                const mensaje = id ? "actualizar" : "guardar";
                console.error(`Error al ${mensaje}:`, error);
                console.error("Detalles del error:", xhr.responseText);

                Swal.fire({
                    icon: 'error',
                    title: 'Oops...',
                    text: `¡Algo salió mal al ${mensaje} el registro!`
                });
            }
        });
    });

    // Marcar fila al hacer clic en editar
    $('body').on('click', '.edit-btn', function (e) {
        e.stopPropagation();
        const $fila = $(this).closest('tr');
        const id = $fila.find('td:first').text().trim();
        if (typeof marcarFilaPorId === 'function') {
            marcarFilaPorId('#tabla-curso', id);
        }
        ultimaFilaModificada = id;
        console.log('Botón editar clickeado, fila marcada:', id);
    });

    // Marcar fila al hacer clic en eliminar
    $('body').on('click', '.delete-btn', function (e) {
        e.stopPropagation();
        const $fila = $(this).closest('tr');
        const id = $fila.find('td:first').text().trim();
        if (typeof marcarFilaPorId === 'function') {
            marcarFilaPorId('#tabla-curso', id);
        }
        ultimaFilaModificada = id;
        console.log('Botón eliminar clickeado, fila marcada:', id);
    });

}); // FIN document.ready


// ===================================================================
// ===== FUNCIONES GLOBALES =====
// ===================================================================

function cargarOpcionesLista(usuario) {
    $.ajax({
        url: `${window.apiBaseUrl}/api/Opciones/listar/${usuario}`,
        method: "GET",
        /*
        headers: {
            "idopcion": String(idOpcionActual), // ✅ DINÁMICO
            "usuario": usuario                   // ✅ DINÁMICO
        },
        */
        success: function (data) {
            console.log("Datos de opciones cargados:", data);
            crearListado(data);
        },
        error: function (xhr, status, error) {
            console.error("Error al obtener opciones:", error);
            console.error("Detalles del error:", xhr.responseText);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudieron cargar las opciones'
            });
        }
    });
}


/**
 * Cargar Tipos de Servicio
 */
function cargarTiposServicio(callback) {
    // ✅ OBTENER EL IDOPCION DINÁMICAMENTE
    const idOpcionActual = window.obtenerIdOpcionActual();
    const usuario = obtenerUsuarioActual();

    if (!idOpcionActual) {
        console.error("No se pudo obtener el idOpcion para cargar tipos de servicio");
        return;
    }

    const etiqueta = "TIPOSERVICIO";

    console.log('Cargando tipos de servicio con idOpcion:', idOpcionActual, 'y usuario:', usuario);

    $.ajax({
        url: `${window.apiBaseUrl}/api/Opciones/ConsultarCombos/${etiqueta}`,
        method: "GET",
        headers: {
            "idopcion": String(idOpcionActual), // ✅ DINÁMICO
            "usuario": usuario                   // ✅ DINÁMICO
        },
        success: function (data) {
            console.log("Tipos de servicio cargados:", data);

            $("#modal-tipo-servicio").empty();

            if (data && data.length > 0) {
                data.forEach(function (item) {
                    $("#modal-tipo-servicio").append(
                        $('<option></option>')
                            .val(item.idcatalogo)
                            .text(item.nombre_catalogo)
                    );
                });
            }

            if (callback && typeof callback === 'function') {
                callback();
            }
        },
        error: function (xhr, status, error) {
            console.error("Error al cargar tipos de servicio:", error);
            console.error("Detalles del error:", xhr.responseText);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudieron cargar los tipos de servicio'
            });
        }
    });
}

/**
 * Cargar Tipos de Grupo
 */
function cargarTipoGrupo(callback) {
    // ✅ OBTENER EL IDOPCION DINÁMICAMENTE
    const idOpcionActual = window.obtenerIdOpcionActual();
    const usuario = obtenerUsuarioActual();

    if (!idOpcionActual) {
        console.error("No se pudo obtener el idOpcion para cargar tipos de grupo");
        return;
    }

    const etiqueta = "GRUPOOPCION";

    console.log('Cargando tipos de grupo con idOpcion:', idOpcionActual, 'y usuario:', usuario);

    $.ajax({
        url: `${window.apiBaseUrl}/api/Opciones/ConsultarCombos/${etiqueta}`,
        method: "GET",
        headers: {
            "idopcion": String(idOpcionActual), // ✅ DINÁMICO
            "usuario": usuario                   // ✅ DINÁMICO
        },
        success: function (data) {
            console.log("Tipos de grupo cargados:", data);

            $("#modal-tipo-grupo").empty();

            if (data && data.length > 0) {
                data.forEach(function (item) {
                    $("#modal-tipo-grupo").append(
                        $('<option></option>')
                            .val(item.idcatalogo)
                            .text(item.nombre_catalogo)
                    );
                });
            }

            if (callback && typeof callback === 'function') {
                callback();
            }
        },
        error: function (xhr, status, error) {
            console.error("Error al cargar tipos de grupo:", error);
            console.error("Detalles del error:", xhr.responseText);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudieron cargar los tipos de grupo'
            });
        }
    });
}

/**
 * Crear el listado de opciones en DataTable
 */
function crearListado(data) {
    if (tabla) {
        tabla.destroy();
    }

    var html = "";
    html += "<table id='tabla-curso' class='table table-striped display'>";
    html += "  <thead><tr><th>ID</th><th>Nombre</th><th>Descripcion</th><th>Opciones</th></tr></thead>";
    html += "  <tbody>";

    if (!data || data.length === 0) {
        html += "<tr><td colspan='4' class='text-center'>Sin datos</td></tr>";
    } else {
        for (var i = 0; i < data.length; i++) {
            var c = data[i];
            var id = c.idopcion;

            var editButton = '<button type="button" class="btn-action edit-btn" title="Editar" onclick="abrirModalEditar(' + id + ')">' +
                '<i class="fa-regular fa-pen-to-square"></i>' +
                '</button>';

            var deleteButton = '<button type="button" class="btn-action delete-btn" title="Eliminar" onclick="confirmDelete(' + id + ')">' +
                '<i class="fa-regular fa-trash-can"></i>' +
                '</button>';

            var optionsHtml = '<div class="action-buttons">' + editButton + deleteButton + '</div>';

            html += "<tr>";
            html += "  <td>" + (c.idopcion ?? "") + "</td>";
            html += "  <td>" + (c.nombre ?? "") + "</td>";
            html += "  <td>" + (c.descripcion ?? "") + "</td>";
            html += "  <td>" + optionsHtml + "</td>";
            html += "</tr>";
        }
    }

    html += "  </tbody>";
    html += "</table>";

    $('#tabla').html(html);

    tabla = $('#tabla-curso').DataTable({
        pageLength: 5,
        lengthMenu: [5, 10, 50],
        pagingType: 'full_numbers',
        columnDefs: [
            { targets: 0, width: "5%", className: "dt-left" },
            { targets: 3, width: "10%", className: "dt-center", orderable: false },
            { targets: 2, width: "60%" }
        ],
        language: {
            decimal: "",
            emptyTable: "No hay datos disponibles en la tabla",
            info: "Mostrando _START_ a _END_ de _TOTAL_ registros",
            infoEmpty: "Mostrando 0 a 0 de 0 registros",
            infoFiltered: "(filtrado de _MAX_ registros totales)",
            infoPostFix: "",
            thousands: ",",
            lengthMenu: "Mostrar _MENU_ registros",
            loadingRecords: "Cargando...",
            processing: "Procesando...",
            search: "Buscar:",
            zeroRecords: "No se encontraron registros coincidentes",
            paginate: {
                first: "Primero",
                last: "Último",
                next: "Siguiente",
                previous: "Anterior"
            },
            aria: {
                sortAscending: ": activar para ordenar la columna de manera ascendente",
                sortDescending: ": activar para ordenar la columna de manera descendente"
            }
        },
        drawCallback: function () {
            if (ultimaFilaModificada !== null) {
                if (typeof marcarFilaPorId === 'function') {
                    marcarFilaPorId('#tabla-curso', ultimaFilaModificada);
                }
            }
        }
    });

    console.log('Llamando a inicializarMarcadoFilas para Opciones');
    if (typeof inicializarMarcadoFilas === 'function') {
        inicializarMarcadoFilas('#tabla-curso');
    }

    const addButtonHtml = `
        <button type="button" class="btn btn-primary ms-2" id="btnAgregarNuevo" title="Agregar Nuevo" style="height: 38px;">
            <i class="fa-solid fa-plus"></i>
        </button>
    `;

    const lengthContainer = $('#tabla-curso_length');
    lengthContainer.find('#btnAgregarNuevo').remove();
    lengthContainer.prepend(addButtonHtml);
    lengthContainer.css('display', 'flex').css('align-items', 'center');
}

/**
 * Abrir modal para editar una opción
 */
function abrirModalEditar(id) {
    // ✅ OBTENER EL IDOPCION DINÁMICAMENTE
    const idOpcionActual = window.obtenerIdOpcionActual();
    const usuario = obtenerUsuarioActual();

    if (!idOpcionActual) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo obtener el ID de la opción. Por favor, acceda nuevamente desde el menú.'
        });
        return;
    }

    console.log('Abriendo modal para editar opción ID:', id, 'con idOpcion:', idOpcionActual, 'y usuario:', usuario);

    $('#formEditar')[0].reset();
    $('#modal-idOpcion').val(id);

    // Configurar el modal para edición
    $('#editarModalLabel').text('Editar Opción');
    $('#btnGuardarCambios')
        .html('<i class="fa-solid fa-pen-to-square me-2"></i> Modificar')
        .removeClass('btn-success')
        .addClass('btn-primary');

    // Cargar Tipos de Servicio y en su callback cargar la data
    cargarTiposServicio(function () {
        // Cargar Tipos de Grupo
        cargarTipoGrupo(function () {
            // Obtener y setear los datos de la opción
            $.ajax({
                url: `${window.apiBaseUrl}/api/Opciones/obtener/${id}`,
                method: "GET",
                headers: {
                    "idopcion": String(idOpcionActual), // ✅ DINÁMICO
                    "usuario": usuario                   // ✅ DINÁMICO
                },
                success: function (data) {
                    console.log("Datos de la opción cargados:", data);

                    $("#modal-id").val(data.idopcion);
                    $("#modal-nombre").val(data.nombre);
                    $("#modal-descripcion").val(data.descripcion);
                    $("#modal-activo").prop("checked", data.idestado === 1);
                    $("#modal-etiqueta").val(data.idetiqueta);
                    $("#modal-vista").val(data.vista);

                    // Seleccionar los valores correspondientes
                    $("#modal-tipo-servicio").val(data.idtiposervicio);
                    $("#modal-tipo-grupo").val(data.idgrupo);

                    var editarModal = new bootstrap.Modal(document.getElementById('editarModal'));
                    editarModal.show();
                },
                error: function (xhr, status, error) {
                    console.error("Error al obtener datos de la opción:", error);
                    console.error("Detalles del error:", xhr.responseText);
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'No se pudieron cargar los datos de la opción'
                    });
                }
            });
        });
    });
}

/**
 * Abrir modal para crear nueva opción
 */
function abrirModalCrear() {
    console.log('Abriendo modal para crear nueva opción');

    $('#formEditar')[0].reset();
    $('#modal-idOpcion').val(''); // Limpia el ID para 'crear'

    // Configurar el modal para creación
    $('#editarModalLabel').text('Crear Nueva Opción');
    $('#btnGuardarCambios')
        .html('<i class="fa-solid fa-plus me-2"></i> Crear')
        .removeClass('btn-primary')
        .addClass('btn-success');

    // Cargar los combos y luego mostrar el modal
    cargarTiposServicio(function () {
        cargarTipoGrupo(function () {
            var crearModal = new bootstrap.Modal(document.getElementById('editarModal'));
            crearModal.show();
        });
    });
}

/**
 * Confirmar eliminación de opción
 */
function confirmDelete(id) {
    // ✅ OBTENER EL IDOPCION DINÁMICAMENTE
    const idOpcionActual = window.obtenerIdOpcionActual();
    const usuario = obtenerUsuarioActual();

    if (!idOpcionActual) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo obtener el ID de la opción. Por favor, acceda nuevamente desde el menú.'
        });
        return;
    }

    console.log('Confirmando eliminación de opción ID:', id, 'con idOpcion:', idOpcionActual, 'y usuario:', usuario);

    Swal.fire({
        title: 'Confirmar Eliminación',
        text: "¿Estás seguro de que deseas eliminar el registro con ID: " + id + "?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#009845',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, Eliminar',
        cancelButtonText: 'Cancelar',
    }).then((result) => {
        if (result.isConfirmed) {
            $.ajax({
                url: `${window.apiBaseUrl}/api/Opciones/eliminar/${id}`,
                type: "DELETE",
                headers: {
                    "idopcion": String(idOpcionActual), // ✅ DINÁMICO
                    "usuario": usuario                   // ✅ DINÁMICO
                },
                success: function () {
                    Swal.fire({
                        icon: 'success',
                        title: '¡Eliminado!',
                        text: 'El registro se ha eliminado correctamente.',
                        showConfirmButton: false,
                        timer: 1500
                    });

                    ultimaFilaModificada = null;
                    if (typeof limpiarSeleccion === 'function') {
                        limpiarSeleccion('#tabla-curso');
                    }

                    // Recargar la lista con headers dinámicos
                    cargarOpcionesLista(usuario);
                },
                error: function (xhr, status, error) {
                    console.error("Error al eliminar:", error);
                    console.error("Detalles del error:", xhr.responseText);
                    Swal.fire({
                        icon: 'error',
                        title: 'Oops...',
                        text: '¡Algo salió mal al eliminar el registro!'
                    });
                }
            });
        }
    });
}