// Espera a que el documento esté listo
$(document).ready(function () {
    // Llama a la función para cargar la bandeja en cuanto la página esté lista
    cargarBandejaAprobacion();
});

/**
 * Función principal para cargar los datos de la bandeja mediante Ajax
 */
function cargarBandejaAprobacion() {
    var tbody = $("#tbody-fondos");
    tbody.html('<tr><td colspan="13" class="text-center">Cargando datos...</td></tr>');

    // DEBUGGING: Muestra qué URL y parámetros se están enviando
    console.log('=== INICIANDO PETICIÓN ===');
    console.log('URL:', '/Api/Fondo/listar');
    console.log('Parámetros:', {
        usuario: '1',
        idopcion: 9
    });

    // Configuración inicial y carga de datos
    $.get("/config", function (config) {
        const apiBaseUrl = config.apiBaseUrl;
        window.apiBaseUrl = apiBaseUrl;

        const headers = {
            "idopcion": "1",
            "usuario": "admin"
        };

        if (window.antiForgeryToken) {
            headers["RequestVerificationToken"] = window.antiForgeryToken;
        }

        $.ajax({
            // URL del endpoint de tu API
            url: `${apiBaseUrl}/Api/fondo/listar`,
            method: 'GET',

            // CRÍTICO: Envía las cookies de autenticación
            xhrFields: {
                withCredentials: false
            },
            // Headers adicionales (incluye el token anti-falsificación si existe)
            headers: headers,
            // Asegura que se envíen las cookies de sesión
            crossDomain: false,
            // Parámetros requeridos por tu API
            /*
            data: {
                usuario: 'admin',
                idopcion: 9
            },*/
            success: function (response) {
                // DEBUGGING: Muestra la respuesta completa
                console.log('=== RESPUESTA EXITOSA ===');
                console.log('Response completo:', response);
                console.log('Tipo de response:', typeof response);
                console.log('Es array?:', Array.isArray(response));

                tbody.empty();

                // Verifica si la respuesta tiene datos
                var data = response;

                // Si la respuesta viene envuelta en un objeto con propiedad 'data'
                if (response.data) {
                    data = response.data;
                }

                console.log('Data procesada:', data);
                console.log('Cantidad de registros:', data ? data.length : 0);

                if (!data || data.length === 0) {
                    tbody.html('<tr><td colspan="13" class="text-center">No se encontraron registros.</td></tr>');
                    return;
                }

                // Iteramos sobre cada registro
                $.each(data, function (index, fondo) {
                    var botonAccion = '<button class="btn btn-primary btn-sm" onclick="gestionarFondo(' + fondo.IdFondo + ')">Gestionar</button>';

                    // Construimos la fila con las propiedades en PascalCase
                    var fila = '<tr>' +
                        '<td>' + botonAccion + '</td>' +
                        //'<td>' + (fondo.solicitud || '') + '</td>' +
                        '<td>' + (fondo.idfondo || '') + '</td>' +
                        '<td>' + (fondo.descripcion || '') + '</td>' +
                        '<td>' + (fondo.idproveedor || '') + '</td>' +
                        '<td>' + (fondo.idtipofondo || '') + '</td>' +
                        '<td>' + formatearMoneda(fondo.valorfondo) + '</td>' +
                        '<td>' + formatearFecha(fondo.fechainiciovigencia) + '</td>' +
                        '<td>' + formatearFecha(fondo.fechafinvigencia) + '</td>' +
                        '<td>' + formatearMoneda(fondo.valordisponible) + '</td>' +
                        '<td>' + formatearMoneda(fondo.valorcomprometido) + '</td>' +
                        '<td>' + formatearMoneda(fondo.valorliquidado) + '</td>' +
                        '<td><span class="badge bg-' + obtenerColorEstado(fondo.estado) + '">' + (fondo.estado || '') + '</span></td>' +
                        '</tr>';

                    tbody.append(fila);
                });
            },
            error: function (jqXHR, textStatus, errorThrown) {
                // DEBUGGING: Muestra información detallada del error
                console.error('=== ERROR EN LA PETICIÓN ===');
                console.error('Status:', jqXHR.status);
                console.error('Status Text:', jqXHR.statusText);
                console.error('Response Text:', jqXHR.responseText);
                console.error('Text Status:', textStatus);
                console.error('Error Thrown:', errorThrown);

                // Intenta parsear la respuesta de error
                try {
                    var errorResponse = JSON.parse(jqXHR.responseText);
                    console.error('Error Response JSON:', errorResponse);
                } catch (e) {
                    console.error('No se pudo parsear la respuesta de error como JSON');
                }

                var mensajeError = 'Error al cargar los datos.';

                // Intenta obtener un mensaje de error más específico
                if (jqXHR.responseJSON && jqXHR.responseJSON.message) {
                    mensajeError += ' ' + jqXHR.responseJSON.message;
                } else if (jqXHR.status === 404) {
                    mensajeError = 'Endpoint no encontrado (404). Verifica la URL de la API.';
                } else if (jqXHR.status === 500) {
                    mensajeError = 'Error interno del servidor (500). Revisa la consola para más detalles.';
                } else if (jqXHR.status === 0) {
                    mensajeError = 'No se pudo conectar con el servidor. Verifica que la API esté en ejecución.';
                }

                tbody.html('<tr><td colspan="13" class="text-center text-danger">' + mensajeError + '<br><small>Revisa la consola del navegador (F12) para más información.</small></td></tr>');
            }
        });
    });

    
}

/**
 * Función que se llama al presionar el botón de "Gestionar"
 */
function gestionarFondo(idFondo) {
    // Aquí puedes abrir un modal o redirigir a una página de detalles
    console.log('Gestionando fondo ID:', idFondo);

    // Opción 1: Redirigir a una página de detalles
    // window.location.href = '/Fondo/Detalle?id=' + idFondo;

    // Opción 2: Abrir un modal (requiere implementar el modal)
    // abrirModalGestion(idFondo);

    // Temporal: mostrar alert
    alert('Se gestionará el fondo con ID: ' + idFondo);
}

/**
 * Obtiene el color del badge según el estado
 */
function obtenerColorEstado(estado) {
    if (!estado) return 'secondary';

    estado = estado.toLowerCase();

    if (estado.includes('pendiente') || estado.includes('solicitado')) {
        return 'warning';
    } else if (estado.includes('aprobado') || estado.includes('activo')) {
        return 'success';
    } else if (estado.includes('rechazado') || estado.includes('cancelado')) {
        return 'danger';
    } else if (estado.includes('liquidado') || estado.includes('cerrado')) {
        return 'info';
    }

    return 'secondary';
}

/**
 * Formatea un número como moneda
 */
function formatearMoneda(valor) {
    if (valor === null || valor === undefined || valor === '') {
        return '0.00';
    }

    var numero = parseFloat(valor);
    if (isNaN(numero)) {
        return '0.00';
    }

    return numero.toLocaleString('es-EC', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

/**
 * Formatea la fecha en formato Nov-01-2025
 */
function formatearFecha(fechaString) {
    if (!fechaString) return "";

    try {
        var fecha = new Date(fechaString);

        // Verificar si la fecha es válida
        if (isNaN(fecha.getTime())) {
            return fechaString;
        }

        var meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
            'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

        var dia = fecha.getDate().toString().padStart(2, '0');
        var mes = meses[fecha.getMonth()];
        var anio = fecha.getFullYear();

        return mes + '-' + dia + '-' + anio;

    } catch (e) {
        console.warn("Error formateando fecha: ", fechaString);
        return fechaString;
    }
}