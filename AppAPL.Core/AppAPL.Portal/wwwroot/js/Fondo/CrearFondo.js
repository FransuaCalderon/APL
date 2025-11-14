/**
* Carga el combo (select) de Tipos de Fondo desde la API.
* @param {function} [callback] - Una función opcional a ejecutar cuando la carga sea exitosa.
*/
function cargarTipoFondo(callback) {
    // Definimos la etiqueta que quieres enviar
    const etiqueta = "TIPOFONDO";

    $.ajax({
        // 1. URL actualizada para incluir la etiqueta en la ruta
        url: `${window.apiBaseUrl}/api/Opciones/ConsultarCombos/${etiqueta}`,
        method: "GET",
        headers: {
            "idopcion": "1",
            "usuario": "admin"
        },
        success: function (data) {
            console.log("Tipos de fondo cargados:", data);

            // Seleccionamos el <select> por su ID
            const $selectFondoTipo = $("#fondoTipo");

            // Limpiar el select
            $selectFondoTipo.empty();

            // Agregar una opción por defecto
            $selectFondoTipo.append(
                $('<option></option>')
                    .val("") // Valor vacío para la opción por defecto
                    .text("Seleccione...")
            );

            // Agregar las opciones dinámicamente desde la API
            if (data && data.length > 0) {
                data.forEach(function (item) {
                    $selectFondoTipo.append(
                        $('<option></option>')
                            // 2. Nombres de propiedades (idcatalogo, nombre_catalogo)
                            .val(item.idcatalogo)
                            .text(item.nombre_catalogo)
                    );
                });
            }

            // Ejecutar callback si existe
            if (callback && typeof callback === 'function') {
                callback();
            }
        },
        error: function (xhr, status, error) {
            console.error("Error al cargar tipos de fondo:", error);
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
 * VERSIÓN CORREGIDA - Maneja tanto valores null como cadenas vacías
 */
function consultarProveedor() {
    // Valores fijos
    const usuario = "1";
    const idopcion = "9";

    // Selector del cuerpo de la tabla
    const $tbody = $("#tablaProveedores tbody");

    // Verificación del selector
    if ($tbody.length === 0) {
        console.error("¡ERROR DE JAVASCRIPT!");
        console.error("No se pudo encontrar el elemento '#tablaProveedores tbody'.");
        console.error("Asegúrate de que tu <table> tenga el ID 'tablaProveedores' y que tenga una etiqueta <tbody>.");
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
                    // *** FUNCIÓN AUXILIAR PARA OBTENER EL PRIMER VALOR NO VACÍO ***
                    function obtenerPrimerValorValido(...valores) {
                        for (let valor of valores) {
                            // Verifica que no sea null, undefined, y que después de trim no esté vacío
                            if (valor != null && String(valor).trim() !== '') {
                                return String(valor).trim();
                            }
                        }
                        return ''; // Retorna cadena vacía si todos están vacíos
                    }

                    // Mapeo de campos básicos
                    const codigo = proveedor.codigo ?? '';
                    const ruc = proveedor.identificacion ?? '';
                    const nombre = proveedor.nombre ?? '';

                    // *** CORRECCIÓN: Los campos del API están en MINÚSCULAS ***
                    // Contacto: nombrecontacto1, nombrecontacto2, nombrecontacto3, nombrecontacto4
                    const contacto = obtenerPrimerValorValido(
                        proveedor.nombrecontacto1,
                        proveedor.nombrecontacto2,
                        proveedor.nombrecontacto3,
                        proveedor.nombrecontacto4
                    );

                    // Mail: mailcontacto1, mailcontacto2, mailcontacto3, mailcontacto4
                    const mail = obtenerPrimerValorValido(
                        proveedor.mailcontacto1,
                        proveedor.mailcontacto2,
                        proveedor.mailcontacto3,
                        proveedor.mailcontacto4
                    );

                    // Teléfono: NO existe en el API, dejamos vacío
                    const telefono = '';

                    // *** DEBUGGING: Imprimir en consola para verificar ***
                    console.log(`Proveedor ${codigo}:`, {
                        contacto,
                        mail,
                        telefono,
                        // Ver valores originales completos
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

$(document).ready(function () {
    console.log("cargando fondos");

    $.get("/config", function (config) {
        const apiBaseUrl = config.apiBaseUrl;
        window.apiBaseUrl = apiBaseUrl;

        // *** ¡NUEVO! ***
        // Llamamos a la función para cargar los tipos de fondo
        cargarTipoFondo();

        //console.log("apiBaseUrl ",apiBaseUrl);
    });

    // *** ¡NUEVO! ***
    // Disparador para cargar los proveedores cuando se abre el modal.
    $('#modalConsultaProveedor').on('show.bs.modal', function (event) {
        // Usamos los valores de tu imagen de Swagger
        const usuario = "1";
        const idopcion = "1";

        consultarProveedor(usuario, idopcion);
    });

    // --- INICIO: CÓDIGO NUEVO PARA FORMATEAR MONEDA ---

    /**
     * Función auxiliar para formatear un número al formato "$ 1.000,00"
     * (punto para miles, coma para decimales)
     */
    function formatCurrencySpanish(value) {
        let number = parseFloat(value);
        if (isNaN(number)) {
            number = 0.0;
        }

        // Usamos 'es-ES' (España) que usa el formato 1.000,00
        const formatter = new Intl.NumberFormat('es-ES', {
            style: 'decimal', // Usamos 'decimal' para controlar el símbolo
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });

        // formatter.format(number) produce "1.000,00"
        // Añadimos el signo $
        return `$ ${formatter.format(number)}`;
    }

    // 1. Restringir entrada en 'Valor Total' a solo números y UNA coma decimal
    $("#fondoValorTotal").on("keypress", function (event) {
        const char = event.key;
        const currentValue = $(this).val();

        // Permitir números (0-9)
        if (char >= '0' && char <= '9') {
            return true;
        }

        // Permitir UNA SOLA coma decimal
        if (char === ',' && currentValue.indexOf(',') === -1) {
            return true;
        }

        // Bloquear todo lo demás
        event.preventDefault();
        return false;
    });

    // 2. Formatear y duplicar el valor cuando el usuario deje el campo 'Valor Total'
    $("#fondoValorTotal").on("blur", function () {
        // Reemplazamos la coma por un punto SÓLO para que parseFloat funcione
        const rawValue = $(this).val().replace(',', '.');

        // Formatear el valor (ej: "1000" -> "$ 1.000,00")
        const formattedValue = formatCurrencySpanish(rawValue);

        // Aplicar el valor formateado a ambos campos
        $(this).val(formattedValue);
        $("#fondoDisponible").val(formattedValue);
    });

    // --- FIN: CÓDIGO NUEVO PARA FORMATEAR MONEDA ---


    // *** ¡NUEVO! ***
    // Lógica para el botón 'Aceptar' del modal de proveedores
    $("#btnAceptarProveedor").on("click", function () {
        const $selected = $("#tablaProveedores tbody input[name='selectProveedor']:checked");

        if ($selected.length > 0) {
            const proveedorId = $selected.data("id");
            const proveedorNombre = $selected.data("nombre");
            const proveedorRuc = $selected.data("ruc");

            console.log("Proveedor seleccionado:", { id: proveedorId, nombre: proveedorNombre, ruc: proveedorRuc });

            // 3. ¡ACCIÓN CLAVE! - CORREGIDO
            // Guardamos el RUC en lugar del código
            $("#fondoProveedorId").val(proveedorRuc); // ✅ CAMBIO: Ahora guarda el RUC
            $("#fondoProveedor").val(proveedorNombre);

            $('#modalConsultaProveedor').modal('hide');

        } else {
            Swal.fire('Atención', 'Por favor, seleccione un proveedor de la lista.', 'info');
        }
    });

    // *** MODIFICADO ***
    // Se actualizó el listener para usar el ID 'btnGuardarFondos'
    // y leer los IDs del nuevo formulario
    // *** MODIFICADO ***
    // Se actualizó el listener para usar el ID 'btnGuardarFondos'
    // y leer los IDs del nuevo formulario
    $("#btnGuardarFondos").on("click", function (e) {
        e.preventDefault();
        console.log("Guardando fondos");

        Swal.fire({
            title: 'Confirmar Guardado de fondos',
            text: "¿Estás seguro de que deseas guardar el fondo?", // Texto corregido
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#009845',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, Guardar',
            cancelButtonText: 'Cancelar',
        }).then((result) => {
            if (result.isConfirmed) {

                // --- INICIO DE CAMBIOS ---

                /**
                 * Función auxiliar para convertir "dd/mm/aaaa" a formato ISO (UTC).
                 * El endpoint espera un formato como "2025-11-07T17:53:30.355Z".
                 */
                function convertirFechaAISO(fechaStr) {
                    // Valida que la fecha tenga el formato "dd/mm/aaaa"
                    if (!fechaStr || !/^\d{2}\/\d{2}\/\d{4}$/.test(fechaStr)) {
                        return null; // Retorna null si el formato es inválido
                    }

                    const partes = fechaStr.split('/'); // ["dd", "mm", "aaaa"]
                    // new Date(año, mes (0-11), dia)
                    const fecha = new Date(parseInt(partes[2]), parseInt(partes[1]) - 1, parseInt(partes[0]));

                    // .toISOString() convierte la fecha a formato UTC (ej: "2025-11-07T05:00:00.000Z")
                    return fecha.toISOString();
                }

                // --- INICIO: FUNCIÓN MODIFICADA ---
                /**
                 * Función auxiliar para limpiar y convertir valores monetarios a número.
                 * Entiende el formato "$ 1.000,00" (punto-miles, coma-decimal).
                 */
                function convertirMonedaANumero(monedaStr) {
                    if (!monedaStr) {
                        return 0;
                    }

                    // 1. Quitar el signo de dólar, los espacios, y los puntos (separadores de miles)
                    // ej: "$ 1.000,00" -> "1000,00"
                    let valorLimpio = String(monedaStr)
                        .replace(/\$/g, '')  // Quita el $
                        .replace(/\s/g, '')  // Quita espacios
                        .replace(/\./g, ''); // Quita los puntos (miles)

                    // 2. Reemplazar la coma decimal por un punto (para que parseFloat funcione)
                    // ej: "1000,00" -> "1000.00"
                    valorLimpio = valorLimpio.replace(',', '.');

                    // 3. Convertir a número
                    return parseFloat(valorLimpio) || 0;
                }
                // --- FIN: FUNCIÓN MODIFICADA ---

                // *** ¡OBJETO DATA MODIFICADO! ***
                // Leemos los valores y los adaptamos al nuevo endpoint
                // *** ¡OBJETO DATA MODIFICADO! ***
                const data = {
                    // --- Campos que coinciden ---
                    descripcion: $("#fondoDescripcion").val(),
                    idproveedor: $("#fondoProveedorId").val(),

                    // --- Campos con nombre y tipo corregidos ---
                    idtipofondo: parseInt($("#fondoTipo").val(), 10) || 0,
                    valorfondo: convertirMonedaANumero($("#fondoValorTotal").val()),

                    // --- Fechas convertidas a formato ISO ---
                    fechainiciovigencia: convertirFechaAISO($("#fondoFechaInicio").val()),
                    fechafinvigencia: convertirFechaAISO($("#fondoFechaFin").val()),

                    // --- Usuario ingreso ---
                    idusuarioingreso: "admin",
                    nombreusuarioingreso: "admin",

                    // --- 🔴 CAMPOS NUEVOS QUE PEDISTE ---
                    idopcion: 40,
                    idcontrolinterfaz: 24,
                    idevento: 29
                };


                // --- FIN DE CAMBIOS ---

                console.log("data antes de enviar", data);

                // --- NUEVA VALIDACIÓN ---
                // Validar que las fechas se hayan podido convertir
                if (!data.fechainiciovigencia || !data.fechafinvigencia) {
                    Swal.fire('Error de Formato', 'La fecha de inicio o fin no es válida. Asegúrese de usar el formato dd/mm/aaaa.', 'error');
                    return; // Detener el envío AJAX
                }


                const url = `${window.apiBaseUrl}/api/Fondo/insertar`;
                const method = "POST";

                $.ajax({
                    url: url,
                    type: method,
                    contentType: "application/json",
                    data: JSON.stringify(data),
                    headers: {
                        "idopcion": "1",
                        "usuario": "admin"
                    },
                    success: function (response) {
                        Swal.fire({
                            icon: 'success',
                            title: '¡Guardado!',
                            text: 'El registro se ha guardado correctamente.',
                            showConfirmButton: false,
                            timer: 1500
                        });

                        // --- INICIO: CÓDIGO NUEVO PARA LIMPIAR EL FORMULARIO ---
                        $("#fondoTipo").val(""); // Resetea el select a "Seleccione..."
                        $("#fondoProveedor").val("Seleccione..."); // Resetea el texto visible
                        $("#fondoProveedorId").val(""); // Limpia el ID oculto
                        $("#fondoDescripcion").val("");
                        $("#fondoFechaInicio").val("");
                        $("#fondoFechaFin").val("");
                        $("#fondoValorTotal").val("");
                        $("#fondoDisponible").val("");
                        // --- FIN: CÓDIGO NUEVO PARA LIMPIAR EL FORMULARIO ---
                    },
                    error: function () {
                        const mensaje = "guardar";
                        Swal.fire({
                            icon: 'error',
                            title: 'Oops...',
                            text: `¡Algo salió mal al ${mensaje} el registro!`
                        });
                    }
                });
            }
        });
    });
});