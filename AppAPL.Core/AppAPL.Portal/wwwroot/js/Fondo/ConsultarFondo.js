// ~/js/Fondo/ConsultarFondo.js

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

    console.log("=== INICIO DE CARGA DE PÁGINA - ConsultarFondo ===");
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

        cargarTipoFondo();
        cargarBandeja();
    });

    /**
     * Carga la bandeja principal de fondos.
     */
    function cargarBandeja() {
        // ✅ OBTENER EL IDOPCION DINÁMICAMENTE
        const idOpcionActual = window.obtenerIdOpcionActual();

        if (!idOpcionActual) {
            console.error("No se pudo obtener el idOpcion para cargar la bandeja");
            return;
        }

        const usuario = obtenerUsuarioActual(); // ✅ USAR FUNCIÓN ROBUSTA
        const apiBaseUrl = window.apiBaseUrl;

        console.log('Cargando bandeja con idOpcion:', idOpcionActual, 'y usuario:', usuario);

        $.ajax({
            url: `${apiBaseUrl}/api/Fondo/listar`,
            method: "GET",
            headers: {
                "idopcion": String(idOpcionActual), // ✅ DINÁMICO
                "nombreusuario": window.usuarioActual,                  // ✅ DINÁMICO
                "idcontrolinterfaz": "BTNCONSULTAR",
                "idevento": "EVCLICK",
            },
            success: function (data) {
                console.log("Bandeja cargada:", data);
                crearListado(data);
            },
            error: function (xhr, status, error) {
                console.error("Error al obtener datos de fondos:", error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se pudieron cargar los fondos'
                });
            }
        });
    }

    /**
     * Carga el select de Tipos de Fondo.
     */
    function cargarTipoFondo() {
        // ✅ OBTENER EL IDOPCION DINÁMICAMENTE
        const idOpcionActual = window.obtenerIdOpcionActual();

        if (!idOpcionActual) {
            console.error("No se pudo obtener el idOpcion para cargar tipos de fondo");
            return;
        }

        const usuario = obtenerUsuarioActual(); // ✅ USAR FUNCIÓN ROBUSTA
        const etiqueta = "TIPOFONDO";

        console.log('Cargando tipos de fondo con idOpcion:', idOpcionActual, 'y usuario:', usuario);

        $.ajax({
            url: `${window.apiBaseUrl}/api/Opciones/ConsultarCombos/${etiqueta}`,
            method: "GET",
            headers: {
                "idopcion": String(idOpcionActual), // ✅ DINÁMICO
                "usuario": usuario                   // ✅ DINÁMICO
            },
            success: function (data) {
                console.log("Tipos de fondo cargados:", data);

                const $selectFondoTipo = $("#modal-fondo-tipofondo");
                $selectFondoTipo.empty();
                $selectFondoTipo.append($('<option></option>').val("").text("Seleccione..."));

                if (data && data.length > 0) {
                    data.forEach(function (item) {
                        $selectFondoTipo.append(
                            $('<option></option>')
                                .val(item.idcatalogo)
                                .text(item.nombre_catalogo)
                        );
                    });
                }
            },
            error: function (xhr, status, error) {
                console.error("Error al cargar tipos de fondo:", error);
                console.error("Detalles del error:", xhr.responseText);
            }
        });
    }

    // ===== BOTÓN LIMPIAR =====
    $('body').on('click', '#btnLimpiar', function () {
        if (tabla) {
            tabla.search('').draw();
            tabla.page(0).draw('page');
            ultimaFilaModificada = null;
            if (typeof limpiarSeleccion === 'function') {
                limpiarSeleccion('#tabla-principal');
            }
        }
    });

    // Disparador para cargar los proveedores cuando se abre el modal
    $('#modalConsultaProveedor').on('show.bs.modal', function (event) {
        consultarProveedor();
    });

    // Lógica para el botón 'Aceptar' del modal de proveedores (Modificación)
    $("#btnAceptarProveedorModificar").on("click", function () {
        const $selected = $("#tablaProveedores tbody input[name='selectProveedor']:checked");

        if ($selected.length > 0) {
            const proveedorNombre = $selected.data("nombre");
            const proveedorRuc = $selected.data("ruc");

            // Concatenación para el input de EDICIÓN: RUC - Nombre
            const textoVisible = `${proveedorRuc} - ${proveedorNombre}`;

            console.log("Proveedor seleccionado para modificar:", { nombre: proveedorNombre, ruc: proveedorRuc });

            // 1. Llenamos el campo de texto visible (RUC - Nombre)
            $("#modal-fondo-proveedor").val(textoVisible);
            // 2. Llenamos el campo oculto (ID/RUC) que se usará al guardar
            $("#modal-fondo-idproveedor-hidden").val(proveedorRuc);

            // 3. Ocultar el modal
            $('#modalConsultaProveedor').modal('hide');

        } else {
            Swal.fire('Atención', 'Por favor, seleccione un proveedor de la lista.', 'info');
        }
    });

}); // FIN document.ready

