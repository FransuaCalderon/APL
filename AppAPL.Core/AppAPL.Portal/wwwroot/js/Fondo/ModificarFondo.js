// Espera a que el documento esté listo
$(document).ready(function () {

    // Llama a la función para cargar la bandeja en cuanto la página esté lista
    cargarBandejaAprobacion();

});

/**
 * Función principal para cargar los datos de la bandeja mediante Ajax
 */
function cargarBandejaAprobacion() {

    // Mostramos un spinner o texto de "cargando" (opcional pero recomendado)
    var tbody = $("#tbody-fondos");
    tbody.html('<tr><td colspan="13" class="text-center">Cargando datos...</td></tr>');

    $.ajax({
        // IMPORTANTE: Reemplaza esto con la URL correcta a tu controlador y método
        url: '/AprobarFondo/ObtenerDatosBandeja',
        type: 'GET',
        dataType: 'json',
        success: function (data) {
            // Limpiamos el tbody
            tbody.empty();

            // Verificamos si la data vino vacía
            if (data.length === 0) {
                tbody.html('<tr><td colspan="13" class="text-center">No se encontraron registros.</td></tr>');
                return;
            }

            // Iteramos sobre cada registro (fondo) que retornó el servidor
            $.each(data, function (index, fondo) {

                // Creamos el botón de Acción. 
                // Asumimos que quieres llamar a una función JS "aprobar" o "ver"
                var botonAccion = '<button class="btn btn-primary btn-sm" onclick="gestionarFondo(' + fondo.idFondo + ')">Gestionar</button>';

                // Construimos la fila (tr)
                var fila = '<tr>' +
                    '<td>' + botonAccion + '</td>' +
                    '<td>' + fondo.solicitud + '</td>' +
                    '<td>' + fondo.idFondo + '</td>' +
                    '<td>' + fondo.descripcion + '</td>' +
                    '<td>' + fondo.proveedor + '</td>' +
                    '<td>' + fondo.tipoDeFondo + '</td>' +
                    '<td>' + formatearMoneda(fondo.valorFondo) + '</td>' +
                    '<td>' + formatearFecha(fondo.fechaInicio) + '</td>' +
                    '<td>' + formatearFecha(fondo.fechaFin) + '</td>' +
                    '<td>' + formatearMoneda(fondo.valorDisponible) + '</td>' +
                    '<td>' + formatearMoneda(fondo.valorComprometido) + '</td>' +
                    '<td>' + formatearMoneda(fondo.valorLiquidado) + '</td>' +
                    '<td>' + fondo.estado + '</td>' +
                    '</tr>';

                // Añadimos la fila al cuerpo de la tabla
                tbody.append(fila);
            });
        },
        error: function (jqXHR, textStatus, errorThrown) {
            // Manejo de errores
            console.error("Error al cargar datos: ", textStatus, errorThrown);
            tbody.html('<tr><td colspan="13" class="text-center text-danger">Error al cargar los datos. Intente más tarde.</td></tr>');
        }
    });
}

/**
 * Función de ejemplo que se llamaría al presionar el botón de "Gestionar"
 */
function gestionarFondo(idFondo) {
    alert('Se gestionará el fondo con ID: ' + idFondo);
    // Aquí puedes redirigir a otra página, abrir un modal, etc.
    // window.location.href = '/AprobarFondo/Detalle?id=' + idFondo;
}


// --- Funciones Utilitarias (Opcionales) ---

/**
 * Formatea un número como moneda (ej: 20000 -> 20,000.00)
 */
function formatearMoneda(valor) {
    // Aseguramos que el valor sea un número
    var numero = parseFloat(valor);
    if (isNaN(numero)) {
        return valor; // Retorna el original si no es un número
    }

    // Formatea a 2 decimales, con separador de miles
    return numero.toLocaleString('es-EC', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

/**
 * Formatea la fecha. Asume que la fecha viene en formato ISO (del servidor)
 * ej: "2025-11-01T00:00:00" -> "01-Nov-2025"
 */
function formatearFecha(fechaString) {
    try {
        var fecha = new Date(fechaString);

        // Opciones para formatear como en tu imagen (ej: Nov-01-2025)
        var opciones = { year: 'numeric', month: 'short', day: '2-digit' };

        var fechaFormateada = fecha.toLocaleDateString('es-EC', opciones); // ej: "01 nov. 2025"

        // Ajustamos para que coincida exactamente con tu imagen "Nov-01-2026"
        var partes = fechaFormateada.replace('.', '').split(' ');

        // 'partes' sería algo como ["01", "nov", "2025"]
        // Capitalizamos el mes
        var mes = partes[1].charAt(0).toUpperCase() + partes[1].slice(1);

        return mes + '-' + partes[0] + '-' + partes[2]; // ej: Nov-01-2025

    } catch (e) {
        console.warn("Error formateando fecha: ", fechaString);
        return fechaString; // Retorna el original si hay error
    }
}