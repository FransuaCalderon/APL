// ~/js/Fondo/ModificarFondo.js

// ===============================================================
// Variables globales
// ===============================================================
let tabla; // GLOBAL
let ultimaFilaModificada = null; // Para recordar la última fila editada/eliminada

// ===============================================================
// FUNCIONES GLOBALES DE CARGA (fuera del ready)
// ===============================================================

/**
 * Carga la bandeja principal de fondos.
 */
function cargarBandeja() {
    const apiBaseUrl = window.apiBaseUrl;

    $.ajax({
        url: `${apiBaseUrl}/api/Fondo/bandeja-modificacion`,
        method: "GET",
        headers: {
            "idopcion": "1",
            "usuario": "admin",
            "idcontrolinterfaz": "0",
            "idevento": "0",
            "entidad": "0",
            "identidad": "0",
            "idtipoproceso": "0"
        },
        success: function (data) {
            console.log(data);
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
    const etiqueta = "TIPOFONDO";

    $.ajax({
        url: `${window.apiBaseUrl}/api/Opciones/ConsultarCombos/${etiqueta}`,
        method: "GET",
        headers: {
            "idopcion": "1",
            "usuario": "admin"
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
        }
    });
}

// ===============================================================
// DOCUMENT READY
// ===============================================================
$(document).ready(function () {

    // Configuración inicial y carga de datos
    $.get("/config", function (config) {
        const apiBaseUrl = config.apiBaseUrl;
        window.apiBaseUrl = apiBaseUrl;

        cargarTipoFondo();
        cargarBandeja();
    });

    // ===== BOTÓN LIMPIAR =====
    $('body').on('click', '#btnLimpiar', function () {
        if (tabla) {
            tabla.search('').draw();
            tabla.page(0).draw('page');
            ultimaFilaModificada = null;
            if (typeof limpiarSeleccion === 'function') {
                limpiarSeleccion('#tabla-fondos');
            }
        }
    });

    // Cargar proveedores cuando se abre el modal
    $('#modalConsultaProveedor').on('show.bs.modal', function (event) {
        consultarProveedor();
    });

    // Botón "Aceptar" del modal de proveedores (Modificación)
    $("#btnAceptarProveedorModificar").on("click", function () {
        const $selected = $("#tablaProveedores tbody input[name='selectProveedor']:checked");

        if ($selected.length > 0) {
            const proveedorNombre = $selected.data("nombre");
            const proveedorRuc = $selected.data("ruc");

            // CONCATENACIÓN: Formatear RUC y Nombre
            const textoVisible = `${proveedorRuc} - ${proveedorNombre}`;

            console.log("Proveedor seleccionado para modificar:", { nombre: proveedorNombre, ruc: proveedorRuc });

            // 1. Campo visible (RUC - Nombre)
            $("#modal-fondo-proveedor").val(textoVisible);
            // 2. Campo oculto (ID/RUC real)
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
    html += "<table id='tabla-fondos' class='table table-bordered table-striped table-hover'>";

    html += "  <thead>";

    // Fila del Título ROJO
    html += "    <tr>";
    html += "      <th colspan='13' style='background-color: #CC0000 !important; color: white; text-align: center; font-weight: bold; padding: 8px; font-size: 1rem;'>";
    html += "          BANDEJA DE FONDOS";
    html += "      </th>";
    html += "    </tr>";

    // Fila de las Cabeceras
    html += "    <tr>";
    html += "      <th>Acción</th>";
    html += "      <th>IDFondo</th>";
    html += "      <th>Descripción</th>";
    html += "      <th>RUC</th>";        // Columna RUC
    html += "      <th>Proveedor</th>";  // Columna Proveedor
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

            // Botón de editar
            var editButton = '<button type="button" class="btn-action edit-btn" title="Editar" onclick="abrirModalEditar(' + id + ')">' +
                '<i class="fa-regular fa-pen-to-square"></i>' +
                '</button>';

            html += "<tr>";
            html += "  <td class='text-center'>" + editButton + "</td>";
            html += "  <td>" + (fondo.idfondo ?? "") + "</td>";
            html += "  <td>" + (fondo.descripcion ?? "") + "</td>";
            html += "  <td>" + (fondo.proveedor ?? "") + "</td>"; // RUC/ID
            html += "  <td>" + (fondo.nombre ?? "") + "</td>";    // Nombre
            html += "  <td>" + (fondo.tipo_fondo ?? "") + "</td>";
            html += "  <td class='text-end'>" + formatearMoneda(fondo.valor_fondo) + "</td>";
            html += "  <td class='text-center'>" + formatearFecha(fondo.fecha_inicio) + "</td>";
            html += "  <td class='text-center'>" + formatearFecha(fondo.fecha_fin) + "</td>";
            html += "  <td class='text-end'>" + formatearMoneda(fondo.valor_disponible) + "</td>";
            html += "  <td class='text-end'>" + formatearMoneda(fondo.valor_comprometido) + "</td>";
            html += "  <td class='text-end'>" + formatearMoneda(fondo.valor_liquidado) + "</td>";
            html += "  <td>" + (fondo.estado ?? "") + "</td>";
            html += "</tr>";
        }
    }

    html += "  </tbody>";
    html += "</table>";

    // Inserta la tabla en el div
    $('#tabla').html(html);

    // Inicializa DataTable
    tabla = $('#tabla-fondos').DataTable({
        pageLength: 10,
        lengthMenu: [5, 10, 25, 50],
        pagingType: 'full_numbers',
        columnDefs: [
            { targets: 0, width: "8%", className: "dt-center", orderable: false },
            { targets: 1, width: "6%", className: "dt-center" },
            { targets: [5, 8, 9, 10], className: "dt-right" },
            { targets: [6, 7], className: "dt-center" },
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
                    marcarFilaPorId('#tabla-fondos', ultimaFilaModificada);
                }
            }
        }
    });

    console.log('Llamando a inicializarMarcadoFilas para Fondos');
    if (typeof inicializarMarcadoFilas === 'function') {
        inicializarMarcadoFilas('#tabla-fondos');
    }
}

/**
 * Abre el modal y carga los datos del fondo para editar.
 */
function abrirModalEditar(id) {
    $.ajax({
        url: `${window.apiBaseUrl}/api/Fondo/bandeja-modificacion-id/${id}`,
        method: "GET",
        headers: {
            "idopcion": "1",
            "usuario": "admin",
            "idcontrolinterfaz": "0",
            "idevento": "0",
            "entidad": "0",
            "identidad": "0",
            "idtipoproceso": "0"
        },
        success: function (data) {

            // Concatenación RUC/ID y Nombre
            const idProveedor = data.proveedor || '';
            const nombreProveedor = data.nombre || '';

            const proveedorCompleto = (idProveedor && nombreProveedor)
                ? `${idProveedor} - ${nombreProveedor}`
                : idProveedor || nombreProveedor || '';

            const datosModal = {
                idfondo: data.idfondo,
                descripcion: data.descripcion,
                proveedor: proveedorCompleto,
                idproveedor: idProveedor,
                tipo_fondo: data.tipo_fondo,
                valor_fondo: data.valor_fondo,
                fecha_inicio: formatDateForInput(data.fecha_inicio),
                fecha_fin: formatDateForInput(data.fecha_fin),
                estado: data.estado
            };
            console.log("datosModal: ", datosModal);
            abrirModalFondo(datosModal);
        },
        error: function (xhr, status, error) {
            console.error("Error al obtener datos del fondo:", error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudieron cargar los datos del fondo.'
            });
        }
    });
}

/**
 * Función para abrir el modal personalizado
 */
function abrirModalFondo(datos) {
    const modal = document.getElementById('modalEditarFondo');

    document.getElementById('modal-fondo-id').value = datos.idfondo || '';
    document.getElementById('modal-fondo-descripcion').value = datos.descripcion || '';

    document.getElementById('modal-fondo-proveedor').value = datos.proveedor || 'Seleccione...';
    document.getElementById('modal-fondo-idproveedor-hidden').value = datos.idproveedor || '';

    const selectTipoFondo = document.getElementById('modal-fondo-tipofondo');
    const textoTipoFondoBuscado = datos.tipo_fondo || '';
    const opcionesArray = Array.from(selectTipoFondo.options);
    const opcionEncontrada = opcionesArray.find(option => option.text === textoTipoFondoBuscado);
    if (opcionEncontrada) {
        selectTipoFondo.value = opcionEncontrada.value;
    } else {
        selectTipoFondo.value = '';
    }

    document.getElementById('modal-fondo-fechainicio').value = datos.fecha_inicio || '';
    document.getElementById('modal-fondo-fechafin').value = datos.fecha_fin || '';
    document.getElementById('modal-fondo-valor').value = datos.valor_fondo || '';
    document.getElementById('modal-fondo-estado').value = datos.estado || '';

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

/**
 * Función para cerrar el modal personalizado
 */
function cerrarModalFondo() {
    const modal = document.getElementById('modalEditarFondo');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';

    document.getElementById('formEditarFondo').reset();
}

/**
 * Función para guardar los cambios del fondo
 */
function guardarCambiosFondo() {
    const id = $("#modal-fondo-id").val();
    const dataParaGuardar = {
        descripcion: $("#modal-fondo-descripcion").val(),
        idproveedor: $("#modal-fondo-idproveedor-hidden").val(),
        idtipofondo: parseInt($("#modal-fondo-tipofondo").val()),
        valorfondo: parseFloat($("#modal-fondo-valor").val()),
        fechainiciovigencia: $("#modal-fondo-fechainicio").val(),
        fechafinvigencia: $("#modal-fondo-fechafin").val(),
        idusuariomodifica: "admin",
        nombreusuariomodifica: "admin",
        idopcion: 11,
        idcontrolinterfaz: 0,
        idevento: 29
    };

    console.log("datos a guardar:", dataParaGuardar);

    $.ajax({
        url: `${window.apiBaseUrl}/api/Fondo/actualizar/${id}`,
        method: "PUT",
        headers: {},
        data: JSON.stringify(dataParaGuardar),
        contentType: "application/json",
        success: function (response) {
            Swal.fire({
                icon: 'success',
                title: 'Éxito',
                text: 'Fondo actualizado correctamente'
            });

            // recordar qué fila se modificó (por si la quieres marcar luego)
            ultimaFilaModificada = id;

            cerrarModalFondo();

            // 🔄 Recargar la bandeja (tabla) sin recargar toda la página
            if (typeof cargarBandeja === 'function') {
                cargarBandeja();
            } else {
                console.warn("cargarBandeja no está definida");
            }
        },
        error: function (xhr, status, error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: xhr.responseJSON?.mensaje || 'Error al guardar'
            });

            console.log("error al guardar", xhr.responseJSON?.mensaje);
            cerrarModalFondo();
        }
    });
}

/**
 * Convierte una fecha/hora (ej: "2025-11-03T00:00:00")
 * al formato "YYYY-MM-DD" que necesita <input type="date">.
 */
function formatDateForInput(fechaString) {
    if (!fechaString) {
        return "";
    }
    return fechaString.split('T')[0];
}

// ===================================================================
// ===== FUNCIONES UTILITARIAS (Formato) =====
// ===================================================================

/**
 * Formatea un número como moneda (ej: 20000 -> 20,000.00)
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

// Cerrar modal al hacer clic fuera
document.addEventListener('DOMContentLoaded', function () {
    const modal = document.getElementById('modalEditarFondo');
    if (modal) {
        modal.addEventListener('click', function (e) {
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
    const usuario = "1";
    const idopcion = "9";
    const $tbody = $("#tablaProveedores tbody");

    if ($tbody.length === 0) {
        console.error("¡ERROR DE JAVASCRIPT! No se encontró '#tablaProveedores tbody'.");
        return;
    }

    $tbody.empty().append('<tr><td colspan="7" class="text-center">Cargando proveedores...</td></tr>');

    $.ajax({
        url: `${window.apiBaseUrl}/api/Proveedor/Listar`,
        method: "GET",
        headers: {
            "idopcion": idopcion,
            "usuario": usuario
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
            $tbody.empty().append(`<tr><td colspan="7" class="text-center text-danger">Error al cargar datos.</td></tr>`);
        }
    });
}
