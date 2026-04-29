$(document).ready(function () {
    console.log("=== INICIO - Parametrizacion Configuracion ===");

    $.get("/config", function (config) {
        window.apiBaseUrl = config.apiBaseUrl;
        cargarConfiguracion();
        cargarGrupoAlmacen();
    });

    // 1. Escuchar el clic en cualquier fila de la tabla de Grupos
    $(document).on('click', '.fila-grupo-almacen', function () {
        // Opción de UI: Pintar la fila seleccionada para que el usuario sepa dónde hizo clic
        $('.fila-grupo-almacen').removeClass('table-active');
        $(this).addClass('table-active');

        // Capturar los datos de la fila
        const codigoGrupo = $(this).data('codigo');
        const nombreGrupo = $(this).data('nombre');

        // Actualizar el título de la segunda tabla
        $('#caption-almacen-grupo').text(`Almacenes Asignados a: ${nombreGrupo}`);

        // Llamar a la API pasando el código de la ruta
        cargarAlmacenGrupo(codigoGrupo);
    });

    // IMPORTANTE: Evitar que hacer clic en los botones de Modificar/Eliminar dispare la carga de la tabla
    $(document).on('click', '.btn-action', function (e) {
        e.stopPropagation();
    });
});

function manejarErrorGlobal(xhr, accion) {
    console.error(`Error al ${accion}:`, xhr.responseText);
    Swal.fire({ icon: 'error', title: 'Error de Comunicación', text: `No se pudo completar la acción: ${accion}.` });
}

function cargarConfiguracion() {
    const payload =
    {
        code_app: "APP20260128155212346",
        http_method: "GET",
        endpoint_path: "api/Parametrizacion/consultar-parametros",
        client: "APL"
    };

    $.ajax({
        url: "/api/apigee-router-proxy", method: "POST", contentType: "application/json", data: JSON.stringify(payload),
        success: function (response) {
            if (response && response.code_status === 200)
                crearListadoConfiguracion(response.json_response || []);
            else
                Swal.fire({ icon: "error", title: "Error", text: "No se pudo cargar la bandeja." });
        },
        error: function (xhr) {
            manejarErrorGlobal(xhr, "cargar la bandeja de consulta");
        }
    });
}

function crearListadoConfiguracion(data) {
    const $contenedorLista = $('#list-tab');

    // Limpiar el menú antes de cargar
    $contenedorLista.empty();

    if (!data || data.length === 0) {
        $contenedorLista.append('<p class="text-muted p-2">No hay opciones disponibles.</p>');
        return;
    }

    let htmlGenerado = '';

    $.each(data, function (index, item) {
        // El primer elemento se marca como activo para que coincida con el diseño original
        const claseActive = (index === 0) ? 'active' : '';

        // Generamos IDs únicos basados en el idparametro del SP
        const idLink = `list-item-${item.idparametro}-list`;
        const hrefTarget = `#list-item-${item.idparametro}`;
        const ariaControl = `list-item-${item.idparametro}`;

        // Mapeo opcional de iconos: como el JSON no trae iconos, 
        // puedes usar uno genérico o definir una lógica según el codigoparametro
        let icono = 'fa-solid fa-circle-chevron-right';

        // Ejemplo de cómo podrías mantener tus iconos originales:
        // if(item.nombre.includes("Pagos")) icono = "fa-regular fa-credit-card";
        // if(item.nombre.includes("Almacenes")) icono = "fa-regular fa-house";

        htmlGenerado += `
            <a class="list-group-item list-group-item-action border-0 ${claseActive}" 
               id="${idLink}" 
               data-bs-toggle="list" 
               href="${hrefTarget}" 
               role="tab" 
               aria-controls="${ariaControl}">
                <i class="${icono}"></i> ${item.nombre}
            </a>
        `;
    });

    $contenedorLista.html(htmlGenerado);
}



function cargarGrupoAlmacen() {
    const payload =
    {
        code_app: "APP20260128155212346",
        http_method: "GET",
        endpoint_path: "api/Parametrizacion/consultar-grupo-almacen",
        client: "APL"
    };

    $.ajax({
        url: "/api/apigee-router-proxy", method: "POST", contentType: "application/json", data: JSON.stringify(payload),
        success: function (response) {
            if (response && response.code_status === 200)
                crearListadoGrupoAlmacen(response.json_response || []);
            else
                Swal.fire({ icon: "error", title: "Error", text: "No se pudo cargar la bandeja." });
        },
        error: function (xhr) {
            manejarErrorGlobal(xhr, "cargar la bandeja de consulta");
        }
    });
}

