// ~/js/Promocion/AprobarPromocion.js

// ===============================================================
// Variables globales
// ===============================================================
let tabla;
let ultimaFilaModificada = null;
let datosAprobacionActual = null;
let tablaHistorial;

// ===============================================================
// FUNCIONES HELPER
// ===============================================================
function obtenerUsuarioActual() {
    return window.usuarioActual
        || sessionStorage.getItem('usuarioActual')
        || sessionStorage.getItem('usuario')
        || localStorage.getItem('usuarioActual')
        || localStorage.getItem('usuario')
        || "admin";
}

function obtenerIdOpcionSeguro() {
    try {
        return (
            (window.obtenerIdOpcionActual && window.obtenerIdOpcionActual()) ||
            (window.obtenerInfoOpcionActual && window.obtenerInfoOpcionActual().idOpcion) ||
            "0"
        );
    } catch (e) {
        console.error("Error obteniendo idOpcion:", e);
        return "0";
    }
}

function manejarErrorGlobal(xhr, accion) {
    console.error(`Error al ${accion}:`, xhr.responseText);
    Swal.fire({
        icon: 'error',
        title: 'Error de Comunicación',
        text: `No se pudo completar la acción: ${accion}.`
    });
}

function formatearMoneda(valor) {
    var numero = parseFloat(valor);
    if (isNaN(numero) || valor === null || valor === undefined) return "$ 0.00";
    return '$ ' + numero.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatearFecha(fechaString) {
    if (!fechaString) return '';
    try {
        var fecha = new Date(fechaString);
        if (isNaN(fecha)) return fechaString;
        var dia = String(fecha.getDate()).padStart(2, '0');
        var mes = String(fecha.getMonth() + 1).padStart(2, '0');
        var anio = fecha.getFullYear();
        return `${dia}/${mes}/${anio}`;
    } catch (e) {
        return fechaString;
    }
}

function formatearFechaHora(f) {
    if (!f) return "";
    const d = new Date(f);
    if (isNaN(d)) return f;
    return d.toLocaleDateString("es-EC") + " " + d.toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" });
}

function obtenerNombreArchivo(rutaCompleta) {
    if (!rutaCompleta) return "";
    var nombreArchivo = rutaCompleta.replace(/^.*[\\/]/, '');
    var sinGuid = nombreArchivo.replace(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}_/i, '');
    return sinGuid || nombreArchivo;
}

function obtenerNombreArchivoConGuid(rutaCompleta) {
    if (!rutaCompleta) return "";
    return rutaCompleta.replace(/^.*[\\/]/, '');
}

function obtenerTextoSegmento(segmentos, etiqueta) {
    if (!segmentos || !Array.isArray(segmentos)) return "";
    const items = segmentos.filter(s => s.etiqueta_tipo_segmento === etiqueta);
    if (items.length === 0) return "";
    if (items.length === 1) {
        const item = items[0];
        return item.codigo_detalle ? `${item.codigo_detalle} - ${item.nombre_detalle || ""}` : (item.nombre_detalle || "");
    }
    return "Varios";
}

