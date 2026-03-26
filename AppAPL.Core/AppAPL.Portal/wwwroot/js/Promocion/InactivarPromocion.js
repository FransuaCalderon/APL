// ~/js/Promocion/InactivarPromocion.js

let tabla;
let dtArticulosDetalle = null;

// ===============================================================
// FUNCIONES HELPER
// ===============================================================
function obtenerUsuarioActual() {
    return window.usuarioActual || sessionStorage.getItem('usuarioActual') || sessionStorage.getItem('usuario') || localStorage.getItem('usuarioActual') || "admin";
}

function getIdOpcionSeguro() {
    try {
        return ((window.obtenerIdOpcionActual && window.obtenerIdOpcionActual()) || (window.obtenerInfoOpcionActual && window.obtenerInfoOpcionActual().idOpcion) || "0");
    } catch (e) {
        console.error("Error obteniendo idOpcion:", e); return "0";
    }
}

function manejarErrorGlobal(xhr, accion) {
    console.error(`Error al ${accion}:`, xhr.responseText);
    Swal.fire({ icon: 'error', title: 'Error de Comunicación', text: `No se pudo completar la acción: ${accion}.` });
}

function formatearMoneda(valor) {
    var numero = parseFloat(valor);
    if (isNaN(numero) || valor === null || valor === undefined) return "$ 0.00";
    return '$ ' + numero.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatearFecha(f) {
    if (!f) return "";
    try {
        var fecha = new Date(f);
        if (isNaN(fecha)) return f;
        var dia = String(fecha.getDate()).padStart(2, '0');
        var mes = String(fecha.getMonth() + 1).padStart(2, '0');
        var anio = fecha.getFullYear();
        return `${dia}/${mes}/${anio}`;
    } catch (e) { return f; }
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

// LÓGICA DE SEGMENTOS Y "VARIOS"
function obtenerTextoSegmento(segmentos, etiqueta) {
    if (!segmentos || !Array.isArray(segmentos) || segmentos.length === 0) return "";
    const items = segmentos.filter(s => {
        const tag = s.etiqueta_tipo_segmento || s.etiquetaTipoSegmento || s.etiqueta || "";
        return tag.toUpperCase() === etiqueta.toUpperCase();
    });

    if (items.length === 0) return "";
    const primerItem = items[0];
    const tipoAsig = (primerItem.tipoasignacion || primerItem.tipoAsignacion || "").toString().toUpperCase();
    if (tipoAsig === "T") return "Todos";
    if (items.length > 1) return `Varios (${items.length})`;

    let cod = (primerItem.codigo_detalle || primerItem.codigoDetalle || "").toString().trim();
    let nom = (primerItem.nombre_detalle || primerItem.nombreDetalle || "").toString().trim();

    if (!nom && !isNaN(cod) && parseInt(cod) > 1) return `Varios (${cod})`;
    if (cod.toUpperCase() === "TODOS") return "Todos";
    if (cod && nom) return `${cod} - ${nom}`;
    return cod || nom || "Todos";
}

function obtenerDetallesSegmento(segmentos, etiqueta) {
    if (!segmentos || !Array.isArray(segmentos) || segmentos.length === 0) return [];
    const items = segmentos.filter(s => {
        const tag = s.etiqueta_tipo_segmento || s.etiquetaTipoSegmento || s.etiqueta || "";
        return tag.toUpperCase() === etiqueta.toUpperCase();
    });

    if (items.length === 0) return [];
    const tipoAsig = (items[0].tipoasignacion || items[0].tipoAsignacion || "").toString().toUpperCase();
    if (tipoAsig === "T") return [];

    const mapa = {};
    items.forEach(i => {
        const cod = (i.codigo_detalle || i.codigoDetalle || "").toString().trim();
        const nom = (i.nombre_detalle || i.nombreDetalle || "").toString().trim();
        if (cod.toUpperCase() === "TODOS") return;

        if (cod.includes(",")) {
            const cods = cod.split(",");
            const noms = nom.split(",");
            cods.forEach((c, index) => {
                const cTrim = c.trim();
                const nTrim = (noms[index] || "").trim();
                if (cTrim && !mapa[cTrim]) mapa[cTrim] = { codigo: cTrim, nombre: nTrim };
            });
        } else {
            const key = cod || nom;
            if (key && !mapa[key]) mapa[key] = { codigo: cod, nombre: nom };
        }
    });

    return Object.values(mapa);
}

function configurarCampoSegmentoGeneral(inputId, btnId, segmentos, etiqueta, tituloModal) {
    const texto = obtenerTextoSegmento(segmentos, etiqueta);
    const detalles = obtenerDetallesSegmento(segmentos, etiqueta);
    $(inputId).val(texto);

    if (detalles.length > 1) {
        $(btnId)
            .css({ "background-color": "#198754", "color": "white", "cursor": "pointer" })
            .html(`<i class="fa-solid fa-list-check"></i> <span style="font-size:0.6rem; margin-left:2px; font-weight:bold;">(${detalles.length})</span>`)
            .prop("disabled", false)
            .off("click").on("click", function () { abrirModalVisualizarSegmento(tituloModal, detalles); });
    } else {
        $(btnId)
            .css({ "background-color": "#e8e8e8", "color": "#666", "cursor": "default" })
            .html('<i class="fa-solid fa-list-check"></i>')
            .prop("disabled", true).off("click");
    }
}

function configurarCampoSegmentoArticulo(inputId, btnId, segmentos, etiqueta, tituloModal) {
    const texto = obtenerTextoSegmento(segmentos, etiqueta);
    const detalles = obtenerDetallesSegmento(segmentos, etiqueta);
    $(inputId).val(texto);

    if (detalles.length > 1) {
        $(btnId)
            .removeClass("d-none btn-outline-secondary").addClass("btn-success")
            .html(`<i class="fa-solid fa-list-check"></i> (${detalles.length})`)
            .off("click").on("click", function () { abrirModalVisualizarSegmento(tituloModal, detalles); });
    } else {
        $(btnId)
            .addClass("d-none").removeClass("btn-success").addClass("btn-outline-secondary")
            .html('<i class="fa-solid fa-list-check"></i>')
            .off("click");
    }
}

function abrirModalVisualizarSegmento(titulo, detalles) {
    $("#modalVerSegmentoLabel").text(titulo);
    const $body = $("#bodyModalVerSegmento");
    $body.empty();
    if (!detalles || detalles.length === 0) {
        $body.html('<p class="text-muted text-center">No hay elementos seleccionados.</p>');
    } else {
        const $ul = $('<ul class="list-group w-100"></ul>');
        detalles.forEach(det => {
            $ul.append(`<li class="list-group-item d-flex align-items-center py-2"><i class="fa-solid fa-check-circle text-success me-2"></i><span><strong>${det.codigo}</strong> - ${det.nombre}</span></li>`);
        });
        $body.append($ul);
    }
    new bootstrap.Modal(document.getElementById("modalVerSegmento")).show();
}

function generarHtmlMedioPagoArticulo(articulossegmentos, codigoItem) {
    if (!articulossegmentos || !Array.isArray(articulossegmentos)) return "Todos";
    const items = articulossegmentos.filter(s => s.codigoitem === codigoItem && (s.etiqueta_tipo_segmento || "").toUpperCase() === "SEGMEDIOPAGO");
    if (items.length === 0) return "Todos";

    const primerItem = items[0];
    const tipoAsig = (primerItem.tipoasignacion || "").toString().toUpperCase();
    if (tipoAsig === "T") return "Todos";

    const mapa = {};
    items.forEach(i => {
        const cod = (i.codigo_detalle || "").toString().trim();
        const nom = (i.nombre_medio_pago || i.nombre_detalle || "").toString().trim();
        if (cod.toUpperCase() === "TODOS") return;

        if (cod.includes(",")) {
            const cods = cod.split(",");
            const noms = nom.split(",");
            cods.forEach((c, idx) => {
                const cTrim = c.trim();
                const nTrim = (noms[idx] || "").trim();
                if (cTrim && !mapa[cTrim]) mapa[cTrim] = { codigo: cTrim, nombre: nTrim };
            });
        } else {
            const key = cod || nom;
            if (key && !mapa[key]) mapa[key] = { codigo: cod, nombre: nom };
        }
    });

    const detalles = Object.values(mapa);
    if (detalles.length > 1) {
        const jsonDetalles = JSON.stringify(detalles).replace(/'/g, "&#39;");
        return `<button type="button" class="btn btn-success btn-sm btn-ver-mediopago-grid" style="font-size:0.75rem; padding:2px 8px;" data-detalles='${jsonDetalles}'><i class="fa-solid fa-list-check"></i> (${detalles.length})</button>`;
    }
    if (detalles.length === 1) {
        let cod = detalles[0].codigo; let nom = detalles[0].nombre;
        if (!nom && !isNaN(cod) && parseInt(cod) > 1) return `Varios (${cod})`;
        if (cod.toUpperCase() === "TODOS") return "Todos";
        if (cod && nom) return `${cod} - ${nom}`;
        return cod || nom || "Todos";
    }
    return "Todos";
}

// ===============================================================
// NUEVO: Generar HTML para Otros Costos
// ===============================================================
function generarHtmlOtrosCostosArticulo(articulosotros, idPromocionArticulo) {
    if (!articulosotros || !Array.isArray(articulosotros)) return "N/A";

    // Filtrar usando 'idpromocionarticulo'
    const items = articulosotros.filter(s => s.idpromocionarticulo === idPromocionArticulo);

    if (items.length === 0) return "N/A";

    const detalles = items.map(item => {
        return {
            codigo: item.descripcion || "Costo",
            nombre: `$${parseFloat(item.costo || 0).toFixed(2)}`
        };
    });

    if (detalles.length > 1) {
        const jsonDetalles = JSON.stringify(detalles).replace(/'/g, "&#39;");
        return `<button type="button" class="btn btn-success btn-sm btn-ver-otroscostos-grid" style="font-size:0.75rem; padding:2px 8px;" data-detalles='${jsonDetalles}'><i class="fa-solid fa-list-check"></i> (${detalles.length})</button>`;
    }

    if (detalles.length === 1) {
        return `${detalles[0].codigo}: ${detalles[0].nombre}`;
    }

    return "N/A";
}

function obtenerAcuerdosArticulo(articulosacuerdos, idPromocionArticulo) {
    if (!articulosacuerdos || !Array.isArray(articulosacuerdos)) return { proveedor: null, rebate: null, propio: null };
    const acuerdos = articulosacuerdos.filter(a => a.idpromocionarticulo === idPromocionArticulo);
    return {
        proveedor: acuerdos.find(a => (a.etiqueta_tipo_fondo || "").toUpperCase() === "TFPROVEDOR") || null,
        rebate: acuerdos.find(a => (a.etiqueta_tipo_fondo || "").toUpperCase() === "TFREBATE") || null,
        propio: acuerdos.find(a => (a.etiqueta_tipo_fondo || "").toUpperCase() === "TFPROPIO") || null
    };
}


// ===============================================================
// DOCUMENT READY
// ===============================================================
$(document).ready(function () {
    console.log("=== INICIO - InactivarPromocion (Estructura Híbrida) ===");

    $.get("/config", function (config) {
        window.apiBaseUrl = config.apiBaseUrl;
        cargarBandeja();
    }).fail(function () {
        cargarBandeja();
    });

    $("#btnVolverTabla, #btnVolverAbajo").on("click", function () { cerrarDetalle(); });

    $("body").on("click", "#btnLimpiar", function () { if (tabla) tabla.search("").draw(); });

    $("#btnInactivarPromocion").on("click", function () { inactivarPromocion(); });

    // Botones PDF
    $("#btnVerSoporte").on("click", function () {
        const soporte = $(this).data("soporte");
        if (!soporte) { Swal.fire({ icon: "info", title: "Sin soporte", text: "Esta promoción no tiene un archivo de soporte adjunto." }); return; }
        const nombreArchivoConGuid = obtenerNombreArchivoConGuid(soporte);
        if (!nombreArchivoConGuid) { Swal.fire({ icon: "info", title: "Sin soporte", text: "No se pudo determinar el nombre del archivo." }); return; }
        abrirVisorPDF(nombreArchivoConGuid);
    });

    $("#btnCerrarVisorPdf, #btnCerrarVisorPdfFooter").on("click", function () { cerrarVisorPDF(); });

    $("#btnDescargarPdf").on("click", function () {
        const url = $(this).data("blob-url"); const nombre = $(this).data("nombre-archivo");
        if (url) { const a = document.createElement("a"); a.href = url; a.download = nombre || "soporte.pdf"; document.body.appendChild(a); a.click(); document.body.removeChild(a); }
    });

    // Botones Auditoría
    $("#btnVerLog").on("click", function () { const idPromocion = parseInt($("#lblIdPromocion").text(), 10); if (idPromocion) abrirModalLog(idPromocion); });
    $("#btnVerAprobaciones").on("click", function () { const idPromocion = parseInt($("#lblIdPromocion").text(), 10); if (idPromocion) abrirModalAprobaciones(idPromocion); });

    // Evento dinámico Medios de Pago en Grilla
    $(document).on("click", ".btn-ver-mediopago-grid", function () {
        const detalles = $(this).data("detalles");
        abrirModalVisualizarSegmento("Medios de Pago Seleccionados", detalles);
    });

    // NUEVO: Evento dinámico Otros Costos en Grilla
    $(document).on("click", ".btn-ver-otroscostos-grid", function () {
        const detalles = $(this).data("detalles");
        abrirModalVisualizarSegmento("Otros Costos Seleccionados", detalles);
    });
});

// ===================================================================
// VISOR PDF
// ===================================================================
function abrirVisorPDF(nombreArchivo) {
    $("#pdfSpinner").show(); $("#pdfVisorContenido").hide(); $("#pdfVisorError").hide(); $("#btnDescargarPdf").hide();
    $("#modalVisorPdfLabel .pdf-nombre-archivo").text(obtenerNombreArchivo(nombreArchivo) || "Soporte");
    new bootstrap.Modal(document.getElementById("modalVisorPdf")).show();
    fetchPDFDirecto(nombreArchivo);
}

function fetchPDFDirecto(nombreArchivo) {
    let baseUrl = (window.apiBaseUrl || "http://localhost:5074").replace("/api/router-proxy/execute", "");
    const url = `${baseUrl}/api/Descargas/descargar/${encodeURIComponent(nombreArchivo)}`;
    fetch(url).then(r => { if (!r.ok) return r.text().then(t => { throw new Error(t || `Error HTTP ${r.status}`); }); return r.blob(); })
        .then(blob => {
            const blobUrl = URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
            $("#pdfIframe").attr("src", blobUrl); $("#pdfSpinner").hide(); $("#pdfVisorContenido").show();
            $("#btnDescargarPdf").data("blob-url", blobUrl).data("nombre-archivo", obtenerNombreArchivo(nombreArchivo) || "soporte.pdf").show();
        }).catch(error => {
            $("#pdfSpinner").hide(); $("#pdfVisorError").html(`<i class="fa-solid fa-triangle-exclamation me-2"></i> ${error.message}`).show();
        });
}

function cerrarVisorPDF() {
    const blobUrl = $("#btnDescargarPdf").data("blob-url");
    if (blobUrl) { URL.revokeObjectURL(blobUrl); $("#btnDescargarPdf").removeData("blob-url"); }
    const iframe = document.getElementById("pdfIframe"); if (iframe) iframe.src = "about:blank";
    const modal = bootstrap.Modal.getInstance(document.getElementById("modalVisorPdf")); if (modal) modal.hide();
}

// ===================================================================
// BANDEJA
// ===================================================================
function cargarBandeja() {
    const payload = { code_app: "APP20260128155212346", http_method: "GET", endpoint_path: "api/Promocion/consultar-bandeja-inactivacion", client: "APL" };
    $.ajax({
        url: "/api/apigee-router-proxy", method: "POST", contentType: "application/json", data: JSON.stringify(payload),
        success: function (response) {
            if (response && response.code_status === 200) crearListado(response.json_response || []);
            else Swal.fire({ icon: "error", title: "Error", text: "No se pudo cargar la bandeja." });
        },
        error: function (xhr) { manejarErrorGlobal(xhr, "cargar la bandeja de inactivación"); }
    });
}

function crearListado(data) {
    if (tabla) tabla.destroy();
    if (!data || data.length === 0) { $('#tabla').html("<div class='alert alert-info text-center'>No hay promociones para inactivar.</div>"); return; }

    let html = `<table id="tabla-principal" class="table table-bordered table-striped table-hover"><thead>
        <tr><th colspan="10" style="background-color: #CC0000 !important; color: white; text-align: center; font-weight: bold; padding: 8px;">BANDEJA DE INACTIVACIÓN DE PROMOCIONES</th></tr>
        <tr><th>Acción</th><th>Id Promoción</th><th>Descripción</th><th>Motivo</th><th>Clase de Promoción</th><th>Fecha Inicio</th><th>Fecha Fin</th><th>Regalo</th><th>Soporte</th><th>Estado</th></tr></thead><tbody>`;

    data.forEach(promo => {
        html += `<tr>
            <td class="text-center"><button type="button" class="btn-action edit-btn" title="Ver / Inactivar" onclick="abrirModalEditar(${promo.idpromocion})"><i class="fa-regular fa-pen-to-square"></i></button></td>
            <td class="text-center">${promo.idpromocion ?? ""}</td><td>${promo.descripcion ?? ""}</td><td>${promo.motivo ?? ""}</td><td>${promo.clase_promocion ?? ""}</td>
            <td class="text-center">${formatearFecha(promo.fecha_inicio)}</td><td class="text-center">${formatearFecha(promo.fecha_fin)}</td>
            <td class="text-center">${promo.regalo && promo.regalo !== "N" ? "✓" : ""}</td><td>${obtenerNombreArchivo(promo.soporte)}</td><td>${promo.estado ?? ""}</td>
        </tr>`;
    });

    html += `</tbody></table>`;
    $("#tabla").html(html);

    tabla = $("#tabla-principal").DataTable({
        pageLength: 10, lengthMenu: [5, 10, 25, 50], pagingType: 'full_numbers',
        columnDefs: [{ targets: 0, width: "5%", className: "dt-center", orderable: false }, { targets: 1, width: "8%", className: "dt-center" }, { targets: [5, 6, 7], className: "dt-center" }],
        order: [[1, "desc"]],
        language: { decimal: "", emptyTable: "No hay datos disponibles en la tabla", info: "Mostrando _START_ a _END_ de _TOTAL_ registros", infoEmpty: "Mostrando 0 a 0 de 0 registros", infoFiltered: "(filtrado de _MAX_ registros totales)", lengthMenu: "Mostrar _MENU_ registros", loadingRecords: "Cargando...", processing: "Procesando...", search: "Buscar:", zeroRecords: "No se encontraron registros coincidentes", paginate: { first: "Primero", last: "Último", next: "Siguiente", previous: "Anterior" } }
    });
}

// ===================================================================
// DETALLE
// ===================================================================
function abrirModalEditar(idPromocion) {
    $("body").css("cursor", "wait");

    if (dtArticulosDetalle) { dtArticulosDetalle.destroy(); dtArticulosDetalle = null; }

    $("#formVisualizar")[0].reset();
    $("#lblIdPromocion").text(idPromocion);
    $("#btnVerSoporte").data("soporte", "").removeData("soporte").attr("title", "Ver Soporte").removeClass("text-danger");

    $('#contenedor-tabla-articulos').html('').hide();
    $('#contenedor-tabla-combos').html('').hide();
    $('#seccion-detalle-general').hide();
    $('#seccion-detalle-articulos').hide();

    // Reset botones de Segmentos Artículos
    $("#btnVerCanalArt, #btnVerGrupoAlmacenArt, #btnVerAlmacenArt, #btnVerTipoClienteArt")
        .addClass("d-none").removeClass("btn-success").addClass("btn-outline-secondary")
        .html('<i class="fa-solid fa-list-check"></i>').off("click");

    // Reset botones de Segmentos Generales
    $(".promo-col-value .icon-btn")
        .css({ "background-color": "#e8e8e8", "color": "#666", "cursor": "default" })
        .html('<i class="fa-solid fa-list-check"></i>').prop("disabled", true).off("click");

    const payload = { code_app: "APP20260128155212346", http_method: "GET", endpoint_path: "api/Promocion/bandeja-inactivacion-id", client: "APL", endpoint_query_params: `/${idPromocion}` };

    $.ajax({
        url: "/api/apigee-router-proxy", method: "POST", contentType: "application/json", data: JSON.stringify(payload),
        success: function (response) {
            if (response && response.code_status === 200) {
                const data = response.json_response || {};
                const cab = data?.cabecera || {};
                const segmentos = data?.segmentos || [];
                const acuerdos = data?.acuerdos || [];
                const articulosotros = data?.articulosotros || []; // NUEVO: Capturar del JSON
                const tipoPromocion = (cab.etiqueta_clase_promocion || data.tipopromocion || "").toUpperCase();

                // Cabecera principal
                $("#verPromocionHeader").val(`${cab.idpromocion ?? ""} - ${cab.nombre_clase_promocion ?? ""}`);
                const rutaSoporte = cab.archivosoporte ?? "";
                $("#btnVerSoporte").data("soporte", rutaSoporte).toggleClass("text-danger", !!rutaSoporte).attr("title", rutaSoporte ? `Ver Soporte: ${obtenerNombreArchivo(rutaSoporte)}` : "Sin soporte");

                $("#verDescripcion").val(cab.descripcion ?? "");
                $("#verMotivo").val(cab.nombre_motivo ?? "");
                $("#verFechaInicio").val(formatearFechaHora(cab.fecha_inicio));
                $("#verFechaFin").val(formatearFechaHora(cab.fecha_fin));
                $("#verEstado").val(cab.nombre_estado_promocion ?? "");
                $("#verRegalo").prop("checked", (cab.marcaregalo ?? "").toString().trim().toUpperCase() === "S");

                // SEPARACIÓN LÓGICA POR TIPO
                if (tipoPromocion === "PRARTICULO") {
                    $('#seccion-detalle-general').hide();
                    $('#seccion-detalle-articulos').show();

                    configurarCampoSegmentoArticulo("#verCanalArt", "#btnVerCanalArt", segmentos, "SEGCANAL", "Canales Seleccionados");
                    configurarCampoSegmentoArticulo("#verGrupoAlmacenArt", "#btnVerGrupoAlmacenArt", segmentos, "SEGGRUPOALMACEN", "Grupos Almacén Seleccionados");
                    configurarCampoSegmentoArticulo("#verAlmacenArt", "#btnVerAlmacenArt", segmentos, "SEGALMACEN", "Almacenes Seleccionados");
                    configurarCampoSegmentoArticulo("#verTipoClienteArt", "#btnVerTipoClienteArt", segmentos, "SEGTIPOCLIENTE", "Tipos de Cliente Seleccionados");

                    if (data.articulos && data.articulos.length > 0) {
                        // NUEVO: Pasamos el array de otros costos
                        renderizarTablaArticulosCompleta(data.articulos, data.articulossegmentos || [], data.articulosacuerdos || [], articulosotros);
                    } else {
                        $('#contenedor-tabla-articulos').html('<div class="alert alert-info text-center">No hay artículos en esta promoción.</div>').show();
                    }
                } else {
                    $('#seccion-detalle-general').show();
                    $('#seccion-detalle-articulos').hide();

                    configurarCampoSegmentoGeneral("#verMarca", "#btnVerMarca", segmentos, "SEGMARCA", "Marcas Seleccionadas");
                    configurarCampoSegmentoGeneral("#verDivision", "#btnVerDivision", segmentos, "SEGDIVISION", "Divisiones Seleccionadas");
                    configurarCampoSegmentoGeneral("#verDepartamento", "#btnVerDepartamento", segmentos, "SEGDEPARTAMENTO", "Departamentos Seleccionados");
                    configurarCampoSegmentoGeneral("#verClase", "#btnVerClase", segmentos, "SEGCLASE", "Clases Seleccionadas");
                    configurarCampoSegmentoGeneral("#verArticulo", "#btnVerArticuloGen", segmentos, "SEGARTICULO", "Artículos Seleccionados");
                    configurarCampoSegmentoGeneral("#verCanal", "#btnVerCanalGen", segmentos, "SEGCANAL", "Canales Seleccionados");
                    configurarCampoSegmentoGeneral("#verGrupoAlmacen", "#btnVerGrupoAlmacenGen", segmentos, "SEGGRUPOALMACEN", "Grupos Almacén Seleccionados");
                    configurarCampoSegmentoGeneral("#verAlmacen", "#btnVerAlmacenGen", segmentos, "SEGALMACEN", "Almacenes Seleccionados");
                    configurarCampoSegmentoGeneral("#verTipoCliente", "#btnVerTipoClienteGen", segmentos, "SEGTIPOCLIENTE", "Tipos de Cliente Seleccionados");
                    configurarCampoSegmentoGeneral("#verMedioPago", "#btnVerMedioPagoGen", segmentos, "SEGMEDIOPAGO", "Medios de Pago Seleccionados");

                    poblarResumenAcuerdos(acuerdos);

                    if (data.articulos && data.articulos.length > 0) renderizarTablaArticulosSimple(data.articulos);
                    if (data.combos && data.combos.length > 0) renderizarTablaCombos(data.combos);
                }

                $("#vistaTabla").fadeOut(200, function () { $("#vistaDetalle").fadeIn(200); });
                $("body").css("cursor", "default");

            } else {
                $("body").css("cursor", "default");
                Swal.fire({ icon: "error", title: "Error", text: "No se pudo obtener el detalle de la promoción." });
            }
        },
        error: function (xhr) {
            $("body").css("cursor", "default"); manejarErrorGlobal(xhr, "obtener el detalle de la promoción");
        }
    });
}

function poblarResumenAcuerdos(acuerdos) {
    if (!acuerdos || acuerdos.length === 0) {
        $("#verDsctoProv, #verIdAcuerdoProv, #verComprometidoProv, #verDsctoProp, #verIdAcuerdoProp, #verComprometidoProp, #verDsctoTotal").val("");
        return;
    }
    const acProv = acuerdos.find(a => a.etiqueta_tipo_fondo === "TFPROVEDOR");
    const acProp = acuerdos.find(a => a.etiqueta_tipo_fondo === "TFPROPIO");

    if (acProv) { $("#verDsctoProv").val((acProv.porcentaje_descuento ?? 0) + "%"); $("#verIdAcuerdoProv").val(`${acProv.idacuerdo ?? ""} - ${acProv.nombre_proveedor ?? ""} - ${acProv.descripcion_acuerdo ?? ""}`); $("#verComprometidoProv").val(formatearMoneda(acProv.valor_comprometido)); }
    if (acProp) { $("#verDsctoProp").val((acProp.porcentaje_descuento ?? 0) + "%"); $("#verIdAcuerdoProp").val(`${acProp.idacuerdo ?? ""} - ${acProp.nombre_proveedor ?? ""} - ${acProp.descripcion_acuerdo ?? ""}`); $("#verComprometidoProp").val(formatearMoneda(acProp.valor_comprometido)); }

    const totalDscto = acuerdos.reduce((sum, ac) => sum + (ac.porcentaje_descuento || 0), 0);
    $("#verDsctoTotal").val(totalDscto + "%");
}

function renderizarTablaArticulosSimple(articulos) {
    let html = `<h6 class="fw-bold mb-2"><i class="fa fa-list text-primary"></i> Detalle de Artículos</h6>
        <div class="table-responsive" style="max-height: 300px; overflow-y: auto;">
            <table class="table table-bordered table-sm mb-0"><thead class="sticky-top text-nowrap">
                <tr class="text-center tabla-items-header">
                    <th class="custom-header-cons-bg">Item</th><th class="custom-header-cons-bg">Descripción</th>
                    <th class="custom-header-ingr-bg">Precio Contado</th><th class="custom-header-ingr-bg">Precio TC</th>
                    <th class="custom-header-ingr-bg">Precio Crédito</th><th class="custom-header-calc-bg">% Descuento</th>
                    <th class="custom-header-calc-bg">Valor Descuento</th>
                </tr></thead><tbody class="text-nowrap tabla-items-body bg-white">`;
    articulos.forEach(art => {
        html += `<tr><td class="fw-bold text-center">${art.codigoarticulo || art.codigoitem || ''}</td>
            <td>${art.descripcion || ''}</td>
            <td class="text-end">${formatearMoneda(art.preciocontado || art.preciopromocioncontado)}</td>
            <td class="text-end">${formatearMoneda(art.preciotarjetacredito || art.preciopromociontarjetacredito)}</td>
            <td class="text-end">${formatearMoneda(art.preciocredito || art.preciopromocioncredito)}</td>
            <td class="text-center fw-bold text-primary">${art.porcentajedescuento ?? 0}%</td>
            <td class="text-end fw-bold">${formatearMoneda(art.valordescuento)}</td></tr>`;
    });
    html += `</tbody></table></div>`;
    $('#contenedor-tabla-articulos').html(html).fadeIn();
}

// NUEVO: Se agregó el parámetro articulosotros
function renderizarTablaArticulosCompleta(articulos, articulossegmentos, articulosacuerdos, articulosotros) {
    let html = `
        <div class="d-flex justify-content-between align-items-center mb-2 mt-2">
            <input type="text" id="buscarArticuloDetalle" class="form-control form-control-sm ms-auto" placeholder="Buscar artículo..." style="width: 280px;">
        </div>
        <div class="table-responsive border rounded" style="overflow-x: auto;">
            <table id="dt-articulos-detalle" class="table table-bordered table-sm table-hover mb-0" style="width:100%">
                <thead class="sticky-top text-nowrap"><tr class="text-center tabla-items-header">
                    <th class="custom-header-cons-bg" style="min-width: 220px;">Artículo</th>
                    <th class="custom-header-cons-bg">Costo</th>
                    <th class="custom-header-cons-bg">Stock Bodega</th>
                    <th class="custom-header-cons-bg">Stock Tienda</th>
                    <th class="custom-header-cons-bg">Inv. Óptimo</th>
                    <th class="custom-header-cons-bg">Excedente(u)</th>
                    <th class="custom-header-cons-bg">Excedente($)</th>
                    <th class="custom-header-cons-bg">Vta M-0(u)</th>
                    <th class="custom-header-cons-bg">Vta M-0($)</th>
                    <th class="custom-header-cons-bg">Vta M-1(u)</th>
                    <th class="custom-header-cons-bg">Vta M-1($)</th>
                    <th class="custom-header-cons-bg">Vta M-2(u)</th>
                    <th class="custom-header-cons-bg">Vta M-2($)</th>
                    <th class="custom-header-ingr-bg">Uds. Límite</th>
                    <th class="custom-header-ingr-bg">Proyección Vtas(u)</th>
                    <th class="custom-header-ingr-bg">Medio de Pago</th>
                    <th class="custom-header-ingr-bg">Otros Costos</th> <th class="custom-header-cons-bg">Precio Lista</th>
                    <th class="custom-header-ingr-bg">Precio Promo Contado</th>
                    <th class="custom-header-ingr-bg">Precio Promo TC</th>
                    <th class="custom-header-ingr-bg">Precio Promo Crédito</th>
                    <th class="custom-header-ingr-bg">Precio Igualar</th>
                    <th class="custom-header-calc-bg">Dscto Promo Contado</th>
                    <th class="custom-header-calc-bg">Dscto Promo TC</th>
                    <th class="custom-header-calc-bg">Dscto Promo Crédito</th>
                    <th class="custom-header-calc-bg">Dscto Igualar</th>
                    <th class="custom-header-ingr-bg">Aporte Proveedor</th>
                    <th class="custom-header-ingr-bg">Aporte Prov. Acuerdo</th>
                    <th class="custom-header-ingr-bg">Aporte Rebate</th>
                    <th class="custom-header-ingr-bg">Aporte Rebate Acuerdo</th>
                    <th class="custom-header-ingr-bg">Aporte Propio</th>
                    <th class="custom-header-ingr-bg">Aporte Propio Acuerdo</th>
                    <th class="custom-header-calc-bg">Margen PL</th>
                    <th class="custom-header-calc-bg">Margen Promo Contado</th>
                    <th class="custom-header-calc-bg">Margen Promo TC</th>
                    <th class="custom-header-calc-bg">Margen Promo Crédito</th>
                    <th class="custom-header-calc-bg">Margen Igualar</th>
                    <th class="custom-header-ingr-bg">Regalo</th>
                </tr></thead>
                <tbody class="text-nowrap tabla-items-body bg-white">`;

    articulos.forEach(art => {
        const codigoItem = art.codigoitem || "";
        const idPromocionArticulo = art.idpromocionarticulo || 0;
        const medioPagoHtml = generarHtmlMedioPagoArticulo(articulossegmentos, codigoItem);
        const otrosCostosHtml = generarHtmlOtrosCostosArticulo(articulosotros, idPromocionArticulo); // NUEVO
        const ac = obtenerAcuerdosArticulo(articulosacuerdos, idPromocionArticulo);
        const esRegalo = (art.marcaregalo ?? "").toString().trim().toUpperCase() === "S";

        const provDisplay = ac.proveedor ? `${ac.proveedor.idacuerdo} - ${ac.proveedor.nombre_proveedor || ""}` : "";
        const rebateDisplay = ac.rebate ? `${ac.rebate.idacuerdo} - ${ac.rebate.nombre_proveedor || ""}` : "";
        const propioDisplay = ac.propio ? `${ac.propio.idacuerdo} - ${ac.propio.nombre_proveedor || ""}` : "";
        const apProv = ac.proveedor ? ac.proveedor.valor_aporte || 0 : 0;
        const apReb = ac.rebate ? ac.rebate.valor_aporte || 0 : 0;
        const apProp = ac.propio ? ac.propio.valor_aporte || 0 : 0;

        html += `<tr>
            <td class="fw-bold text-start">${art.descripcion || (codigoItem + ' - ')}</td>
            <td class="text-end">${formatearMoneda(art.costo)}</td>
            <td class="text-end">${art.stockbodega || 0}</td>
            <td class="text-end">${art.stocktienda || 0}</td>
            <td class="text-end">${art.inventariooptimo || 0}</td>
            <td class="text-end">${art.excedenteunidad || 0}</td>
            <td class="text-end">${formatearMoneda(art.excedentevalor)}</td>
            <td class="text-end">${art.m0unidades || 0}</td>
            <td class="text-end">${formatearMoneda(art.m0precio)}</td>
            <td class="text-end">${art.m1unidades || 0}</td>
            <td class="text-end">${formatearMoneda(art.m1precio)}</td>
            <td class="text-end">${art.m2unidades || 0}</td>
            <td class="text-end">${formatearMoneda(art.m2precio)}</td>
            <td class="text-end">${art.unidadeslimite || 0}</td>
            <td class="text-end">${art.unidadesproyeccionventas || 0}</td>
            <td class="text-center align-middle">${medioPagoHtml}</td>
            <td class="text-center align-middle">${otrosCostosHtml}</td> <td class="text-end">${formatearMoneda(art.preciolistacontado)}</td>
            <td class="text-end">${formatearMoneda(art.preciopromocioncontado)}</td>
            <td class="text-end">${formatearMoneda(art.preciopromociontarjetacredito)}</td>
            <td class="text-end">${formatearMoneda(art.preciopromocioncredito)}</td>
            <td class="text-end">${formatearMoneda(art.precioigualarprecio)}</td>
            <td class="text-end">${formatearMoneda(art.descuentopromocioncontado)}</td>
            <td class="text-end">${formatearMoneda(art.descuentopromociontarjetacredito)}</td>
            <td class="text-end">${formatearMoneda(art.descuentopromocioncredito)}</td>
            <td class="text-end">${formatearMoneda(art.descuentoigualarprecio)}</td>
            <td class="text-end">${formatearMoneda(apProv)}</td>
            <td class="text-start" style="font-size:0.75rem;">${provDisplay}</td>
            <td class="text-end">${formatearMoneda(apReb)}</td>
            <td class="text-start" style="font-size:0.75rem;">${rebateDisplay}</td>
            <td class="text-end">${formatearMoneda(apProp)}</td>
            <td class="text-start" style="font-size:0.75rem;">${propioDisplay}</td>
            <td class="text-end">${(art.margenpreciolistacontado || 0).toFixed(2)}%</td>
            <td class="text-end">${(art.margenpromocioncontado || 0).toFixed(2)}%</td>
            <td class="text-end">${(art.margenpromociontarjetacredito || 0).toFixed(2)}%</td>
            <td class="text-end">${(art.margenpromocioncredito || 0).toFixed(2)}%</td>
            <td class="text-end">${(art.margenigualarprecio || 0).toFixed(2)}%</td>
            <td class="text-center">${esRegalo ? '<i class="fa-solid fa-check text-success"></i>' : ''}</td>
        </tr>`;
    });

    html += `</tbody></table></div>`;
    $('#contenedor-tabla-articulos').html(html).fadeIn();

    dtArticulosDetalle = $('#dt-articulos-detalle').DataTable({
        destroy: true, deferRender: true, pageLength: 10, lengthMenu: [5, 10, 25, 50], pagingType: 'simple_numbers',
        searching: true, scrollX: true, dom: '<"row"<"col-12"tr>><"row mt-2"<"col-sm-5"i><"col-sm-7 d-flex justify-content-end"p>>',
        columnDefs: [{ targets: 0, className: "text-start" }], order: [[0, 'asc']],
        language: { decimal: "", emptyTable: "No hay artículos disponibles", info: "Mostrando _START_ a _END_ de _TOTAL_ artículos", infoEmpty: "Mostrando 0 a 0 de 0 artículos", infoFiltered: "(filtrado de _MAX_ artículos totales)", lengthMenu: "Mostrar _MENU_ artículos", loadingRecords: "Cargando...", processing: "Procesando...", search: "Buscar:", zeroRecords: "No se encontraron artículos coincidentes", paginate: { first: "Primero", last: "Último", next: "Siguiente", previous: "Anterior" } }
    });

    $("#buscarArticuloDetalle").off("keyup").on("keyup", function () { dtArticulosDetalle.search($(this).val()).draw(); });
}

function renderizarTablaCombos(combos) {
    let html = `<h6 class="fw-bold mb-2 mt-3"><i class="fa fa-layer-group text-primary"></i> Detalle de Combos</h6>
        <div class="table-responsive" style="max-height: 300px; overflow-y: auto;">
            <table class="table table-bordered table-sm mb-0"><thead class="sticky-top text-nowrap">
                <tr class="text-center tabla-items-header">
                    <th class="custom-header-cons-bg">Código Combo</th><th class="custom-header-cons-bg">Descripción</th>
                    <th class="custom-header-ingr-bg">Cantidad</th><th class="custom-header-ingr-bg">Precio</th>
                    <th class="custom-header-calc-bg">Valor Total</th>
                </tr></thead><tbody class="text-nowrap tabla-items-body bg-white">`;
    combos.forEach(combo => {
        html += `<tr><td class="fw-bold text-center">${combo.codigocombo || ''}</td><td>${combo.descripcion || ''}</td>
            <td class="text-center fw-bold text-primary">${combo.cantidad ?? 0}</td>
            <td class="text-end">${formatearMoneda(combo.precio)}</td>
            <td class="text-end fw-bold">${formatearMoneda(combo.valortotal)}</td></tr>`;
    });
    html += `</tbody></table></div>`;
    $('#contenedor-tabla-combos').html(html).fadeIn();
}

function cerrarDetalle() {
    if (dtArticulosDetalle) { dtArticulosDetalle.destroy(); dtArticulosDetalle = null; }
    $("#contenedor-tabla-articulos").hide().html("");
    $("#contenedor-tabla-combos").hide().html("");
    $("#vistaDetalle").fadeOut(200, function () { $("#vistaTabla").fadeIn(200); if (tabla) tabla.columns.adjust(); });
}

// ===================================================================
// INACTIVAR PROMOCIÓN
// ===================================================================
function inactivarPromocion() {
    const usuario = obtenerUsuarioActual();
    const idOpcionActual = getIdOpcionSeguro();
    const idPromocion = parseInt($("#lblIdPromocion").text(), 10);

    if (!idPromocion || isNaN(idPromocion)) { Swal.fire({ icon: "warning", title: "Atención", text: "No se pudo determinar el Id de la promoción." }); return; }
    if (idOpcionActual === "0" || !idOpcionActual) { Swal.fire({ icon: "error", title: "Error de Sesión", text: "No se pudo obtener el ID de la opción. Por favor, reingrese desde el menú." }); return; }

    Swal.fire({
        icon: "question", title: "Confirmar inactivación", text: `¿Deseas inactivar la Promoción #${idPromocion}?`,
        showCancelButton: true, confirmButtonColor: '#dc3545', cancelButtonColor: '#6c757d', confirmButtonText: "Sí, inactivar", cancelButtonText: "Cancelar"
    }).then((r) => {
        if (!r.isConfirmed) return;
        $("body").css("cursor", "wait");
        Swal.fire({ title: 'Procesando...', text: 'Por favor espere', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

        const body = { idpromocion: idPromocion, nombreusuarioingreso: usuario, idopcion: idOpcionActual, idcontrolinterfaz: "BTNINACTIVAR", idevento: "EVCLICK", nombreusuario: usuario };
        const payload = { code_app: "APP20260128155212346", http_method: "POST", endpoint_path: "api/Promocion/inactivar-promocion", client: "APL", body_request: body };

        $.ajax({
            url: "/api/apigee-router-proxy", method: "POST", contentType: "application/json", data: JSON.stringify(payload),
            success: function (response) {
                $("body").css("cursor", "default");
                if (response && response.code_status === 200) {
                    Swal.fire({ icon: "success", title: "¡Operación Exitosa!", text: response.json_response?.respuesta || "Promoción inactivada correctamente.", confirmButtonText: "Aceptar", timer: 2000, timerProgressBar: true }).then(() => { cerrarDetalle(); cargarBandeja(); });
                } else { Swal.fire({ icon: "error", title: "Error", text: response.json_response?.mensaje || "No se pudo inactivar la promoción." }); }
            },
            error: function (xhr) {
                $("body").css("cursor", "default"); Swal.fire({ icon: "error", title: "Error", text: xhr?.responseJSON?.mensaje || xhr?.responseText || "No se pudo inactivar la promoción." });
            }
        });
    });
}

// ===================================================================
// MODALES LOG Y APROBACIONES
// ===================================================================
function abrirModalLog(idPromocion) {
    $("#tbodyLog").empty(); $("#logSinDatos, #contenedorTablaLog").hide(); $("#logSpinner").show();
    new bootstrap.Modal(document.getElementById("modalRegistroLog")).show();
    const payload = { code_app: "APP20260128155212346", http_method: "GET", endpoint_path: "api/Auditoria/consultar-logs-general", client: "APL", endpoint_query_params: `/ENTPROMOCION/${idPromocion}` };

    $.ajax({
        url: "/api/apigee-router-proxy", method: "POST", contentType: "application/json", data: JSON.stringify(payload),
        success: function (response) {
            $("#logSpinner").hide(); $("#contenedorTablaLog").show();
            if (response && response.code_status === 200) {
                const logs = response.json_response || [];
                if (!Array.isArray(logs) || logs.length === 0) { $("#logSinDatos").show(); return; }
                let html = ""; window._logsCache = {};
                logs.forEach(log => {
                    window._logsCache[log.idlog] = log.datos;
                    html += `<tr><td class="text-center fw-bold">${log.idlog ?? ""}</td><td class="text-center text-nowrap">${log.fecha ?? ""}</td><td class="text-center">${log.usuario ?? ""}</td><td>${log.opción ?? log.opcion ?? ""}</td><td>${log.acción ?? log.accion ?? ""}</td><td class="text-center">${log.entidad ?? ""}</td><td class="text-center">${log.tipo_proceso ?? ""}</td><td class="text-center">${(log.datos && log.datos.toString().trim() !== "") ? `<button type="button" class="btn btn-sm btn-outline-secondary py-0 px-1" title="Ver datos" onclick="verDatosLog(${log.idlog})"><i class="fa-regular fa-file-lines"></i></button>` : ""}</td></tr>`;
                });
                $("#tbodyLog").html(html);
            } else { $("#logSinDatos").show(); }
        },
        error: function () { $("#logSpinner").hide(); $("#contenedorTablaLog").show(); $("#logSinDatos").show(); }
    });
}

function verDatosLog(idLog) {
    const datos = window._logsCache && window._logsCache[idLog];
    if (!datos) { Swal.fire({ icon: "info", title: `Log #${idLog}`, text: "No hay datos disponibles para este registro." }); return; }
    let contenido = datos; try { contenido = JSON.stringify(JSON.parse(datos), null, 2); } catch (e) { }
    Swal.fire({ icon: "info", title: `Datos del Log #${idLog}`, html: `<pre style="text-align:left; font-size:0.78rem; max-height:350px; overflow-y:auto; background:#f8f8f8; border:1px solid #ddd; border-radius:4px; padding:10px; white-space:pre-wrap; word-break:break-all;">${contenido}</pre>`, width: 700, confirmButtonText: "Cerrar" });
}

function abrirModalAprobaciones(idPromocion) {
    document.querySelectorAll('#tbodyAprobaciones [data-bs-toggle="popover"]').forEach(el => { const inst = bootstrap.Popover.getInstance(el); if (inst) inst.dispose(); });
    $("#tbodyAprobaciones").empty(); $("#aprobacionesSinDatos, #contenedorTablaAprobaciones").hide(); $("#aprobacionesSpinner").show();
    new bootstrap.Modal(document.getElementById("modalRegistroAprobaciones")).show();
    const payload = { code_app: "APP20260128155212346", http_method: "GET", endpoint_path: "api/Aprobacion/consultar-aprobaciones-generales", client: "APL", endpoint_query_params: `/ENTPROMOCION/${idPromocion}` };

    $.ajax({
        url: "/api/apigee-router-proxy", method: "POST", contentType: "application/json", data: JSON.stringify(payload),
        success: function (response) {
            $("#aprobacionesSpinner").hide(); $("#contenedorTablaAprobaciones").show();
            if (response && response.code_status === 200) {
                const aprobaciones = response.json_response || [];
                if (!Array.isArray(aprobaciones) || aprobaciones.length === 0) { $("#aprobacionesSinDatos").show(); return; }
                let html = "";
                aprobaciones.forEach(apr => {
                    const tieneComentario = apr.comentario_aprobador && apr.comentario_aprobador.toString().trim() !== "";
                    const comentarioAttr = (apr.comentario_aprobador ?? "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
                    html += `<tr><td class="text-center">${apr.tipo_solicitud ?? ""}</td><td class="text-center">${apr.usuario_solicita ?? ""}</td><td class="text-center text-nowrap">${formatearFecha(apr.fecha_solicitud)}</td><td class="text-center"><span>${apr.usuario_aprobador ?? ""}</span>${tieneComentario ? `<button type="button" class="btn btn-sm btn-link p-0 ms-1 text-dark btn-comentario-popover" data-bs-toggle="popover" data-bs-trigger="click" data-bs-placement="left" data-bs-title="Comentario de ${apr.usuario_aprobador ?? ""}" data-bs-content="${comentarioAttr}"><i class="fa-solid fa-message" style="font-size:0.8rem;"></i></button>` : ""}</td><td class="text-center text-nowrap">${formatearFecha(apr.fecha_aprobacion)}</td><td class="text-center">${apr.nivel ?? ""}</td><td class="text-center">${apr.estado ?? ""}</td><td class="text-center">${apr.lote ?? ""}</td></tr>`;
                });
                $("#tbodyAprobaciones").html(html);
                document.querySelectorAll('#tbodyAprobaciones [data-bs-toggle="popover"]').forEach(el => { new bootstrap.Popover(el, { trigger: 'click', container: '#modalRegistroAprobaciones' }); el.addEventListener('show.bs.popover', function () { document.querySelectorAll('#tbodyAprobaciones [data-bs-toggle="popover"]').forEach(other => { if (other !== el) { const inst = bootstrap.Popover.getInstance(other); if (inst) inst.hide(); } }); }); });
            } else { $("#aprobacionesSinDatos").show(); }
        },
        error: function () { $("#aprobacionesSpinner").hide(); $("#contenedorTablaAprobaciones").show(); $("#aprobacionesSinDatos").show(); }
    });
}