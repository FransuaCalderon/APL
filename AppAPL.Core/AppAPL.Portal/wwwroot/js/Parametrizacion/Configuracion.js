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

    $(document).on('shown.bs.tab', '#list-tab a', function (e) {
        // 'e.target' es el enlace al que se le acaba de dar clic
        const idTipo = $(e.target).data('idparametrotipo');
        const idParam = $(e.target).data('idparametro');
        const codParam = $(e.target).data('codigoparametro');

        console.log("Cargando sección:", $(e.target).data('nombre'));
        console.log("Datos para el API:", { idTipo, idParam, codParam });
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


    // ==========================================
    // MODIFICAR APORTE POR MARCA Y PROVEEDOR
    // ==========================================

    // 1. Llenar el modal al abrir
    $('#modalModificarAporteMarcaProveedor').on('show.bs.modal', function (event) {
        const $boton = $(event.relatedTarget);

        const idParamDato = $boton.data('id');
        const numAporteActual = $boton.data('num');
        const codigoMarca = $boton.data('marca');
        const identificacionProv = $boton.data('proveedor');

        // Llenamos el ID oculto y el número de aporte
        $('#inputIdModifAMP').val(idParamDato);
        $('#inputModifNumAporteMP').val(numAporteActual);

        // Seleccionamos la marca por su código
        $('#selectModifMarcaMP').val(codigoMarca);

        // Para el proveedor, buscamos el option que tenga la identificación correspondiente
        // ya que el 'value' es el código interno, pero el 'data-identificacion' es lo que viene de la tabla
        $('#selectModifProveedorMP option').each(function () {
            if ($(this).data('identificacion') === identificacionProv) {
                $(this).prop('selected', true);
                return false;
            }
        });
    });


    // 2. Ejecutar la modificación
    $('#btnGuardarModifAMP').click(function () {
        modificarAMP();
    });


    // ==========================================
    // ELIMINAR APORTE POR MARCA Y PROVEEDOR
    // ==========================================

    // 1. Llenar el modal de confirmación al abrir
    $('#modalEliminarAporteMarcaProveedor').on('show.bs.modal', function (event) {
        const $boton = $(event.relatedTarget);

        // En la función crearListadoAportesMarcaProveedor inyectamos data-id, data-marca y data-prov
        $('#inputIdElimAMP').val($boton.data('id'));
        $('#inputIdMarcaElimAMP').val($boton.data('marca'));
        $('#inputIdProvElimAMP').val($boton.data('proveedor'));


        $('#txtElimMarcaAMP').text($boton.data('marca'));
        $('#txtElimProvAMP').text($boton.data('prov'));
    });

    // 2. Ejecutar la eliminación
    $('#btnConfirmarElimAMP').click(function () {
        eliminarAMP();
    });


    // ==========================================
    // 1. CARGA DE TABLA: APORTES POR MARCA
    // ==========================================
    $(document).on('shown.bs.tab', 'a[href="#list-messages"]', function () {
        cargarAportesMarca();
    });

    
    // ==========================================
    // 2. NUEVO APORTE POR MARCA
    // ==========================================
    $('#btnGuardarNuevoAM').click(function () {
        guardarAM();
    });

    // ==========================================
    // 3. MODIFICAR APORTE POR MARCA
    // ==========================================
    $('#modalModificarAporteMarca').on('show.bs.modal', function (event) {
        const $boton = $(event.relatedTarget);
        $('#inputIdModifAM').val($boton.data('id'));
        $('#inputModifNumAporteAM').val($boton.data('num'));
        $('#selectModifMarcaAM').val($boton.data('marca')); // El select se autoselecciona
    });

    $('#btnGuardarModifAM').click(function () {
        modificarAM();
    });

    // ==========================================
    // 4. ELIMINAR APORTE POR MARCA
    // ==========================================
    $('#modalEliminarAporteMarca').on('show.bs.modal', function (event) {
        const $boton = $(event.relatedTarget);
        $('#inputIdElimAM').val($boton.data('id'));
        $('#inputCodigoElimAM').val($boton.data('marca'));
        $('#txtElimMarcaAM').text($boton.data('nombremarca'));
    });

    $('#btnConfirmarElimAM').click(function () {
        eliminarAM();
    });


    // ==========================================
    // 1. CARGAR DATOS: PORCENTAJES DE INCREMENTO
    // ==========================================
    $(document).on('shown.bs.tab', 'a[href="#list-porcentaje-incremento-precios"]', function () {
        cargarDatosPorcentaje();
    });

    
    // ==========================================
    // 2. GUARDAR DATOS: PORCENTAJES DE INCREMENTO
    // ==========================================
    $('#btnGuardarPorcentaje').click(function () {
        guardarPorcIncremento();
    });

    // ==========================================
    // VALIDACIÓN DE RANGO: 0 a 100
    // ==========================================
    $('#inputPorcentajeTC, #inputPorcentajeCredito').on('input', function () {
        // Capturamos el valor actual mientras escriben
        let valor = parseFloat($(this).val());

        // Si el valor no está vacío o no es inválido
        if (!isNaN(valor)) {
            if (valor > 100) {
                $(this).val(100); // Si es mayor a 100, lo forzamos a 100
            } else if (valor < 0) {
                $(this).val(0);   // Si es menor a 0, lo forzamos a 0
            }
        }
    });



    // Cargar la tabla al activar la pestaña
    $(document).on('shown.bs.tab', 'a[href="#list-aporte-propio-articulo"]', function () {
        cargarAportesPropioArticulo();
    });

    

    // Validación de rango 0-100 para los inputs de esta sección
    $('#inputNuevoNumAporteArt, #inputModifNumAporteArt').on('input', function () {
        let valor = parseFloat($(this).val());
        if (!isNaN(valor)) {
            if (valor > 100) $(this).val(100);
            else if (valor < 0) $(this).val(0);
        }
    });

    // Guardar Nuevo
    $('#btnGuardarNuevoAPA').click(function () {
        guardarAPA();
    });

    

    $('#btnGuardarModifAPA').click(function () {
        modificarAPA();
    });

    // ==========================================
    // 1. CARGA DE TABLA: PRECIO COMPETENCIA
    // ==========================================
    $(document).on('shown.bs.tab', 'a[href="#list-precio-competencia"]', function () {
        cargarPreciosCompetencia();
    });

    // ==========================================
    // 2. NUEVO PRECIO COMPETENCIA
    // ==========================================
    // Limpiamos el modal al abrir
    $('#modalNuevoPrecioComp').on('show.bs.modal', function () {
        $('#inputNuevoCodArticuloPC, #inputNuevoNombreCompPC, #inputNuevoPrecioPC').val('');
    });

    $('#btnGuardarNuevoPC').click(function () {
        guardarPC();
    });

    // ==========================================
    // 3. MODIFICAR PRECIO COMPETENCIA
    // ==========================================
    $('#modalModificarPrecioComp').on('show.bs.modal', function (event) {
        const $boton = $(event.relatedTarget);
        $('#inputIdModifPC').val($boton.data('id'));
        $('#inputCodModifPC').val($boton.data('codigo'));
        $('#inputModifNombreArtPC').val($boton.data('nombreart'));
        $('#inputModifNombreCompPC').val($boton.data('competencia'));
        $('#inputModifPrecioPC').val($boton.data('precio'));
    });

    $('#btnGuardarModifPC').click(function () {
        modificarPC();
    });

    // ==========================================
    // 4. ELIMINAR PRECIO COMPETENCIA
    // ==========================================
    $('#modalEliminarPrecioComp').on('show.bs.modal', function (event) {
        const $boton = $(event.relatedTarget);
        $('#inputIdElimPC').val($boton.data('id'));
        $('#inputCodElimPC').val($boton.data('codigo'));
        $('#inputCompElimPC').val($boton.data('competencia'));
        $('#txtElimArtPC').text($boton.data('nombreart'));
        $('#txtElimCompPC').text($boton.data('competencia'));
    });

    $('#btnConfirmarElimPC').click(function () {
        eliminarPC();
    });


    // ==========================================
    // 1. CARGA DE TABLA: MARGEN MÍNIMO
    // ==========================================
    $(document).on('shown.bs.tab', 'a[href="#list-margen-minimo-articulo"]', function () {
        cargarMargenMinimo();
    });

    

    // Validación de rango 0-100 para todos los inputs de margen
    $('.input-porcentaje-mm').on('input', function () {
        let valor = parseFloat($(this).val());
        if (!isNaN(valor)) {
            if (valor > 100) $(this).val(100);
            else if (valor < 0) $(this).val(0);
        }
    });

    // ==========================================
    // 2. NUEVO MARGEN MÍNIMO
    // ==========================================
    // Limpiar modal Nuevo al abrir
    $('#modalNuevoMargenMinimoArticulo').on('show.bs.modal', function () {
        $('#inputNuevoArticuloMM').val('').data('codigo', '');
        $('#inputNuevoContadoMM, #inputNuevoTarjCrMM, #inputNuevoCreditoMM, #inputNuevoIgualarMM').val('');
        cargarArticulosModalMM(); // La función DataTables que ya tenías
    });

    $('#btnGuardarNuevoMM').click(function () {
        guardarMM();
    });

    
    // Llenar Modal Modificar al abrir
    $('#modalModificarMargenMinimoArticulo').on('show.bs.modal', function (event) {
        const $boton = $(event.relatedTarget);
        $('#inputIdModifMM').val($boton.data('id'));
        $('#inputCodArtModifMM').val($boton.data('codigo'));
        $('#inputModifArticuloMM').val($boton.data('nombre'));
        $('#inputModifContadoMM').val(parseFloat($boton.data('contado')));
        $('#inputModifTarjCrMM').val(parseFloat($boton.data('tarjeta')));
        $('#inputModifCreditoMM').val(parseFloat($boton.data('credito')));
        $('#inputModifIgualarMM').val(parseFloat($boton.data('igualar')));
    });

    $('#btnGuardarModifMM').click(function () {
        modificarMM();
    });

    // ==========================================
    // 4. ELIMINAR MARGEN MÍNIMO
    // ==========================================
    // Llenar Modal Eliminar al abrir
    $('#modalEliminarMargenMinimoArticulo').on('show.bs.modal', function (event) {
        const $boton = $(event.relatedTarget);
        $('#inputIdElimMM').val($boton.data('id'));
        $('#inputCodArtElimMM').val($boton.data('codigo'));
        $('#txtElimArtMM').text($boton.data('nombre')); // Pasamos el nombre completo a la etiqueta <b>
    });

    $('#btnConfirmarElimMM').click(function () {
        eliminarMM();
    });

    

    // Evento Radio Button (Artículos)
    $(document).on('change', '.radio-seleccion-articulo-mm', function () {
        const codigo = $(this).data('codigo');
        const nombre = $(this).data('nombre');
        $('#inputNuevoArticuloMM').val(`${codigo} - ${nombre}`);
        $('#inputNuevoArticuloMM').data('codigo', codigo);
    });

    // Limpiar modal Nuevo al abrir y cargar tabla
    $('#modalNuevoAporteArticulo').on('show.bs.modal', function () {
        $('#inputNuevoArticuloAPA').val('').data('codigo', '');
        $('#inputNuevoNumAporteAPA').val('');
        cargarArticulosModalAPA();
    });

    // Evento Radio Button (Artículos)
    $(document).on('change', '.radio-seleccion-articulo-apa', function () {
        const codigo = $(this).data('codigo');
        const nombre = $(this).data('nombre');
        $('#inputNuevoArticuloAPA').val(`${codigo} - ${nombre}`);
        $('#inputNuevoArticuloAPA').data('codigo', codigo);
    });

    // Llenar Modal Modificar al abrir
    $('#modalModificarAporteArticulo').on('show.bs.modal', function (event) {
        const $boton = $(event.relatedTarget);
        $('#inputIdModifAPA').val($boton.data('id'));
        $('#inputModifArticuloAPA').val($boton.data('nombre'));
        $('#inputModifNumAporteAPA').val($boton.data('num'));
    });

    // Llenar Modal Eliminar al abrir
    $('#modalEliminarAportePropioArticulo').on('show.bs.modal', function (event) {
        const $boton = $(event.relatedTarget);
        $('#inputIdElimAPA').val($boton.data('id'));
        $('#txtElimArtAPA').text($boton.data('nombre'));
    });

    // Validación genérica de rangos 0-100 para los inputs
    $(document).on('input', '.input-rango-100', function () {
        let valor = parseFloat($(this).val());
        if (!isNaN(valor)) {
            if (valor > 100) $(this).val(100);
            else if (valor < 0) $(this).val(0);
        }
    });

    $('#btnGuardarNuevoAPA').off('click').on('click', guardarAPA);
    $('#btnGuardarModifAPA').off('click').on('click', modificarAPA);
    $('#btnConfirmarElimAPA').off('click').on('click', eliminarAPA);
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



// --- Lógica de DataTables y Renderizado ---

function cargarArticulosModalAPA() {
    const $tabla = $('#datosarticulosAPA');
    const $tbody = $('#modalNuevoAporteArticulo #datosarticulosAPA tbody');

    if ($.fn.DataTable.isDataTable('#datosarticulosAPA')) {
        $tabla.DataTable().clear().destroy();
    }

    $tbody.html(`
        <tr>
            <td colspan="3" class="text-center py-4">
                <div class="spinner-border text-primary" role="status"></div>
                <p class="mt-2 text-muted fw-bold">Descargando catálogo de artículos...</p>
            </td>
        </tr>
    `);

    const payload = {
        code_app: "APP20260128155212346",
        http_method: "GET",
        endpoint_path: "api/Acuerdo/consultar-articulos-parametrizacion",
        client: "APL"
    };

    $.ajax({
        url: "/api/apigee-router-proxy", method: "POST", contentType: "application/json", data: JSON.stringify(payload),
        success: function (response) {
            $tbody.empty();
            if (response && response.code_status === 200 && response.json_response) {
                inicializarDataTablesArticulosAPA(response.json_response);
            } else {
                $tbody.html('<tr><td colspan="3" class="text-center text-muted">No se encontraron artículos.</td></tr>');
            }
        },
        error: function (xhr) {
            $tbody.html('<tr><td colspan="3" class="text-center text-danger fw-bold">Error al cargar los artículos.</td></tr>');
            manejarErrorGlobal(xhr, "cargar los artículos");
        }
    });
}

function inicializarDataTablesArticulosAPA(data) {
    $('#datosarticulosAPA').DataTable({
        data: data,
        deferRender: true,
        pageLength: 10,
        lengthMenu: [10, 25, 50],
        destroy: true,
        autoWidth: false,
        language: { "url": "//cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json" },
        columns: [
            { data: 'codigo', className: 'align-middle text-center' },
            { data: 'descripcion', className: 'align-middle text-wrap' },
            {
                data: null,
                orderable: false,
                className: 'text-center align-middle',
                render: function (data, type, row) {
                    return `<input class="form-check-input radio-seleccion-articulo-apa" type="radio" name="radioArticuloAPA" data-codigo="${row.codigo}" data-nombre="${row.descripcion}">`;
                }
            }
        ]
    });
}

function crearListadoAportesPropioArticulo(data) {
    const $tbody = $('#tbody-aporte-propio-articulo');
    $tbody.empty();

    if (!data || data.length === 0) {
        $tbody.append('<tr><td colspan="4" class="text-center text-muted">No hay registros.</td></tr>');
        return;
    }

    let html = '';
    $.each(data, function (index, item) {
        html += `
            <tr data-id="${item.idparametrodato}">
                <td class="align-middle text-wrap">${item.codigo_articulo} - ${item.nombre_articulo}</td>
                <td class="text-center align-middle">${item.numero_aporte}</td>
                <td class="text-center align-middle">
                    <div class="btn-group btn-group-sm">
                        <button type="button" class="btn btn-action" data-bs-toggle="modal" data-bs-target="#modalModificarAporteArticulo" 
                                data-id="${item.idparametrodato}" data-nombre="${item.codigo_articulo} - ${item.nombre_articulo}" data-num="${item.numero_aporte}" style="color:#0d6efd;">
                            <i class="fa-regular fa-pen-to-square"></i>
                        </button>
                        <button type="button" class="btn btn-action" data-bs-toggle="modal" data-bs-target="#modalEliminarAportePropioArticulo" 
                                data-id="${item.idparametrodato}" data-nombre="${item.nombre_articulo}" style="color:red;">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>`;
    });
    $tbody.html(html);
}


// --- Funciones CRUD al API ---

function guardarAPA() {
    const codArticulo = $('#inputNuevoArticuloAPA').data('codigo');
    const numAporte = $('#inputNuevoNumAporteAPA').val().trim();

    if (!codArticulo || numAporte === "") {
        return Swal.fire({ icon: 'warning', title: 'Atención', text: 'Seleccione un artículo e ingrese el número de aportes.' });
    }

    // Validación de duplicados en la tabla principal
    let yaExiste = false;
    $('#tbody-aporte-propio-articulo tr').each(function () {
        const textoCelda = $(this).find('td:eq(0)').text().trim();
        let codEnTabla = textoCelda;
        if (textoCelda.includes('-')) {
            codEnTabla = textoCelda.substring(0, textoCelda.indexOf('-')).trim();
        }
        if (codEnTabla.toString() === codArticulo.toString()) {
            yaExiste = true;
            return false;
        }
    });

    if (yaExiste) {
        return Swal.fire({ icon: 'warning', title: 'Duplicado', text: `El artículo con código ${codArticulo} ya está configurado.` });
    }

    const $menu = $('#list-tab a.active');
    const payload = {
        code_app: "APP20260128155212346",
        http_method: "POST",
        endpoint_path: "api/Parametrizacion/crear-aporte-articulo",
        client: "APL",
        json_body: {
            idparametrotipo: $menu.data('idparametrotipo'),
            idparametro: $menu.data('idparametro'),
            codigoparametro: $menu.data('codigoparametro'),
            codigo_articulo: codArticulo.toString(),
            numero_aporte: numAporte.toString()
        }
    };

    $.ajax({
        url: "/api/apigee-router-proxy", method: "POST", contentType: "application/json", data: JSON.stringify(payload),
        success: function (response) {
            if (response.code_status === 200) {
                $('#modalNuevoAporteArticulo').modal('hide');
                Swal.fire({ icon: 'success', title: 'Guardado', timer: 1500 });
                cargarAportesPropioArticulo();
            } else {
                Swal.fire({ icon: "error", title: "Error", text: "No se pudo guardar la configuración." });
            }
        },
        error: function (xhr) { manejarErrorGlobal(xhr, "crear el aporte por artículo"); }
    });
}

function modificarAPA() {
    const id = $('#inputIdModifAPA').val();
    const num = $('#inputModifNumAporteAPA').val().trim();

    if (num === "") return Swal.fire({ icon: 'warning', text: 'Ingrese el número de aportes.' });

    const payload = {
        code_app: "APP20260128155212346",
        http_method: "PUT",
        endpoint_path: "api/Parametrizacion/actualizar-aporte-articulo",
        client: "APL",
        json_body: { idparametrodato: parseInt(id), numero_aporte: num.toString() }
    };

    $.ajax({
        url: "/api/apigee-router-proxy", method: "POST", contentType: "application/json", data: JSON.stringify(payload),
        success: function (response) {
            if (response.code_status === 200) {
                $('#modalModificarAporteArticulo').modal('hide');
                Swal.fire({ icon: 'success', title: 'Actualizado', timer: 1500 });
                cargarAportesPropioArticulo();
            } else {
                Swal.fire({ icon: "error", title: "Error", text: "No se pudo actualizar la configuración." });
            }
        },
        error: function (xhr) { manejarErrorGlobal(xhr, "actualizar el aporte"); }
    });
}

function eliminarAPA() {
    const id = $('#inputIdElimAPA').val();

    const payload = {
        code_app: "APP20260128155212346",
        http_method: "DELETE",
        endpoint_path: `api/Parametrizacion/eliminar-aporte-articulo/${id}`,
        client: "APL"
    };

    $.ajax({
        url: "/api/apigee-router-proxy", method: "POST", contentType: "application/json", data: JSON.stringify(payload),
        success: function (response) {
            if (response.code_status === 200) {
                $('#modalEliminarAportePropioArticulo').modal('hide');
                Swal.fire({ icon: 'success', title: 'Eliminado', timer: 1500 });
                cargarAportesPropioArticulo();
            } else {
                Swal.fire({ icon: "error", title: "Error", text: "No se pudo eliminar el registro." });
            }
        },
        error: function (xhr) { manejarErrorGlobal(xhr, "eliminar el aporte"); }
    });
}




function cargarArticulosModalMM() {
    const $tabla = $('#datosarticulosMM');
    const $tbody = $('#modalNuevoMargenMinimoArticulo #datosarticulosMM tbody');

    // 1. ANTES DEL API: Destruimos la tabla si ya existe y ponemos el spinner
    if ($.fn.DataTable.isDataTable('#datosarticulos')) {
        $tabla.DataTable().clear().destroy();
    }

    $tbody.html(`
            <tr>
                <td colspan="3" class="text-center py-4">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Cargando...</span>
                    </div>
                    <p class="mt-2 text-muted fw-bold">Descargando catálogo de artículos, por favor espere...</p>
                </td>
            </tr>
        `);

    const payload = {
        code_app: "APP20260128155212346",
        http_method: "GET",
        endpoint_path: "api/Acuerdo/consultar-articulos-parametrizacion",
        client: "APL"
    };

    $.ajax({
        url: "/api/apigee-router-proxy",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(payload),
        success: function (response) {
            // 2. CUANDO RESPONDE EL API: Vaciamos el spinner
            $tbody.empty();

            if (response && response.code_status === 200 && response.json_response) {
                // Le enviamos el JSON entero a DataTables en vez de hacer un $.each
                inicializarDataTablesArticulos(response.json_response);
            } else {
                $tbody.html('<tr><td colspan="3" class="text-center text-muted">No se encontraron artículos.</td></tr>');
            }
        },
        error: function (xhr) {
            $tbody.html('<tr><td colspan="3" class="text-center text-danger fw-bold">Error al cargar los artículos.</td></tr>');
            manejarErrorGlobal(xhr, "cargar los artículos");
        }
    });
}

function inicializarDataTablesArticulos(data) {
    $('#datosarticulosMM').DataTable({
        data: data, // Le pasamos el array de 4MB
        deferRender: true, // MAGIA: Solo dibuja en el HTML los registros visibles
        pageLength: 10,    // Muestra 10 registros por página
        lengthMenu: [10, 25, 50], // Opciones de paginación
        destroy: true,     // Permite reinicializar la tabla si se cierra y abre el modal
        autoWidth: false,
        language: {
            "sProcessing": "Procesando...",
            "sLengthMenu": "Mostrar _MENU_ registros",
            "sZeroRecords": "No se encontraron resultados",
            "sEmptyTable": "Ningún dato disponible en esta tabla",
            "sInfo": "Mostrando registros del _START_ al _END_ de un total de _TOTAL_ registros",
            "sInfoEmpty": "Mostrando registros del 0 al 0 de un total de 0 registros",
            "sInfoFiltered": "(filtrado de un total de _MAX_ registros)",
            "sSearch": "Buscar en catálogo:",
            "oPaginate": {
                "sFirst": "Primero",
                "sLast": "Último",
                "sNext": "Siguiente",
                "sPrevious": "Anterior"
            }
        },
        columns: [
            // Columna 1: Código
            {
                data: 'codigo',
                className: 'align-middle text-center'
            },
            // Columna 2: Descripción
            {
                data: 'descripcion',
                className: 'align-middle text-wrap'
            },
            // Columna 3: Acción (El Radio Button)
            {
                data: null,
                orderable: false, // Quitamos las flechitas de ordenar en esta columna
                className: 'text-center align-middle',
                render: function (data, type, row) {
                    // Aquí dibujamos el botón con los datos de la fila
                    return `<input class="form-check-input radio-seleccion-articulo-mm" type="radio" name="radioArticuloMM" data-codigo="${row.codigo}" data-nombre="${row.descripcion}">`;
                }
            }
        ]
    });
}


function cargarMargenMinimo() {
    const payload = {
        code_app: "APP20260128155212346",
        http_method: "GET",
        endpoint_path: "api/Parametrizacion/consultar-margen-minimo", // <-- Ajusta a tu Swagger
        client: "APL"
    };

    $.ajax({
        url: "/api/apigee-router-proxy", method: "POST", contentType: "application/json", data: JSON.stringify(payload),
        success: function (response) {
            console.log("response: ", response);
            if (response && response.code_status === 200) {
                crearListadoMargenMinimo(response.json_response || []);
            }
        },
        error: function (xhr) { manejarErrorGlobal(xhr, "cargar márgenes mínimos"); }
    });
}

function crearListadoMargenMinimo(data) {
    // En tu HTML la tabla de margen mínimo no tiene un ID en el tbody, 
    // así que la buscamos usando el ID del tab.
    const $tbody = $('#list-margen-minimo-articulo tbody');
    $tbody.empty();

    if (!data || data.length === 0) {
        $tbody.append('<tr><td colspan="6" class="text-center text-muted">No hay registros de margen mínimo.</td></tr>');
        return;
    }

    let html = '';
    $.each(data, function (index, item) {
        html += `
                <tr data-id="${item.idparametrodato}">
                    <td class="align-middle text-wrap">${item.codigo_articulo} - ${item.nombre_articulo}</td>
                    <td class="text-center align-middle">${item.margen_minimo_contado}</td>
                    <td class="text-center align-middle">${item.margen_minimo_tarjeta_credito}</td>
                    <td class="text-center align-middle">${item.margen_minimo_credito}</td>
                    <td class="text-center align-middle">${item.margen_minimo_igualar_precio}</td>
                    <td class="text-center align-middle">
                        <div class="btn-group btn-group-sm">
                            <button type="button" class="btn btn-action" data-bs-toggle="modal" data-bs-target="#modalModificarMargenMinimoArticulo" 
                                    data-id="${item.idparametrodato}" 
                                    data-codigo="${item.codigo_articulo}" 
                                    data-nombre="${item.codigo_articulo} - ${item.nombre_articulo}" 
                                    data-contado="${item.margen_minimo_contado}" 
                                    data-tarjeta="${item.margen_minimo_tarjeta_credito}" 
                                    data-credito="${item.margen_minimo_credito}" 
                                    data-igualar="${item.margen_minimo_igualar_precio}" 
                                    style="color:#0d6efd;">
                                <i class="fa-regular fa-pen-to-square"></i>
                            </button>
                            <button type="button" class="btn btn-action" data-bs-toggle="modal" data-bs-target="#modalEliminarMargenMinimoArticulo" 
                                    data-id="${item.idparametrodato}" 
                                    data-codigo="${item.codigo_articulo}" 
                                    data-nombre="${item.codigo_articulo} - ${item.nombre_articulo}" 
                                    style="color:red;">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>`;
    });
    $tbody.html(html);
}






function cargarPreciosCompetencia() {
    const payload = {
        code_app: "APP20260128155212346",
        http_method: "GET",
        endpoint_path: "api/Parametrizacion/consultar-precios-competencia", // <-- Ajusta a tu Swagger
        client: "APL"
    };

    $.ajax({
        url: "/api/apigee-router-proxy", method: "POST", contentType: "application/json", data: JSON.stringify(payload),
        success: function (response) {
            if (response && response.code_status === 200) {
                crearListadoPrecioCompetencia(response.json_response || []);
            }
        },
        error: function (xhr) { manejarErrorGlobal(xhr, "cargar precios de competencia"); }
    });
}

function crearListadoPrecioCompetencia(data) {
    const $tbody = $('#tbody-precio-competencia');
    $tbody.empty();

    if (!data || data.length === 0) {
        $tbody.append('<tr><td colspan="5" class="text-center text-muted">No hay registros de competencia.</td></tr>');
        return;
    }

    let html = '';
    $.each(data, function (index, item) {
        html += `
                <tr data-id="${item.idparametrodato}">
                    <td class="text-center align-middle">${item.codigo_articulo} - ${item.nombre_articulo}</td>
                    <td class="align-middle text-wrap">${item.nombre_competencia}</td>
                    <td class="text-end align-middle">$ ${parseFloat(item.precio_contado).toFixed(2)}</td>
                    <td class="text-center align-middle">
                        <div class="btn-group btn-group-sm">
                            <button type="button" class="btn btn-action" data-bs-toggle="modal" data-bs-target="#modalModificarPrecioComp" 
                                    data-id="${item.idparametrodato}" 
                                    data-nombreart="${item.nombre_articulo}" 
                                    data-competencia="${item.nombre_competencia}" 
                                    data-precio="${item.precio_contado}" 
                                    data-codigo="${item.codigo_articulo}" 
                                    style="color:#0d6efd;">
                                <i class="fa-regular fa-pen-to-square"></i>
                            </button>
                            <button type="button" class="btn btn-action" data-bs-toggle="modal" data-bs-target="#modalEliminarPrecioComp" 
                                    data-id="${item.idparametrodato}" 
                                    data-nombreart="${item.nombre_articulo}" 
                                    data-competencia="${item.nombre_competencia}"
                                    data-codigo="${item.codigo_articulo}" 
                                    style="color:red;">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>`;
    });
    $tbody.html(html);
}




function cargarDatosPorcentaje() {
    const payload = {
        code_app: "APP20260128155212346",
        http_method: "GET",
        endpoint_path: "api/Parametrizacion/consultar-porcentaje-incremento", // <-- Revisa tu ruta en Swagger
        client: "APL"
    };

    $.ajax({
        url: "/api/apigee-router-proxy",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(payload),
        success: function (response) {
            console.log("response.json_response: ", response.json_response);
            if (response && response.code_status === 200) {
                const data = response.json_response;

                // Como tu JSON es un arreglo [ { ... } ], validamos que traiga al menos un elemento
                if (data && data.length > 0) {
                    const registro = data[0]; // Tomamos el primer objeto

                    // Guardamos el ID en el campo oculto
                    $('#inputIdParamDatoIncremento').val(registro.idparametrodato);

                    // Llenamos los inputs con los valores exactos
                    $('#inputPorcentajeTC').val(registro.porcentaje_incremento_tarjeta_credito);
                    $('#inputPorcentajeCredito').val(registro.porcentaje_incremento_credito);
                } else {
                    // Si no hay configuración previa, limpiamos todo
                    $('#inputIdParamDatoIncremento').val('0');
                    $('#inputPorcentajeTC').val('');
                    $('#inputPorcentajeCredito').val('');
                }
            }
        },
        error: function (xhr) {
            manejarErrorGlobal(xhr, "cargar los porcentajes de incremento");
        }
    });
}


function cargarAportesMarca() {
    const payload = {
        code_app: "APP20260128155212346",
        http_method: "GET",
        endpoint_path: "api/Parametrizacion/consultar-aporte-marca", 
        client: "APL"
    };

    $.ajax({
        url: "/api/apigee-router-proxy", method: "POST", contentType: "application/json", data: JSON.stringify(payload),
        success: function (response) {
            if (response && response.code_status === 200) {
                crearListadoAportesMarca(response.json_response || []);
            }
        },
        error: function (xhr) { manejarErrorGlobal(xhr, "cargar aportes por marca"); }
    });
}

function crearListadoAportesMarca(data) {
    const $tbody = $('#tbody-aportes-marca');
    $tbody.empty();

    if (!data || data.length === 0) {
        $tbody.append('<tr><td colspan="3" class="text-center text-muted">No hay registros.</td></tr>');
        return;
    }

    let html = '';
    $.each(data, function (index, item) {
        html += `
                <tr data-id="${item.idparametrodato}">
                    <td class="align-middle">${item.nombre_marca}</td>
                    <td class="align-middle text-center">${item.numero_aporte}</td>
                    <td class="align-middle text-center">
                        <div class="btn-group btn-group-sm">
                            <button type="button" class="btn btn-action" data-bs-toggle="modal" data-bs-target="#modalModificarAporteMarca" 
                                    data-id="${item.idparametrodato}" data-num="${item.numero_aporte}" data-marca="${item.codigo_marca}" style="color:#0d6efd;">
                                <i class="fa-regular fa-pen-to-square"></i>
                            </button>
                            <button type="button" class="btn btn-action" data-bs-toggle="modal" data-bs-target="#modalEliminarAporteMarca" 
                                    data-id="${item.idparametrodato}" data-nombremarca="${item.nombre_marca}" data-marca="${item.codigo_marca}" style="color:red;">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>`;
    });
    $tbody.html(html);
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
            <tr data-id="${item.idparametrodato}">
                <td class="align-middle text-wrap">${item.nombre_proveedor}</td>
                <td class="align-middle">${item.nombre_marca}</td>
                <td class="align-middle text-center">${item.numero_aporte}</td>
                <td class="align-middle text-center">
                    <div class="btn-group btn-group-sm">
                        <button type="button" class="btn btn-action" 
                                data-bs-toggle="modal" 
                                data-bs-target="#modalModificarAporteMarcaProveedor" 
                                data-id="${item.idparametrodato}" 
                                data-num="${item.numero_aporte}"
                                data-marca="${item.codigo_marca}" 
                                data-proveedor="${item.identificacion_proveedor}"
                                style="color:#0d6efd;">
                            <i class="fa-regular fa-pen-to-square"></i>
                        </button>
                        <button type="button" class="btn btn-action" 
                                data-bs-toggle="modal" 
                                data-bs-target="#modalEliminarAporteMarcaProveedor" 
                                data-id="${item.idparametrodato}" 
                                data-marca="${item.nombre_marca}" 
                                data-prov="${item.nombre_proveedor}" 
                                data-proveedor="${item.identificacion_proveedor}"
                                style="color:red;">
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



//MARGEN MINIMO
// ==========================================
// CRUD: MARGEN MÍNIMO POR ARTÍCULO
// ==========================================

// 1. Guardar Nuevo (Mantenimiento: Insertar)
function guardarMM() {
    const codArticulo = $('#inputNuevoArticuloMM').data('codigo');
    const mContado = $('#inputNuevoContadoMM').val();
    const mTarjeta = $('#inputNuevoTarjCrMM').val();
    const mCredito = $('#inputNuevoCreditoMM').val();
    const mIgualar = $('#inputNuevoIgualarMM').val();

    if (!codArticulo || mContado === "" || mTarjeta === "" || mCredito === "" || mIgualar === "") {
        return Swal.fire({ icon: 'warning', title: 'Atención', text: 'Debe seleccionar un artículo y llenar todos los porcentajes.' });
    }

    // Validación de duplicados en la tabla
    let yaExiste = false;
    $('#list-margen-minimo-articulo tbody tr').each(function () {
        const textoCelda = $(this).find('td:eq(0)').text().trim();
        let codEnTabla = textoCelda;
        if (textoCelda.includes('-')) {
            codEnTabla = textoCelda.substring(0, textoCelda.indexOf('-')).trim();
        }
        if (codEnTabla.toString() === codArticulo.toString()) {
            yaExiste = true;
            return false;
        }
    });

    if (yaExiste) {
        return Swal.fire({ icon: 'warning', title: 'Artículo Duplicado', text: `El artículo ${codArticulo} ya tiene un margen configurado.` });
    }

    const $menuActivo = $('#list-tab a.active');

    const body = {
        "tipo_mant": 8, // Asegúrate de que 8 sea la opción correcta en tu backend
        "opcion": "I",
        "idparametro": $menuActivo.data('idparametro'),
        "codigoparametro": $menuActivo.data('codigoparametro'),
        "idusuario": getUsuario(),
        "codigorelacion1": codArticulo.toString(),
        "valor1": parseFloat(mContado),
        "valor2": parseFloat(mTarjeta),
        "valor3": parseFloat(mCredito),
        "valor4": parseFloat(mIgualar)
    };

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
                $('#modalNuevoMargenMinimoArticulo').modal('hide');
                Swal.fire({ icon: 'success', title: 'Guardado', timer: 1500 });
                cargarMargenMinimo();
            } else {
                Swal.fire({ icon: "error", title: "Error", text: "No se pudo guardar la configuración." });
            }
        },
        error: function (xhr) { manejarErrorGlobal(xhr, "crear margen mínimo"); }
    });
}

