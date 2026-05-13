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

    
    // ==========================================================
    // VALIDACIÓN GLOBAL: PROTEGER TODOS LOS INPUTS DE NÚMEROS
    // ==========================================================

    // 1. Evitar que escriban la letra "e", "E", o signos de suma/resta
    $(document).on('keydown', 'input[type="number"]', function (e) {
        if (e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '-') {
            e.preventDefault();
        }
    });

    // 2. Validación exacta: Máximo 3 enteros y 2 decimales (Ej: 999.99)
    $(document).on('input', 'input[type="number"]', function () {
        // Evitar números negativos
        if ($(this).val() < 0) {
            $(this).val(0);
            return;
        }

        let valorStr = $(this).val();

        // Si el usuario ingresó un punto decimal
        if (valorStr.includes('.')) {
            let partes = valorStr.split('.');
            let enteros = partes[0];
            let decimales = partes[1];

            // Limitamos a 3 dígitos enteros (antes del punto)
            if (enteros.length > 3) {
                enteros = enteros.slice(0, 3);
            }
            // Limitamos a 2 dígitos decimales (después del punto)
            if (decimales.length > 2) {
                decimales = decimales.slice(0, 2);
            }

            // Volvemos a unir el número
            $(this).val(enteros + '.' + decimales);
        }
        // Si es un número entero sin punto decimal
        else {
            // Limitamos estrictamente a 3 dígitos enteros
            if (valorStr.length > 3) {
                $(this).val(valorStr.slice(0, 3));
            }
        }
    });

    // Guardar Nuevo
    $('#btnGuardarNuevoAPA').click(function () {
        guardarAPA();
    });

    

    $('#btnGuardarModifAPA').click(function () {
        modificarAPA();
    });

    $('#btnConfirmarElimAPA').click(function () {
        eliminarAPA();
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
        $('#inputNuevoArticuloPC').val('').data('codigo', '');
        $('#inputNuevoNombreCompPC, #inputNuevoPrecioPC').val('');
        cargarArticulosModalPC();
    });


    $(document).on('change', '.radio-seleccion-articulo-pc', function () {
        const codigo = $(this).data('codigo');
        const nombre = $(this).data('nombre');
        $('#inputNuevoArticuloPC').val(`${codigo} - ${nombre}`);
        $('#inputNuevoArticuloPC').data('codigo', codigo);
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
    $(document).on('shown.bs.tab', 'a[href="#list-margen-minimo"]', function () {
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

        console.log("$boton.data('id')", $boton.data('id'));
        console.log("$boton.data('contado')", $boton.data('contado'));
        console.log("$boton.data('tarjeta')", $boton.data('tarjeta'));
        console.log("$boton.data('credito')", $boton.data('credito'));
        console.log("$boton.data('igualar')", $boton.data('igualar'));
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
        $('#inputCodModifAPA').val($boton.data('codigo'));
        $('#inputModifArticuloAPA').val($boton.data('nombre'));
        $('#inputModifNumAporteAPA').val($boton.data('num'));
    });

    // Llenar Modal Eliminar al abrir
    $('#modalEliminarAportePropioArticulo').on('show.bs.modal', function (event) {
        const $boton = $(event.relatedTarget);
        $('#inputIdElimAPA').val($boton.data('id'));
        $('#inputCodElimAPA').val($boton.data('codigo'));
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

    /*
    $('#btnGuardarNuevoAPA').off('click').on('click', guardarAPA);
    $('#btnGuardarModifAPA').off('click').on('click', modificarAPA);
    $('#btnConfirmarElimAPA').off('click').on('click', eliminarAPA);*/



    // ==========================================================
    // LIMPIEZA DE MODALES FALTANTES DE "NUEVO" (Al Abrir)
    // ==========================================================

    // Limpiar modal Nuevo Almacén
    $('#modalNuevoAlmacen').on('show.bs.modal', function () {
        $('#selectNuevoAlmacen').val('');
    });

    // Limpiar modal Nuevo Aporte por Marca
    $('#modalNuevoAporteMarca').on('show.bs.modal', function () {
        $('#selectNuevoMarcaAM').val('');
        $('#inputNuevoNumAporteAM').val('0'); // O vacío '' según prefieras
    });

    // Limpiar modal Nuevo Aporte por Marca y Proveedor
    $('#modalNuevoAporteMarcaProveedor').on('show.bs.modal', function () {
        $('#selectNuevoMarcaMP, #selectNuevoProveedorMP').val('');
        $('#inputNuevoNumAporteMP').val('0');
    });


    // ==========================================================
    // LIMPIEZA TOTAL DE MODALES "MODIFICAR" (Al Cerrar)
    // ==========================================================

    $('#modalModificarGrupo').on('hidden.bs.modal', function () {
        $('#inputIdModifGrupo, #inputCodParamModifGrupo, #inputModifNombreGrupo').val('');
    });

    $('#modalModificaMedioPago').on('hidden.bs.modal', function () {
        $('#inputIdModifMedioPago, #inputCodigoModifMedioPago, #inputModifNombreMedioPago').val('');
    });

    $('#modalModificarAporteMarca').on('hidden.bs.modal', function () {
        $('#inputIdModifAM, #selectModifMarcaAM, #inputModifNumAporteAM').val('');
    });

    $('#modalModificarAporteMarcaProveedor').on('hidden.bs.modal', function () {
        $('#inputIdModifAMP, #selectModifMarcaMP, #selectModifProveedorMP, #inputModifNumAporteMP').val('');
    });

    $('#modalModificarAporteArticulo').on('hidden.bs.modal', function () {
        $('#inputIdModifAPA, #inputCodModifAPA, #inputModifArticuloAPA, #inputModifNumAporteAPA').val('');
    });

    $('#modalModificarPrecioComp').on('hidden.bs.modal', function () {
        $('#inputIdModifPC, #inputCodModifPC, #inputModifNombreArtPC, #inputModifNombreCompPC, #inputModifPrecioPC').val('');
    });

    $('#modalModificarMargenMinimoArticulo').on('hidden.bs.modal', function () {
        $('#inputIdModifMM, #inputCodArtModifMM, #inputModifArticuloMM, #inputModifContadoMM, #inputModifTarjCrMM, #inputModifCreditoMM, #inputModifIgualarMM').val('');
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



// --- Lógica de DataTables y Renderizado ---

// ==========================================
// CARGAR TABLA DE ARTÍCULOS: PRECIO COMPETENCIA
// ==========================================
function cargarArticulosModalPC() {
    const $tabla = $('#datosarticulosPC');
    const $tbody = $('#modalNuevoPrecioComp #datosarticulosPC tbody');

    if ($.fn.DataTable.isDataTable('#datosarticulosPC')) {
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
                inicializarDataTablesArticulosPC(response.json_response);
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

function inicializarDataTablesArticulosPC(data) {
    $('#datosarticulosPC').DataTable({
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
                    return `<input class="form-check-input radio-seleccion-articulo-pc" type="radio" name="radioArticuloPC" data-codigo="${row.codigo}" data-nombre="${row.descripcion}">`;
                }
            }
        ]
    });
}


// 2. Función que consulta al API
function cargarAportesPropioArticulo() {
    const payload = {
        code_app: "APP20260128155212346",
        http_method: "GET",
        // IMPORTANTE: Verifica que esta ruta sea exacta a la de tu Swagger
        endpoint_path: "api/Parametrizacion/consultar-aporte-articulo",
        client: "APL"
    };

    $.ajax({
        url: "/api/apigee-router-proxy",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(payload),
        success: function (response) {
            if (response && response.code_status === 200) {
                // Llamamos a la función que dibuja el HTML (que te pasé en el mensaje anterior)
                crearListadoAportesPropioArticulo(response.json_response || []);
            } else {
                // Si el API responde 200 pero tu backend mandó un code_status distinto
                console.warn("No se encontraron registros o hubo un problema en el backend.");
                crearListadoAportesPropioArticulo([]); // Dibujamos la tabla vacía
            }
        },
        error: function (xhr) {
            manejarErrorGlobal(xhr, "cargar aportes propios por artículo");
        }
    });
}

// ==========================================
// RENDERIZADO CON DATATABLES: APORTES PROPIO POR ARTÍCULO
// ==========================================
function crearListadoAportesPropioArticulo(data) {
    const $tabla = $('#tabla-aporte-propio-articulo');

    // Destruimos la tabla previa si existe para reinicializarla
    if ($.fn.DataTable.isDataTable('#tabla-aporte-propio-articulo')) {
        $tabla.DataTable().clear().destroy();
    }

    $tabla.DataTable({
        data: data || [],
        deferRender: true,
        pageLength: 10,
        lengthMenu: [10, 20, 50],
        autoWidth: false,
        language: {
            "url": "//cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json",
            "emptyTable": "No hay registros de aportes propios configurados."
        },
        columns: [
            {
                // Concatenamos Código - Nombre
                data: null,
                className: 'align-middle text-wrap',
                render: function (data, type, row) {
                    return `${row.codigo_articulo} - ${row.nombre_articulo}`;
                }
            },
            {
                data: 'numero_aporte',
                className: 'align-middle text-center'
            },
            {
                data: null,
                orderable: false,
                className: 'align-middle text-center',
                render: function (data, type, row) {
                    // Inyectamos los datos en los data-attributes exactamente como lo esperan tus modales
                    return `
                        <div class="btn-group btn-group-sm">
                            <button type="button" class="btn btn-action" 
                                    data-bs-toggle="modal" 
                                    data-bs-target="#modalModificarAporteArticulo" 
                                    data-id="${row.idparametrodato}" 
                                    data-nombre="${row.codigo_articulo} - ${row.nombre_articulo}" 
                                    data-num="${row.numero_aporte}" 
                                    data-codigo="${row.codigo_articulo}" 
                                    style="color:#0d6efd;" title="Modificar">
                                <i class="fa-regular fa-pen-to-square"></i>
                            </button>
                            <button type="button" class="btn btn-action" 
                                    data-bs-toggle="modal" 
                                    data-bs-target="#modalEliminarAportePropioArticulo" 
                                    data-id="${row.idparametrodato}" 
                                    data-nombre="${row.codigo_articulo} - ${row.nombre_articulo}" 
                                    data-codigo="${row.codigo_articulo}" 
                                    style="color:red;" title="Eliminar">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    `;
                }
            }
        ]
    });
}

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

// ==========================================
// RENDERIZADO CON DATATABLES: MARGEN MÍNIMO
// ==========================================
function crearListadoMargenMinimo(data) {
    const $tabla = $('#tabla-margen-minimo');

    if ($.fn.DataTable.isDataTable('#tabla-margen-minimo')) {
        $tabla.DataTable().clear().destroy();
    }

    $tabla.DataTable({
        data: data || [],
        deferRender: true,
        pageLength: 10,
        lengthMenu: [10, 25, 50, 100], // Opciones más amplias para catálogos grandes
        autoWidth: false,
        language: {
            "url": "//cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json",
            "emptyTable": "No se encontraron configuraciones de margen mínimo."
        },
        columns: [
            {
                data: null,
                className: 'align-middle text-wrap',
                render: function (data, type, row) {
                    return `${row.codigo_articulo} - ${row.nombre_articulo}`;
                }
            },
            {
                data: 'margen_minimo_contado',
                className: 'align-middle text-center',
                render: function (data, type, row) { return `${parseFloat(row.margen_minimo_contado || 0).toFixed(2)} %`; }
            },
            {
                data: 'margen_minimo_tarjeta_credito',
                className: 'align-middle text-center',
                render: function (data, type, row) { return `${parseFloat(row.margen_minimo_tarjeta_credito || 0).toFixed(2)} %`; }
            },
            {
                data: 'margen_minimo_credito',
                className: 'align-middle text-center',
                render: function (data, type, row) { return `${parseFloat(row.margen_minimo_credito || 0).toFixed(2)} %`; }
            },
            {
                data: 'margen_minimo_igualar_precio',
                className: 'align-middle text-center',
                render: function (data, type, row) { return `${parseFloat(row.margen_minimo_igualar_precio || 0).toFixed(2)} %`; }
            },
            {
                data: null,
                orderable: false,
                className: 'align-middle text-center',
                render: function (data, type, row) {
                    return `
                        <div class="btn-group btn-group-sm">
                            <button type="button" class="btn btn-action" 
                                    data-bs-toggle="modal" 
                                    data-bs-target="#modalModificarMargenMinimoArticulo" 
                                    data-id="${row.idparametrodato}" 
                                    data-codigo="${row.codigo_articulo}" 
                                    data-nombre="${row.nombre_articulo}" 
                                    data-contado="${row.margen_minimo_contado}" 
                                    data-tarjeta="${row.margen_minimo_tarjeta_credito}" 
                                    data-credito="${row.margen_minimo_credito}" 
                                    data-igualar="${row.margen_minimo_igualar_precio}" 
                                    style="color:#0d6efd;" title="Modificar">
                                <i class="fa-regular fa-pen-to-square"></i>
                            </button>
                            <button type="button" class="btn btn-action" 
                                    data-bs-toggle="modal" 
                                    data-bs-target="#modalEliminarMargenMinimoArticulo" 
                                    data-id="${row.idparametrodato}" 
                                    data-codigo="${row.codigo_articulo}" 
                                    data-nombre="${row.nombre_articulo}" 
                                    style="color:red;" title="Eliminar">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    `;
                }
            }
        ]
    });
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


// ==========================================
// RENDERIZADO CON DATATABLES: PRECIO COMPETENCIA
// ==========================================
function crearListadoPrecioCompetencia(data) {
    const $tabla = $('#tabla-precio-competencia');

    if ($.fn.DataTable.isDataTable('#tabla-precio-competencia')) {
        $tabla.DataTable().clear().destroy();
    }

    $tabla.DataTable({
        data: data || [],
        deferRender: true,
        pageLength: 10,
        lengthMenu: [10, 20, 50],
        autoWidth: false,
        language: {
            "url": "//cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json",
            "emptyTable": "No se encontraron precios de competencia registrados."
        },
        columns: [
            {
                data: null,
                className: 'align-middle text-wrap',
                render: function (data, type, row) {
                    return `${row.codigo_articulo} - ${row.nombre_articulo}`;
                }
            },
            {
                data: 'nombre_competencia',
                className: 'align-middle text-wrap'
            },
            {
                data: 'precio_contado',
                className: 'align-middle text-end',
                render: function (data, type, row) {
                    // Formateamos automáticamente como moneda a 2 decimales
                    return `$ ${parseFloat(row.precio_contado).toFixed(2)}`;
                }
            },
            {
                data: null,
                orderable: false,
                className: 'align-middle text-center',
                render: function (data, type, row) {
                    return `
                        <div class="btn-group btn-group-sm">
                            <button type="button" class="btn btn-action" 
                                    data-bs-toggle="modal" 
                                    data-bs-target="#modalModificarPrecioComp" 
                                    data-id="${row.idparametrodato}" 
                                    data-nombreart="${row.nombre_articulo}" 
                                    data-competencia="${row.nombre_competencia}" 
                                    data-precio="${row.precio_contado}" 
                                    data-codigo="${row.codigo_articulo}" 
                                    style="color:#0d6efd;" title="Modificar">
                                <i class="fa-regular fa-pen-to-square"></i>
                            </button>
                            <button type="button" class="btn btn-action" 
                                    data-bs-toggle="modal" 
                                    data-bs-target="#modalEliminarPrecioComp" 
                                    data-id="${row.idparametrodato}" 
                                    data-nombreart="${row.nombre_articulo}" 
                                    data-competencia="${row.nombre_competencia}"
                                    data-codigo="${row.codigo_articulo}" 
                                    style="color:red;" title="Eliminar">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    `;
                }
            }
        ]
    });
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

// ==========================================
// RENDERIZADO CON DATATABLES: APORTES POR MARCA
// ==========================================
function crearListadoAportesMarca(data) {
    const $tabla = $('#tabla-aportes-marca');

    // Destruimos la tabla previa si existe para reinicializarla
    if ($.fn.DataTable.isDataTable('#tabla-aportes-marca')) {
        $tabla.DataTable().clear().destroy();
    }

    $tabla.DataTable({
        data: data || [],
        deferRender: true,
        pageLength: 10,
        lengthMenu: [10, 20, 50],
        autoWidth: false,
        language: {
            "url": "//cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json",
            "emptyTable": "No se encontraron registros de aportes por marca."
        },
        columns: [
            {
                data: 'nombre_marca',
                className: 'align-middle'
            },
            {
                data: 'numero_aporte',
                className: 'align-middle text-center'
            },
            {
                data: null,
                orderable: false,
                className: 'align-middle text-center',
                render: function (data, type, row) {
                    // Inyectamos los datos necesarios para que los modales de Modificar y Eliminar funcionen
                    return `
                        <div class="btn-group btn-group-sm">
                            <button type="button" class="btn btn-action" 
                                    data-bs-toggle="modal" 
                                    data-bs-target="#modalModificarAporteMarca" 
                                    data-id="${row.idparametrodato}" 
                                    data-num="${row.numero_aporte}" 
                                    data-marca="${row.codigo_marca}" 
                                    style="color:#0d6efd;" title="Modificar">
                                <i class="fa-regular fa-pen-to-square"></i>
                            </button>
                            <button type="button" class="btn btn-action" 
                                    data-bs-toggle="modal" 
                                    data-bs-target="#modalEliminarAporteMarca" 
                                    data-id="${row.idparametrodato}" 
                                    data-nombremarca="${row.nombre_marca}" 
                                    data-marca="${row.codigo_marca}" 
                                    style="color:red;" title="Eliminar">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    `;
                }
            }
        ]
    });
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

// ==========================================
// RENDERIZADO CON DATATABLES: APORTES POR MARCA Y PROVEEDOR
// ==========================================
function crearListadoAportesMarcaProveedor(data) {
    const $tabla = $('#tabla-aportes-marca-proveedor');

    // Destruimos la tabla previa si existe
    if ($.fn.DataTable.isDataTable('#tabla-aportes-marca-proveedor')) {
        $tabla.DataTable().clear().destroy();
    }

    $tabla.DataTable({
        data: data || [],
        deferRender: true,
        pageLength: 10,
        lengthMenu: [10, 20, 50],
        autoWidth: false,
        language: {
            "url": "//cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json",
            "emptyTable": "No se encontraron registros."
        },
        columns: [
            {
                data: 'nombre_proveedor',
                className: 'align-middle text-wrap'
            },
            {
                data: 'nombre_marca',
                className: 'align-middle'
            },
            {
                data: 'numero_aporte',
                className: 'align-middle text-center'
            },
            {
                data: null,
                orderable: false,
                className: 'align-middle text-center',
                render: function (data, type, row) {
                    // Usamos "row" para extraer los datos de la fila y los inyectamos en los botones
                    return `
                        <div class="btn-group btn-group-sm">
                            <button type="button" class="btn btn-action" 
                                    data-bs-toggle="modal" 
                                    data-bs-target="#modalModificarAporteMarcaProveedor" 
                                    data-id="${row.idparametrodato}" 
                                    data-num="${row.numero_aporte}"
                                    data-marca="${row.codigo_marca}" 
                                    data-proveedor="${row.identificacion_proveedor}"
                                    style="color:#0d6efd;" title="Modificar">
                                <i class="fa-regular fa-pen-to-square"></i>
                            </button>
                            <button type="button" class="btn btn-action" 
                                    data-bs-toggle="modal" 
                                    data-bs-target="#modalEliminarAporteMarcaProveedor" 
                                    data-id="${row.idparametrodato}" 
                                    data-marca="${row.nombre_marca}" 
                                    data-prov="${row.nombre_proveedor}" 
                                    data-proveedor="${row.identificacion_proveedor}"
                                    style="color:red;" title="Eliminar">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    `;
                }
            }
        ]
    });
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
// Función para renderizar las filas de la tabla con DataTables
function crearListadoMediosPago(data) {
    const $tabla = $('#tabla-medios-pago');

    // Destruimos la tabla previa si existe
    if ($.fn.DataTable.isDataTable('#tabla-medios-pago')) {
        $tabla.DataTable().clear().destroy();
    }

    $tabla.DataTable({
        data: data || [],
        deferRender: true,
        pageLength: 10, // Mostrar 10 registros por página
        lengthMenu: [10, 20, 50],
        autoWidth: false,
        language: {
            "url": "//cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json",
            "emptyTable": "No se encontraron registros de medios de pago."
        },
        columns: [
            {
                data: 'nombre',
                className: 'align-middle text-wrap'
            },
            {
                data: null,
                orderable: false,
                className: 'align-middle text-center',
                render: function (data, type, row) {
                    // Inyectamos también data-nombre para que los modales lo lean directo de aquí
                    return `
                        <div class="btn-group btn-group-sm">
                            <button type="button" class="btn btn-action edit-btn" 
                                    data-bs-toggle="modal" 
                                    data-bs-target="#modalModificaMedioPago" 
                                    data-id="${row.idparametro}" 
                                    data-codigo="${row.codigoparametro}"
                                    data-nombre="${row.nombre}"
                                    style="color:#0d6efd;" title="Modificar">
                                <i class="fa-regular fa-pen-to-square"></i>
                            </button>
                            <button type="button" class="btn btn-action delete-btn" 
                                    data-bs-toggle="modal" 
                                    data-bs-target="#modalEliminaMedioPago" 
                                    data-id="${row.idparametro}" 
                                    data-codigo="${row.codigoparametro}"
                                    data-nombre="${row.nombre}"
                                    style="color:red;" title="Eliminar">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    `;
                }
            }
        ]
    });
}



//APORTE PROPIO POR ARTICULO
function guardarAPA() {
    const codArticulo = $('#inputNuevoArticuloAPA').data('codigo');
    const numAporte = $('#inputNuevoNumAporteAPA').val().trim();

    if (!codArticulo || numAporte === "") {
        return Swal.fire({ icon: 'warning', title: 'Atención', text: 'Seleccione un artículo e ingrese el número de aportes.' });
    }

    // ==========================================
    // VALIDACIÓN DE DUPLICADOS CON DATATABLES
    // ==========================================
    let yaExiste = false;

    // 1. Verificamos si la tabla usa DataTables
    if ($.fn.DataTable.isDataTable('#tabla-aporte-propio-articulo')) {
        const dataTabla = $('#tabla-aporte-propio-articulo').DataTable().rows().data().toArray();
        yaExiste = dataTabla.some(function (row) {
            // Comparamos el código del artículo que viene en el JSON
            return row.codigo_articulo.toString() === codArticulo.toString();
        });
    }
    // 2. Si usa la tabla clásica (respaldo)
    else {
        $('#tbody-aporte-propio-articulo tr').each(function () {
            const textoCelda = $(this).find('td:eq(0)').text().trim();
            let codEnTabla = textoCelda;
            if (textoCelda.includes('-')) {
                codEnTabla = textoCelda.substring(0, textoCelda.indexOf('-')).trim();
            }
            if (codEnTabla.toString() === codArticulo.toString()) {
                yaExiste = true;
                return false; // Funciona como un break
            }
        });
    }

    if (yaExiste) {
        return Swal.fire({
            icon: 'warning',
            title: 'Duplicado',
            text: `El artículo con código ${codArticulo} ya está configurado.`
        });
    }
    // ==========================================

    const $menu = $('#list-tab a.active');

    const body = {
        "tipo_mant": 6,
        "opcion": "I",
        "idparametro": $menu.data('idparametro'),
        "codigoparametro": $menu.data('codigoparametro'),
        "idusuario": getUsuario(),
        //"idparametrodato": 0,
        "codigorelacion1": codArticulo.toString(),
        "valor1": parseFloat(numAporte)
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
    const codArticulo = $('#inputCodModifAPA').val();

    if (num === "") return Swal.fire({ icon: 'warning', text: 'Ingrese el número de aportes.' });

    //json_body: { idparametrodato: parseInt(id), numero_aporte: num.toString() }

    const $menu = $('#list-tab a.active');

    const body = {
        "tipo_mant": 6,
        "opcion": "M",
        "idparametro": $menu.data('idparametro'),
        "codigoparametro": $menu.data('codigoparametro'),
        "idusuario": getUsuario(),
        "idparametrodato": parseInt(id),
        "codigorelacion1": codArticulo,
        "valor1": parseFloat(num)
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
    const codArticulo = $('#inputCodElimAPA').val();

    const $menu = $('#list-tab a.active');

    const body = {
        "tipo_mant": 6,
        "opcion": "E",
        "idparametro": $menu.data('idparametro'),
        "codigoparametro": $menu.data('codigoparametro'),
        "idusuario": getUsuario(),
        "idparametrodato": parseInt(id),
        "codigorelacion1": codArticulo,
        //"valor1": parseFloat(num)
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

    // ==========================================
    // VALIDACIÓN DE DUPLICADOS CON DATATABLES
    // ==========================================
    let yaExiste = false;

    // 1. Verificamos si la tabla usa DataTables
    if ($.fn.DataTable.isDataTable('#tabla-margen-minimo')) {
        const dataTabla = $('#tabla-margen-minimo').DataTable().rows().data().toArray();
        yaExiste = dataTabla.some(function (row) {
            // Comparamos el código del artículo que viene en el JSON
            return row.codigo_articulo.toString() === codArticulo.toString();
        });
    }
    // 2. Si usa la tabla clásica (respaldo)
    else {
        $('#list-margen-minimo-articulo tbody tr').each(function () {
            const textoCelda = $(this).find('td:eq(0)').text().trim();
            let codEnTabla = textoCelda;
            if (textoCelda.includes('-')) {
                codEnTabla = textoCelda.substring(0, textoCelda.indexOf('-')).trim();
            }
            if (codEnTabla.toString() === codArticulo.toString()) {
                yaExiste = true;
                return false; // Break para salir del .each()
            }
        });
    }

    if (yaExiste) {
        return Swal.fire({
            icon: 'warning',
            title: 'Artículo Duplicado',
            text: `El artículo ${codArticulo} ya tiene un margen configurado.`
        });
    }
    // ==========================================

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
    return;
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
    // Capturamos el código desde el atributo data que seteó el radio button en la tabla del modal
    const codArticulo = $('#inputNuevoArticuloPC').data('codigo');
    const competencia = $('#inputNuevoNombreCompPC').val().trim();
    const precio = $('#inputNuevoPrecioPC').val().trim();

    if (!codArticulo || !competencia || precio === "") {
        return Swal.fire({ icon: 'warning', title: 'Atención', text: 'Debe seleccionar un artículo de la tabla y llenar todos los campos.' });
    }

    // ==========================================
    // VALIDACIÓN DE DUPLICADOS CON DATATABLES
    // ==========================================
    let yaExiste = false;
    const competenciaBuscada = competencia.toLowerCase();

    // 1. Verificamos si la tabla usa DataTables
    if ($.fn.DataTable.isDataTable('#tabla-precio-competencia')) {
        const dataTabla = $('#tabla-precio-competencia').DataTable().rows().data().toArray();
        yaExiste = dataTabla.some(function (row) {
            // Comparamos el código del artículo y la competencia ignorando mayúsculas
            return row.codigo_articulo.toString() === codArticulo.toString() &&
                row.nombre_competencia.toLowerCase() === competenciaBuscada;
        });
    }
    // 2. Si usa la tabla clásica (respaldo)
    else {
        $('#tbody-precio-competencia tr').each(function () {
            const codFila = $(this).find('td:eq(0)').text().trim();
            const compFila = $(this).find('td:eq(1)').text().trim().toLowerCase();

            let codFilaLimpio = codFila;
            if (codFila.includes('-')) {
                // Tomamos desde el inicio hasta el primer guión y quitamos espacios
                codFilaLimpio = codFila.substring(0, codFila.indexOf('-')).trim();
            }

            // Comparamos el código limpio y la competencia
            if (codFilaLimpio === codArticulo && compFila === competenciaBuscada) {
                yaExiste = true;
                return false; // Break para salir del .each()
            }
        });
    }

    if (yaExiste) {
        return Swal.fire({
            icon: 'warning',
            title: 'Duplicado',
            text: `Ya existe un precio de "${competencia}" para el artículo ${codArticulo}.`
        });
    }
    // ==========================================

    // ==========================================
    // ENVÍO AL API
    // ==========================================
    const $menuActivo = $('#list-tab a.active');

    const body = {
        "tipo_mant": 7,
        "opcion": "I",
        "idparametro": $menuActivo.data('idparametro'),
        "codigoparametro": $menuActivo.data('codigoparametro'),
        "idusuario": getUsuario(),
        "codigorelacion1": codArticulo.toString(),
        "codigorelacion2": competencia,
        "valor1": parseFloat(precio)
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
            if (response && response.code_status === 200) {
                $('#modalNuevoPrecioComp').modal('hide');
                Swal.fire({ icon: 'success', title: 'Guardado', timer: 1500 });
                cargarPreciosCompetencia(); // Refresca la tabla
            } else {
                Swal.fire({ icon: "error", title: "Error", text: "No se pudo guardar." });
            }
        },
        error: function (xhr) { manejarErrorGlobal(xhr, "guardar precio de competencia"); }
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
        },
        error: function (xhr) {
            manejarErrorGlobal(xhr, "modificar precio competencia");
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
        },
        error: function (xhr) {
            manejarErrorGlobal(xhr, "eliminar precio competencia");
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

    // ==========================================
    // VALIDACIÓN DE DUPLICADOS CON DATATABLES
    // ==========================================
    let combinacionYaExiste = false;

    // 1. Verificamos si la tabla usa DataTables
    if ($.fn.DataTable.isDataTable('#tabla-aportes-marca')) {
        const dataTabla = $('#tabla-aportes-marca').DataTable().rows().data().toArray();
        combinacionYaExiste = dataTabla.some(function (row) {
            // Comparamos usando el campo exacto que viene del JSON
            return row.nombre_marca === nombreMarca;
        });
    }
    // 2. Si usa la tabla clásica (respaldo)
    else {
        $('#tbody-aportes-marca tr').each(function () {
            if ($(this).find('td:eq(0)').text().trim() === nombreMarca) {
                combinacionYaExiste = true;
                return false; // Break para salir del .each()
            }
        });
    }

    if (combinacionYaExiste) {
        return Swal.fire({
            icon: 'warning',
            title: 'Registro Duplicado',
            text: `Ya existe un límite configurado para la marca "${nombreMarca}".`
        });
    }
    // ==========================================

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
    // VALIDACIÓN DE DUPLICADOS CON DATATABLES
    // ==========================================
    let combinacionYaExiste = false;

    // Limpiamos el texto del proveedor seleccionado
    let nombreProveedorLimpio = textoProveedor;
    if (textoProveedor.includes('-')) {
        nombreProveedorLimpio = textoProveedor.substring(textoProveedor.indexOf('-') + 1).trim();
    }

    // 1. Verificamos si la tabla usa DataTables
    if ($.fn.DataTable.isDataTable('#tabla-aportes-marca-proveedor')) {
        const dataTabla = $('#tabla-aportes-marca-proveedor').DataTable().rows().data().toArray();
        combinacionYaExiste = dataTabla.some(function (row) {
            // Comparamos usando los campos exactos que vienen de tu JSON
            return row.nombre_proveedor === nombreProveedorLimpio && row.nombre_marca === nombreMarca;
        });
    }
    // 2. Si usa la tabla clásica (respaldo)
    else {
        $('#tbody-aportes-marca-proveedor tr').each(function () {
            const provEnFila = $(this).find('td:eq(0)').text().trim();
            const marcaEnFila = $(this).find('td:eq(1)').text().trim();

            if (provEnFila === nombreProveedorLimpio && marcaEnFila === nombreMarca) {
                combinacionYaExiste = true;
                return false;
            }
        });
    }

    if (combinacionYaExiste) {
        return Swal.fire({
            icon: 'warning',
            title: 'Registro Duplicado',
            text: `Ya existe un límite configurado para la marca "${nombreMarca}" y el proveedor "${nombreProveedorLimpio}".`
        });
    }
    // ==========================================

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


    // ==========================================
    // VALIDACIÓN DE DUPLICADOS (MEDIOS DE PAGO)
    // ==========================================
    let yaExiste = false;
    const nombreBuscado = nombreMedioPago.toLowerCase(); // Convertimos a minúscula para la comparación

    // 1. Verificamos si la tabla usa DataTables
    if ($.fn.DataTable.isDataTable('#tabla-medios-pago')) {
        const dataTabla = $('#tabla-medios-pago').DataTable().rows().data().toArray();
        yaExiste = dataTabla.some(function (row) {
            // Comparamos usando el campo 'nombre' que viene de tu JSON
            return row.nombre.toLowerCase() === nombreBuscado;
        });
    }
    // 2. Si usa la tabla clásica (busca en el HTML visible)
    else {
        $('#tbody-medios-pago tr').each(function () {
            const nombreEnFila = $(this).find('td:eq(0)').text().trim().toLowerCase();
            if (nombreEnFila === nombreBuscado) {
                yaExiste = true;
                return false; // Break para salir del .each()
            }
        });
    }

    if (yaExiste) {
        return Swal.fire({
            icon: 'warning',
            title: 'Duplicado',
            text: `Ya existe un medio de pago registrado con el nombre "${nombreMedioPago}".`
        });
    }
    // ==========================================

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
    console.log("guardarAlmacen");
    const codigoAlmacenSeleccionado = $('#selectNuevoAlmacen').val();

    // Obtenemos el texto (nombre) del option que está seleccionado
    const nombreAlmacenSeleccionado = $('#selectNuevoAlmacen option:selected').text().trim();
    console.log("nombreAlmacenSeleccionado ", nombreAlmacenSeleccionado);
    // Validar que no envíen el select vacío
    if (!codigoAlmacenSeleccionado) {
        Swal.fire({ icon: 'warning', title: 'Atención', text: 'Por favor, seleccione un almacén de la lista.' });
        return;
    }


    // ==========================================
    // VALIDACIÓN DE DUPLICADOS CON DATATABLES
    // ==========================================
    let almacenYaExiste = false;

    // Verificamos si la tabla de DataTables está inicializada
    if ($.fn.DataTable.isDataTable('#tabla-almacenes-asignados')) {
        // Extraemos TODA la data de la tabla (todas las páginas)
        const dataTabla = $('#tabla-almacenes-asignados').DataTable().rows().data().toArray();

        // Comparamos el nombre o el código (usar nombre_almacen según tu JSON)
        almacenYaExiste = dataTabla.some(function (row) {
            return row.nombre_almacen === nombreAlmacenSeleccionado;
        });
    }

    if (almacenYaExiste) {
        return Swal.fire({
            icon: 'warning',
            title: 'Duplicado',
            text: `El almacén "${nombreAlmacenSeleccionado}" ya está asignado a este grupo.`
        });
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


    // ==========================================
    // VALIDACIÓN DE GRUPOS DUPLICADOS
    // ==========================================
    let yaExiste = false;
    const nombreBuscado = nombreGrupo.toLowerCase(); // Convertimos a minúscula para una comparación exacta

    // 1. Verificamos si la tabla usa DataTables (busca en toda la memoria, en todas las páginas)
    if ($.fn.DataTable.isDataTable('#tabla-grupo-almacen')) {
        const dataTabla = $('#tabla-grupo-almacen').DataTable().rows().data().toArray();
        yaExiste = dataTabla.some(function (row) {
            return row.nombre.toLowerCase() === nombreBuscado;
        });
    }
    // 2. Si usa la tabla clásica (busca en el HTML visible)
    else {
        $('#tbody-grupo-almacen tr').each(function () {
            const nombreEnFila = $(this).find('td:eq(0)').text().trim().toLowerCase();
            if (nombreEnFila === nombreBuscado) {
                yaExiste = true;
                return false; // Funciona como un "break" para detener el ciclo each
            }
        });
    }

    if (yaExiste) {
        Swal.fire({
            icon: 'warning',
            title: 'Grupo Duplicado',
            text: `Ya existe un grupo registrado con el nombre "${nombreGrupo}".`
        });
        return; // Detenemos la función para que no llegue al $.ajax
    }
    // ==========================================

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
    //console.log("body: ", body);

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

    /*
    // ==========================================
    // VALIDACIÓN DE GRUPOS DUPLICADOS
    // ==========================================
    let yaExiste = false;
    const nombreBuscado = nombreGrupo.toLowerCase(); // Convertimos a minúscula para una comparación exacta

    // 1. Verificamos si la tabla usa DataTables (busca en toda la memoria, en todas las páginas)
    if ($.fn.DataTable.isDataTable('#tabla-grupo-almacen')) {
        const dataTabla = $('#tabla-grupo-almacen').DataTable().rows().data().toArray();
        yaExiste = dataTabla.some(function (row) {
            return row.nombre.toLowerCase() === nombreBuscado;
        });
    }
    // 2. Si usa la tabla clásica (busca en el HTML visible)
    else {
        $('#tbody-grupo-almacen tr').each(function () {
            const nombreEnFila = $(this).find('td:eq(0)').text().trim().toLowerCase();
            if (nombreEnFila === nombreBuscado) {
                yaExiste = true;
                return false; // Funciona como un "break" para detener el ciclo each
            }
        });
    }

    if (yaExiste) {
        Swal.fire({
            icon: 'warning',
            title: 'Grupo Duplicado',
            text: `Ya existe un grupo registrado con el nombre "${nombreGrupo}".`
        });
        return; // Detenemos la función para que no llegue al $.ajax
    }
    // ==========================================
    */
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



        "Margen Mínimo": { id: "list-margen-minimo", icon: "fa-solid fa-tag" },
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

// ==========================================
// RENDERIZADO CON DATATABLES: GRUPO ALMACEN
// ==========================================
function crearListadoGrupoAlmacen(data) {
    const $tabla = $('#tabla-grupo-almacen');

    // Destruimos la tabla previa si existe
    if ($.fn.DataTable.isDataTable('#tabla-grupo-almacen')) {
        $tabla.DataTable().clear().destroy();
    }

    $tabla.DataTable({
        data: data || [],
        deferRender: true,
        pageLength: 5,
        lengthMenu: [5, 10, 20],
        autoWidth: false,
        language: { "url": "//cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json" },
        createdRow: function (row, dataItem, dataIndex) {
            // Inyectamos las clases y datos necesarios para que funcione tu evento "click"
            $(row).addClass('fila-grupo-almacen');
            $(row).attr('data-codigo', dataItem.codigoparametro);
            $(row).attr('data-nombre', dataItem.nombre);
            $(row).attr('data-idparametro', dataItem.idparametro);
            $(row).css('cursor', 'pointer');

            // Mantenemos el grupo sombreado si está seleccionado
            if (grupoSeleccionadoActual.codigo === dataItem.codigoparametro) {
                $(row).addClass('table-active');
            }
        },
        columns: [
            {
                data: 'nombre',
                className: 'align-middle text-wrap'
            },
            {
                data: null,
                orderable: false,
                className: 'align-middle text-center',
                render: function (data, type, row) {
                    // Usamos "row" para obtener los datos de la fila de forma segura
                    return `
                        <div class="btn-group btn-group-sm">
                            <button type="button" class="btn btn-action edit-btn" 
                                    data-bs-toggle="modal" 
                                    data-bs-target="#modalModificarGrupo" 
                                    data-id="${row.idparametro}"
                                    data-codigo="${row.codigoparametro}"
                                    style="color:#0d6efd;" title="Modificar">
                                <i class="fa-regular fa-pen-to-square"></i>
                            </button>
                            <button type="button" class="btn btn-action delete-btn" 
                                    data-bs-toggle="modal" 
                                    data-bs-target="#modalEliminarGrupo" 
                                    data-id="${row.idparametro}" 
                                    data-codigo="${row.codigoparametro}" 
                                    style="color:red;" title="Eliminar">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    `;
                }
            }
        ]
    });
}

// ==========================================
// RENDERIZADO CON DATATABLES: ALMACENES ASIGNADOS
// ==========================================

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


function crearListadoAlmacenGrupo(data) {
    const $tabla = $('#tabla-almacenes-asignados');

    if ($.fn.DataTable.isDataTable('#tabla-almacenes-asignados')) {
        $tabla.DataTable().clear().destroy();
    }

    $tabla.DataTable({
        data: data || [],
        deferRender: true,
        pageLength: 5,
        lengthMenu: [5, 10, 20],
        autoWidth: false,
        // Usamos un solo bloque language con la traducción y el mensaje de tabla vacía
        language: {
            "url": "//cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json",
            "emptyTable": "No hay almacenes asignados a este grupo."
        },
        columns: [
            {
                data: 'nombre_almacen',
                className: 'align-middle text-wrap'
            },
            {
                data: null,
                orderable: false,
                className: 'align-middle text-center',
                render: function (data, type, row) {
                    // Usamos "row" explícitamente aquí también
                    return `
                        <button type="button" class="btn btn-action delete-btn btn-sm" 
                                data-bs-toggle="modal" 
                                data-bs-target="#modalEliminarAlmacen" 
                                data-id="${row.idparametrodato}"
                                data-codigo="${row.codigo_almacen}"
                                style="border:none; background:none; color:red">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    `;
                }
            }
        ]
    });
}
