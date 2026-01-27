// ~/js/Fondo/ModificarFondo.js

// ===============================================================
// Variables globales
// ===============================================================
let tabla; // GLOBAL
let ultimaFilaModificada = null; // Para recordar la última fila editada/eliminada

// ===============================================================
// FUNCIONES HELPER PARA MANEJO DE RESPUESTAS DEL API
// ===============================================================

/**
 * Procesa la respuesta del API y extrae los datos
 * @param {Object} response - Respuesta del API
 * @returns {Object} - { success: boolean, data: any, message: string, result: Object }
 */
function procesarRespuestaAPI(response) {
    // Verificar si la respuesta tiene la nueva estructura
    if (response && typeof response === 'object' && 'status' in response) {
        const esExitoso = response.status === 'ok' && response.code_status === 200;
        const jsonResponse = response.json_response || {};
        const data = jsonResponse.data || null;
        const result = jsonResponse.result || {};

        return {
            success: esExitoso,
            data: data,
            message: result.message || response.status,
            result: result,
            unitransac: response.unitransac || null,
            codigoRetorno: data?.codigoretorno || null,
            filasAfectadas: data?.filasafectadas || null
        };
    }

    // Si es la estructura antigua (array directo o objeto simple), mantener compatibilidad
    return {
        success: true,
        data: response,
        message: 'OK',
        result: { statuscode: '200', title: 'OK', message: 'successful' },
        unitransac: null,
        codigoRetorno: null,
        filasAfectadas: null
    };
}

/**
 * Procesa errores del API de manera uniforme
 * @param {Object} xhr - Objeto XMLHttpRequest
 * @param {string} status - Estado del error
 * @param {string} error - Mensaje de error
 * @returns {Object} - { message: string, details: string, codigoRetorno: number }
 */
function procesarErrorAPI(xhr, status, error) {
    let mensaje = error || 'Error desconocido';
    let detalles = '';
    let codigoRetorno = null;

    try {
        if (xhr.responseJSON) {
            const respuesta = procesarRespuestaAPI(xhr.responseJSON);
            mensaje = respuesta.result?.message || respuesta.message || mensaje;
            detalles = respuesta.data?.mensaje || '';
            codigoRetorno = respuesta.codigoRetorno;
        } else if (xhr.responseText) {
            const parsed = JSON.parse(xhr.responseText);
            const respuesta = procesarRespuestaAPI(parsed);
            mensaje = respuesta.result?.message || mensaje;
            detalles = respuesta.data?.mensaje || '';
            codigoRetorno = respuesta.codigoRetorno;
        }
    } catch (e) {
        detalles = xhr.responseText || '';
    }

    return {
        message: mensaje,
        details: detalles,
        codigoRetorno: codigoRetorno,
        fullMessage: detalles ? `${mensaje}: ${detalles}` : mensaje
    };
}

/**
 * Obtiene el usuario actual de múltiples fuentes posibles
 * @returns {string} - Usuario actual
 */
function obtenerUsuarioActual() {
    const usuario = window.usuarioActual
        || sessionStorage.getItem('usuarioActual')
        || sessionStorage.getItem('usuario')
        || localStorage.getItem('usuarioActual')
        || localStorage.getItem('usuario')
        || "admin"; // Fallback final

    return usuario;
}

/**
 * Obtiene los headers estándar para las peticiones al API
 * @returns {Object} - Headers para la petición
 */
function obtenerHeadersAPI() {
    const idOpcionActual = window.obtenerIdOpcionActual();
    const usuario = obtenerUsuarioActual();

    return {
        "idopcion": String(idOpcionActual || 0),
        "usuario": usuario,
        "idcontrolinterfaz": "0",
        "idevento": "0",
        "entidad": "0",
        "identidad": "0",
        "idtipoproceso": "0"
    };
}

// ===============================================================
// FUNCIONES GLOBALES DE CARGA (fuera del ready)
// ===============================================================

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

    const usuario = obtenerUsuarioActual();
    const apiBaseUrl = window.apiBaseUrl;

    console.log('Cargando bandeja con idOpcion:', idOpcionActual);

    $.ajax({
        url: `${apiBaseUrl}/api/Fondo/bandeja-modificacion`,
        method: "GET",
        headers: obtenerHeadersAPI(),
        success: function (response) {
            console.log("Respuesta cruda de bandeja-modificacion:", response);

            // Procesar la respuesta con la nueva estructura
            const resultado = procesarRespuestaAPI(response);

            if (resultado.success) {
                console.log("Datos procesados de bandeja:", resultado.data);
                crearListado(resultado.data);
            } else {
                console.error("Error en respuesta de bandeja:", resultado.message);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: resultado.message || 'No se pudieron cargar los fondos'
                });
            }
        },
        error: function (xhr, status, error) {
            const errorInfo = procesarErrorAPI(xhr, status, error);
            console.error("Error al obtener datos de fondos:", errorInfo.fullMessage);

            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: errorInfo.fullMessage || 'No se pudieron cargar los fondos'
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

    const usuario = obtenerUsuarioActual();
    const etiqueta = "TIPOFONDO";

    console.log('Cargando tipos de fondo con idOpcion:', idOpcionActual);

    $.ajax({
        url: `${window.apiBaseUrl}/api/Opciones/ConsultarCombos/${etiqueta}`,
        method: "GET",
        headers: {
            "idopcion": String(idOpcionActual),
            "usuario": usuario
        },
        success: function (response) {
            console.log("Respuesta cruda de tipos de fondo:", response);

            // Procesar la respuesta con la nueva estructura
            const resultado = procesarRespuestaAPI(response);
            const data = resultado.success ? resultado.data : response;

            console.log("Tipos de fondo procesados:", data);

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
            const errorInfo = procesarErrorAPI(xhr, status, error);
            console.error("Error al cargar tipos de fondo:", errorInfo.fullMessage);
        }
    });
}