// 2. Modificar (Mantenimiento: Modificar)
function modificarMM() {
    const idParamDato = $('#inputIdModifMM').val();
    const codArticulo = $('#inputCodArtModifMM').val();
    const mContado = $('#inputModifContadoMM').val();
    const mTarjeta = $('#inputModifTarjCrMM').val();
    const mCredito = $('#inputModifCreditoMM').val();
    const mIgualar = $('#inputModifIgualarMM').val();

    if (mContado === "" || mTarjeta === "" || mCredito === "" || mIgualar === "") {
        return Swal.fire({ icon: 'warning', title: 'Atención', text: 'Todos los porcentajes son obligatorios.' });
    }

    const $menuActivo = $('#list-tab a.active');

    const body = {
        "tipo_mant": 8,
        "opcion": "M",
        "idparametro": $menuActivo.data('idparametro'),
        "codigoparametro": $menuActivo.data('codigoparametro'),
        "idusuario": getUsuario(),
        "idparametrodato": parseInt(idParamDato),
        "codigorelacion1": codArticulo.toString(),
        "valor1": parseFloat(mContado),
        "valor2": parseFloat(mTarjeta),
        "valor3": parseFloat(mCredito),
        "valor4": parseFloat(mIgualar)
    };

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
            if (response.code_status === 200) {
                $('#modalModificarMargenMinimoArticulo').modal('hide');
                Swal.fire({ icon: 'success', title: 'Actualizado', timer: 1500 });
                cargarMargenMinimo();
            } else {
                Swal.fire({ icon: "error", title: "Error", text: "No se pudo modificar." });
            }
        },
        error: function (xhr) { manejarErrorGlobal(xhr, "modificar margen mínimo"); }
    });
}

