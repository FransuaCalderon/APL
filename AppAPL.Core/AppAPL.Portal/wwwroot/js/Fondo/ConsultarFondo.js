// ~/js/Fondo/ModificarFondo.js

// Variables globales
let tabla; // GLOBAL
let ultimaFilaModificada = null; // Para recordar la última fila editada/eliminada

// Se ejecuta cuando el DOM está listo
$(document).ready(function () {

    // Configuración inicial y carga de datos
    $.get("/config", function (config) {
        const apiBaseUrl = config.apiBaseUrl;
        window.apiBaseUrl = apiBaseUrl;

        cargarTipoFondo();
        cargarBandeja();
    });

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

    // ===== BOTÓN LIMPIAR (sigue igual) =====
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

    // Disparador para cargar los proveedores cuando se abre el modal
    $('#modalConsultaProveedor').on('show.bs.modal', function (event) {
        consultarProveedor(); // Llama a la función para cargar la tabla
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


}); // <-- FIN de $(document).ready


// ===================================================================
// ===== FUNCIONES GLOBALES (Datatables, Abrir/Cerrar Modal) =====
// ===================================================================

function crearListado(data) {
    if (tabla) {
        tabla.destroy();
    }

    var html = "";
    html += "<table id='tabla-fondos' class='table table-bordered table-striped table-hover'>";

    html += "  <thead>";

    // Fila del Título ROJO
    html += "    <tr>";
    html += "      <th colspan='12' style='background-color: #CC0000 !important; color: white; text-align: center; font-weight: bold; padding: 8px; font-size: 1rem;'>";
    html += "          BANDEJA DE FONDOS";
    html += "      </th>";
    html += "    </tr>";

    // Fila de las Cabeceras
    html += "    <tr>";
    html += "      <th>Acción</th>";
    html += "      <th>IDFondo</th>";
    html += "      <th>Descripción</th>";
    html += "      <th>Proveedor</th>";
    html += "      <th>Tipo Fondo</th>";
    html += "      <th>$ Fondo</th>";
    html += "      <th>Fecha Inicio</th>";
    html += "      <th>Fecha Fin</th>";
    html += "      <th>$ Disponible</th>";
    html += "      <th>$ Comprometido</th>";
    html += "      <th>$ Liquidado</th>";
    html += "      <th>Estado</th>";
    html += "    </tr>";
    html += "  </thead>";
    html += "  <tbody>";

    if (!data || data.length === 0) {
        html += "<tr><td colspan='12' class='text-center'>Sin datos</td></tr>";
    } else {
        for (var i = 0; i < data.length; i++) {
            var fondo = data[i];
            var id = fondo.idfondo;

            // Botón de editar
            // Se asume que este botón abrirá el modal de visualización (lectura) en este flujo
            var viewButton = '<button type="button" class="btn-action view-btn" title="Visualizar/Editar" onclick="abrirModalEditar(' + id + ')">' +
                '<i class="fa-regular fa-eye" ></i>' +
                '</button>';

            html += "<tr>";
            html += "  <td class='text-center'>" + viewButton + "</td>";
            html += "  <td>" + (fondo.idfondo ?? "") + "</td>";
            html += "  <td>" + (fondo.descripcion ?? "") + "</td>";
            html += "  <td>" + (fondo.proveedor ?? "") + "</td>";
            html += "  <td>" + (fondo.tipo_fondo ?? "") + "</td>";
            html += "  <td class='text-end'>" + formatearMoneda(fondo.valor_fondo) + "</td>";
            html += "  <td class='text-center'>" + formatearFecha(fondo.fecha_inicio) + "</td>";
            html += "  <td class='text-center'>" + formatearFecha(fondo.fecha_fin) + "</td>";
            html += "  <td class='text-end'>" + formatearMoneda(fondo.valor_disponible) + "</td>";
            html += "  <td class='text-end'>" + formatearMoneda(fondo.valor_comprometido) + "</td>";
            html += "  <td class='text-end'>" + formatearMoneda(fondo.valor_liquidado) + "</td>";
            html += "  <td>" + (fondo.estado ?? "") + "</td>";
            html += "</tr>";
        }
    }

    html += "  </tbody>";
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
 * Abre el modal de VISUALIZACIÓN o EDICIÓN (depende del ID del modal usado) 
 * y carga los datos del fondo para editar.
 */
function abrirModalEditar(id) {
    // 1. Cargar la tabla de acuerdos (asumiendo que existe esta función)
    if (typeof cargarAcuerdoFondo === 'function') {
        cargarAcuerdoFondo(id);
    }

    // 2. Llama a la API para obtener los datos del fondo por ID
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

            // ** ✨ CAMBIO CLAVE: CONCATENACIÓN RUC/ID y NOMBRE ✨ **
            // data.proveedor contiene el RUC/ID (ej: "1790012345001")
            // data.nombre debe contener el nombre completo (ej: "PRUEBA JOSE LUIS")
            const idProveedor = data.proveedor || '';
            const nombreProveedor = data.nombre || ''; // Asumimos que la API devuelve el nombre en 'data.nombre'

            // Formato deseado: RUC/ID - Nombre
            const proveedorCompleto = (idProveedor && nombreProveedor)
                ? `${idProveedor} - ${nombreProveedor}`
                : idProveedor || nombreProveedor || '';

            // 3. Preparar los datos para el modal
            const datosModal = {
                idfondo: data.idfondo,
                descripcion: data.descripcion,
                proveedor: proveedorCompleto, // <-- Se usa el valor concatenado para VISUALIZACIÓN
                idproveedor: idProveedor, // Se mantiene el ID/RUC puro para la edición si se requiere
                nombre_proveedor: nombreProveedor, // Se mantiene el nombre puro para la edición
                tipo_fondo: data.tipo_fondo,
                valor_fondo: parseFloat(data.valor_fondo) || 0,
                fecha_inicio: formatDateForInput(data.fecha_inicio),
                fecha_fin: formatDateForInput(data.fecha_fin),
                estado: data.estado
            };

            // 4. Abrir el modal personalizado (Asumiendo que esta es la función para el modalVisualizarFondo)
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
 * Función para abrir el modal personalizado (modalVisualizarFondo)
 * NOTA: Esta función está diseñada para llenar el modal de VISUALIZACIÓN
 */
function abrirModalFondo(datos) {
    const modal = document.getElementById('modalVisualizarFondo');

    // Llenar los datos
    document.getElementById('modal-fondo-id').value = datos.idfondo || '';
    document.getElementById('modal-fondo-descripcion').value = datos.descripcion || '';

    // El campo de proveedor ya trae el RUC/ID - Nombre desde abrirModalEditar
    document.getElementById('modal-fondo-proveedor').value = datos.proveedor || '';

    // La versión de visualización usa un input type="text"
    document.getElementById('modal-fondo-tipofondo').value = datos.tipo_fondo || '';

    document.getElementById('modal-fondo-fechainicio').value = datos.fecha_inicio || '';
    document.getElementById('modal-fondo-fechafin').value = datos.fecha_fin || '';

    // Asignar el valor para el input tipo 'number'
    document.getElementById('modal-fondo-valor').value = datos.valor_fondo || '';

    document.getElementById('modal-fondo-estado').value = datos.estado || '';

    // Mostrar modal
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

    // Si tuvieras un modal de edición:
    const modalEditar = document.getElementById('modalEditarFondo');
    if (modalEditar) {
        modalEditar.classList.remove('active');
        document.getElementById('formEditarFondo').reset();
    }

    document.body.style.overflow = 'auto';
}

/**
 * Función para guardar los cambios del fondo
 * NOTA: Esta función DEBE ser llamada desde el modal de EDICIÓN (modalEditarFondo).
 */
function guardarCambiosFondo() {
    // Obtener datos del formulario
    const id = $("#modal-fondo-id").val();
    const dataParaGuardar = {
        descripcion: $("#modal-fondo-descripcion").val(),
        // Obtener el ID/RUC del campo oculto del modal de EDICIÓN
        idproveedor: $("#modal-fondo-idproveedor-hidden").val(),
        idtipofondo: parseInt($("#modal-fondo-tipofondo").val()),
        valorfondo: parseFloat($("#modal-fondo-valor").val()),
        fechainiciovigencia: $("#modal-fondo-fechainicio").val(),
        fechafinvigencia: $("#modal-fondo-fechafin").val(),
        idusuariomodifica: "admin",  // el usuario debe escoger de la sesion logeada
        nombreusuariomodifica: "admin",
        idopcion: 13,
        idcontrolinterfaz: 0,
        idevento: 29
    };

    console.log("datos a guardar:", dataParaGuardar);

    //TODO: Implementar la llamada AJAX para actualizar
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
            cerrarModalFondo();
            // Recargar tabla
            cargarBandeja();
        },
        error: function (xhr, status, error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: xhr.responseJSON.mensaje
            });

            console.log("error al guardar", xhr.responseJSON.mensaje);
            cerrarModalFondo();
        }
    });
}