// ===================================================================
// ===== FUNCIONES GLOBALES (Datatables, Abrir/Cerrar Modal) =====
// ===================================================================

function crearListado(data) {
    if (tabla) {
        tabla.destroy();
    }

    var html = "";
    html += "<table id='tabla-principal' class='table table-bordered table-striped table-hover'>";

    html += "  <thead>";

    // Fila del Título ROJO
    html += "    <tr>";
    html += "      <th colspan='13' style='background-color: #CC0000 !important; color: white; text-align: center; font-weight: bold; padding: 8px; font-size: 1rem;'>";
    html += "          BANDEJA DE CONSULTA DE FONDOS";
    html += "      </th>";
    html += "    </tr>";
    // Fila de las Cabeceras
    html += "    <tr>";
    html += "      <th>Acción</th>";
    html += "      <th>IDFondo</th>";
    html += "      <th>Descripción</th>";
    html += "      <th>RUC</th>";
    html += "      <th>Proveedor</th>";
    html += "      <th>Tipo Fondo</th>";
    html += "      <th>$ Fondo</th>";
    html += "      <th>Fecha Inicio</th>";
    html += "      <th>Fecha Fin</th>";
    html += "      <th>$ Disponible</th>";
    html += "      <th>$ Comprometido</th>";
    html += "      <th>$ Liquidado</th>";
    html += "      <th>Estado</th>";
    html += "    </tr>";
    html += "  </thead>";
    html += "  <tbody>";

    if (data && data.length > 0) {
        for (var i = 0; i < data.length; i++) {
            var fondo = data[i];
            var id = fondo.idfondo;

            var viewButton = '<button type="button" class="btn-action edit-btn" title="Visualizar" onclick="abrirModalEditar(' + id + ')">' +
                '<i class="fa-regular fa-pen-to-square"></i>' +
                '</button>';

            html += "<tr>";
            html += "  <td class='text-center'>" + viewButton + "</td>";
            html += "  <td>" + (fondo.idfondo ?? "") + "</td>";
            html += "  <td>" + (fondo.descripcion ?? "") + "</td>";
            html += "  <td>" + (fondo.idproveedor ?? "") + "</td>";
            html += "  <td>" + (fondo.nombre_proveedor ?? "") + "</td>";
            html += "  <td>" + (fondo.idtipofondo ?? "") + "</td>";
            html += "  <td class='text-end'>" + formatearMoneda(fondo.valorfondo) + "</td>";
            html += "  <td class='text-center'>" + formatearFecha(fondo.fechainiciovigencia) + "</td>";
            html += "  <td class='text-center'>" + formatearFecha(fondo.fechafinvigencia) + "</td>";
            html += "  <td class='text-end'>" + formatearMoneda(fondo.valordisponible) + "</td>";
            html += "  <td class='text-end'>" + formatearMoneda(fondo.valorcomprometido) + "</td>";
            html += "  <td class='text-end'>" + formatearMoneda(fondo.valorliquidado) + "</td>";
            html += "  <td>" + (fondo.estado_nombre ?? "") + "</td>";
            html += "</tr>";
        }
    }

    html += "  </tbody>";
    html += "</table>";

    // Inserta la tabla en el div
    $('#tabla').html(html);

    // Inicializa DataTable
    tabla = $('#tabla-principal').DataTable({
        pageLength: 10,
        lengthMenu: [5, 10, 25, 50],
        pagingType: 'full_numbers',
        columnDefs: [
            { targets: 0, width: "8%", className: "dt-center", orderable: false },
            { targets: 1, width: "6%", className: "dt-center" },
            { targets: [6, 9, 10, 11], className: "dt-right" },
            { targets: [7, 8], className: "dt-center" },
        ],
        order: [[1, 'desc']],
        language: {
            emptyTable: "Sin datos",
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
            }
        },
        drawCallback: function () {
            if (ultimaFilaModificada !== null) {
                if (typeof marcarFilaPorId === 'function') {
                    marcarFilaPorId('#tabla-principal', ultimaFilaModificada);
                }
            }
        }
    });

    console.log('Llamando a inicializarMarcadoFilas para Fondos');
    if (typeof inicializarMarcadoFilas === 'function') {
        inicializarMarcadoFilas('#tabla-principal');
    }
}