// 3. Eliminar (Mantenimiento: Eliminar)
function eliminarMM() {
    const idParamDato = $('#inputIdElimMM').val();
    const codArticulo = $('#inputCodArtElimMM').val();

    const $menuActivo = $('#list-tab a.active');

    const body = {
        "tipo_mant": 8,
        "opcion": "E",
        "idparametro": $menuActivo.data('idparametro'),
        "codigoparametro": $menuActivo.data('codigoparametro'),
        "idusuario": getUsuario(),
        "idparametrodato": parseInt(idParamDato),
        "codigorelacion1": codArticulo.toString()
    };

    const payload = {
        code_app: "APP20260128155212346",
        http_method: "POST",
        endpoint_path: "api/Parametrizacion/mantenimiento-parametros",
        client: "APL",
        body_request: body
    };

    $.ajax({
        url: "/api/apigee-router-proxy", method: "POST", contentType: "application/json", data: JSON.stringify(payload),
        success: function (response) {
            if (response.code_status === 200) {
                $('#modalEliminarMargenMinimoArticulo').modal('hide');
                Swal.fire({ icon: 'success', title: 'Eliminado', timer: 1500 });
                cargarMargenMinimo();
            } else {
                Swal.fire({ icon: "error", title: "Error", text: "No se pudo eliminar el registro." });
            }
        },
        error: function (xhr) { manejarErrorGlobal(xhr, "eliminar margen mínimo"); }
    });
}



