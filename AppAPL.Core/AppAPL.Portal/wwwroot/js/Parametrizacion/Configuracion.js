let grupoSeleccionadoActual = {
    codigo: null,
    nombre: null,
    idparametro: null
};

$(document).ready(function () {
    console.log("=== INICIO - Parametrizacion Configuracion ===");

    $.get("/config", function (config) {
        window.apiBaseUrl = config.apiBaseUrl;
        cargarConfiguracion();
        cargarGrupoAlmacen();
        cargarComboAlmacenes();  

        cargarComboMarcas();
        cargarComboProveedores();
    });

    // Escuchar cuando se hace clic en la opción de Medios de Pago en el menú dinámico
    $(document).on('shown.bs.tab', 'a[href="#list-profile"]', function () {
        cargarMediosPago();
    });

    $(document).on('shown.bs.tab', 'a[href="#list-settings"]', function () {
        cargarAportesMarcaProveedor();
    });

    // 1. Escuchar el clic en cualquier fila de la tabla de Grupos
    $(document).on('click', '.fila-grupo-almacen', function () {
        // Opción de UI: Pintar la fila seleccionada para que el usuario sepa dónde hizo clic
        $('.fila-grupo-almacen').removeClass('table-active');
        $(this).addClass('table-active');

        // Llenamos la variable global
        grupoSeleccionadoActual.codigo = $(this).data('codigo');
        grupoSeleccionadoActual.nombre = $(this).data('nombre');
        grupoSeleccionadoActual.idparametro = $(this).data('idparametro');

        // Actualizar el título de la segunda tabla
        $('#caption-almacen-grupo').text(`Almacenes Asignados a: ${grupoSeleccionadoActual.nombre}`);

        // Llamar a la API pasando el código de la ruta
        cargarAlmacenGrupo(grupoSeleccionadoActual.codigo);
    });

    // IMPORTANTE: Evitar que hacer clic en los botones de Modificar/Eliminar dispare la carga de la tabla
    $(document).on('click', '.btn-action', function (e) {
        e.stopPropagation();
    });



    // ==========================================
    // AÑADIR NUEVO ALMACEN AL GRUPO
    // ==========================================

    // Validar antes de abrir el modal que haya un grupo seleccionado
    $('#modalNuevoAlmacen').on('show.bs.modal', function (e) {
        if (!grupoSeleccionadoActual.codigo) {
            e.preventDefault(); // Impide que se abra el modal
            Swal.fire({ icon: 'warning', title: 'Atención', text: 'Debe seleccionar un Grupo de Almacenes primero haciendo clic en una fila de la primera tabla.' });
            return;
        }
        // Mostramos el nombre del grupo en el modal para que el usuario esté seguro
        $('#txtGrupoSeleccionadoModal').text(`Asignando a: ${grupoSeleccionadoActual.nombre}`);
    });


    $('#btnGuardarNuevoAlmacen').click(function () {
        guardarAlmacen();
    });


    // ==========================================
    // ELIMINAR (QUITAR) ALMACEN DEL GRUPO
    // ==========================================

    // Llenar datos al abrir el modal de eliminación
    $('#modalEliminarAlmacen').on('show.bs.modal', function (event) {
        const $boton = $(event.relatedTarget);
        const $fila = $boton.closest('tr');

        // El idparametrodato lo pusimos en el data-id del botón en la función crearListadoAlmacenGrupo
        const idParametroDato = $boton.data('id');
        const codigoAlmacen = $boton.data('codigo');

        // Extraemos el texto de la primera celda (td) de esa fila
        const nombreAlmacen = $fila.find('td:eq(0)').text().trim();

        $('#inputIdElimAlmacen').val(idParametroDato);
        $('#inputCodigoElimAlmacen').val(codigoAlmacen);
        $('#inputElimNombreAlmacen').val(nombreAlmacen);
    });

    $('#btnConfirmarElimAlmacen').click(function () {
        eliminarAlmacen();
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
        const codigoParametro = $boton.data('codigo');
        const nombreGrupo = $fila.data('nombre');

        // Llenamos el input visible y el oculto
        $('#inputIdModifGrupo').val(idParam);
        $('#inputModifNombreGrupo').val(nombreGrupo);
        $('#inputCodParamModifGrupo').val(codigoParametro);
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
        $('#inputCodigoParamElimGrupo').val($boton.data('codigo'));
    });

    // 2. Evento para confirmar eliminación
    $('#btnConfirmarElimGrupo').click(function () {
        eliminarGrupoAlmacen();
    });


    // ==========================================
    // AÑADIR NUEVO MEDIO DE PAGO
    // ==========================================

    // Limpiar el modal al abrir
    $('#modalNuevoMedioPago').on('show.bs.modal', function () {
        $('#inputNuevoNombreMedioPago').val('');
    });

    $('#btnGuardarNuevoMedioPago').click(function () {
        guardarMediosPagos();
    });


    // ==========================================
    // MODIFICAR MEDIO DE PAGO
    // ==========================================

    // Llenar el modal al abrir
    $('#modalModificaMedioPago').on('show.bs.modal', function (event) {
        const $boton = $(event.relatedTarget);
        const $fila = $boton.closest('tr');

        // Capturamos los datos que inyectamos en la fila/botón en el paso anterior
        const idParam = $boton.data('id');
        const codParam = $boton.data('codigo');
        const nombreMedioPago = $fila.find('td:eq(0)').text().trim();

        $('#inputIdModifMedioPago').val(idParam);
        $('#inputCodigoModifMedioPago').val(codParam);
        $('#inputModifNombreMedioPago').val(nombreMedioPago);
    });

    $('#btnGuardarModifMedioPago').click(function () {
        modificarMediosPagos();
    });


    // ==========================================
    // ELIMINAR MEDIO DE PAGO
    // ==========================================

    // Llenar el modal al abrir
    $('#modalEliminaMedioPago').on('show.bs.modal', function (event) {
        const $boton = $(event.relatedTarget);
        const $fila = $boton.closest('tr');

        $('#inputIdElimMedioPago').val($boton.data('id'));
        $('#inputCodElimMedioPago').val($boton.data('codigo'));
        $('#inputElimNombreMedioPago').val($fila.find('td:eq(0)').text().trim());
    });

    $('#btnConfirmarElimMedioPago').click(function () {
        eliminarMediosPagos();
    });



    $('#btnGuardarNuevoAMP').click(function () {
        guardarAMP();
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

function cargarAportesMarcaProveedor() {
    const payload = {
        code_app: "APP20260128155212346",
        http_method: "GET",
        endpoint_path: "api/Parametrizacion/consultar-aporte-marca-prov", // Ajustar según Swagger
        client: "APL"
    };

    $.ajax({
        url: "/api/apigee-router-proxy",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(payload),
        success: function (response) {
            if (response && response.code_status === 200) {
                crearListadoAportesMarcaProveedor(response.json_response || []);
            }
        },
        error: function (xhr) { manejarErrorGlobal(xhr, "cargar aportes"); }
    });
}

function crearListadoAportesMarcaProveedor(data) {
    const $tbody = $('#tbody-aportes-marca-proveedor');
    $tbody.empty();

    if (!data || data.length === 0) {
        $tbody.append('<tr><td colspan="4" class="text-center text-muted">No hay registros.</td></tr>');
        return;
    }

    let html = '';
    $.each(data, function (index, item) {
        html += `
            <tr data-id="${item.idparametrodato}" data-idparam="${item.idparametro}">
                <td class="align-middle text-wrap">${item.nombre_proveedor}</td>
                <td class="align-middle">${item.nombre_marca}</td>
                <td class="align-middle text-center">${item.numero_aporte}</td>
                <td class="align-middle text-center">
                    <div class="btn-group btn-group-sm">
                        <button type="button" class="btn btn-action" data-bs-toggle="modal" data-bs-target="#modalModificarAporteMarcaProveedor" 
                                data-id="${item.idparametrodato}" data-num="${item.numero_aporte}" style="color:#0d6efd;">
                            <i class="fa-regular fa-pen-to-square"></i>
                        </button>
                        <button type="button" class="btn btn-action" data-bs-toggle="modal" data-bs-target="#modalEliminarAporteMarcaProveedor" 
                                data-id="${item.idparametrodato}" data-marca="${item.nombre_marca}" data-prov="${item.nombre_proveedor}" style="color:red;">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>`;
    });
    $tbody.html(html);
}


// Función para obtener los medios de pago desde el API
function cargarMediosPago() {
    const payload = {
        code_app: "APP20260128155212346",
        http_method: "GET",
        endpoint_path: "api/Parametrizacion/consultar-medios-pago", // Confirma esta ruta con tu Swagger
        client: "APL"
    };

    $.ajax({
        url: "/api/apigee-router-proxy",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(payload),
        success: function (response) {
            if (response && response.code_status === 200) {
                crearListadoMediosPago(response.json_response || []);
            } else {
                Swal.fire({ icon: "error", title: "Error", text: "No se pudieron cargar los medios de pago." });
            }
        },
        error: function (xhr) {
            manejarErrorGlobal(xhr, "cargar los medios de pago");
        }
    });
}

// Función para renderizar las filas de la tabla
function crearListadoMediosPago(data) {
    const $tbody = $('#tbody-medios-pago');
    $tbody.empty();

    if (!data || data.length === 0) {
        $tbody.append('<tr><td colspan="2" class="text-center text-muted">No se encontraron registros.</td></tr>');
        return;
    }

    let htmlFilas = '';

    $.each(data, function (index, item) {
        // Almacenamos idparametro y codigoparametro en atributos data-
        htmlFilas += `
            <tr class="m-0 p-0" data-id="${item.idparametro}" data-codigo="${item.codigoparametro}">
                <td class="align-middle">${item.nombre}</td>
                <td class="">
                    <div class="btn-toolbar d-flex justify-content-center" role="toolbar">
                        <div class="btn-group btn-group-sm" role="group">
                            <button type="button" class="btn-action edit-btn" 
                                    data-bs-toggle="modal" 
                                    data-bs-target="#modalModificaMedioPago" 
                                    data-id="${item.idparametro}" 
                                    data-codigo="${item.codigoparametro}"
                                    style="border:none; background:none; color:#0d6efd;">
                                <i class="fa-regular fa-pen-to-square"></i>
                            </button>
                            <button type="button" class="btn-action delete-btn" 
                                    data-bs-toggle="modal" 
                                    data-bs-target="#modalEliminaMedioPago" 
                                    data-id="${item.idparametro}" 
                                    data-codigo="${item.codigoparametro}"
                                    style="border:none; background:none; color:red">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </td>
            </tr>`;
    });

    $tbody.html(htmlFilas);
}


//APORTA MARCA PROVEEDOR
function guardarAMP() {

    // Para la marca, el código está directo en el .val()
    const codigoMarca = $('#selectNuevoMarcaMP').val();

    // Para el proveedor, capturamos el option seleccionado
    const $opcionProveedor = $('#selectNuevoProveedorMP option:selected');
    const codigoProveedor = $opcionProveedor.val(); // Trae el "codigo"
    const identificacionProveedor = $opcionProveedor.data('identificacion'); // Trae la "identificacion"

    // Validamos que hayan seleccionado ambos
    if (!codigoMarca || !codigoProveedor) {
        return Swal.fire({ icon: 'warning', title: 'Atención', text: 'Debe seleccionar una Marca y un Proveedor.' });
    }

    const aportes = $('#inputNuevoNumAporteMP').val();

    console.log("codigoMarca: ", codigoMarca);
    console.log("codigoProveedor: ", codigoProveedor);
    console.log("aportes: ", aportes);

    const body = {
        "tipo_mant": 0,
        "opcion": "string",
        "idparametro": 0,
        "idparametrotipo": 0,
        "nombre": "string",
        "codigoparametro": 0,
        "idusuario": getUsuario(),
        "idparametrodato": 0,
        "codigorelacion1": "string", //marca
        "codigorelacion2": "string", //proveedor
        "valor1": 0 //numero de aportes
        
    }

    const payload = {
        code_app: "APP20260128155212346",
        http_method: "POST",
        endpoint_path: "api/Parametrizacion/crear-aporte-marca-proveedor",
        client: "APL",
        body_request: body
    };

    console.log("body: ", body);
    return;

    $.ajax({
        url: "/api/apigee-router-proxy",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(payload),
        success: function (response) {
            if (response && response.code_status === 200) {
                $('#modalNuevoAporteMarcaProveedor').modal('hide');
                Swal.fire({ icon: 'success', title: 'Guardado', timer: 1500 });
                cargarAportesMarcaProveedor();
            }
        }
    });
}

// ==========================================
// CARGAR COMBO DE MARCAS
// ==========================================
function cargarComboMarcas() {
    const payload = {
        code_app: "APP20260128155212346",
        http_method: "GET",
        endpoint_path: "api/Acuerdo/consultar-combos", 
        client: "APL"
    };

    $.ajax({
        url: "/api/apigee-router-proxy", method: "POST", contentType: "application/json", data: JSON.stringify(payload),
        success: function (response) {
            if (response && response.code_status === 200) {
                // Aquí extraemos específicamente el arreglo "marcas" del objeto JSON
                const dataMarcas = response.json_response.marcas || [];
                llenarSelectMarcas(dataMarcas);
            } else {
                console.error("No se pudieron cargar las marcas.");
            }
        },
        error: function (xhr) { manejarErrorGlobal(xhr, "cargar la lista de marcas"); }
    });
}

function llenarSelectMarcas(data) {
    const $select = $('#selectNuevoMarcaMP'); // El ID de tu select en el HTML
    $select.empty();

    if (!data || data.length === 0) {
        $select.append('<option value="">No hay marcas disponibles</option>');
        return;
    }

    $select.append('<option value="" selected disabled>Seleccione una marca...</option>');

    // Recorremos el arreglo de marcas
    $.each(data, function (index, item) {
        // Guardamos el código en el value
        $select.append(`<option value="${item.codigo}">${item.nombre}</option>`);
    });
}

// ==========================================
// CARGAR COMBO DE PROVEEDORES
// ==========================================
function cargarComboProveedores() {
    const payload = {
        code_app: "APP20260128155212346",
        http_method: "GET",
        endpoint_path: "api/Proveedor/listar", // <-- CAMBIA ESTO por tu ruta real
        client: "APL"
    };

    $.ajax({
        url: "/api/apigee-router-proxy", method: "POST", contentType: "application/json", data: JSON.stringify(payload),
        success: function (response) {
            if (response && response.code_status === 200) {
                llenarSelectProveedores(response.json_response || []);
            } else {
                console.error("No se pudieron cargar los proveedores.");
            }
        },
        error: function (xhr) { manejarErrorGlobal(xhr, "cargar la lista de proveedores"); }
    });
}

function llenarSelectProveedores(data) {
    const $select = $('#selectNuevoProveedorMP'); // El ID de tu select en el HTML
    $select.empty();

    if (!data || data.length === 0) {
        $select.append('<option value="">No hay proveedores disponibles</option>');
        return;
    }

    $select.append('<option value="" selected disabled>Seleccione un proveedor...</option>');

    // Recorremos el arreglo de proveedores
    $.each(data, function (index, item) {
        // Guardamos el código en el value, y la identificación en un data-attribute
        // Mostramos ambos en el texto para que el usuario sepa a quién elige
        $select.append(`<option value="${item.codigo}" data-identificacion="${item.identificacion}">${item.identificacion} - ${item.nombre}</option>`);
    });
}


//MEDIOS DE PAGOS
function guardarMediosPagos() {
    const nombreMedioPago = $('#inputNuevoNombreMedioPago').val().trim();

    if (!nombreMedioPago) {
        return Swal.fire({ icon: 'warning', title: 'Atención', text: 'Debe ingresar un nombre para el Medio de Pago.' });
    }

    const body = {
        "tipo_mant": 3,
        "opcion": "I",
        "idparametro": 0,
        "idparametrotipo": 2,
        "nombre": nombreMedioPago,
        "codigoparametro": 0,
        "idusuario": getUsuario()
    }

    const payload = {
        code_app: "APP20260128155212346",
        http_method: "POST",
        endpoint_path: "api/Parametrizacion/mantenimiento-parametros", // <-- Ajusta ruta
        client: "APL",
        body_request: body
    };

    //console.log("body: ", body);

    $.ajax({
        url: "/api/apigee-router-proxy", method: "POST", contentType: "application/json", data: JSON.stringify(payload),
        success: function (response) {
            if (response && response.code_status === 200) {
                $('#modalNuevoMedioPago').modal('hide');
                Swal.fire({ icon: 'success', title: 'Éxito', text: 'Medio de pago creado correctamente.', timer: 1500 });
                cargarMediosPago(); // Refresca la tabla
            } else {
                Swal.fire({ icon: "error", title: "Error", text: "No se pudo guardar el medio de pago." });
            }
        },
        error: function (xhr) { manejarErrorGlobal(xhr, "crear el medio de pago"); }
    });
}


function modificarMediosPagos() {
    const idParam = $('#inputIdModifMedioPago').val();
    const codParam = $('#inputCodigoModifMedioPago').val();
    const nuevoNombre = $('#inputModifNombreMedioPago').val().trim();

    if (!nuevoNombre) return Swal.fire({ icon: 'warning', title: 'Atención', text: 'El nombre no puede estar vacío.' });

    const body = {
        "tipo_mant": 3,
        "opcion": "M",
        "idparametro": idParam,
        "idparametrotipo": 2,
        "nombre": nuevoNombre,
        "codigoparametro": codParam,
        "idusuario": getUsuario()
    }

    const payload = {
        code_app: "APP20260128155212346",
        http_method: "POST",
        endpoint_path: "api/Parametrizacion/mantenimiento-parametros", 
        client: "APL",
        body_request: body
    };

    console.log("body: ", body);

    $.ajax({
        url: "/api/apigee-router-proxy", method: "POST", contentType: "application/json", data: JSON.stringify(payload),
        success: function (response) {
            if (response && response.code_status === 200) {
                $('#modalModificaMedioPago').modal('hide');
                Swal.fire({ icon: 'success', title: 'Éxito', text: 'Medio de pago actualizado.', timer: 1500 });
                cargarMediosPago(); // Refresca la tabla
            } else {
                Swal.fire({ icon: "error", title: "Error", text: "No se pudo actualizar." });
            }
        },
        error: function (xhr) { manejarErrorGlobal(xhr, "actualizar el medio de pago"); }
    });
}


function eliminarMediosPagos() {
    const idParam = $('#inputIdElimMedioPago').val();
    const codigoParametro = $('#inputCodElimMedioPago').val();

    const body = {
        "tipo_mant": 3,
        "opcion": "E",
        "idparametro": idParam,
        "idparametrotipo": 2,
        //"nombre": nuevoNombre,
        "codigoparametro": codigoParametro,
        "idusuario": getUsuario()
    }

    const payload = {
        code_app: "APP20260128155212346",
        http_method: "POST",
        endpoint_path: "api/Parametrizacion/mantenimiento-parametros",
        client: "APL",
        body_request: body
    };


    //console.log("body: ", body);

    $.ajax({
        url: "/api/apigee-router-proxy", method: "POST", contentType: "application/json", data: JSON.stringify(payload),
        success: function (response) {
            if (response && response.code_status === 200) {
                $('#modalEliminaMedioPago').modal('hide');
                Swal.fire({ icon: 'success', title: 'Éxito', text: 'Medio de pago eliminado.', timer: 1500 });
                cargarMediosPago(); // Refresca la tabla
            } else {
                Swal.fire({ icon: "error", title: "Error", text: "No se pudo eliminar el registro." });
            }
        },
        error: function (xhr) { manejarErrorGlobal(xhr, "eliminar el medio de pago"); }
    });
}





// ==========================================
// CARGAR COMBO DE ALMACENES (SELECT)
// ==========================================
function cargarComboAlmacenes() {
    const payload = {
        code_app: "APP20260128155212346",
        http_method: "GET",
        endpoint_path: "api/Promocion/consultar-almacen",
        client: "APL"
    };

    $.ajax({
        url: "/api/apigee-router-proxy",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(payload),
        success: function (response) {
            if (response && response.code_status === 200) {
                llenarSelectAlmacenes(response.json_response || []);
            } else {
                console.error("No se pudieron cargar los almacenes para el select.");
            }
        },
        error: function (xhr) {
            manejarErrorGlobal(xhr, "cargar la lista de almacenes disponibles");
        }
    });
}

function llenarSelectAlmacenes(data) {
    const $select = $('#selectNuevoAlmacen');

    // Limpiamos las opciones quemadas (Riocentro, etc.)
    $select.empty();

    // Validamos si viene data
    if (!data || data.length === 0) {
        $select.append('<option value="">No hay almacenes disponibles</option>');
        return;
    }

    // Agregamos una opción por defecto para obligar al usuario a elegir
    $select.append('<option value="" selected disabled>Seleccione un almacén...</option>');

    // Recorremos el JSON armando los <option> con los nombres exactos del esquema
    $.each(data, function (index, item) {
        $select.append(`<option value="${item.codigoalmacen}">${item.nombrealmacen}</option>`);
    });
}


//ALMACEN
function guardarAlmacen() {
    const codigoAlmacenSeleccionado = $('#selectNuevoAlmacen').val();

    // Obtenemos el texto (nombre) del option que está seleccionado
    const nombreAlmacenSeleccionado = $('#selectNuevoAlmacen option:selected').text().trim();
    // Validar que no envíen el select vacío
    if (!codigoAlmacenSeleccionado) {
        Swal.fire({ icon: 'warning', title: 'Atención', text: 'Por favor, seleccione un almacén de la lista.' });
        return;
    }


    // 2. Validar que el almacén no exista ya en la tabla
    let almacenYaExiste = false;

    // Recorremos cada fila de la tabla de almacenes
    $('#tbody-almacenes-asignados tr').each(function () {
        // Buscamos el texto de la primera columna (td) de la fila actual
        const nombreEnFila = $(this).find('td:eq(0)').text().trim();

        if (nombreEnFila === nombreAlmacenSeleccionado) {
            almacenYaExiste = true;
            return false; // El 'return false' en un .each() de jQuery funciona como un 'break' para salir del ciclo
        }
    });

    if (almacenYaExiste) {
        Swal.fire({ icon: 'warning', title: 'Duplicado', text: `El almacén "${nombreAlmacenSeleccionado}" ya está asignado a este grupo.` });
        return; // Detenemos la ejecución para que no haga el AJAX
    }



    const body = {
        "tipo_mant": 2,
        "opcion": "I",
        "idparametro": grupoSeleccionadoActual.idparametro,
        "codigoparametro": grupoSeleccionadoActual.codigo,
        "idusuario": getUsuario(),
        //"idparametrodato": 0,
        "codigorelacion1": codigoAlmacenSeleccionado,
        
    }

    const payload = {
        code_app: "APP20260128155212346",
        http_method: "POST",
        endpoint_path: "api/Parametrizacion/mantenimiento-parametros", // <-- Reemplaza por tu endpoint exacto
        client: "APL",
        body_request: body
    };

    /*
    console.log("body: ", body);
    console.log("codigoparametro", grupoSeleccionadoActual.codigo);
    console.log("codigo_almacen", codigoAlmacenSeleccionado);
    console.log("grupoSeleccionadoActual.idparametro", grupoSeleccionadoActual.idparametro);
    */

    $.ajax({
        url: "/api/apigee-router-proxy", method: "POST", contentType: "application/json", data: JSON.stringify(payload),
        success: function (response) {
            if (response && response.code_status === 200) {
                $('#modalNuevoAlmacen').modal('hide');
                Swal.fire({ icon: 'success', title: 'Éxito', text: 'Almacen asignado correctamente.', timer: 1500 });

                // Recargamos SOLO la tabla de almacenes del grupo actual
                cargarAlmacenGrupo(grupoSeleccionadoActual.codigo);
            } else {
                Swal.fire({ icon: "error", title: "Error", text: "No se pudo asignar el almacén." });
            }
        },
        error: function (xhr) { manejarErrorGlobal(xhr, "asignar el almacén"); }
    });
}

function eliminarAlmacen() {
    const idParametroDato = $('#inputIdElimAlmacen').val();
    const codigoAlmacen = $('#inputCodigoElimAlmacen').val();


    const body = {
        "tipo_mant": 2,
        "opcion": "E",
        "idparametro": grupoSeleccionadoActual.idparametro,
        "codigoparametro": grupoSeleccionadoActual.codigo,
        "idusuario": getUsuario(),
        "idparametrodato": idParametroDato,
        "codigorelacion1": codigoAlmacen,

    }

    const payload = {
        code_app: "APP20260128155212346",
        http_method: "POST", // o POST según defina tu SP
        endpoint_path: "api/Parametrizacion/mantenimiento-parametros", // <-- Reemplaza por tu endpoint exacto
        client: "APL",
        body_request: body
    };

    //console.log("body: ", body);
    //return;


    $.ajax({
        url: "/api/apigee-router-proxy", method: "POST", contentType: "application/json", data: JSON.stringify(payload),
        success: function (response) {
            if (response && response.code_status === 200) {
                $('#modalEliminarAlmacen').modal('hide');
                Swal.fire({ icon: 'success', title: 'Éxito', text: 'Almacén removido del grupo.', timer: 1500 });

                // Volvemos a cargar la tabla para reflejar los cambios
                cargarAlmacenGrupo(grupoSeleccionadoActual.codigo);
            } else {
                Swal.fire({ icon: "error", title: "Error", text: "No se pudo remover el almacén." });
            }
        },
        error: function (xhr) { manejarErrorGlobal(xhr, "remover el almacén"); }
    });
}



//GRUPO ALMACEN

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
        "idparametrotipo": 1,
        "nombre": nombreGrupo,
        "codigoparametro": 0,
        "idusuario": getUsuario()
    }

    const payload = {
        code_app: "APP20260128155212346",
        http_method: "POST",
        endpoint_path: "api/Parametrizacion/mantenimiento-parametros", 
        client: "APL",
        body_request: body // <-- Ajusta la estructura según tu API
    };
    console.log("body: ", body);
    //return;

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
    const codigoParametro = $('#inputCodParamModifGrupo').val();

    if (nuevoNombre === "") return Swal.fire({ icon: 'warning', title: 'Atención', text: 'El nombre no puede estar vacío.' });

    const body = {
        "tipo_mant": 1,
        "opcion": "M",
        "idparametro": idParam,
        "idparametrotipo": 1,
        "nombre": nuevoNombre,
        "codigoparametro": codigoParametro,
        "idusuario": getUsuario()
    }

    const payload = {
        code_app: "APP20260128155212346",
        http_method: "POST",
        endpoint_path: "api/Parametrizacion/mantenimiento-parametros",
        client: "APL",
        body_request: body // <-- Ajusta la estructura según tu API
    };
    //console.log("body: ", body);

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
    const codigoParametro = $('#inputCodigoParamElimGrupo').val();

    const body = {
        "tipo_mant": 1,
        "opcion": "E",
        "idparametro": idParam,
        "idparametrotipo": 1,
        //"nombre": nombreGrupo,
        "codigoparametro": codigoParametro,
        "idusuario": getUsuario()
    }

    const payload = {
        code_app: "APP20260128155212346",
        http_method: "POST", // O POST, dependiendo de tu API
        endpoint_path: `api/Parametrizacion/mantenimiento-parametros`, // <-- CAMBIA ESTO
        client: "APL",
        body_request: body
    };

    //console.log("idParam", idParam);
    //console.log("codigoParametro", codigoParametro);

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
                data-idparametro="${item.idparametro}"
                style="cursor: pointer;">
                <td class="align-middle">${item.nombre}</td>
                <td class="align-middle">
                    <div class="btn-toolbar" role="toolbar" aria-label="Toolbar with button groups">
                        <div class="btn-group btn-group-sm" role="group" aria-label="First group">
                            <button type="button" class="btn-action edit-btn" 
                                    data-bs-toggle="modal" 
                                    data-bs-target="#modalModificarGrupo" 
                                    data-id="${item.idparametro}"
                                    data-codigo="${item.codigoparametro}"
                                    title="Modificar" 
                                    style="border:none; background:none; color:#0d6efd;">
                                <i class="fa-regular fa-pen-to-square"></i>
                            </button>
                            <button type="button" class="btn-action delete-btn" 
                                    data-bs-toggle="modal" 
                                    data-bs-target="#modalEliminarGrupo" 
                                    data-id="${item.idparametro}" 
                                    data-codigo="${item.codigoparametro}" 
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
                                    data-codigo="${item.codigo_almacen}"
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