// ===============================================================
// DOCUMENT READY
// ===============================================================
$(document).ready(function () {

    console.log("=== INICIO DE CARGA DE PÁGINA - ModificarFondo ===");

    // ✅ LOGS DE VERIFICACIÓN AL INICIAR LA PÁGINA
    console.log("Usuario actual capturado:", window.usuarioActual);

    // Obtener información completa de la opción actual
    const infoOpcion = window.obtenerInfoOpcionActual();
    console.log("Información de la opción actual:", {
        idOpcion: infoOpcion.idOpcion,
        nombre: infoOpcion.nombre,
        ruta: infoOpcion.ruta
    });

    // Verificación adicional
    if (!infoOpcion.idOpcion) {
        console.warn("⚠️ ADVERTENCIA: No se detectó un idOpcion al cargar la página.");
        console.warn("Esto es normal si accediste directamente a la URL sin pasar por el menú.");
        console.warn("Para que funcione correctamente, accede a esta página desde el menú.");
    } else {
        console.log("✅ idOpcion capturado correctamente:", infoOpcion.idOpcion);
    }

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

    // Si no hay datos, mostramos mensaje y salimos
    if (!data || data.length === 0) {
        $('#tabla').html(
            "<div class='alert alert-info text-center'>No hay fondos disponibles para modificar.</div>"
        );
        return;
    }

    var html = "";
    html += "<table id='tabla-principal' class='table table-bordered table-striped table-hover'>";
    html += "  <thead>";

    // Fila del Título ROJO
    html += "    <tr>";
    html += "      <th colspan='13' style='background-color: #CC0000 !important; color: white; text-align: center; font-weight: bold; padding: 8px; font-size: 1rem;'>";
    html += "          BANDEJA DE MODIFICACIÓN DE FONDOS";
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
        html += "  <td>" + (fondo.proveedor ?? "") + "</td>";
        html += "  <td>" + (fondo.nombre_proveedor ?? "") + "</td>";
        html += "  <td>" + (fondo.nombre_tipo_fondo ?? "") + "</td>";
        html += "  <td class='text-end'>" + formatearMoneda(fondo.valor_fondo) + "</td>";
        html += "  <td class='text-center'>" + formatearFecha(fondo.fecha_inicio) + "</td>";
        html += "  <td class='text-center'>" + formatearFecha(fondo.fecha_fin) + "</td>";
        html += "  <td class='text-end'>" + formatearMoneda(fondo.valor_disponible) + "</td>";
        html += "  <td class='text-end'>" + formatearMoneda(fondo.valor_comprometido) + "</td>";
        html += "  <td class='text-end'>" + formatearMoneda(fondo.valor_liquidado) + "</td>";
        html += "  <td>" + (fondo.estado ?? "") + "</td>";
        html += "</tr>";
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
 * Abre el modal y carga los datos del fondo para editar.
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

    const usuario = obtenerUsuarioActual();
    console.log('Abriendo modal para editar fondo ID:', id, 'con idOpcion:', idOpcionActual);

    $.ajax({
        url: `${window.apiBaseUrl}/api/Fondo/bandeja-modificacion-id/${id}`,
        method: "GET",
        headers: obtenerHeadersAPI(),
        success: function (response) {
            console.log("Respuesta cruda del fondo:", response);

            // Procesar la respuesta con la nueva estructura
            const resultado = procesarRespuestaAPI(response);

            if (!resultado.success) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: resultado.message || 'No se pudieron cargar los datos del fondo.'
                });
                return;
            }

            // Los datos pueden venir como array o como objeto único
            const data = Array.isArray(resultado.data) ? resultado.data[0] : resultado.data;

            if (!data) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se encontraron datos del fondo.'
                });
                return;
            }

            console.log("Datos procesados del fondo:", data);

            // Concatenación RUC/ID y Nombre
            const idProveedor = data.proveedor || '';
            const nombreProveedor = data.nombre_proveedor || '';
            const proveedorCompleto = (idProveedor && nombreProveedor)
                ? `${idProveedor} - ${nombreProveedor}`
                : idProveedor || nombreProveedor || '';

            const datosModal = {
                idfondo: data.idfondo,
                descripcion: data.descripcion,
                proveedor: proveedorCompleto,
                idproveedor: idProveedor,
                tipo_fondo: data.nombre_tipo_fondo,
                valor_fondo: formatearMoneda(data.valor_fondo),
                valor_disponible: formatearMoneda(data.valor_disponible),
                valor_comprometido: formatearMoneda(data.valor_comprometido),
                valor_liquidado: formatearMoneda(data.valor_liquidado),
                fecha_inicio: formatDateForInput(data.fecha_inicio),
                fecha_fin: formatDateForInput(data.fecha_fin),
                estado: data.estado
            };

            console.log("datosModal: ", datosModal);
            abrirModalFondo(datosModal);
        },
        error: function (xhr, status, error) {
            const errorInfo = procesarErrorAPI(xhr, status, error);
            console.error("Error al obtener datos del fondo:", errorInfo.fullMessage);

            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: errorInfo.fullMessage || 'No se pudieron cargar los datos del fondo.'
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
    const modal = document.getElementById('modalEditarFondo');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';

    document.getElementById('formEditarFondo').reset();
}