//PRECIO COMPETENCIA
function guardarPC() {
    const codArticulo = $('#inputNuevoCodArticuloPC').val().trim();
    const competencia = $('#inputNuevoNombreCompPC').val().trim();
    const precio = $('#inputNuevoPrecioPC').val().trim();

    if (!codArticulo || !competencia || precio === "") {
        return Swal.fire({ icon: 'warning', title: 'Atención', text: 'Debe llenar todos los campos.' });
    }

    // Validación de duplicados (Mismo código de artículo y misma competencia)
    let yaExiste = false;
    $('#tbody-precio-competencia tr').each(function () {
        const codFila = $(this).find('td:eq(0)').text().trim();
        const compFila = $(this).find('td:eq(1)').text().trim();

        let codFilaLimpio = codFila;
        if (codFila.includes('-')) {
            // Tomamos desde el inicio (0) hasta la posición donde está el primer guión, y quitamos espacios
            codFilaLimpio = codFila.substring(0, codFila.indexOf('-')).trim();
        }

        // Puedes dejar estos console.log si quieres ver la magia en acción en la consola
         console.log("codLimpio: ", codFilaLimpio);
         console.log("compFila: ", compFila);

        // Ahora comparamos el código limpio con lo que ingresó el usuario
        if (codFilaLimpio === codArticulo && compFila.toLowerCase() === competencia.toLowerCase()) {
            yaExiste = true;
            return false; // Rompe el ciclo each
        }
    });

    if (yaExiste) {
        return Swal.fire({ icon: 'warning', title: 'Duplicado', text: `Ya existe un precio de "${competencia}" para el artículo ${codArticulo}.` });
    }

    const $menuActivo = $('#list-tab a.active');

    const body = {
        "tipo_mant": 7,
        "opcion": "I",
        "idparametro": $menuActivo.data('idparametro'),
        "codigoparametro": $menuActivo.data('codigoparametro'),
        "idusuario": getUsuario(),
        //"idparametrodato": 0,
        "codigorelacion1": codArticulo,
        "codigorelacion2": competencia,
        "valor1": parseFloat(precio)
    };

    // Armamos el body exactamente con todos los campos de tu esquema
    const payload = {
        code_app: "APP20260128155212346",
        http_method: "POST", // O PUT, verifica con tu backend
        endpoint_path: "api/Parametrizacion/mantenimiento-parametros", // <-- Revisa tu ruta
        client: "APL",
        body_request: body
    };

    console.log("body: ", body);
    return;

    $.ajax({
        url: "/api/apigee-router-proxy", method: "POST", contentType: "application/json", data: JSON.stringify(payload),
        success: function (response) {
            if (response && response.code_status === 200) {
                $('#modalNuevoPrecioComp').modal('hide');
                Swal.fire({ icon: 'success', title: 'Guardado', timer: 1500 });
                cargarPreciosCompetencia();
            }
        }
    });
}