/**
 * Abre el modal de VISUALIZACIÓN o EDICIÓN y carga los datos del fondo para editar.
 */
function abrirModalEditar(id) {
    // ✅ OBTENER EL IDOPCION DINÁMICAMENTE
    const idOpcionActual = window.obtenerIdOpcionActual();
    if (!idOpcionActual) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo obtener el ID de la opción. Por favor, acceda nuevamente desde el menú.'
        });
        return;
    }
    const usuario = obtenerUsuarioActual(); // ✅ USAR FUNCIÓN ROBUSTA
    console.log('Abriendo modal para visualizar fondo ID:', id, 'con idOpcion:', idOpcionActual, 'y usuario:', usuario);

    // 1. Cargar la tabla de acuerdos
    if (typeof cargarAcuerdoFondo === 'function') {
        cargarAcuerdoFondo(id);
    }

    // 2. Llama a la API para obtener los datos del fondo por ID
    $.ajax({
        url: `${window.apiBaseUrl}/api/Fondo/obtener/${id}`,
        method: "GET",
        headers: {
            "idopcion": String(idOpcionActual), // ✅ DINÁMICO
            "usuario": usuario,                  // ✅ DINÁMICO
            "idcontrolinterfaz": "0",
            "idevento": "0",
            "entidad": "0",
            "identidad": "0",
            "idtipoproceso": "0"
        },
        success: function (data) {
            // Concatenación RUC/ID y NOMBRE
            const idProveedor = data.proveedor || '';
            const nombreProveedor = data.nombre_proveedor || '';
            const proveedorCompleto = (idProveedor && nombreProveedor)
                ? `${idProveedor} - ${nombreProveedor}`
                : idProveedor || nombreProveedor || '';

            // 3. Preparar los datos para el modal
            const datosModal = {
                idfondo: data.idfondo,
                descripcion: data.descripcion,
                proveedor: proveedorCompleto,
                idproveedor: idProveedor,
                nombre_proveedor: nombreProveedor,
                tipo_fondo: data.nombre_tipo_fondo,
                valor_disponible: formatearMoneda(data.valor_disponible),
                valor_comprometido: formatearMoneda(data.valor_comprometido),
                valor_liquidado: formatearMoneda(data.valor_liquidado),
                valor_fondo: formatearMoneda(data.valor_fondo),  // ✅ CAMBIO AQUÍ
                fecha_inicio: formatDateForInput(data.fecha_inicio),
                fecha_fin: formatDateForInput(data.fecha_fin),
                estado: data.estado_nombre
            };

            console.log("datosModal:", datosModal);
            abrirModalFondo(datosModal);
        },
        error: function (xhr, status, error) {
            console.error("Error al obtener datos del fondo:", error);
            console.error("Detalles del error:", xhr.responseText);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudieron cargar los datos del fondo.'
            });
        }
    });
}