// ===================================================================
// ===== FUNCIONES UTILITARIAS (Formato) =====
// ===================================================================

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
    const modalVisualizar = document.getElementById('modalVisualizarFondo');
    if (modalVisualizar) {
        modalVisualizar.addEventListener('click', function (e) {
            if (e.target === this) {
                cerrarModalFondo();
            }
        });
    }

    // Si tuvieras un modal de edición:
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
// ===== FUNCIONES AUXILIARES PARA DATOS Y LÓGICA DEL MODAL PROVEEDOR =====
// ===================================================================

/**
 * Función auxiliar para obtener el primer valor no vacío (copiada de CrearFondo.js)
 */
function obtenerPrimerValorValido(...valores) {
    for (let valor of valores) {
        if (valor != null && String(valor).trim() !== '') {
            return String(valor).trim();
        }
    }
    return ''; // Retorna cadena vacía si todos están vacíos
}

/**
 * Carga la tabla de proveedores desde la API en el modal. (Copiada de CrearFondo.js)
 */
function consultarProveedor() {
    // Valores fijos
    const usuario = "1";
    const idopcion = "9";

    // Selector del cuerpo de la tabla
    const $tbody = $("#tablaProveedores tbody");

    // Verificación del selector
    if ($tbody.length === 0) {
        console.error("¡ERROR DE JAVASCRIPT! No se encontró '#tablaProveedores tbody'.");
        return;
    }

    // Muestra "Cargando..."
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

            // Limpia el "Cargando..."
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
                    const telefono = ''; // No existe en el API

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

// ===================================================================
// ===== ACUERDOS POR FONDO ==========================================
// ===================================================================
function cargarAcuerdoFondo(idFondo) {
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
        url: `${window.apiBaseUrl}/consultar-acuerdo-fondo/${idFondo}`, // ✅ CORREGIDO: Agregado /api/Fondo/
        method: "GET",
        dataType: "json",
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

            let acuerdos = Array.isArray(data) ? data : [data];

            if (!acuerdos.length || !acuerdos[0].idAcuerdofondo || acuerdos[0].idAcuerdofondo === 0) {
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
                const valor = acuerdo.valorImporte ?? acuerdo.valorFondo ?? 0;

                html += "<tr>";
                html += "  <td>" + (acuerdo.idAcuerdofondo ?? "") + "</td>";
                html += "  <td>" + (acuerdo.acuerdofondo_estado_nombre ?? "") + "</td>";
                html += "  <td>" + (acuerdo.acuerdo_descripcion ?? "") + "</td>";
                html += "  <td class='text-end'>" + formatearMoneda(valor) + "</td>";
                html += "  <td class='text-end'>" + formatearMoneda(acuerdo.acuerdofondo_disponible) + "</td>";
                html += "  <td class='text-end'>" + formatearMoneda(acuerdo.acuerdofondo_comprometido) + "</td>";
                html += "  <td class='text-end'>" + formatearMoneda(acuerdo.acuerdofondo_liquidado) + "</td>";
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
            $('#tabla-acuerdo-fondo').html('<p class="alert alert-danger text-center">Error al cargar el acuerdo.</p>');
        }
    });
}