function modificarPC() {
    const idParamDato = $('#inputIdModifPC').val();
    const nuevoPrecio = $('#inputModifPrecioPC').val().trim();
    const competencia = $('#inputModifNombreCompPC').val().trim();
    const codArticulo = $('#inputCodModifPC').val();

    if (nuevoPrecio === "") return Swal.fire({ icon: 'warning', title: 'Atención', text: 'Ingrese el nuevo precio.' });

    /*
    json_body: {
            idparametrodato: parseInt(idParamDato),
            precio_contado: parseFloat(nuevoPrecio).toString()
        }
    */

    const $menuActivo = $('#list-tab a.active');

    const body = {
        "tipo_mant": 7,
        "opcion": "M",
        "idparametro": $menuActivo.data('idparametro'),
        "codigoparametro": $menuActivo.data('codigoparametro'),
        "idusuario": getUsuario(),
        "idparametrodato": idParamDato,
        "codigorelacion1": codArticulo,
        "codigorelacion2": competencia,
        "valor1": parseFloat(nuevoPrecio)
    };

    // Armamos el body exactamente con todos los campos de tu esquema
    const payload = {
        code_app: "APP20260128155212346",
        http_method: "POST", // O PUT, verifica con tu backend
        endpoint_path: "api/Parametrizacion/mantenimiento-parametros", // <-- Revisa tu ruta
        client: "APL",
        body_request: body
    };

    //console.log("body: ", body);

    $.ajax({
        url: "/api/apigee-router-proxy", method: "POST", contentType: "application/json", data: JSON.stringify(payload),
        success: function (response) {
            if (response.code_status === 200) {
                $('#modalModificarPrecioComp').modal('hide');
                Swal.fire({ icon: 'success', title: 'Actualizado', timer: 1500 });
                cargarPreciosCompetencia();
            }
        }
    });
}