/**
 * Función para abrir el modal personalizado (modalVisualizarFondo)
 */
function abrirModalFondo(datos) {
    const modal = document.getElementById('modalVisualizarFondo');

    document.getElementById('modal-fondo-id').value = datos.idfondo || '';
    document.getElementById('modal-fondo-descripcion').value = datos.descripcion || '';
    document.getElementById('modal-fondo-proveedor').value = datos.proveedor || '';
    document.getElementById('modal-fondo-tipofondo').value = datos.tipo_fondo || '';
    document.getElementById('modal-fondo-fechainicio').value = datos.fecha_inicio || '';
    document.getElementById('modal-fondo-fechafin').value = datos.fecha_fin || '';
    document.getElementById('modal-fondo-valor').value = datos.valor_fondo || '';
    document.getElementById('modal-fondo-estado').value = datos.estado || '';
    document.getElementById('modal-fondo-disponible').value = datos.valor_disponible ?? '';
    document.getElementById('modal-fondo-comprometido').value = datos.valor_comprometido ?? '';
    document.getElementById('modal-fondo-liquidado').value = datos.valor_liquidado ?? '';

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

/**
 * Función para cerrar el modal personalizado
 */
function cerrarModalFondo() {
    const modalVisualizar = document.getElementById('modalVisualizarFondo');
    if (modalVisualizar) {
        modalVisualizar.classList.remove('active');
    }

    const modalEditar = document.getElementById('modalEditarFondo');
    if (modalEditar) {
        modalEditar.classList.remove('active');
        document.getElementById('formEditarFondo').reset();
    }

    document.body.style.overflow = 'auto';
}

/**
 * Función para guardar los cambios del fondo
 */
function guardarCambiosFondo() {
    // ✅ OBTENER EL IDOPCION DINÁMICAMENTE
    const idOpcionActual = window.obtenerIdOpcionActual();

    if (!idOpcionActual) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo obtener el ID de la opción. Por favor, acceda nuevamente desde el menú.'
        });
        return;
    }

    // ✅ OBTENER EL USUARIO DINÁMICAMENTE
    const usuario = obtenerUsuarioActual();

    console.log('Guardando cambios con idOpcion:', idOpcionActual, 'y usuario:', usuario);

    const id = $("#modal-fondo-id").val();
    const dataParaGuardar = {
        descripcion: $("#modal-fondo-descripcion").val(),
        idproveedor: $("#modal-fondo-idproveedor-hidden").val(),
        idtipofondo: parseInt($("#modal-fondo-tipofondo").val()),
        valorfondo: parseFloat($("#modal-fondo-valor").val()),
        fechainiciovigencia: $("#modal-fondo-fechainicio").val(),
        fechafinvigencia: $("#modal-fondo-fechafin").val(),
        idusuariomodifica: usuario,           // ✅ DINÁMICO
        nombreusuariomodifica: usuario,       // ✅ DINÁMICO
        idopcion: idOpcionActual,             // ✅ DINÁMICO
        idcontrolinterfaz: 0,
        idevento: 29
    };

    console.log("datos a guardar:", dataParaGuardar);

    $.ajax({
        url: `${window.apiBaseUrl}/api/Fondo/actualizar/${id}`,
        method: "PUT",
        headers: {
            "idopcion": String(idOpcionActual), // ✅ DINÁMICO
            "usuario": usuario                   // ✅ DINÁMICO
        },
        data: JSON.stringify(dataParaGuardar),
        contentType: "application/json",
        success: function (response) {
            Swal.fire({
                icon: 'success',
                title: 'Éxito',
                text: 'Fondo actualizado correctamente'
            });
            cerrarModalFondo();

            // Recargar tabla - necesitamos llamar a la función dentro del ready
            // Como cargarBandeja está dentro del ready, recargamos la página o la exponemos
            if (window.location) {
                window.location.reload();
            }
        },
        error: function (xhr, status, error) {
            console.error("Error al guardar:", xhr.responseText);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: xhr.responseJSON?.mensaje || 'Error al guardar'
            });
            cerrarModalFondo();
        }
    });
}

