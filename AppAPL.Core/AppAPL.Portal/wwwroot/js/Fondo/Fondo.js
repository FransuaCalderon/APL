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


$(document).ready(function () {
    console.log("cargnado fondos");

    $.get("/config", function (config) {
        const apiBaseUrl = config.apiBaseUrl;
        window.apiBaseUrl = apiBaseUrl;

        // *** ¡NUEVO! ***
        // Llamamos a la función para cargar los tipos de fondo
        cargarTipoFondo();

        //console.log("apiBaseUrl ",apiBaseUrl);
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
                    idproveedor: 0, // Debes implementar la búsqueda de proveedor
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