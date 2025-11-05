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
 * ¡NUEVA FUNCIÓN!
 * Carga la tabla de proveedores desde la API en el modal.
 * @param {string} usuario - El usuario que realiza la solicitud.
 * @param {string} idopcion - El ID de la opción.
 */
/**
 * ¡NUEVA FUNCIÓN! (Modificada)
 * Carga la tabla de proveedores desde la API en el modal.
 * Los valores de usuario e idopcion están fijos en "1".
 */
/**
 * Carga la tabla de proveedores desde la API en el modal.
 * Esta versión tiene verificación de selector y mapeo de campos.
 */
function consultarProveedor() {
    // Valores fijos
    const usuario = "1";
    const idopcion = "1";

    // Selector del cuerpo de la tabla
    const $tbody = $("#tablaProveedores tbody");

    // --- ¡VERIFICACIÓN IMPORTANTE! ---
    // Si no encuentra la tabla, lo dirá en la consola.
    if ($tbody.length === 0) {
        console.error("¡ERROR DE JAVASCRIPT!");
        console.error("No se pudo encontrar el elemento '#tablaProveedores tbody'.");
        console.error("Asegúrate de que tu <table> tenga el ID 'tablaProveedores' y que tenga una etiqueta <tbody>.");
        return; // Detiene la función
    }
    // --- FIN DE LA VERIFICACIÓN ---

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
            // Esto ya te funciona
            console.log("Proveedores cargados:", data);

            // Limpia el "Cargando..."
            $tbody.empty();

            if (data && data.length > 0) {

                data.forEach(function (proveedor) {

                    // Mapeo de campos (buscando el primer valor no-nulo)
                    const codigo = proveedor.codigo ?? '';
                    const ruc = proveedor.identificacion ?? '';
                    const nombre = proveedor.nombre ?? '';
                    const contacto = proveedor.nombreContacto1 ?? proveedor.nombreContacto2 ?? proveedor.nombreContacto3 ?? proveedor.nombreContacto4 ?? '';
                    const mail = proveedor.mailContacto1 ?? proveedor.mailContacto2 ?? proveedor.mailContacto3 ?? proveedor.mailContacto4 ?? '';
                    const telefono = proveedor.telefonoContacto1 ?? proveedor.telefonoContacto2 ?? proveedor.telefonoContacto3 ?? proveedor.telefonoContacto4 ?? '';

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

                    // Agrega la fila al tbody
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

    // *** ¡NUEVO! ***
    // Lógica para el botón 'Aceptar' del modal de proveedores
    $("#btnAceptarProveedor").on("click", function () {
        // 1. Encontrar el radio button que está seleccionado
        const $selected = $("#tablaProveedores tbody input[name='selectProveedor']:checked");

        if ($selected.length > 0) {
            // 2. Obtener los datos guardados en los data-attributes
            const proveedorId = $selected.data("id");
            const proveedorNombre = $selected.data("nombre");
            const proveedorRuc = $selected.data("ruc");

            console.log("Proveedor seleccionado:", { id: proveedorId, nombre: proveedorNombre, ruc: proveedorRuc });

            // 3. ¡ACCIÓN CLAVE! 
            // Poner los datos en tu formulario principal (el de "Fondos").
            // *** ¡DEBES TENER ESTOS INPUTS EN TU FORMULARIO PRINCIPAL! ***

            // Asumo que tienes un input para el ID (puede ser 'hidden')
            $("#fondoProveedorId").val(proveedorId); // Ej: <input type="hidden" id="fondoProveedorId">

            // Asumo que tienes un input para el nombre (visible y 'readonly')
            $("#fondoProveedorNombre").val(`${proveedorRuc} - ${proveedorNombre}`); // Ej: <input type="text" id="fondoProveedorNombre" readonly>


            // 4. Cierro el modal
            $('#modalConsultaProveedor').modal('hide');

        } else {
            // Si no seleccionó nada
            Swal.fire('Atención', 'Por favor, seleccione un proveedor de la lista.', 'info');
        }
    });

    // *** MODIFICADO ***
    // Se actualizó el listener para usar el ID 'btnGuardarFondos'
    // y leer los IDs del nuevo formulario
    $("#btnGuardarFondos").on("click", function (e) {
        e.preventDefault();
        console.log("Guardando fondos");

        Swal.fire({
            title: 'Confirmar Guardado de fondos',
            text: "¿Estás seguro de que deseas guardar el fondo ",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#009845',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, Guardar',
            cancelButtonText: 'Cancelar',
        }).then((result) => {
            if (result.isConfirmed) {
                // *** ¡MODIFICADO! ***
                // Leemos los valores de los campos del nuevo formulario
                const data = {
                    descripcion_fondo: $("#fondoDescripcion").val(),

                    // ¡AQUÍ ESTÁ EL CAMBIO! 
                    // Leemos el ID del proveedor desde el campo que llenamos con el modal
                    idproveedor: $("#fondoProveedorId").val(), // Asegúrate de tener <input id="fondoProveedorId">

                    tipo_fondo: $("#fondoTipo").val(),
                    valor_fondo: $("#fondoValorTotal").val(),
                    fecha_inicio_vigencia: $("#fondoFechaInicio").val(),
                    fecha_fin_vigencia: $("#fondoFechaFin").val(),
                    valor_disponible: $("#fondoDisponible").val(),
                    valor_comprometido: $("#fondoComprometido").val(), // Estos son readonly, quizás deban calcularse
                    valor_liquidado: $("#fondoLiquidado").val(), // Estos son readonly, quizás deban calcularse
                    estado_registro: 0, // Asumiendo valores por defecto
                    indicador_creacion: 0 // Asumiendo valores por defecto
                };

                console.log("data antes de enviar", data);

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

                        // Aquí podrías limpiar el formulario o redirigir
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