// ===============================================================
// DOCUMENT READY
// ===============================================================
$(document).ready(function () {

    console.log("=== INICIO DE CARGA DE PÁGINA - AprobarPromocion (Estructura Post-REST) ===");

    $.get("/config", function (config) {
        window.apiBaseUrl = config.apiBaseUrl;
        cargarBandeja();
    });

    $('body').on('click', '#btnLimpiar', function () {
        if (tabla) {
            tabla.search('').draw();
            tabla.page(0).draw('page');
            ultimaFilaModificada = null;
            if (typeof limpiarSeleccion === 'function') limpiarSeleccion('#tabla-principal');
        }
    });

    $('#btnVolverTabla, #btnVolverAbajo').on('click', function () {
        cerrarDetalle();
    });

    $('#btnAprobarPromocion').on('click', function () {
        let comentario = $("#modal-promocion-comentario").val();
        procesarAprobacionPromocion("APROBAR", comentario);
    });

    $('#btnRechazarPromocion').on('click', function () {
        let comentario = $("#modal-promocion-comentario").val();
        procesarAprobacionPromocion("RECHAZAR", comentario);
    });

    // Eventos Visor PDF
    $("#btnVerSoporte").on("click", function () {
        const soporte = $(this).data("soporte");
        if (!soporte) {
            Swal.fire({ icon: "info", title: "Sin soporte", text: "Esta promoción no tiene un archivo de soporte adjunto." });
            return;
        }

        const nombreArchivoConGuid = obtenerNombreArchivoConGuid(soporte);
        if (!nombreArchivoConGuid) {
            Swal.fire({ icon: "info", title: "Sin soporte", text: "No se pudo determinar el nombre del archivo." });
            return;
        }
        abrirVisorPDF(nombreArchivoConGuid);
    });

    $("#btnCerrarVisorPdf, #btnCerrarVisorPdfFooter").on("click", function () {
        cerrarVisorPDF();
    });

    $("#btnDescargarPdf").on("click", function () {
        const url = $(this).data("blob-url");
        const nombre = $(this).data("nombre-archivo");
        if (url) {
            const a = document.createElement("a");
            a.href = url;
            a.download = nombre || "soporte.pdf";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
    });

});

// ===================================================================
// VISOR DE PDF EMBEBIDO
// ===================================================================
function abrirVisorPDF(nombreArchivo) {
    $("#pdfSpinner").show();
    $("#pdfVisorContenido").hide();
    $("#pdfVisorError").hide();
    $("#btnDescargarPdf").hide();

    const nombreLegible = obtenerNombreArchivo(nombreArchivo);
    $("#modalVisorPdfLabel .pdf-nombre-archivo").text(nombreLegible || "Soporte");

    const modal = new bootstrap.Modal(document.getElementById("modalVisorPdf"));
    modal.show();

    fetchPDFDirecto(nombreArchivo);
}

function fetchPDFDirecto(nombreArchivo) {
    let baseUrl = (window.apiBaseUrl || "http://localhost:5074").replace("/api/router-proxy/execute", "");
    const url = `${baseUrl}/api/Descargas/descargar/${encodeURIComponent(nombreArchivo)}`;

    fetch(url)
        .then(function (response) {
            if (!response.ok) {
                return response.text().then(function (txt) { throw new Error(txt || `Error HTTP ${response.status}`); });
            }
            return response.blob();
        })
        .then(function (blob) {
            const pdfBlob = new Blob([blob], { type: "application/pdf" });
            const blobUrl = URL.createObjectURL(pdfBlob);

            $("#pdfIframe").attr("src", blobUrl);
            $("#pdfSpinner").hide();
            $("#pdfVisorContenido").show();

            const nombreLegible = obtenerNombreArchivo(nombreArchivo);
            $("#btnDescargarPdf")
                .data("blob-url", blobUrl)
                .data("nombre-archivo", nombreLegible || "soporte.pdf")
                .show();
        })
        .catch(function (error) {
            $("#pdfSpinner").hide();
            $("#pdfVisorError").html(`<i class="fa-solid fa-triangle-exclamation me-2"></i> ${error.message}`).show();
        });
}

function cerrarVisorPDF() {
    const iframe = document.getElementById("pdfIframe");
    const blobUrl = $("#btnDescargarPdf").data("blob-url");

    if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
        $("#btnDescargarPdf").removeData("blob-url");
    }

    if (iframe) iframe.src = "about:blank";

    const modal = bootstrap.Modal.getInstance(document.getElementById("modalVisorPdf"));
    if (modal) modal.hide();
}

// ===================================================================
// FUNCIONES GLOBALES - BANDEJA
// ===================================================================

function cargarBandeja() {
    const usuario = obtenerUsuarioActual();
    if (!usuario) return;

    const payload = {
        code_app: "APP20260128155212346",
        http_method: "GET",
        endpoint_path: "api/Promocion/consultar-bandeja-aprobacion",
        client: "APL",
        endpoint_query_params: `/${usuario}`
    };

    $.ajax({
        url: "/api/apigee-router-proxy",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(payload),
        success: function (response) {
            if (response && response.code_status === 200) {
                crearListado(response.json_response || []);
            } else {
                Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudieron cargar las promociones para aprobación' });
            }
        },
        error: (xhr) => manejarErrorGlobal(xhr, "cargar la bandeja de aprobación de promociones")
    });
}