/**
 * Función para guardar los cambios del fondo
 * ✅ CAMBIADO DE PUT A POST
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
        idfondo: parseInt(id),                // ✅ Incluir ID en el body para POST
        descripcion: $("#modal-fondo-descripcion").val(),
        idproveedor: $("#modal-fondo-idproveedor-hidden").val(),
        idtipofondo: parseInt($("#modal-fondo-tipofondo").val()),
        valorfondo: parseFloat($("#modal-fondo-valor").val()),
        fechainiciovigencia: $("#modal-fondo-fechainicio").val(),
        fechafinvigencia: $("#modal-fondo-fechafin").val(),
        idusuariomodifica: usuario,
        nombreusuariomodifica: usuario,
        idopcion: idOpcionActual,
        idcontrolinterfaz: "BTNMODIFICAR",
        idevento: "EVCLICK",
        nombreusuario: usuario
    };

    console.log("Datos a guardar:", dataParaGuardar);

    // Mostrar indicador de carga
    Swal.fire({
        title: 'Guardando...',
        text: 'Por favor espere',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    $.ajax({
        url: `${window.apiBaseUrl}/api/Fondo/actualizar/${id}`,
        method: "POST",  // ✅ CAMBIADO DE PUT A POST
        headers: obtenerHeadersAPI(),
        data: JSON.stringify(dataParaGuardar),
        contentType: "application/json",
        success: function (response) {
            console.log("Respuesta cruda de actualizar:", response);

            // Procesar la respuesta con la nueva estructura
            const resultado = procesarRespuestaAPI(response);

            if (resultado.success) {
                // Verificar si hay mensaje de error en data
                if (resultado.data?.codigoretorno && resultado.data.codigoretorno < 0) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: resultado.data.mensaje || 'Error al actualizar el fondo'
                    });
                    return;
                }

                const mensajeExito = resultado.data?.mensaje || 'Fondo actualizado correctamente';

                Swal.fire({
                    icon: 'success',
                    title: 'Éxito',
                    text: mensajeExito,
                    timer: 2000,
                    timerProgressBar: true
                });

                // Recordar qué fila se modificó
                ultimaFilaModificada = id;

                cerrarModalFondo();

                // Recargar la bandeja
                if (typeof cargarBandeja === 'function') {
                    cargarBandeja();
                }
            } else {
                // Error en la respuesta
                const mensajeError = resultado.data?.mensaje || resultado.message || 'Error al guardar';

                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: mensajeError
                });

                console.error("Error al guardar:", mensajeError);
            }
        },
        error: function (xhr, status, error) {
            const errorInfo = procesarErrorAPI(xhr, status, error);
            console.error("Error al guardar:", errorInfo.fullMessage);

            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: errorInfo.fullMessage || 'Error al guardar'
            });

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

    const usuario = obtenerUsuarioActual();
    const $tbody = $("#tablaProveedores tbody");

    console.log('Consultando proveedores con idOpcion:', idOpcionActual);

    if ($tbody.length === 0) {
        console.error("¡ERROR DE JAVASCRIPT! No se encontró '#tablaProveedores tbody'.");
        return;
    }

    $tbody.empty().append('<tr><td colspan="7" class="text-center">Cargando proveedores...</td></tr>');

    $.ajax({
        url: `${window.apiBaseUrl}/api/Proveedor/Listar`,
        method: "GET",
        headers: {
            "idopcion": String(idOpcionActual),
            "usuario": usuario
        },
        success: function (response) {
            console.log("Respuesta cruda de proveedores:", response);

            // Procesar la respuesta con la nueva estructura
            const resultado = procesarRespuestaAPI(response);
            const data = resultado.success ? resultado.data : response;

            console.log("Proveedores procesados:", data);

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
            const errorInfo = procesarErrorAPI(xhr, status, error);
            console.error("Error al cargar proveedores:", errorInfo.fullMessage);

            $tbody.empty().append(`<tr><td colspan="7" class="text-center text-danger">Error al cargar datos: ${errorInfo.message}</td></tr>`);
        }
    });
}

// Autor: JEAN FRANCOIS CALDERON VEAS | Empresa: BMTECSA | Proyecto: SOFTWARE APL