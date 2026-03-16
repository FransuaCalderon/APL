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
    // 1. Si el array ni siquiera existe, devolvemos "Todos" por seguridad visual
    if (!segmentos || !Array.isArray(segmentos) || segmentos.length === 0) {
        return "Todos";
    }

    // 2. Intento de filtrado flexible
    const items = segmentos.filter(s => {
        const tag = s.etiqueta_tipo_segmento || s.etiquetaTipoSegmento || s.etiqueta || "";
        return tag.toUpperCase() === etiqueta.toUpperCase();
    });

    if (items.length === 0) return "Todos";

    const primerItem = items[0];

    // 3. Manejo de Tipo de Asignación "T" (Todos)
    const tipoAsig = (primerItem.tipoasignacion || primerItem.tipoAsignacion || "").toString().toUpperCase();
    if (tipoAsig === "T") return "Todos";

    // 4. Manejo de múltiples registros
    if (items.length > 1) return `Varios (${items.length})`;

    // 5. Formateo de un solo registro (Código - Nombre)
    let cod = (primerItem.codigo_detalle || primerItem.codigoDetalle || "").toString().trim();
    let nom = (primerItem.nombre_detalle || primerItem.nombreDetalle || "").toString().trim();

    if (cod && nom) return `${cod} - ${nom}`;
    return cod || nom || "Todos";
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
                $("#verMarca").val(obtenerTextoSegmento(segmentos, "SEGMARCA"));
                $("#verDivision").val(obtenerTextoSegmento(segmentos, "SEGDIVISION"));
                $("#verDepartamento").val(obtenerTextoSegmento(segmentos, "SEGDEPARTAMENTO"));
                $("#verClase").val(obtenerTextoSegmento(segmentos, "SEGCLASE"));
                $("#verArticulo").val(obtenerTextoSegmento(segmentos, "SEGARTICULO"));
                $("#verCanal").val(obtenerTextoSegmento(segmentos, "SEGCANAL"));
                $("#verGrupoAlmacen").val(obtenerTextoSegmento(segmentos, "SEGGRUPOALMACEN"));
                $("#verAlmacen").val(obtenerTextoSegmento(segmentos, "SEGALMACEN"));
                $("#verTipoCliente").val(obtenerTextoSegmento(segmentos, "SEGTIPOCLIENTE"));
                $("#verMedioPago").val(obtenerTextoSegmento(segmentos, "SEGMEDIOPAGO"));

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

    // Búsqueda uno a uno por su etiqueta correspondiente
    const acProv = acuerdos.find(a => a.etiqueta_tipo_fondo === "TFPROVEDOR");
    const acProp = acuerdos.find(a => a.etiqueta_tipo_fondo === "TFPROPIO");

    if (acProv) {
        $("#verDsctoProv").val((acProv.porcentaje_descuento ?? 0) + "%");
        $("#verIdAcuerdoProv").val(`${acProv.idacuerdo ?? ""} - ${acProv.nombre_proveedor ?? ""} - ${acProv.descripcion_acuerdo ?? ""}`);
        $("#verComprometidoProv").val(formatearMoneda(acProv.valor_comprometido));
    }

    if (acProp) {
        $("#verDsctoProp").val((acProp.porcentaje_descuento ?? 0) + "%");
        $("#verIdAcuerdoProp").val(`${acProp.idacuerdo ?? ""} - ${acProp.nombre_proveedor ?? ""} - ${acProp.descripcion_acuerdo ?? ""}`);
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
    if ($.fn.DataTable.isDataTable('#dt-historial')) {
        $('#dt-historial').DataTable().destroy();
    }

    document.querySelectorAll('#tabla-aprobaciones-promocion [data-bs-toggle="popover"]').forEach(function (el) {
        const instance = bootstrap.Popover.getInstance(el);
        if (instance) instance.dispose();
    });

    $('#tabla-aprobaciones-promocion').html(`
        <div class="text-center p-3">
            <div class="spinner-border text-primary" role="status"><span class="visually-hidden">Cargando...</span></div>
            <p class="mt-2 small text-muted">Cargando historial...</p>
        </div>
    `);

    const payload = {
        code_app: "APP20260128155212346",
        http_method: "GET",
        endpoint_path: "api/Aprobacion/consultar-aprobaciones-generales",
        client: "APL",
        endpoint_query_params: `/ENTPROMOCION/${idEntidad}`
    };

    $.ajax({
        url: "/api/apigee-router-proxy",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(payload),
        success: function (response) {
            if (response && response.code_status === 200) {
                let lista = response.json_response || [];
                if (!Array.isArray(lista)) lista = [lista];

                if (!lista || lista.length === 0) {
                    $('#tabla-aprobaciones-promocion').html('<div class="alert alert-light text-center border">No hay historial de aprobaciones disponibles.</div>');
                    return;
                }

                // ESTRUCTURA LIMPIA (sin estilos en línea) para que tome tu CSS global azul
                let html = `
                <table id='dt-historial' class='table table-sm table-bordered table-hover w-100'>
                    <thead class="table-light">
                        <tr>
                            <th class="text-center">Tipo Solicitud</th>
                            <th class="text-center">Usuario Solicita</th>
                            <th class="text-center">Fecha Solicitud</th>
                            <th class="text-center">Usuario Aprobador</th>
                            <th class="text-center">Fecha Aprobación</th>
                            <th class="text-center">Nivel</th>
                            <th class="text-center">Estado</th>
                            <th class="text-center">Lote</th>
                        </tr>
                    </thead>
                    <tbody>`;

                lista.forEach(apr => {
                    const tieneComentario = apr.comentario_aprobador && apr.comentario_aprobador.toString().trim() !== "";

                    const comentarioAttr = (apr.comentario_aprobador ?? "")
                        .replace(/&/g, "&amp;")
                        .replace(/"/g, "&quot;")
                        .replace(/'/g, "&#39;")
                        .replace(/</g, "&lt;")
                        .replace(/>/g, "&gt;");

                    html += `<tr>
                        <td class="text-center">${apr.tipo_solicitud ?? ""}</td>
                        <td class="text-center">${apr.usuario_solicita ?? ""}</td>
                        <td class="text-center text-nowrap">${formatearFecha(apr.fecha_solicitud)}</td>
                        <td class="text-center">
                            <span>${apr.usuario_aprobador ?? ""}</span>
                            ${tieneComentario
                            ? `<button type="button" class="btn btn-sm btn-link p-0 ms-1 text-dark btn-comentario-popover" 
                                    data-bs-toggle="popover" data-bs-trigger="focus" data-bs-placement="left" 
                                    data-bs-title="Comentario de ${apr.usuario_aprobador ?? ""}" 
                                    data-bs-content="${comentarioAttr}">
                                    <i class="fa-solid fa-message text-warning" style="font-size:0.9rem;"></i>
                                   </button>`
                            : ""}
                        </td>
                        <td class="text-center text-nowrap">${formatearFecha(apr.fecha_aprobacion)}</td>
                        <td class="text-center">${apr.nivel ?? ""}</td>
                        <td class="text-center">${apr.estado ?? ""}</td>
                        <td class="text-center">${apr.lote ?? ""}</td>
                    </tr>`;
                });

                html += `</tbody></table>`;
                $('#tabla-aprobaciones-promocion').html(html);

                tablaHistorial = $('#dt-historial').DataTable({
                    pageLength: 5,
                    lengthMenu: [5, 10, 25],
                    pagingType: 'simple_numbers',
                    searching: false,
                    columnDefs: [
                        { targets: [0, 5, 7], className: "dt-center" },
                        { targets: [2, 4], className: "dt-nowrap dt-center" }
                    ],
                    order: [],
                    // CONFIGURACIÓN DE IDIOMA EXACTAMENTE IGUAL A APROBARACUERDO
                    language: {
                        decimal: "",
                        emptyTable: "No hay aprobaciones disponibles",
                        info: "Mostrando _START_ a _END_ de _TOTAL_ aprobaciones",
                        infoEmpty: "Mostrando 0 a 0 de 0 aprobaciones",
                        infoFiltered: "(filtrado de _MAX_ aprobaciones totales)",
                        lengthMenu: "Mostrar _MENU_ aprobaciones",
                        loadingRecords: "Cargando...",
                        processing: "Procesando...",
                        search: "Buscar:",
                        zeroRecords: "No se encontraron aprobaciones coincidentes",
                        paginate: { first: "Primero", last: "Último", next: "Siguiente", previous: "Anterior" }
                    },
                    drawCallback: function () {
                        const popoverTriggerList = document.querySelectorAll('#dt-historial [data-bs-toggle="popover"]');
                        [...popoverTriggerList].map(el => new bootstrap.Popover(el));
                    }
                });
            } else {
                $('#tabla-aprobaciones-promocion').html('<div class="text-danger small text-center p-3 border">Error al cargar historial.</div>');
            }
        },
        error: function () {
            $('#tabla-aprobaciones-promocion').html('<div class="text-danger small text-center p-3 border">Error al cargar historial.</div>');
        }
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

    console.log("body: ", body);
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