function eliminarPC() {
    const idParamDato = $('#inputIdElimPC').val();
    const competencia = $('#inputCompElimPC').val().trim();
    const codArticulo = $('#inputCodElimPC').val();

    const $menuActivo = $('#list-tab a.active');

    const body = {
        "tipo_mant": 7,
        "opcion": "E",
        "idparametro": $menuActivo.data('idparametro'),
        "codigoparametro": $menuActivo.data('codigoparametro'),
        "idusuario": getUsuario(),
        "idparametrodato": idParamDato,
        "codigorelacion1": codArticulo,
        "codigorelacion2": competencia,
        //"valor1": parseFloat(nuevoPrecio)
    };

    // Armamos el body exactamente con todos los campos de tu esquema
    const payload = {
        code_app: "APP20260128155212346",
        http_method: "POST", // O PUT, verifica con tu backend
        endpoint_path: "api/Parametrizacion/mantenimiento-parametros", // <-- Revisa tu ruta
        client: "APL",
        body_request: body
    };


    //console.log("body: ", body);

    $.ajax({
        url: "/api/apigee-router-proxy", method: "POST", contentType: "application/json", data: JSON.stringify(payload),
        success: function (response) {
            if (response.code_status === 200) {
                $('#modalEliminarPrecioComp').modal('hide');
                Swal.fire({ icon: 'success', title: 'Eliminado', timer: 1500 });
                cargarPreciosCompetencia();
            }
        }
    });
}