function crearListadoGrupoAlmacen(data) {
    const $tbody = $('#tbody-grupo-almacen');

    // 1. Limpiar la tabla antes de inyectar la nueva data
    $tbody.empty();

    // 2. Validar que el API traiga registros
    if (!data || data.length === 0) {
        $tbody.append('<tr><td colspan="2" class="text-center text-muted">No se encontraron grupos de almacenes.</td></tr>');
        return;
    }

    let htmlFilas = '';

    // 3. Recorrer el JSON devuelto
    $.each(data, function (index, item) {
        // Se arma la fila (tr) inyectando 'item.nombre' en la columna correspondiente
        // y 'item.idparametro' en los data-attributes de los botones.
        // Dentro del $.each de crearListadoGrupoAlmacen, el <tr> debería quedar así:
        htmlFilas += `
            <tr class="fila-grupo-almacen" 
                data-codigo="${item.codigoparametro}" 
                data-nombre="${item.nombre}" 
                style="cursor: pointer;">
                <td class="align-middle">${item.nombre}</td>
                <td class="align-middle">
                    <div class="btn-toolbar" role="toolbar" aria-label="Toolbar with button groups">
                        <div class="btn-group btn-group-sm" role="group" aria-label="First group">
                            <button type="button" class="btn-action edit-btn" 
                                    data-bs-toggle="modal" 
                                    data-bs-target="#modalModificarGrupo" 
                                    data-id="${item.idparametro}" 
                                    title="Modificar" 
                                    style="border:none; background:none; color:#0d6efd;">
                                <i class="fa-regular fa-pen-to-square"></i>
                            </button>
                            <button type="button" class="btn-action delete-btn" 
                                    data-bs-toggle="modal" 
                                    data-bs-target="#modalEliminarGrupo" 
                                    data-id="${item.idparametro}" 
                                    title="Eliminar" 
                                    style="border:none; background:none; color:red">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </td>
            </tr>
        `;
    });

    // 4. Insertar todo el bloque de filas en el cuerpo de la tabla
    $tbody.html(htmlFilas);
}

function cargarAlmacenGrupo(codigo) {
    const payload =
    {
        code_app: "APP20260128155212346",
        http_method: "GET",
        endpoint_path: `api/Parametrizacion/consultar-almacen-grupo/${codigo}`,
        client: "APL"
    };

    $.ajax({
        url: "/api/apigee-router-proxy", method: "POST", contentType: "application/json", data: JSON.stringify(payload),
        success: function (response) {
            if (response && response.code_status === 200)
                crearListadoAlmacenGrupo(response.json_response || []);
            else
                Swal.fire({ icon: "error", title: "Error", text: "No se pudo cargar la bandeja." });
        },
        error: function (xhr) {
            manejarErrorGlobal(xhr, "cargar la bandeja de consulta");
        }
    });
}


// 2. Función para pintar la tabla de Almacenes Asignados
function crearListadoAlmacenGrupo(data) {
    const $tbody = $('#tbody-almacenes-asignados');

    // Limpiar tabla
    $tbody.empty();

    // Validar si vienen datos
    if (!data || data.length === 0) {
        $tbody.append('<tr><td colspan="2" class="text-center text-muted">No hay almacenes asignados a este grupo.</td></tr>');
        return;
    }

    let htmlFilas = '';

    // Recorrer el JSON devuelto
    $.each(data, function (index, item) {
        htmlFilas += `
            <tr>
                <td class="align-middle">${item.nombre_almacen}</td>
                <td class="align-middle">
                    <div class="btn-toolbar" role="toolbar" aria-label="Toolbar with button groups">
                        <div class="btn-group btn-group-sm" role="group" aria-label="First group">
                            <button type="button" class="btn-action edit-btn" 
                                    data-bs-toggle="modal" 
                                    data-bs-target="#modalEliminarAlmacen" 
                                    data-id="${item.idparametrodato}"
                                    style="border:none; background:none; color:red">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </td>
            </tr>
        `;
    });

    // Inyectar en el tbody
    $tbody.html(htmlFilas);
}