function crearListado(data) {
    if (tabla) tabla.destroy();

    if (!data || data.length === 0) {
        $('#tabla').html("<div class='alert alert-info text-center'>No hay promociones para aprobar.</div>");
        return;
    }

    var html = `
    <table id='tabla-principal' class='table table-bordered table-striped table-hover'>
      <thead>
        <tr>
          <th colspan='13' style='background-color: #CC0000 !important; color: white; text-align: center; font-weight: bold; padding: 8px; font-size: 1rem;'>
              BANDEJA DE APROBACIÓN DE PROMOCIONES
          </th>
        </tr>
        <tr>
          <th>Acción</th>
          <th>Solicitud</th>
          <th>Id Promoción</th>
          <th>Descripción</th>
          <th>Motivo</th>
          <th>Clase de Promoción</th>
          <th>Fecha Solicitud</th>
          <th>Usuario Solicita</th>
          <th>Fecha Inicio</th>
          <th>Fecha Fin</th>
          <th>Regalo</th>
          <th>Soporte</th>
          <th>Estado</th>
        </tr>
      </thead>
      <tbody>`;

    for (var i = 0; i < data.length; i++) {
        var promo = data[i];

        var viewButton = '<button type="button" class="btn-action view-btn" title="Visualizar/Aprobar" onclick="abrirModalEditar(' + promo.idpromocion + ', ' + promo.idaprobacion + ')">' +
            '<i class="fa-regular fa-eye"></i></button>';

        var clasePromocionHTML = (promo.nombre_clase_promocion ?? "");
        if (promo.cantidad_articulos > 0) {
            clasePromocionHTML += '<sup style="font-size: 0.8em; margin-left: 2px; font-weight: bold;">' + promo.cantidad_articulos + '</sup>';
        }

        html += "<tr>";
        html += "  <td class='text-center'>" + viewButton + "</td>";
        html += "  <td class='text-center'>" + (promo.solicitud ?? "") + "</td>";
        html += "  <td class='text-center'>" + (promo.idpromocion ?? "") + "</td>";
        html += "  <td>" + (promo.descripcion ?? "") + "</td>";
        html += "  <td>" + (promo.motivo ?? "") + "</td>";
        html += "  <td>" + clasePromocionHTML + "</td>";
        html += "  <td class='text-center'>" + formatearFecha(promo.fechasolicitud) + "</td>";
        html += "  <td class='text-center'>" + (promo.nombreusersolicitud ?? "") + "</td>";
        html += "  <td class='text-center'>" + formatearFecha(promo.fechahorainicio) + "</td>";
        html += "  <td class='text-center'>" + formatearFecha(promo.fechahorafin) + "</td>";
        html += "  <td class='text-center'>" + (promo.marcaregalo && promo.marcaregalo !== "N" ? "✓" : "") + "</td>";
        html += "  <td>" + obtenerNombreArchivo(promo.archivosoporte) + "</td>";
        html += "  <td class='text-center'>" + (promo.nombre_estado ?? "") + "</td>";
        html += "</tr>";
    }

    html += "  </tbody></table>";
    $('#tabla').html(html);

    tabla = $('#tabla-principal').DataTable({
        pageLength: 10,
        lengthMenu: [5, 10, 25, 50],
        pagingType: 'full_numbers',
        columnDefs: [
            { targets: 0, width: "5%", className: "dt-center", orderable: false },
            { targets: 1, width: "8%", className: "dt-center" },
            { targets: 2, width: "8%", className: "dt-center" },
            { targets: [6, 8, 9], className: "dt-center" },
        ],
        order: [[2, 'desc']],
        language: {
            decimal: "", emptyTable: "No hay datos disponibles en la tabla", info: "Mostrando _START_ a _END_ de _TOTAL_ registros", infoEmpty: "Mostrando 0 a 0 de 0 registros", infoFiltered: "(filtrado de _MAX_ registros totales)", lengthMenu: "Mostrar _MENU_ registros", loadingRecords: "Cargando...", processing: "Procesando...", search: "Buscar:", zeroRecords: "No se encontraron registros coincidentes", paginate: { first: "Primero", last: "Último", next: "Siguiente", previous: "Anterior" }
        }
    });
}

// ===================================================================
// LOGICA DE DETALLE (VISUALIZAR Y APROBAR)
// ===================================================================