// ===================================================================
// ===== FUNCIONES UTILITARIAS (Formato) =====
// ===================================================================

/**
 * Convierte una fecha/hora al formato "YYYY-MM-DD"
 */
function formatDateForInput(fechaString) {
    if (!fechaString) {
        return "";
    }
    return fechaString.split('T')[0];
}

/**
 * Formatea un número como moneda
 */
function formatearMoneda(valor) {
    var numero = parseFloat(valor);
    if (isNaN(numero) || valor === null || valor === undefined) {
        return "$ 0.00";
    }

    return '$ ' + numero.toLocaleString('es-EC', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

/**
 * Formatea la fecha al formato DD/MM/YYYY
 */
function formatearFecha(fechaString) {
    try {
        if (!fechaString) return '';

        var fecha = new Date(fechaString);
        if (isNaN(fecha)) return fechaString;

        var dia = String(fecha.getDate()).padStart(2, '0');
        var mes = String(fecha.getMonth() + 1).padStart(2, '0');
        var anio = fecha.getFullYear();

        return `${dia}/${mes}/${anio}`;
    } catch (e) {
        console.warn("Error formateando fecha:", fechaString);
        return fechaString;
    }
}

// ===================================================================
// ===== EVENT LISTENERS PARA EL MODAL (Cerrar) =====
// ===================================================================

document.addEventListener('DOMContentLoaded', function () {
    const modalVisualizar = document.getElementById('modalVisualizarFondo');
    if (modalVisualizar) {
        modalVisualizar.addEventListener('click', function (e) {
            if (e.target === this) {
                cerrarModalFondo();
            }
        });
    }

    const modalEditar = document.getElementById('modalEditarFondo');
    if (modalEditar) {
        modalEditar.addEventListener('click', function (e) {
            if (e.target === this) {
                cerrarModalFondo();
            }
        });
    }
});

// ===================================================================
// ===== FUNCIONES AUXILIARES PARA PROVEEDOR =====
// ===================================================================

/**
 * Obtiene el primer valor no vacío
 */
function obtenerPrimerValorValido(...valores) {
    for (let valor of valores) {
        if (valor != null && String(valor).trim() !== '') {
            return String(valor).trim();
        }
    }
    return '';
}

/**
 * Carga la tabla de proveedores desde la API en el modal.
 */
function consultarProveedor() {
    // ✅ OBTENER EL IDOPCION DINÁMICAMENTE
    const idOpcionActual = window.obtenerIdOpcionActual();

    if (!idOpcionActual) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo obtener el ID de la opción. Por favor, acceda nuevamente desde el menú.'
        });
        return;
    }

    const usuario = obtenerUsuarioActual(); // ✅ USAR FUNCIÓN ROBUSTA
    const $tbody = $("#tablaProveedores tbody");

    console.log('Consultando proveedores con idOpcion:', idOpcionActual, 'y usuario:', usuario);

    if ($tbody.length === 0) {
        console.error("¡ERROR DE JAVASCRIPT! No se encontró '#tablaProveedores tbody'.");
        return;
    }

    $tbody.empty().append('<tr><td colspan="7" class="text-center">Cargando proveedores...</td></tr>');

    $.ajax({
        url: `${window.apiBaseUrl}/api/Proveedor/Listar`,
        method: "GET",
        headers: {
            "idopcion": String(idOpcionActual), // ✅ DINÁMICO
            "usuario": usuario                   // ✅ DINÁMICO
        },
        success: function (data) {
            console.log("Proveedores cargados:", data);

            $tbody.empty();

            if (data && data.length > 0) {

                data.forEach(function (proveedor) {

                    const codigo = proveedor.codigo ?? '';
                    const ruc = proveedor.identificacion ?? '';
                    const nombre = proveedor.nombre ?? '';

                    const contacto = obtenerPrimerValorValido(
                        proveedor.nombrecontacto1, proveedor.nombrecontacto2, proveedor.nombrecontacto3, proveedor.nombrecontacto4
                    );
                    const mail = obtenerPrimerValorValido(
                        proveedor.mailcontacto1, proveedor.mailcontacto2, proveedor.mailcontacto3, proveedor.mailcontacto4
                    );
                    const telefono = '';

                    const fila = `
                        <tr>
                            <td class="align-middle text-center">
                                <input class="form-check-input" type="radio" name="selectProveedor" 
                                        data-id="${codigo}" 
                                        data-nombre="${nombre}"
                                        data-ruc="${ruc}">
                            </td>
                            <td class="align-middle">${codigo}</td>
                            <td class="align-middle">${ruc}</td>
                            <td class="align-middle">${nombre}</td>
                            <td class="align-middle">${contacto}</td>
                            <td class="align-middle">${mail}</td>
                            <td class="align-middle">${telefono}</td>
                        </tr>
                    `;

                    $tbody.append(fila);
                });

            } else {
                $tbody.append('<tr><td colspan="7" class="text-center">No se encontraron proveedores.</td></tr>');
            }
        },
        error: function (xhr, status, error) {
            console.error("Error en la llamada AJAX a /api/Proveedor/Listar:", error);
            console.error("Detalles del error:", xhr.responseText);
            $tbody.empty().append(`<tr><td colspan="7" class="text-center text-danger">Error al cargar datos.</td></tr>`);
        }
    });
}

