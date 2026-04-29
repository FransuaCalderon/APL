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




    // ==========================================
    // AÑADIR NUEVO GRUPO
    // ==========================================

    // Limpiar el modal cuando se abre para que no quede el texto anterior
    $('#modalNuevoGrupo').on('show.bs.modal', function () {
        $('#inputNuevoNombreGrupo').val('');
    });

    $('#btnGuardarNuevoGrupo').click(function () {
        guardarGrupoAlmacen();
    });


    // ==========================================
    // MODIFICAR GRUPO
    // ==========================================

    // 1. Cuando se abre el modal, capturamos los datos de la fila y llenamos los inputs
    $('#modalModificarGrupo').on('show.bs.modal', function (event) {
        // 'event.relatedTarget' es el botón del lapicito que disparó el modal
        const $boton = $(event.relatedTarget);
        const $fila = $boton.closest('tr');

        const idParam = $boton.data('id');
        const nombreGrupo = $fila.data('nombre');

        // Llenamos el input visible y el oculto
        $('#inputIdModifGrupo').val(idParam);
        $('#inputModifNombreGrupo').val(nombreGrupo);
    });

    // 2. Evento para guardar la modificación
    $('#btnGuardarModifGrupo').click(function () {
        modificarGrupoAlmacen();
    });


    // ==========================================
    // ELIMINAR GRUPO
    // ==========================================

    // 1. Llenar el modal de confirmación
    $('#modalEliminarGrupo').on('show.bs.modal', function (event) {
        const $boton = $(event.relatedTarget);
        const $fila = $boton.closest('tr');

        $('#inputIdElimGrupo').val($boton.data('id'));
        $('#inputElimNombreGrupo').val($fila.data('nombre'));
    });

    // 2. Evento para confirmar eliminación
    $('#btnConfirmarElimGrupo').click(function () {
        eliminarGrupoAlmacen();
    });
});

function getUsuario() {
    return window.usuarioActual || "admin";
}

function getIdOpcionSeguro() {
    try {
        return (
            (window.obtenerIdOpcionActual && window.obtenerIdOpcionActual()) ||
            (window.obtenerInfoOpcionActual && window.obtenerInfoOpcionActual().idOpcion) ||
            null
        );
    } catch (e) {
        console.error("Error obteniendo idOpcion:", e);
        return null;
    }
}

function guardarGrupoAlmacen() {
    const nombreGrupo = $('#inputNuevoNombreGrupo').val().trim();

    if (nombreGrupo === "") {
        Swal.fire({ icon: 'warning', title: 'Atención', text: 'Debe ingresar un nombre para el grupo.' });
        return;
    }

    const body = {
        "tipo_mant": 1,
        "opcion": "I",
        "idparametro": 0,
        "idparametrotipo": 0,
        "nombre": nombreGrupo,
        "codigoparametro": 0,
        "idusuario": getUsuario(),
        "idparametrodato": 0,
        
    }

    const payload = {
        code_app: "APP20260128155212346",
        http_method: "POST",
        endpoint_path: "api/Parametrizacion/mantenimiento-parametros", 
        client: "APL",
        body_request: body // <-- Ajusta la estructura según tu API
    };
    console.log("body: ", body);
    return;

    $.ajax({
        url: "/api/apigee-router-proxy", method: "POST", contentType: "application/json", data: JSON.stringify(payload),
        success: function (response) {
            if (response && response.code_status === 200) {
                $('#modalNuevoGrupo').modal('hide');
                Swal.fire({ icon: 'success', title: 'Éxito', text: 'Grupo creado correctamente.', timer: 1500 });
                cargarGrupoAlmacen(); // Refresca la tabla
            } else {
                Swal.fire({ icon: "error", title: "Error", text: "No se pudo guardar el grupo." });
            }
        },
        error: function (xhr) { manejarErrorGlobal(xhr, "crear el grupo"); }
    });
}