function abrirModalEditar(idPromocion, idAprobacion) {
    if (!idAprobacion || isNaN(idAprobacion) || parseInt(idAprobacion) <= 0) {
        Swal.fire({ icon: 'warning', title: 'Sin Aprobación Pendiente', text: `La promoción #${idPromocion} no tiene un proceso de aprobación activo.` });
        return;
    }

    $('body').css('cursor', 'wait');
    datosAprobacionActual = null;

    // Limpiar campos UI
    $("#formVisualizar")[0].reset();
    $("#lblIdPromocion").text(idPromocion);
    $("#btnVerSoporte").data("soporte", "").removeData("soporte").attr("title", "Ver Soporte").removeClass("text-danger");

    $('#tabla-aprobaciones-promocion').html('');
    $('#contenedor-tabla-articulos').html('').hide();
    $('#contenedor-tabla-combos').html('').hide();

    const payload = {
        code_app: "APP20260128155212346",
        http_method: "GET",
        endpoint_path: "api/Promocion/bandeja-aprobacion-id",
        client: "APL",
        endpoint_query_params: `/${idPromocion}/${idAprobacion}`
    };

    $.ajax({
        url: "/api/apigee-router-proxy",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(payload),
        success: function (response) {
            if (response && response.code_status === 200) {
                const data = response.json_response || {};
                const cab = data.cabecera || {};
                const segmentos = data.segmentos || [];
                const acuerdos = data.acuerdos || [];

                datosAprobacionActual = {
                    entidad: cab.id_entidad || 0,
                    identidad: cab.idpromocion || 0,
                    idtipoproceso: cab.id_tipo_proceso || 0,
                    idetiquetatipoproceso: cab.tipo_proceso_etiqueta || "",
                    idaprobacion: idAprobacion,
                    entidad_etiqueta: cab.entidad_etiqueta,
                    idetiquetatestado: cab.etiqueta_estado_promocion || "",
                    comentario: ""
                };

                // Llenar Grilla Visual (sin solicitud, ni usuario solicita, ni fecha solicitud)
                const idStr = cab.idpromocion ?? "";
                const claseStr = cab.nombre_clase_promocion ?? "";
                $("#verPromocionHeader").val(`${idStr} - ${claseStr}`);

                // Soporte PDF
                const rutaSoporte = cab.archivosoporte ?? "";
                $("#btnVerSoporte").data("soporte", rutaSoporte)
                    .toggleClass("text-danger", !!rutaSoporte)
                    .attr("title", rutaSoporte ? `Ver Soporte: ${obtenerNombreArchivo(rutaSoporte)}` : "Sin soporte");

                // Datos Generales
                $("#verDescripcion").val(cab.descripcion ?? "");
                $("#verMotivo").val(cab.nombre_motivo ?? "");
                $("#verFechaInicio").val(formatearFechaHora(cab.fecha_inicio));
                $("#verFechaFin").val(formatearFechaHora(cab.fecha_fin));
                $("#verEstado").val(cab.nombre_estado_promocion ?? "");

                const esRegalo = (cab.marcaregalo ?? "").toString().trim().toUpperCase() === "S";
                $("#verRegalo").prop("checked", esRegalo);

                // Segmentos
                $("#verMarca").val(obtenerTextoSegmento(segmentos, "SEGMARCA") || "Todos");
                $("#verDivision").val(obtenerTextoSegmento(segmentos, "SEGDIVISION") || "Todos");
                $("#verDepartamento").val(obtenerTextoSegmento(segmentos, "SEGDEPARTAMENTO") || "Todos");
                $("#verClase").val(obtenerTextoSegmento(segmentos, "SEGCLASE") || "Todos");
                $("#verArticulo").val(obtenerTextoSegmento(segmentos, "SEGARTICULO") || "");
                $("#verCanal").val(obtenerTextoSegmento(segmentos, "SEGCANAL") || "Todos");
                $("#verGrupoAlmacen").val(obtenerTextoSegmento(segmentos, "SEGGRUPOALMACEN") || "Todos");
                $("#verAlmacen").val(obtenerTextoSegmento(segmentos, "SEGALMACEN") || "Todos");
                $("#verTipoCliente").val(obtenerTextoSegmento(segmentos, "SEGTIPOCLIENTE") || "Todos");
                $("#verMedioPago").val(obtenerTextoSegmento(segmentos, "SEGMEDIOPAGO") || "Todos");

                // Resumen Acuerdos
                poblarResumenAcuerdos(acuerdos);

                // Artículos y Combos
                if (data.articulos && data.articulos.length > 0) renderizarTablaArticulos(data.articulos);
                if (data.combos && data.combos.length > 0) renderizarTablaCombos(data.combos);

                $("#vistaTabla").fadeOut(200, function () { $("#vistaDetalle").fadeIn(200); });
                $('body').css('cursor', 'default');

                // Historial
                if (cab.entidad_etiqueta && cab.tipo_proceso_etiqueta) {
                    cargarAprobacionesPromocion(cab.entidad_etiqueta, idPromocion, cab.tipo_proceso_etiqueta);
                } else {
                    $('#tabla-aprobaciones-promocion').html('<p class="alert alert-warning">No se encontraron los parámetros necesarios para cargar aprobaciones.</p>');
                }

            } else {
                $('body').css('cursor', 'default');
                Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudieron cargar los datos de la promoción.' });
            }
        },
        error: function (xhr) {
            $('body').css('cursor', 'default');
            manejarErrorGlobal(xhr, "cargar los datos de la promoción");
        }
    });
}

