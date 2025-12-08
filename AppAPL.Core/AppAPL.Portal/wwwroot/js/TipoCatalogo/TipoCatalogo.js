// ~/js/TipoCatalogo/TipoCatalogo.js

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

    console.log("=== INICIO DE CARGA DE PÁGINA - TipoCatalogo ===");
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
            console.error("No se pudo obtener el idOpcion para listar tipo catálogo");
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo obtener el ID de la opción. Por favor, acceda nuevamente desde el menú.'
            });
            return;
        }

        console.log('Cargando tipo catálogo con idOpcion:', idOpcionActual, 'y usuario:', usuario);

        $.ajax({
            url: `${apiBaseUrl}/api/CatalogoTipo/listar`,
            method: "GET",
            headers: {
                "idopcion": String(idOpcionActual), // ✅ DINÁMICO
                "usuario": usuario                   // ✅ DINÁMICO
            },
            success: function (data) {
                console.log("Datos de tipo catálogo cargados:", data);
                crearListado(data);
            },
            error: function (xhr, status, error) {
                console.error("Error al obtener tipo catálogo:", error);
                console.error("Detalles del error:", xhr.responseText);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se pudieron cargar los tipos de catálogo'
                });
            }
        });
    });

    // Delegación para el botón "Agregar Nuevo"
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

    // Lógica para el cierre del modal
    $('#editarModal').on('hidden.bs.modal', function () {
        $('#editarModalLabel').text('Editar Tipo de Catálogo');
        $('#btnGuardarCambios')
            .html('<i class="fa-solid fa-pen-to-square me-2"></i> Modificar')
            .removeClass('btn-success')
            .addClass('btn-primary');
    });

    // Lógica para Guardar o Crear
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

        const id = $("#modal-idCatalogoTipo").val();
        const isCrear = !id;

        console.log('Guardando/creando tipo catálogo con idOpcion:', idOpcionActual, 'y usuario:', usuario);

        const data = {
            nombre: $("#modal-nombre").val(),
            descripcion: $("#modal-descripcion").val(),
            idusuariocreacion: 1,
            fechacreacion: new Date().toISOString(),
            idusuariomodificacion: 1,
            fechamodificacion: new Date().toISOString(),
            idestado: $("#modal-activo").is(":checked") ? 1 : 0,
            idmarcaabreviaturaautomatica: 1,
            idetiqueta: $("#modal-etiqueta").val()
        };

        if (isCrear) {
            data.idusuariocreacion = 1;
            data.fechacreacion = new Date().toISOString();
        }

        const url = id ? `${window.apiBaseUrl}/api/CatalogoTipo/actualizar/${id}`
            : `${window.apiBaseUrl}/api/CatalogoTipo/insertar`;

        const method = id ? "PUT" : "POST";

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

                // ✅ RECARGAR CON HEADERS DINÁMICOS
                $.ajax({
                    url: `${window.apiBaseUrl}/api/CatalogoTipo/listar`,
                    method: "GET",
                    headers: {
                        "idopcion": String(idOpcionActual), // ✅ DINÁMICO
                        "usuario": usuario                   // ✅ DINÁMICO
                    },
                    success: function (data) {
                        crearListado(data);
                    },
                    error: function (xhr, status, error) {
                        console.error("Error al recargar tipo catálogo:", error);
                        console.error("Detalles del error:", xhr.responseText);
                    }
                });
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

    // Cuando el mouse entra en el div de los botones
    $('#tabla').on('mouseenter', '.action-buttons', function () {
        $(this).closest('tr').addClass('fila-marcada');
    });

    // Cuando el mouse sale del div de los botones
    $('#tabla').on('mouseleave', '.action-buttons', function () {
        $(this).closest('tr').removeClass('fila-marcada');
    });

    // Cuando se hace clic en el botón de editar
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

    // Cuando se hace clic en el botón de eliminar
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

