/**
* Carga el combo (select) de Tipos de Fondo desde la API.
* @param {function} [callback] - Una función opcional a ejecutar cuando la carga sea exitosa.
*/
function cargarTipoFondo(callback) {
    const idOpcionActual = window.obtenerIdOpcionActual();

    if (!idOpcionActual) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo obtener el ID de la opción. Por favor, acceda nuevamente desde el menú.'
        });
        return;
    }

    console.log('Cargando tipos de fondo con idOpcion:', idOpcionActual);

    const usuario = window.usuarioActual || "admin";
    const etiqueta = "TIPOFONDO";

    $.ajax({
        url: `${window.apiBaseUrl}/api/Opciones/ConsultarCombos/${etiqueta}`,
        method: "GET",
        headers: {
            "idopcion": String(idOpcionActual),
            "usuario": usuario,
        },
        success: function (data) {
            console.log("Tipos de fondo cargados:", data);

            const $selectFondoTipo = $("#fondoTipo");
            $selectFondoTipo.empty();

            $selectFondoTipo.append(
                $('<option></option>')
                    .val("")
                    .text("Seleccione...")
            );

            if (data && data.length > 0) {
                data.forEach(function (item) {
                    $selectFondoTipo.append(
                        $('<option></option>')
                            .val(item.idcatalogo)
                            .text(item.nombre_catalogo)
                            // ✅ NUEVO: Guardamos el nombre como data attribute
                            .attr('data-nombre', item.nombre_catalogo)
                    );
                });
            }

            if (callback && typeof callback === 'function') {
                callback();
            }
        },
        error: function (xhr, status, error) {
            console.error("Error al cargar tipos de fondo:", error);
            console.error("Detalles del error:", xhr.responseText);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudieron cargar los tipos de fondo'
            });
        }
    });
}

/**
 * Carga la tabla de proveedores desde la API en el modal.
 * ✅ MODIFICADO: Filtra el proveedor de Fondo Propio cuando NO está seleccionado Fondo Propio
 */