function poblarResumenAcuerdos(acuerdos) {
    if (!acuerdos || acuerdos.length === 0) {
        $("#verDsctoProv, #verIdAcuerdoProv, #verComprometidoProv, #verDsctoProp, #verIdAcuerdoProp, #verComprometidoProp, #verDsctoTotal").val("");
        return;
    }

    const acProv = acuerdos.length > 0 ? acuerdos[0] : null;
    const acProp = acuerdos.length > 1 ? acuerdos[1] : null;

    if (acProv) {
        $("#verDsctoProv").val((acProv.porcentaje_descuento ?? 0) + "%");
        $("#verIdAcuerdoProv").val(`${acProv.idacuerdo ?? ""} - ${acProv.descripcion_acuerdo ?? ""}`);
        $("#verComprometidoProv").val(formatearMoneda(acProv.valor_comprometido));
    }
    if (acProp) {
        $("#verDsctoProp").val((acProp.porcentaje_descuento ?? 0) + "%");
        $("#verIdAcuerdoProp").val(`${acProp.idacuerdo ?? ""} - ${acProp.descripcion_acuerdo ?? ""}`);
        $("#verComprometidoProp").val(formatearMoneda(acProp.valor_comprometido));
    }

    const totalDscto = acuerdos.reduce((sum, ac) => sum + (ac.porcentaje_descuento || 0), 0);
    $("#verDsctoTotal").val(totalDscto + "%");
}

function renderizarTablaArticulos(articulos) {
    let html = `
        <h6 class="fw-bold mb-2"><i class="fa fa-list text-primary"></i> Detalle de Artículos</h6>
        <div class="table-responsive" style="max-height: 300px; overflow-y: auto;">
            <table class="table table-bordered table-sm mb-0">
                <thead class="sticky-top text-nowrap">
                    <tr class="text-center tabla-items-header">
                        <th class="custom-header-cons-bg">Item</th>
                        <th class="custom-header-cons-bg">Descripción</th>
                        <th class="custom-header-ingr-bg">Precio Contado</th>
                        <th class="custom-header-ingr-bg">Precio TC</th>
                        <th class="custom-header-ingr-bg">Precio Crédito</th>
                        <th class="custom-header-calc-bg">% Descuento</th>
                        <th class="custom-header-calc-bg">Valor Descuento</th>
                    </tr>
                </thead>
                <tbody class="text-nowrap tabla-items-body bg-white">`;
    articulos.forEach(art => {
        html += `
            <tr>
                <td class="fw-bold text-center">${art.codigoarticulo || ''}</td>
                <td>${art.descripcion || ''}</td>
                <td class="text-end">${formatearMoneda(art.preciocontado)}</td>
                <td class="text-end">${formatearMoneda(art.preciotarjetacredito)}</td>
                <td class="text-end">${formatearMoneda(art.preciocredito)}</td>
                <td class="text-center fw-bold text-primary">${art.porcentajedescuento ?? 0}%</td>
                <td class="text-end fw-bold">${formatearMoneda(art.valordescuento)}</td>
            </tr>`;
    });
    html += `</tbody></table></div>`;
    $('#contenedor-tabla-articulos').html(html).fadeIn();
}

