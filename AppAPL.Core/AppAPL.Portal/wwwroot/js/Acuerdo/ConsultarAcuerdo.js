// ~/js/Acuerdo/ConsultarAcuerdo.js

// ===============================================================
// Variables globales
// ===============================================================
let tabla;
let ultimaFilaModificada = null;

// ===============================================================
// FUNCIÓN HELPER PARA OBTENER USUARIO
// ===============================================================
function obtenerUsuarioActual() {
    return window.usuarioActual || sessionStorage.getItem('usuarioActual') || "admin";
}

// ===============================================================
// DOCUMENT READY
// ===============================================================
$(document).ready(function () {
    console.log("=== INICIO - ModificarAcuerdo ===");

    $.get("/config", function (config) {
        window.apiBaseUrl = config.apiBaseUrl;
        cargarBandeja();
    });

    // Eventos de Navegación
    $('#btnVolverTabla, #btnVolverAbajo').on('click', function () {
        cerrarDetalle();
    });

    // Botón Limpiar Filtros
    $('body').on('click', '#btnLimpiar', function () {
        if (tabla) {
            tabla.search('').draw();
        }
    });

});

// ===================================================================
// ===== FUNCIONES DE CARGA =====
// ===================================================================

function cargarBandeja() {
    const idOpcionActual = (window.obtenerIdOpcionActual && window.obtenerIdOpcionActual()) || "0";
    const usuario = obtenerUsuarioActual();

    $.ajax({
        url: `${window.apiBaseUrl}/api/Acuerdo/consultar-bandeja-general`,
        method: "GET",
        headers: {
            "idopcion": String(idOpcionActual),
            "usuario": usuario
        },
        success: function (data) {
            crearListado(data);
        },
        error: function () {
            Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo cargar la bandeja' });
        }
    });
}

function crearListado(data) {
    if (tabla) tabla.destroy();
    let html = `
        <table id='tabla-principal' class='table table-bordered table-striped table-hover'>
            <thead>
                <tr>
                    <th colspan='12' style='background-color: #CC0000 !important; color: white; text-align: center; font-weight: bold; padding: 8px; font-size: 1rem;'>
                        BANDEJA DE CONSULTA DE ACUERDOS
                    </th>
                </tr>
                <tr>
                    <th>Acción</th>
                    <th>IdAcuerdo</th>
                    <th>Descripción</th>
                    <th>Fondo</th>
                    <th>Clase</th>
                    <th>Valor</th>
                    <th>Inicio</th>
                    <th>Fin</th>
                    <th>Disponible</th>
                    <th>Comprometido</th>
                    <th>Liquidado</th>
                    <th>Estado</th>
                </tr>
            </thead>
            <tbody>`;

    data.forEach(acuerdo => {
        let fondoCompleto = [acuerdo.idfondo, acuerdo.nombre_tipo_fondo, acuerdo.nombre_proveedor].filter(Boolean).join(" - ");
        let claseHTML = (acuerdo.clase_acuerdo ?? "") + (acuerdo.cantidad_articulos > 0 ? `<sup class="fw-bold"> ${acuerdo.cantidad_articulos}</sup>` : "");

        html += `<tr>
            <td class='text-center'>
                <button type="button" class="btn-action edit-btn" onclick="abrirModalEditar(${acuerdo.idacuerdo})">
                    <i class="fa-regular fa-pen-to-square"></i>
                </button>
            </td>
            <td>${acuerdo.idacuerdo ?? ""}</td>
            <td>${acuerdo.descripcion ?? ""}</td>
            <td>${fondoCompleto}</td>
            <td>${claseHTML}</td>
            <td class='text-end'>${formatearMoneda(acuerdo.valor_acuerdo)}</td>
            <td class='text-center'>${formatearFecha(acuerdo.fecha_inicio)}</td>
            <td class='text-center'>${formatearFecha(acuerdo.fecha_fin)}</td>
            <td class='text-end'>${formatearMoneda(acuerdo.valor_disponible)}</td>
            <td class='text-end'>${formatearMoneda(acuerdo.valor_comprometido)}</td>
            <td class='text-end'>${formatearMoneda(acuerdo.valor_liquidado)}</td>
            <td>${acuerdo.estado ?? ""}</td>
        </tr>`;
    });

    html += "</tbody></table>";
    $('#tabla').html(html);

    // Inicializa DataTable
    tabla = $('#tabla-principal').DataTable({
        pageLength: 10,
        lengthMenu: [5, 10, 25, 50],
        pagingType: 'full_numbers',
        columnDefs: [
            { targets: 0, width: "8%", className: "dt-center", orderable: false },
            { targets: 1, width: "6%", className: "dt-center" },
            { targets: [6, 9, 10, 11], className: "dt-right" },
            { targets: [7, 8], className: "dt-center" },
        ],
        order: [[1, 'desc']],
        language: {
            emptyTable: "Sin datos",
            decimal: "",
            emptyTable: "No hay datos disponibles en la tabla",
            info: "Mostrando _START_ a _END_ de _TOTAL_ registros",
            infoEmpty: "Mostrando 0 a 0 de 0 registros",
            infoFiltered: "(filtrado de _MAX_ registros totales)",
            infoPostFix: "",
            thousands: ",",
            lengthMenu: "Mostrar _MENU_ registros",
            loadingRecords: "Cargando...",
            processing: "Procesando...",
            search: "Buscar:",
            zeroRecords: "No se encontraron registros coincidentes",
            paginate: {
                first: "Primero",
                last: "Último",
                next: "Siguiente",
                previous: "Anterior"
            }
        },
        drawCallback: function () {
            if (ultimaFilaModificada !== null) {
                if (typeof marcarFilaPorId === 'function') {
                    marcarFilaPorId('#tabla-principal', ultimaFilaModificada);
                }
            }
        }
    });
}