function consultarProveedor() {
    const idOpcionActual = window.obtenerIdOpcionActual();

    if (!idOpcionActual) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo obtener el ID de la opción. Por favor, acceda nuevamente desde el menú.'
        });
        return;
    }

    console.log('Consultando proveedores con idOpcion:', idOpcionActual);

    const usuario = window.usuarioActual || "admin";
    const $tbody = $("#tablaProveedores tbody");

    if ($tbody.length === 0) {
        console.error("¡ERROR DE JAVASCRIPT!");
        console.error("No se pudo encontrar el elemento '#tablaProveedores tbody'.");
        return;
    }

    function obtenerPrimerValorValido(...valores) {
        for (let valor of valores) {
            if (valor != null && String(valor).trim() !== '') {
                return String(valor).trim();
            }
        }
        return '';
    }

    // ✅ NUEVO: Verificar si está seleccionado Fondo Propio
    const esFondoPropio = verificarSiFondoPropio();
    const RUC_FONDO_PROPIO = "1790895548001";

    $tbody.empty().append('<tr><td colspan="7" class="text-center">Cargando proveedores...</td></tr>');

    $.ajax({
        url: `${window.apiBaseUrl}/api/Proveedor/Listar`,
        method: "GET",
        headers: {
            "idopcion": String(idOpcionActual),
            "usuario": usuario,
        },
        success: function (data) {
            console.log("Proveedores cargados:", data);

            $tbody.empty();

            if (data && data.length > 0) {

                data.forEach(function (proveedor) {
                    const codigo = proveedor.codigo ?? '';
                    const ruc = proveedor.identificacion ?? '';
                    const nombre = proveedor.nombre ?? '';

                    // ✅ NUEVO: Filtrar el proveedor de Fondo Propio cuando NO está seleccionado Fondo Propio
                    if (!esFondoPropio && ruc === RUC_FONDO_PROPIO) {
                        console.log(`Proveedor ${ruc} (Fondo Propio) ocultado porque no está seleccionado Fondo Propio`);
                        return; // Saltar este proveedor
                    }

                    const contacto = obtenerPrimerValorValido(
                        proveedor.nombrecontacto1,
                        proveedor.nombrecontacto2,
                        proveedor.nombrecontacto3,
                        proveedor.nombrecontacto4
                    );

                    const mail = obtenerPrimerValorValido(
                        proveedor.mailcontacto1,
                        proveedor.mailcontacto2,
                        proveedor.mailcontacto3,
                        proveedor.mailcontacto4
                    );

                    const telefono = '';

                    console.log(`Proveedor ${codigo}:`, {
                        contacto,
                        mail,
                        telefono,
                        datosOriginales: {
                            nombrecontacto1: proveedor.nombrecontacto1,
                            nombrecontacto2: proveedor.nombrecontacto2,
                            nombrecontacto3: proveedor.nombrecontacto3,
                            nombrecontacto4: proveedor.nombrecontacto4,
                            mailcontacto1: proveedor.mailcontacto1,
                            mailcontacto2: proveedor.mailcontacto2,
                            mailcontacto3: proveedor.mailcontacto3,
                            mailcontacto4: proveedor.mailcontacto4
                        }
                    });

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

// ✅ NUEVA FUNCIÓN: Verifica si el tipo de fondo seleccionado es "Fondo Propio"
function verificarSiFondoPropio() {
    const $selectFondoTipo = $("#fondoTipo");
    const valorSeleccionado = $selectFondoTipo.val();

    if (!valorSeleccionado) {
        return false;
    }

    // Obtener el texto de la opción seleccionada
    const textoSeleccionado = $selectFondoTipo.find('option:selected').attr('data-nombre') ||
        $selectFondoTipo.find('option:selected').text();

    // Verificar si contiene "FONDO PROPIO" o "PROPIO" (case insensitive)
    const esFondoPropio = /fondo\s*propio|propio/i.test(textoSeleccionado);

    console.log('Verificando si es Fondo Propio:', {
        valorSeleccionado,
        textoSeleccionado,
        esFondoPropio
    });

    return esFondoPropio;
}

// ✅ NUEVA FUNCIÓN: Selecciona automáticamente el proveedor de Fondo Propio
function seleccionarProveedorFondoPropio() {
    const RUC_FONDO_PROPIO = "1790895548001";
    const NOMBRE_PROVEEDOR_PROPIO = "Unicomer de Ecuador S.A.";

    // Establecer el proveedor en los campos
    $("#fondoProveedorId").val(RUC_FONDO_PROPIO);
    $("#fondoProveedor").val(NOMBRE_PROVEEDOR_PROPIO);

    // Deshabilitar el botón de búsqueda
    $("#btnBuscarProveedorModal").prop('disabled', true).addClass('disabled');

    console.log('Proveedor de Fondo Propio seleccionado automáticamente');
}

// ✅ NUEVA FUNCIÓN: Limpia y habilita la selección de proveedor
function habilitarSeleccionProveedor() {
    // Limpiar los campos de proveedor
    $("#fondoProveedorId").val("");
    $("#fondoProveedor").val("Seleccione...");

    // Habilitar el botón de búsqueda
    $("#btnBuscarProveedorModal").prop('disabled', false).removeClass('disabled');

    console.log('Selección de proveedor habilitada');
}

$(document).ready(function () {
    console.log("=== INICIO DE CARGA DE PÁGINA - CrearFondo ===");

    console.log("Usuario actual capturado:", window.usuarioActual);

    const infoOpcion = window.obtenerInfoOpcionActual();
    console.log("Información de la opción actual:", {
        idOpcion: infoOpcion.idOpcion,
        nombre: infoOpcion.nombre,
        ruta: infoOpcion.ruta
    });

    if (!infoOpcion.idOpcion) {
        console.warn("⚠️ ADVERTENCIA: No se detectó un idOpcion al cargar la página.");
        console.warn("Esto es normal si accediste directamente a la URL sin pasar por el menú.");
        console.warn("Para que funcione correctamente, accede a esta página desde el menú.");
    } else {
        console.log("✅ idOpcion capturado correctamente:", infoOpcion.idOpcion);
    }

    console.log("=== FIN DE VERIFICACIÓN INICIAL ===");
    console.log("");

    $.get("/config", function (config) {
        const apiBaseUrl = config.apiBaseUrl;
        window.apiBaseUrl = apiBaseUrl;

        console.log("API Base URL configurada:", apiBaseUrl);

        cargarTipoFondo();
    });

    // ✅ NUEVO: Evento change para el select de Tipo Fondo
    $("#fondoTipo").on("change", function () {
        const esFondoPropio = verificarSiFondoPropio();

        if (esFondoPropio) {
            // Si es Fondo Propio, seleccionar automáticamente el proveedor
            seleccionarProveedorFondoPropio();
        } else {
            // Si no es Fondo Propio, habilitar la selección normal
            habilitarSeleccionProveedor();
        }
    });

    $('#modalConsultaProveedor').on('show.bs.modal', function (event) {
        consultarProveedor();
    });

    function formatCurrencySpanish(value) {
        let number = parseFloat(value);
        if (isNaN(number)) {
            number = 0.0;
        }

        const formatter = new Intl.NumberFormat('es-ES', {
            style: 'decimal',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });

        return `$ ${formatter.format(number)}`;
    }

    $("#fondoValorTotal").on("keypress", function (event) {
        const char = event.key;
        const currentValue = $(this).val();

        if (char >= '0' && char <= '9') {
            return true;
        }

        if (char === ',' && currentValue.indexOf(',') === -1) {
            return true;
        }

        event.preventDefault();
        return false;
    });

    $("#fondoValorTotal").on("blur", function () {
        const rawValue = $(this).val().replace(',', '.');

        const formattedValue = formatCurrencySpanish(rawValue);

        $(this).val(formattedValue);
        $("#fondoDisponible").val(formattedValue);
    });

    $("#btnAceptarProveedor").on("click", function () {
        const $selected = $("#tablaProveedores tbody input[name='selectProveedor']:checked");

        if ($selected.length > 0) {
            const proveedorId = $selected.data("id");
            const proveedorNombre = $selected.data("nombre");
            const proveedorRuc = $selected.data("ruc");

            console.log("Proveedor seleccionado:", { id: proveedorId, nombre: proveedorNombre, ruc: proveedorRuc });

            $("#fondoProveedorId").val(proveedorRuc);
            $("#fondoProveedor").val(proveedorNombre);

            $('#modalConsultaProveedor').modal('hide');

        } else {
            Swal.fire('Atención', 'Por favor, seleccione un proveedor de la lista.', 'info');
        }
    });

    $("#btnGuardarFondos").on("click", function (e) {
        e.preventDefault();
        console.log("Guardando fondos");

        Swal.fire({
            title: 'Confirmar Guardado de fondos',
            text: "¿Estás seguro de que deseas guardar el fondo?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#009845',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, Guardar',
            cancelButtonText: 'Cancelar',
        }).then((result) => {
            if (result.isConfirmed) {

                const idOpcionActual = window.obtenerIdOpcionActual();

                if (!idOpcionActual) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'No se pudo obtener el ID de la opción. Por favor, acceda nuevamente desde el menú.'
                    });
                    return;
                }

                console.log('ID Opción capturado dinámicamente:', idOpcionActual);

                function convertirFechaAISO(fechaStr) {
                    if (!fechaStr || !/^\d{2}\/\d{2}\/\d{4}$/.test(fechaStr)) {
                        return null;
                    }

                    const partes = fechaStr.split('/');
                    const fecha = new Date(parseInt(partes[2]), parseInt(partes[1]) - 1, parseInt(partes[0]));

                    return fecha.toISOString();
                }

                function convertirMonedaANumero(monedaStr) {
                    if (!monedaStr) {
                        return 0;
                    }

                    let valorLimpio = String(monedaStr)
                        .replace(/\$/g, '')
                        .replace(/\s/g, '')
                        .replace(/\./g, '');

                    valorLimpio = valorLimpio.replace(',', '.');

                    return parseFloat(valorLimpio) || 0;
                }

                const data = {
                    descripcion: $("#fondoDescripcion").val(),
                    idproveedor: $("#fondoProveedorId").val(),
                    idtipofondo: parseInt($("#fondoTipo").val(), 10) || 0,
                    valorfondo: convertirMonedaANumero($("#fondoValorTotal").val()),
                    fechainiciovigencia: convertirFechaAISO($("#fondoFechaInicio").val()),
                    fechafinvigencia: convertirFechaAISO($("#fondoFechaFin").val()),
                    idusuarioingreso: window.usuarioActual,
                    nombreusuarioingreso: window.usuarioActual,
                    idopcion: idOpcionActual,
                    idcontrolinterfaz: "BTNGRABAR",
                    idevento: "EVCLICK",
                    nombreusuario: window.usuarioActual
                };

                console.log("data antes de enviar", data);

                if (!data.fechainiciovigencia || !data.fechafinvigencia) {
                    Swal.fire('Error de Formato', 'La fecha de inicio o fin no es válida. Asegúrese de usar el formato dd/mm/aaaa.', 'error');
                    return;
                }

                const url = `${window.apiBaseUrl}/api/Fondo/insertar`;
                const method = "POST";

                $.ajax({
                    url: url,
                    type: method,
                    contentType: "application/json",
                    data: JSON.stringify(data),
                    headers: {
                        "idopcion": String(idOpcionActual),
                        "usuario": window.usuarioActual
                    },
                    success: function (response) {
                        Swal.fire({
                            icon: 'success',
                            title: '¡Guardado!',
                            text: 'El registro se ha guardado correctamente.',
                            showConfirmButton: false,
                            timer: 1500
                        });

                        $("#fondoTipo").val("");
                        $("#fondoProveedor").val("Seleccione...");
                        $("#fondoProveedorId").val("");
                        $("#fondoDescripcion").val("");
                        $("#fondoFechaInicio").val("");
                        $("#fondoFechaFin").val("");
                        $("#fondoValorTotal").val("");
                        $("#fondoDisponible").val("");

                        // ✅ NUEVO: Habilitar el botón de búsqueda después de limpiar
                        habilitarSeleccionProveedor();
                    },
                    error: function (xhr, status, error) {
                        const mensaje = "guardar";
                        console.error("Error en el guardado:", xhr.responseText);
                        Swal.fire({
                            icon: 'error',
                            title: 'Oops...',
                            text: `¡Algo salió mal al ${mensaje} el registro!`,
                            footer: xhr.responseText ? `Detalle: ${xhr.responseText}` : ''
                        });
                    }
                });
            }
        });
    });
});