function renderizarTablaCombos(combos) {
    let html = `
        <h6 class="fw-bold mb-2 mt-3"><i class="fa fa-layer-group text-primary"></i> Detalle de Combos</h6>
        <div class="table-responsive" style="max-height: 300px; overflow-y: auto;">
            <table class="table table-bordered table-sm mb-0">
                <thead class="sticky-top text-nowrap">
                    <tr class="text-center tabla-items-header">
                        <th class="custom-header-cons-bg">Código Combo</th>
                        <th class="custom-header-cons-bg">Descripción</th>
                        <th class="custom-header-ingr-bg">Cantidad</th>
                        <th class="custom-header-ingr-bg">Precio</th>
                        <th class="custom-header-calc-bg">Valor Total</th>
                    </tr>
                </thead>
                <tbody class="text-nowrap tabla-items-body bg-white">`;
    combos.forEach(combo => {
        html += `
            <tr>
                <td class="fw-bold text-center">${combo.codigocombo || ''}</td>
                <td>${combo.descripcion || ''}</td>
                <td class="text-center fw-bold text-primary">${combo.cantidad ?? 0}</td>
                <td class="text-end">${formatearMoneda(combo.precio)}</td>
                <td class="text-end fw-bold">${formatearMoneda(combo.valortotal)}</td>
            </tr>`;
    });
    html += `</tbody></table></div>`;
    $('#contenedor-tabla-combos').html(html).fadeIn();
}

function cerrarDetalle() {
    $("#vistaDetalle").fadeOut(200, function () {
        $("#vistaTabla").fadeIn(200);
        if (tabla) tabla.columns.adjust();
    });
    datosAprobacionActual = null;
}

function cargarAprobacionesPromocion(entidad, idEntidad, tipoProceso) {
    if ($.fn.DataTable.isDataTable('#dt-historial')) $('#dt-historial').DataTable().destroy();

    $('#tabla-aprobaciones-promocion').html(`
        <div class="text-center p-3">
            <div class="spinner-border text-primary" role="status"><span class="visually-hidden">Cargando...</span></div>
        </div>
    `);

    const payload = {
        code_app: "APP20260128155212346", http_method: "GET", endpoint_path: "api/Aprobacion/consultar-aprobaciones", client: "APL", endpoint_query_params: `/${entidad}/${idEntidad}/${tipoProceso}`
    };

    $.ajax({
        url: "/api/apigee-router-proxy", method: "POST", contentType: "application/json", data: JSON.stringify(payload),
        success: function (response) {
            if (response && response.code_status === 200) {
                let lista = Array.isArray(response.json_response) ? response.json_response : [response.json_response];
                if (!lista || lista.length === 0) {
                    $('#tabla-aprobaciones-promocion').html('<div class="alert alert-light text-center border">No hay historial de aprobaciones.</div>');
                    return;
                }

                let html = `
                <h6 class="fw-bold mb-2"><i class="fa fa-clock-rotate-left text-primary"></i> Historial de Aprobaciones</h6>
                <table id='dt-historial' class='table table-sm table-bordered table-hover w-100'>
                    <thead class="table-light">
                        <tr>
                            <th>ID Aprobación</th>
                            <th>Usuario Solicitante</th>
                            <th>Usuario Aprobador</th>
                            <th>Estado</th>
                            <th>Fecha Solicitud</th>
                            <th>Nivel Aprobación</th>
                            <th>Tipo Proceso</th>
                        </tr>
                    </thead>
                    <tbody>`;

                lista.forEach(item => {
                    let comentarioLimpio = (item.comentario && item.comentario !== "string") ? item.comentario : "Sin comentarios.";
                    let estadoNombre = item.estado_nombre || item.estado_etiqueta || "N/A";
                    let estadoUpper = estadoNombre.toUpperCase();
                    let iconoPopover = "";
                    if (estadoUpper.includes("APROBADO") || estadoUpper.includes("NEGADO")) {
                        iconoPopover = `<i class="fa-solid fa-comment-dots text-warning ms-1" style="cursor:pointer; font-size:0.9rem;" data-bs-toggle="popover" data-bs-trigger="focus" data-bs-placement="top" tabindex="0" title="Comentario" data-bs-content="${comentarioLimpio}"></i>`;
                    }
                    html += `<tr>
                        <td class="text-center">${item.idaprobacion || ""}</td>
                        <td>${item.idusersolicitud || ""}</td>
                        <td>${item.iduseraprobador || ""}</td>
                        <td class="text-nowrap">${estadoNombre}${iconoPopover}</td>
                        <td class="text-center">${formatearFecha(item.fechasolicitud)}</td>
                        <td class="text-center">${item.nivelaprobacion || 0}</td>
                        <td>${item.tipoproceso_nombre || ""}</td>
                    </tr>`;
                });
                html += `</tbody></table>`;
                $('#tabla-aprobaciones-promocion').html(html);

                tablaHistorial = $('#dt-historial').DataTable({
                    pageLength: 5, lengthMenu: [5, 10, 25], pagingType: 'simple_numbers', searching: false,
                    columnDefs: [{ targets: [0, 4, 5], className: "dt-center" }, { targets: 3, className: "dt-nowrap" }], order: [[0, 'desc']],
                    language: { decimal: "", emptyTable: "No hay aprobaciones", info: "Mostrando _START_ a _END_ de _TOTAL_", infoEmpty: "0 a 0 de 0", paginate: { first: "Primero", last: "Último", next: "Sig", previous: "Ant" } },
                    drawCallback: function () {
                        const popoverTriggerList = document.querySelectorAll('#dt-historial [data-bs-toggle="popover"]');
                        [...popoverTriggerList].map(el => new bootstrap.Popover(el));
                    }
                });
            } else { $('#tabla-aprobaciones-promocion').html('<div class="text-danger small">Error al cargar historial.</div>'); }
        },
        error: function () { $('#tabla-aprobaciones-promocion').html('<div class="text-danger small">Error al cargar historial.</div>'); }
    });
}