function modificarGrupoAlmacen() {
    const idParam = $('#inputIdModifGrupo').val();
    const nuevoNombre = $('#inputModifNombreGrupo').val().trim();

    if (nuevoNombre === "") return Swal.fire({ icon: 'warning', title: 'Atención', text: 'El nombre no puede estar vacío.' });

    const payload = {
        code_app: "APP20260128155212346",
        http_method: "PUT", // O POST, dependiendo de tu API
        endpoint_path: "api/Parametrizacion/actualizar-grupo-almacen", // <-- CAMBIA ESTO
        client: "APL",
        body_request: { idparametro: idParam, nombre: nuevoNombre } // <-- Ajusta esto
    };

    $.ajax({
        url: "/api/apigee-router-proxy", method: "POST", contentType: "application/json", data: JSON.stringify(payload),
        success: function (response) {
            if (response && response.code_status === 200) {
                $('#modalModificarGrupo').modal('hide');
                Swal.fire({ icon: 'success', title: 'Éxito', text: 'Grupo actualizado.', timer: 1500 });

                // Si el grupo modificado estaba seleccionado, actualizamos el título de la segunda tabla
                if ($('#caption-almacen-grupo').text().includes($('#inputModifNombreGrupo').data('nombreAnterior'))) {
                    $('#caption-almacen-grupo').text(`Almacenes Asignados a: ${nuevoNombre}`);
                }
                cargarGrupoAlmacen();
            } else {
                Swal.fire({ icon: "error", title: "Error", text: "No se pudo actualizar." });
            }
        },
        error: function (xhr) { manejarErrorGlobal(xhr, "actualizar el grupo"); }
    });
}

function eliminarGrupoAlmacen() {
    const idParam = $('#inputIdElimGrupo').val();

    const payload = {
        code_app: "APP20260128155212346",
        http_method: "DELETE", // O POST, dependiendo de tu API
        endpoint_path: `api/Parametrizacion/eliminar-grupo-almacen/${idParam}`, // <-- CAMBIA ESTO
        client: "APL"
    };

    $.ajax({
        url: "/api/apigee-router-proxy", method: "POST", contentType: "application/json", data: JSON.stringify(payload),
        success: function (response) {
            if (response && response.code_status === 200) {
                $('#modalEliminarGrupo').modal('hide');
                Swal.fire({ icon: 'success', title: 'Éxito', text: 'Grupo eliminado.', timer: 1500 });

                // Limpiamos la segunda tabla por si acaso borramos el grupo que estábamos viendo
                $('#caption-almacen-grupo').text('Seleccione un Grupo de Almacenes');
                $('#tbody-almacenes-asignados').empty();

                cargarGrupoAlmacen();
            } else {
                Swal.fire({ icon: "error", title: "Error", text: "No se pudo eliminar el grupo." });
            }
        },
        error: function (xhr) { manejarErrorGlobal(xhr, "eliminar el grupo"); }
    });
}

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

    // MAPEO: Conectamos el 'nombre' del API con el ID del <div> en tu HTML y su respectivo ícono
    // IMPORTANTE: Las llaves de la izquierda deben ser idénticas a la data que trae tu SP.
    const mapaTabs = {
        "Grupos de Almacenes": { id: "list-home", icon: "fa-regular fa-house" },
        "Medios de Pago": { id: "list-profile", icon: "fa-regular fa-credit-card" },
        "Cantidad Aportes por Marca y Proveedor": { id: "list-settings", icon: "fa-solid fa-wallet" },
        "Cantidad Aportes por Marca": { id: "list-messages", icon: "fa-solid fa-wallet" },
        "Porcentaje de Incremento": { id: "list-porcentaje-incremento-precios", icon: "fa-solid fa-tag" },
        "Cantidad Aportes Propio por Articulo": { id: "list-aporte-propio-articulo", icon: "fa-solid fa-wallet" },
        "Precio Competencia por Artticulo": { id: "list-precio-competencia", icon: "fa-solid fa-tag" }, // Mantuve "Artticulo" con doble 't' porque así viene en tu JSON
        "Margen Mínimo": { id: "list-margen-minimo-articulo", icon: "fa-solid fa-tag" },
        "Otros Costos": { id: "list-otros-costos-articulo", icon: "fa-solid fa-tag" }
    };

    let htmlGenerado = '';

    $.each(data, function (index, item) {
        // El primer elemento se marca como activo
        const claseActive = (index === 0) ? 'active' : '';

        // Buscamos la configuración en el mapa usando el nombre exacto que trae el JSON.
        // Si el nombre cambia o llega uno nuevo, se le asignará un ID genérico por defecto.
        const conf = mapaTabs[item.nombre] || { id: `tab-desconocido-${index}`, icon: "fa-solid fa-circle-chevron-right" };

        // Armamos la etiqueta <a> apuntando al href correcto
        htmlGenerado += `
            <a class="list-group-item list-group-item-action border-0 ${claseActive}" 
               id="${conf.id}-list" 
               data-bs-toggle="list" 
               href="#${conf.id}" 
               role="tab" 
               aria-controls="${conf.id}">
                <i class="${conf.icon}"></i> ${item.nombre}
            </a>
        `;
    });

    // Inyectamos el menú dinámico y funcional
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