//APORTE PROPIO POR ARTICULO



//PORCENTAJE DE INCREMENTO
function guardarPorcIncremento() {
    // Capturamos los valores
    const idParamDato = $('#inputIdParamDatoIncremento').val();
    const porcentajeTC = $('#inputPorcentajeTC').val().trim();
    const porcentajeCredito = $('#inputPorcentajeCredito').val().trim();

    // Validamos que los inputs no estén vacíos
    if (porcentajeTC === "" || porcentajeCredito === "") {
        return Swal.fire({ icon: 'warning', title: 'Atención', text: 'Debe ingresar ambos porcentajes.' });
    }

    // Recuperamos la jerarquía (idparametro, codigoparametro) desde el menú activo
    const $menuActivo = $('#list-tab a.active');

    const body = {
        "tipo_mant": 9,
        "opcion": idParamDato ? "M": "I",
        "idparametro": $menuActivo.data('idparametro'),
        "codigoparametro": $menuActivo.data('codigoparametro'),
        "idusuario": getUsuario(),
        "idparametrodato": idParamDato ?? 0,
        "valor1": porcentajeTC,
        "valor2": porcentajeCredito,
    };

    // Armamos el body exactamente con todos los campos de tu esquema
    const payload = {
        code_app: "APP20260128155212346",
        http_method: "POST", // O PUT, verifica con tu backend
        endpoint_path: "api/Parametrizacion/mantenimiento-parametros", // <-- Revisa tu ruta
        client: "APL",
        body_request: body
    };

    //console.log("body: ", body);

    $.ajax({
        url: "/api/apigee-router-proxy",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(payload),
        success: function (response) {
            if (response && response.code_status === 200) {
                Swal.fire({ icon: 'success', title: 'Guardado', text: 'Los porcentajes se guardaron correctamente.', timer: 1500 });

                // Volvemos a consultar para asegurarnos de traer el nuevo idparametrodato si fue un insert
                cargarDatosPorcentaje();
            } else {
                Swal.fire({ icon: "error", title: "Error", text: "No se pudo guardar la configuración." });
            }
        },
        error: function (xhr) {
            manejarErrorGlobal(xhr, "guardar los porcentajes");
        }
    });
}


//APORTE MARCA
function guardarAM() {
    const codigoMarca = $('#selectNuevoMarcaAM').val();
    const numeroAporte = $('#inputNuevoNumAporteAM').val().trim();
    const nombreMarca = $('#selectNuevoMarcaAM option:selected').text().trim();

    if (!codigoMarca || numeroAporte === "") {
        return Swal.fire({ icon: 'warning', title: 'Atención', text: 'Debe seleccionar una Marca e ingresar el número de aportes.' });
    }

    // Validación de duplicados
    let combinacionYaExiste = false;
    $('#tbody-aportes-marca tr').each(function () {
        if ($(this).find('td:eq(0)').text().trim() === nombreMarca) {
            combinacionYaExiste = true;
            return false;
        }
    });

    if (combinacionYaExiste) {
        return Swal.fire({ icon: 'warning', title: 'Registro Duplicado', text: `Ya existe un límite configurado para la marca "${nombreMarca}".` });
    }

    // Datos del Menú Activo
    const $menuActivo = $('#list-tab a.active');

    const body = {
        "tipo_mant": 4,
        "opcion": "I",
        "idparametro": $menuActivo.data('idparametro'),
        "codigoparametro": $menuActivo.data('codigoparametro'),
        "idusuario": getUsuario(),
        "idparametrodato": 0,
        "codigorelacion1": codigoMarca,
        "valor1": numeroAporte
    };


    const payload = {
        code_app: "APP20260128155212346",
        http_method: "POST",
        endpoint_path: "api/Parametrizacion/mantenimiento-parametros", // <-- Validar ruta
        client: "APL",
        body_request: body
    };


    //console.log("body: ", body);

    $.ajax({
        url: "/api/apigee-router-proxy", method: "POST", contentType: "application/json", data: JSON.stringify(payload),
        success: function (response) {
            if (response && response.code_status === 200) {
                $('#modalNuevoAporteMarca').modal('hide');
                $('#inputNuevoNumAporteAM').val('');
                Swal.fire({ icon: 'success', title: 'Guardado', timer: 1500 });
                cargarAportesMarca();
            }
        }
    });
}

function modificarAM() {
    const idParamDato = $('#inputIdModifAM').val();
    const nuevoAporte = $('#inputModifNumAporteAM').val().trim();
    const codigoMarca = $('#selectModifMarcaAM').val();

    if (nuevoAporte === "") return Swal.fire({ icon: 'warning', title: 'Atención', text: 'Ingrese el número.' });

    // Datos del Menú Activo
    const $menuActivo = $('#list-tab a.active');

    const body = {
        "tipo_mant": 4,
        "opcion": "M",
        "idparametro": $menuActivo.data('idparametro'),
        "codigoparametro": $menuActivo.data('codigoparametro'),
        "idusuario": getUsuario(),
        "idparametrodato": idParamDato,
        "codigorelacion1": codigoMarca,
        "valor1": nuevoAporte
    };


    const payload = {
        code_app: "APP20260128155212346",
        http_method: "POST",
        endpoint_path: "api/Parametrizacion/mantenimiento-parametros", // <-- Validar ruta
        client: "APL",
        body_request: body
    };

    //console.log("body: ", body);

    $.ajax({
        url: "/api/apigee-router-proxy", method: "POST", contentType: "application/json", data: JSON.stringify(payload),
        success: function (response) {
            if (response.code_status === 200) {
                $('#modalModificarAporteMarca').modal('hide');
                Swal.fire({ icon: 'success', title: 'Actualizado', timer: 1500 });
                cargarAportesMarca();
            }
        }
    });
}

function eliminarAM() {
    const idParamDato = $('#inputIdElimAM').val();
    const codigoMarca = $('#inputCodigoElimAM').val();

    // Datos del Menú Activo
    const $menuActivo = $('#list-tab a.active');

    const body = {
        "tipo_mant": 4,
        "opcion": "E",
        "idparametro": $menuActivo.data('idparametro'),
        "codigoparametro": $menuActivo.data('codigoparametro'),
        "idusuario": getUsuario(),
        "idparametrodato": idParamDato,
        "codigorelacion1": codigoMarca,
        //"valor1": nuevoAporte
    };


    const payload = {
        code_app: "APP20260128155212346",
        http_method: "POST",
        endpoint_path: "api/Parametrizacion/mantenimiento-parametros", // <-- Validar ruta
        client: "APL",
        body_request: body
    };


    //console.log("body: ", body);

    $.ajax({
        url: "/api/apigee-router-proxy", method: "POST", contentType: "application/json", data: JSON.stringify(payload),
        success: function (response) {
            if (response.code_status === 200) {
                $('#modalEliminarAporteMarca').modal('hide');
                Swal.fire({ icon: 'success', title: 'Eliminado', timer: 1500 });
                cargarAportesMarca();
            }
        }
    });
}