// ===================================================================
// FUNCIONES PARA APROBAR/RECHAZAR PROMOCIONES
// ===================================================================

function procesarAprobacionPromocion(accion, comentario) {
    if (!datosAprobacionActual) {
        Swal.fire({ icon: 'error', title: 'Error', text: 'No hay datos de aprobación disponibles.' });
        return;
    }
    let nuevoEstado = accion === "APROBAR" ? "ESTADOAPROBADO" : "ESTADONEGADO";
    let tituloAccion = accion === "APROBAR" ? "Aprobar Promoción" : "Rechazar Promoción";
    let mensajeAccion = accion === "APROBAR" ? "¿Está seguro que desea aprobar esta promoción?" : "¿Está seguro que desea rechazar esta promoción?";

    Swal.fire({
        title: tituloAccion, text: mensajeAccion, icon: 'warning', showCancelButton: true,
        confirmButtonColor: accion == "APROBAR" ? '#28a745' : '#dc3545', cancelButtonColor: '#6c757d',
        confirmButtonText: accion == "APROBAR" ? 'Sí, aprobar' : 'Sí, rechazar', cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) ejecutarAprobacionPromocion(accion, nuevoEstado, comentario);
    });
}

function ejecutarAprobacionPromocion(accion, nuevoEstado, comentario) {
    const idOpcionActual = obtenerIdOpcionSeguro();
    const usuarioActual = obtenerUsuarioActual();

    const body = {
        entidad: datosAprobacionActual.entidad,
        identidad: datosAprobacionActual.identidad,
        idtipoproceso: datosAprobacionActual.idtipoproceso,
        idetiquetatipoproceso: datosAprobacionActual.idetiquetatipoproceso,
        comentario: comentario,
        idetiquetaestado: nuevoEstado,
        idaprobacion: datosAprobacionActual.idaprobacion,
        usuarioaprobador: usuarioActual,
        idopcion: idOpcionActual,
        idcontrolinterfaz: accion == "APROBAR" ? "BTNAPROBAR" : "BTNNEGAR",
        idevento: "EVCLICK",
        nombreusuario: usuarioActual
    };

    Swal.fire({ title: 'Procesando...', text: 'Por favor espere', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    const payload = {
        code_app: "APP20260128155212346", http_method: "POST", endpoint_path: "api/Promocion/aprobar-promocion", client: "APL", body_request: body
    };

    $.ajax({
        url: "/api/apigee-router-proxy", method: "POST", contentType: "application/json", data: JSON.stringify(payload),
        success: function (response) {
            if (response && response.code_status === 200) {
                cerrarDetalle();
                Swal.fire({ icon: 'success', title: '¡Operación Exitosa!', text: response.json_response?.respuesta || `Promoción ${accion === "APROBAR" ? "aprobada" : "rechazada"}`, confirmButtonText: 'Aceptar', timer: 2000, timerProgressBar: true })
                    .then(() => { datosAprobacionActual = null; cargarBandeja(); });
            } else {
                Swal.fire({ icon: 'error', title: 'Error', text: response.json_response?.mensaje || 'Error al procesar' });
            }
        },
        error: function (xhr) { Swal.fire({ icon: 'error', title: 'Error', text: 'Error al procesar: ' + (xhr.responseJSON?.mensaje || '') }); }
    });
}