// ===================================================================
// ===== LÓGICA DE DETALLE (EL NÚCLEO QUE BUSCABAS) =====
// ===================================================================

function abrirModalEditar(idAcuerdo) {
    $('body').css('cursor', 'wait');
    const usuario = obtenerUsuarioActual();

    // Limpiar campos
    $("#formVisualizar")[0].reset();
    $("#lblIdAcuerdo").text(idAcuerdo);
    $('#contenedor-tabla-articulos').hide().html('');

    $.ajax({
        url: `${window.apiBaseUrl}/api/Acuerdo/bandeja-modificacion-id/${idAcuerdo}`,
        method: "GET",
        headers: { "usuario": usuario },
        success: function (data) {
            const cab = data.cabecera;

            // Mapeo de Cabecera (Campos de AprobarAcuerdo.cshtml)
            $("#verNombreProveedor").val(cab.nombre_proveedor);
            $("#verNombreTipoFondo").val(cab.motivo);
            $("#verClaseAcuerdo").val(cab.clase_acuerdo);
            $("#verEstado").val(cab.estado);
            $("#verDescripcion").val(cab.descripcion);
            $("#verFechaInicio").val(formatearFecha(cab.fecha_inicio));
            $("#verFechaFin").val(formatearFecha(cab.fecha_fin));
            $("#verValorAcuerdo").val(formatearMoneda(cab.valor_total));
            $("#verValorDisponible").val(formatearMoneda(cab.valor_disponible));
            $("#verValorComprometido").val(formatearMoneda(cab.valor_comprometido));
            $("#verValorLiquidado").val(formatearMoneda(cab.valor_liquidado));

            // Renderizado de Artículos
            if (data.articulos && data.articulos.length > 0) {
                renderizarTablaArticulos(data.articulos);
            }

            $("#vistaTabla").fadeOut(200, function () {
                $("#vistaDetalle").fadeIn(200);
            });
            $('body').css('cursor', 'default');
        },
        error: function () {
            $('body').css('cursor', 'default');
            Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo obtener el detalle' });
        }
    });
}

function renderizarTablaArticulos(articulos) {
    let htmlArticulos = `
        <h6 class="fw-bold mb-2"><i class="fa fa-list"></i> Detalle de Artículos</h6>
        <div class="table-responsive" style="max-height: 300px; overflow-y: auto;">
            <table class="table table-bordered table-sm mb-0">
                <thead class="sticky-top text-nowrap">
                    <tr class="text-center tabla-items-header">                                     
                        <th scope="col" class="custom-header-cons-bg">Item</th>
                        <th scope="col" class="custom-header-cons-bg">Costo</th>
                        <th scope="col" class="custom-header-ingr-bg">Unidades Limite</th>
                        <th scope="col" class="custom-header-ingr-bg">Precio - Contado</th>
                        <th scope="col" class="custom-header-ingr-bg">Precio - TC</th>
                        <th scope="col" class="custom-header-ingr-bg">Precio - Crédito</th>
                        <th scope="col" class="custom-header-ingr-bg">Aporte x Unidad</th>
                        <th scope="col" class="custom-header-calc-bg">Comprometido Prov.</th>
                        <th scope="col" class="custom-header-calc-bg">Margen Contado</th>
                        <th scope="col" class="custom-header-calc-bg">Margen TC</th>
                        <th scope="col" class="custom-header-calc-bg">Margen Crédito</th>
                    </tr>
                </thead>
                <tbody class="text-nowrap tabla-items-body bg-white">`;

    articulos.forEach(art => {
        // Cálculo del margen de crédito (Costo - Precio Crédito) si no viene en el JSON
        let margenCredito = (art.precio_credito || 0) - (art.costo || 0);

        htmlArticulos += `
            <tr>
                <td class="fw-bold text-center">${art.articulo || ''}</td>
                <td class="text-end">${formatearMoneda(art.costo)}</td>
                <td class="text-center fw-bold text-primary">${art.unidades_limite}</td>
                <td class="text-end">${formatearMoneda(art.precio_contado)}</td>
                <td class="text-end">${formatearMoneda(art.precio_tc)}</td>
                <td class="text-end">${formatearMoneda(art.precio_credito)}</td>
                <td class="text-end fw-bold">${formatearMoneda(art.aporte_unidad_proveedor)}</td>
                <td class="text-end fw-bold">${formatearMoneda(art.comprometido_proveedor)}</td>
                <td class="text-end">${formatearMoneda(art.margen_contado)}</td>
                <td class="text-end">${formatearMoneda(art.margen_tc)}</td>
                <td class="text-end">${formatearMoneda(margenCredito)}</td>
            </tr>`;
    });

    htmlArticulos += `
                </tbody>
            </table>
        </div>`;

    $('#contenedor-tabla-articulos').html(htmlArticulos).fadeIn();
}

function cerrarDetalle() {
    $("#vistaDetalle").fadeOut(200, function () { $("#vistaTabla").fadeIn(200); });
}

// Utilidades
function formatearMoneda(v) {
    return (v || 0).toLocaleString('es-EC', { style: 'currency', currency: 'USD' });
}
function formatearFecha(f) {
    if (!f) return "";
    let d = new Date(f);
    return d.toLocaleDateString('es-EC');
}