//APORTE MARCA PROVEEDOR
function guardarAMP() {

    // Para la marca, el código está directo en el .val()
    const codigoMarca = $('#selectNuevoMarcaMP').val();

    // Para el proveedor, capturamos el option seleccionado
    const $opcionProveedor = $('#selectNuevoProveedorMP option:selected');
    const codigoProveedor = $opcionProveedor.val(); // Trae el "codigo"
    const identificacionProveedor = $opcionProveedor.data('identificacion'); // Trae la "identificacion"
    const aportes = $('#inputNuevoNumAporteMP').val();

    // Textos para la validación y el mensaje de error
    const nombreMarca = $('#selectNuevoMarcaMP option:selected').text().trim();
    const textoProveedor = $opcionProveedor.text().trim(); // Ej: "09190007510001 - ALMACENES JUAN ELJURI..."

    // Validamos que hayan seleccionado ambos
    if (!codigoMarca || !codigoProveedor) {
        return Swal.fire({ icon: 'warning', title: 'Atención', text: 'Debe seleccionar una Marca y un Proveedor.' });
    }


    // ==========================================
    // 2. VALIDACIÓN DE DUPLICADOS EN LA TABLA
    // ==========================================
    let combinacionYaExiste = false;

    // Limpiamos el texto del proveedor seleccionado para quitarle la identificación y el guión.
    // Ej: "0991400427001 - CARTIMEX S.A." se convierte en "CARTIMEX S.A."
    // Usamos indexOf para encontrar el primer guión y tomamos todo el texto que está después.
    let nombreProveedorLimpio = textoProveedor;
    if (textoProveedor.includes('-')) {
        nombreProveedorLimpio = textoProveedor.substring(textoProveedor.indexOf('-') + 1).trim();
    }

    $('#tbody-aportes-marca-proveedor tr').each(function () {
        // Obtenemos los textos exactos de la tabla
        const provEnFila = $(this).find('td:eq(0)').text().trim();
        const marcaEnFila = $(this).find('td:eq(1)').text().trim();

        // Ahora comparamos de forma exacta el nombre limpio con el de la fila
        if (provEnFila === nombreProveedorLimpio && marcaEnFila === nombreMarca) {
            combinacionYaExiste = true;
            return false; // Rompe el ciclo .each()
        }
    });

    if (combinacionYaExiste) {
        Swal.fire({
            icon: 'warning',
            title: 'Registro Duplicado',
            text: `Ya existe un límite configurado para la marca "${nombreMarca}" y el proveedor "${nombreProveedorLimpio}".`
        });
        return; // Detiene la ejecución aquí
    }
    /*
    console.log("codigoMarca: ", codigoMarca);
    console.log("codigoProveedor: ", codigoProveedor);
    console.log("aportes: ", aportes);*/

    // 1. Buscamos el enlace (<a>) que está seleccionado actualmente
    const $itemActivo = $('#list-tab a.active');

    const body = {
        "tipo_mant": 5,
        "opcion": "I",
        "idparametro": $itemActivo.data('idparametro'),
        "codigoparametro": $itemActivo.data('codigoparametro'),
        "idusuario": getUsuario(),
        //"idparametrodato": 0,
        "codigorelacion1": codigoMarca, //marca
        "codigorelacion2": identificacionProveedor.toString(), //proveedor
        "valor1": aportes //numero de aportes
        
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
        },
        error: function (xhr) { manejarErrorGlobal(xhr, "crear el aporte por marca proveedor"); }
    });
}

function modificarAMP() {
    const idParamDato = $('#inputIdModifAMP').val();
    const nuevoAporte = $('#inputModifNumAporteMP').val().trim();
    const $itemActivo = $('#list-tab a.active');
    const codigoMarca = $('#selectModifMarcaMP').val();
    const $opcionProveedor = $('#selectModifProveedorMP option:selected');
    //const codigoProveedor = $opcionProveedor.val(); // Trae el "codigo"
    const identificacionProveedor = $opcionProveedor.data('identificacion'); // Trae la "identificacion"

    if (nuevoAporte === "") {
        return Swal.fire({ icon: 'warning', title: 'Atención', text: 'Debe ingresar el número de aportes.' });
    }

    const body = {
        "tipo_mant": 5,
        "opcion": "M",
        "idparametro": $itemActivo.data('idparametro'),
        "codigoparametro": $itemActivo.data('codigoparametro'),
        "idusuario": getUsuario(),
        "idparametrodato": idParamDato,
        "codigorelacion1": codigoMarca, //marca
        "codigorelacion2": identificacionProveedor.toString(), //proveedor
        "valor1": nuevoAporte //numero de aportes

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
        url: "/api/apigee-router-proxy",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(payload),
        success: function (response) {
            if (response && response.code_status === 200) {
                $('#modalModificarAporteMarcaProveedor').modal('hide');
                Swal.fire({ icon: 'success', title: 'Éxito', text: 'Aporte actualizado correctamente.', timer: 1500 });
                cargarAportesMarcaProveedor(); // Refresca la tabla
            } else {
                Swal.fire({ icon: "error", title: "Error", text: "No se pudo actualizar." });
            }
        },
        error: function (xhr) { manejarErrorGlobal(xhr, "actualizar el aporte"); }
    });
}

function eliminarAMP() {
    const idParamDato = $('#inputIdElimAMP').val();
    const codigoMarca = $('#inputIdMarcaElimAMP').val();
    const identificacionProveedor = $('#inputIdProvElimAMP').val();

    const $itemActivo = $('#list-tab a.active');


    const body = {
        "tipo_mant": 5,
        "opcion": "E",
        "idparametro": $itemActivo.data('idparametro'),
        "codigoparametro": $itemActivo.data('codigoparametro'),
        "idusuario": getUsuario(),
        "idparametrodato": idParamDato,
        "codigorelacion1": codigoMarca, //marca
        "codigorelacion2": identificacionProveedor, //proveedor
        //"valor1": nuevoAporte //numero de aportes

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
        url: "/api/apigee-router-proxy",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(payload),
        success: function (response) {
            if (response && response.code_status === 200) {
                $('#modalEliminarAporteMarcaProveedor').modal('hide');
                Swal.fire({ icon: 'success', title: 'Éxito', text: 'Aporte eliminado correctamente.', timer: 1500 });
                cargarAportesMarcaProveedor(); // Refresca la tabla
            } else {
                Swal.fire({ icon: "error", title: "Error", text: "No se pudo eliminar el registro." });
            }
        },
        error: function (xhr) { manejarErrorGlobal(xhr, "eliminar el aporte"); }
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
    // Agregamos los IDs de los nuevos modales separados por coma
    const selects = $('#selectNuevoMarcaMP, #selectModifMarcaMP, #selectNuevoMarcaAM, #selectModifMarcaAM');
    selects.empty().append('<option value="" selected disabled>Seleccione una marca...</option>');
    $.each(data, function (index, item) {
        selects.append(`<option value="${item.codigo}">${item.nombre}</option>`);
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
    const selects = $('#selectNuevoProveedorMP, #selectModifProveedorMP');
    selects.empty().append('<option value="" selected disabled>Seleccione un proveedor...</option>');
    $.each(data, function (index, item) {
        selects.append(`<option value="${item.codigo}" data-identificacion="${item.identificacion}">${item.identificacion} - ${item.nombre}</option>`);
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

        // --- BLINDAJE PARA PRECIO COMPETENCIA ---
        "Precio Competencia por Articulo": { id: "list-precio-competencia", icon: "fa-solid fa-tag" },
        "Precio Competencia por Artticulo": { id: "list-precio-competencia", icon: "fa-solid fa-tag" },
        "Precios de la Competencia": { id: "list-precio-competencia", icon: "fa-solid fa-tag" },
        "Precios de la Competencia por Articulo": { id: "list-precio-competencia", icon: "fa-solid fa-tag" },
        // ----------------------------------------



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
        // Inyectamos todos los campos del JSON como data-attributes
        htmlGenerado += `
            <a class="list-group-item list-group-item-action border-0 ${claseActive}" 
               id="${conf.id}-list" 
               data-bs-toggle="list" 
               href="#${conf.id}" 
               role="tab" 
               aria-controls="${conf.id}"
               data-idparametrotipo="${item.idparametrotipo}"
               data-idparametro="${item.idparametro}"
               data-codigoparametro="${item.codigoparametro}"
               data-nombre="${item.nombre}">
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