// ===================================================================
// ===== ACUERDOS POR FONDO ==========================================
// ===================================================================
function cargarAcuerdoFondo(idFondo) {
    // ✅ OBTENER EL IDOPCION DINÁMICAMENTE
    const idOpcionActual = window.obtenerIdOpcionActual();

    if (!idOpcionActual) {
        console.error("No se pudo obtener el idOpcion para cargar acuerdos");
        return;
    }

    const usuario = obtenerUsuarioActual(); // ✅ USAR FUNCIÓN ROBUSTA

    console.log('Cargando acuerdos para fondo ID:', idFondo, 'con idOpcion:', idOpcionActual, 'y usuario:', usuario);

    if ($.fn.DataTable.isDataTable('#tabla-acuerdo')) {
        $('#tabla-acuerdo').DataTable().destroy();
    }

    $('#tabla-acuerdo-fondo').html(`
        <div class="text-center p-4">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Cargando...</span>
            </div>
            <p class="mt-2">Cargando datos del acuerdo...</p>
        </div>
    `);

    $.ajax({
        url: `${window.apiBaseUrl}/api/acuerdo/consultar-acuerdo-fondo/${idFondo}`,
        method: "GET",
        dataType: "json",
        headers: {
            "idopcion": String(idOpcionActual), // ✅ DINÁMICO
            "usuario": usuario,                  // ✅ DINÁMICO
            "idcontrolinterfaz": "0",
            "idevento": "0",
            "entidad": "0",
            "identidad": "0",
            "idtipoproceso": "0"
        },
        success: function (data) {
            console.log("Datos del Acuerdo (raw):", data, typeof data);

            if (typeof data === "string") {
                try {
                    data = JSON.parse(data);
                } catch (e) {
                    console.error("No se pudo parsear la respuesta como JSON:", e);
                    $('#tabla-acuerdo-fondo').html('<p class="alert alert-danger text-center">Respuesta inválida del servidor.</p>');
                    return;
                }
            }

            // ⚠️ POSIBLE PUNTO DE FALLO: Si la API devuelve un solo objeto, 
            // asegúrate de que se convierta correctamente en un array para el bucle.
            let acuerdos = Array.isArray(data) ? data : (data && data.idfondo ? [data] : []); // Lógica más robusta

            // Usamos idacuerdofondo (minúsculas)
            if (!acuerdos.length || !acuerdos[0].idacuerdofondo || acuerdos[0].idacuerdofondo === 0) {
                $('#tabla-acuerdo-fondo').html(
                    '<p class="alert alert-warning mb-0 text-center">No se encontraron datos de acuerdo para este fondo.</p>'
                );
                return;
            }

            var html = "";
            html += "<table id='tabla-acuerdo' class='table table-bordered table-striped table-hover w-100'>";
            html += "  <thead>";
            html += "    <tr>";
            html += "      <th>ID Acuerdo</th>";
            html += "      <th>Estado</th>";
            html += "      <th>Descripción</th>";
            html += "      <th>Valor</th>";
            html += "      <th>Valor Disponible</th>";
            html += "      <th>Valor Comprometido</th>";
            html += "      <th>Valor Liquidado</th>";
            html += "    </tr>";
            html += "  </thead>";
            html += "  <tbody>";

            acuerdos.forEach(acuerdo => {
                console.log("Acuerdo completo:", acuerdo);
                // ANTES: const valor = acuerdo.valorImporte ?? acuerdo.valorFondo ?? 0;
                const valor = acuerdo.valorFondo ?? 0; // Usando solo valorFondo por simplificación

                html += "<tr>";
                // ANTES: html += "  <td>" + (acuerdo.idAcuerdofondo ?? "") + "</td>";
                html += "  <td>" + (acuerdo.idacuerdofondo ?? "") + "</td>"; // Propiedad en minúsculas
                html += "  <td>" + (acuerdo.acuerdofondo_estado_nombre ?? "") + "</td>";
                html += "  <td>" + (acuerdo.acuerdo_descripcion ?? "") + "</td>";
                html += "  <td class='text-end'>" + formatearMoneda(acuerdo.valorfondo) + "</td>"; // Usar valorfondo (minúsculas)
                html += "  <td class='text-end'>" + formatearMoneda(acuerdo.acuerdofondo_disponible) + "</td>";
                html += "  <td class='text-end'>" + formatearMoneda(acuerdo.acuerdofondo_comprometido) + "</td>";
                html += "  <td class='text-end'>" + formatearMoneda(acuerdo.acuerdofondo_liquidado) + "</td>";
                html += "</tr>";
            });

            html += "  </tbody>";
            html += "</table>";

            $('#tabla-acuerdo-fondo').html(html);

            $('#tabla-acuerdo').DataTable({
                pageLength: 5,
                lengthMenu: [5, 10, 25],
                pagingType: 'simple_numbers',
                searching: false,
                columnDefs: [
                    { targets: [3, 4, 5, 6], className: "dt-right" }
                ],
                order: [[0, 'desc']],
                language: {
                    decimal: "",
                    emptyTable: "No hay acuerdos disponibles",
                    info: "Mostrando _START_ a _END_ de _TOTAL_ acuerdos",
                    infoEmpty: "Mostrando 0 a 0 de 0 acuerdos",
                    infoFiltered: "(filtrado de _MAX_ acuerdos totales)",
                    lengthMenu: "Mostrar _MENU_ acuerdos",
                    loadingRecords: "Cargando...",
                    processing: "Procesando...",
                    search: "Buscar:",
                    zeroRecords: "No se encontraron acuerdos coincidentes",
                    paginate: {
                        first: "Primero",
                        last: "Último",
                        next: "Siguiente",
                        previous: "Anterior"
                    }
                }
            });
        },
        error: function (xhr, status, error) {
            console.error("Error al obtener datos del acuerdo:", error);
            console.error("Detalles del error:", xhr.responseText);
            $('#tabla-acuerdo-fondo').html('<p class="alert alert-danger text-center">Error al cargar el acuerdo.</p>');
        }
    });
}

function formatearMoneda(v) {
    return (v || 0).toLocaleString('es-EC', { style: 'currency', currency: 'USD' });
}