function crearListado(data) {
    if (tabla) {
        tabla.destroy();
    }

    console.log("data de tipo catalogo", data);
    var html = "";
    html += "<table id='tabla-curso' class='table table-striped display'>";
    html += "  <thead><tr><th>ID</th><th>Nombre</th><th>Descripción</th><th>Opciones</th></tr></thead>";
    html += "  <tbody>";

    if (!data || data.length === 0) {
        html += "<tr><td colspan='4' class='text-center'>Sin datos</td></tr>";
    } else {
        for (var i = 0; i < data.length; i++) {
            var c = data[i];
            var id = c.idcatalogotipo;

            var editButton = '<button type="button" class="btn-action edit-btn" title="Editar" onclick="abrirModalEditar(' + id + ')">' +
                '<i class="fa-regular fa-pen-to-square"></i>' +
                '</button>';

            var deleteButton = '<button type="button" class="btn-action delete-btn" title="Eliminar" onclick="confirmDelete(' + id + ')">' +
                '<i class="fa-regular fa-trash-can"></i>' +
                '</button>';

            var optionsHtml = '<div class="action-buttons">' + editButton + deleteButton + '</div>';

            html += "<tr>";
            html += "  <td>" + (c.idcatalogotipo ?? "") + "</td>";
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

    console.log('Llamando a inicializarMarcadoFilas para TipoCatalogo');
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
 * Abrir modal para editar tipo de catálogo
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

    console.log('Abriendo modal para editar tipo catálogo ID:', id, 'con idOpcion:', idOpcionActual, 'y usuario:', usuario);

    $('#formEditar')[0].reset();
    $('#modal-idCatalogoTipo').val(id);
    $('#editarModalLabel').text('Editar Tipo de Catálogo');
    $('#btnGuardarCambios')
        .html('<i class="fa-solid fa-pen-to-square me-2"></i> Modificar')
        .removeClass('btn-success')
        .addClass('btn-primary');

    $.ajax({
        url: `${window.apiBaseUrl}/api/CatalogoTipo/obtener/${id}`,
        method: "GET",
        headers: {
            "idopcion": String(idOpcionActual), // ✅ DINÁMICO
            "usuario": usuario                   // ✅ DINÁMICO
        },
        success: function (data) {
            console.log("Datos del tipo catálogo cargados:", data);

            $("#modal-id").val(data.idcatalogotipo);
            $("#modal-nombre").val(data.nombre);
            $("#modal-descripcion").val(data.descripcion);
            $("#modal-activo").prop("checked", data.idestado === 1);
            $("#modal-etiqueta").val(data.idetiqueta);

            var editarModal = new bootstrap.Modal(document.getElementById('editarModal'));
            editarModal.show();
        },
        error: function (xhr, status, error) {
            console.error("Error al obtener datos del tipo catálogo:", error);
            console.error("Detalles del error:", xhr.responseText);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudieron cargar los datos del tipo de catálogo'
            });
        }
    });
}

/**
 * Abrir modal para crear nuevo tipo de catálogo
 */
function abrirModalCrear() {
    console.log('Abriendo modal para crear nuevo tipo catálogo');

    $('#formEditar')[0].reset();
    $('#modal-idcatalogotipo').val('');
    $('#editarModalLabel').text('Crear Nuevo Tipo de Catálogo');
    $('#btnGuardarCambios')
        .html('<i class="fa-solid fa-plus me-2"></i> Crear')
        .removeClass('btn-primary')
        .addClass('btn-success');

    var crearModal = new bootstrap.Modal(document.getElementById('editarModal'));
    crearModal.show();
}

/**
 * Confirmar eliminación de tipo de catálogo
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

    console.log('Confirmando eliminación de tipo catálogo ID:', id, 'con idOpcion:', idOpcionActual, 'y usuario:', usuario);

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
                url: `${window.apiBaseUrl}/api/CatalogoTipo/eliminar/${id}`,
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

                    // ✅ RECARGAR CON HEADERS DINÁMICOS
                    $.ajax({
                        url: `${window.apiBaseUrl}/api/CatalogoTipo/listar`,
                        method: "GET",
                        headers: {
                            "idopcion": String(idOpcionActual), // ✅ DINÁMICO
                            "usuario": usuario                   // ✅ DINÁMICO
                        },
                        success: function (data) {
                            crearListado(data);
                        },
                        error: function (xhr, status, error) {
                            console.error("Error al recargar tipo catálogo:", error);
                            console.error("Detalles del error:", xhr.responseText);
                        }
                    });
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