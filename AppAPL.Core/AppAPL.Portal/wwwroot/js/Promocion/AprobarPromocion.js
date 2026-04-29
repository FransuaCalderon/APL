// ~/js/Promocion/AprobarPromocion.js

// ===============================================================
// Variables globales
// ===============================================================
let tabla;
let ultimaFilaModificada = null;
let datosAprobacionActual = null;
let tablaHistorial;
let dtArticulosDetalle = null;

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
    if (!segmentos || !Array.isArray(segmentos) || segmentos.length === 0) {
        return "";
    }

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

    if (!nom && !isNaN(cod) && parseInt(cod) > 1) {
        return `Varios (${cod})`;
    }

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
                if (cTrim && !mapa[cTrim]) {
                    mapa[cTrim] = { codigo: cTrim, nombre: nTrim };
                }
            });
        } else {
            const key = cod || nom;
            if (key && !mapa[key]) {
                mapa[key] = { codigo: cod, nombre: nom };
            }
        }
    });

    return Object.values(mapa);
}

function configurarCampoSegmentoArticulo(inputId, btnId, segmentos, etiqueta, tituloModal) {
    const texto = obtenerTextoSegmento(segmentos, etiqueta);
    const detalles = obtenerDetallesSegmento(segmentos, etiqueta);

    $(inputId).val(texto);

    if (detalles.length > 1) {
        $(btnId)
            .removeClass("d-none btn-outline-secondary")
            .addClass("btn-success")
            .html(`<i class="fa-solid fa-list-check"></i> (${detalles.length})`)
            .off("click")
            .on("click", function () {
                abrirModalVisualizarSegmento(tituloModal, detalles);
            });
    } else {
        $(btnId)
            .addClass("d-none")
            .removeClass("btn-success")
            .addClass("btn-outline-secondary")
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
            $ul.append(`
                <li class="list-group-item d-flex align-items-center py-2">
                    <i class="fa-solid fa-check-circle text-success me-2"></i>
                    <span><strong>${det.codigo}</strong> - ${det.nombre}</span>
                </li>
            `);
        });
        $body.append($ul);
    }

    const modal = new bootstrap.Modal(document.getElementById("modalVerSegmento"));
    modal.show();
}

function generarHtmlMedioPagoArticulo(articulossegmentos, idPromocionArticulo) {
    if (!articulossegmentos || !Array.isArray(articulossegmentos)) return "Todos";

    const items = articulossegmentos.filter(s =>
        s.idpromocionarticulo === idPromocionArticulo && (s.etiqueta_tipo_segmento || "").toUpperCase() === "SEGMEDIOPAGO"
    );

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
        let cod = detalles[0].codigo;
        let nom = detalles[0].nombre;
        if (!nom && !isNaN(cod) && parseInt(cod) > 1) {
            return `Varios (${cod})`;
        }
        if (cod.toUpperCase() === "TODOS") return "Todos";
        if (cod && nom) return `${cod} - ${nom}`;
        return cod || nom || "Todos";
    }

    return "Todos";
}

// ===============================================================
// HELPER: Generar HTML Medio Pago para Combos
// ===============================================================
function generarHtmlMedioPagoCombo(articulossegmentos, idPromocionArticulo, codigoCombo, idPromocionCombo) {
    if (!articulossegmentos || !Array.isArray(articulossegmentos)) return "Todos";

    // Filtramos siendo ultra flexibles con las llaves de relación
    const items = articulossegmentos.filter(s => {
        const tag = (s.etiqueta_tipo_segmento || "").toUpperCase();
        if (tag !== "SEGMEDIOPAGO") return false;

        let coincide = false;
        const targetCodigo = (codigoCombo || "").toString().trim().toUpperCase();
        const sCodigo = (s.codigo_combo || s.codigocombo || "").toString().trim().toUpperCase();

        // 1. Validar por coincidencia de Código del Combo
        if (targetCodigo && sCodigo && targetCodigo === sCodigo) coincide = true;
        // 2. Validar por coincidencia de ID Promoción Artículo
        if (idPromocionArticulo && s.idpromocionarticulo === idPromocionArticulo) coincide = true;
        // 3. Validar por coincidencia de ID Promoción Combo (por si el backend usa esta llave)
        if (idPromocionCombo && (s.idpromocioncombo === idPromocionCombo || s.idpromocionarticulo === idPromocionCombo)) coincide = true;

        return coincide;
    });

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
        let cod = detalles[0].codigo;
        let nom = detalles[0].nombre;
        if (!nom && !isNaN(cod) && parseInt(cod) > 1) return `Varios (${cod})`;
        if (cod.toUpperCase() === "TODOS") return "Todos";

        return nom || cod || "Todos";
    }
    return "Todos";
}

// ===============================================================
// Generar HTML para Otros Costos
// ===============================================================
function generarHtmlOtrosCostosArticulo(articulosotros, idPromocionArticulo) {
    if (!articulosotros || !Array.isArray(articulosotros)) return "N/A";

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

    $('#btnVolverTabla, #btnVolverAbajo').on('click', function () { cerrarDetalle(); });

    $('#btnAprobarPromocion').on('click', function () {
        procesarAprobacionPromocion("APROBAR", $("#modal-promocion-comentario").val());
    });

    $('#btnRechazarPromocion').on('click', function () {
        procesarAprobacionPromocion("RECHAZAR", $("#modal-promocion-comentario").val());
    });

    // Eventos Visor PDF
    $("#btnVerSoporte").on("click", function () {
        const soporte = $(this).data("soporte");
        if (!soporte) { Swal.fire({ icon: "info", title: "Sin soporte", text: "Esta promoción no tiene un archivo de soporte adjunto." }); return; }
        const nombreArchivoConGuid = obtenerNombreArchivoConGuid(soporte);
        if (!nombreArchivoConGuid) { Swal.fire({ icon: "info", title: "Sin soporte", text: "No se pudo determinar el nombre del archivo." }); return; }
        abrirVisorPDF(nombreArchivoConGuid);
    });

    $("#btnCerrarVisorPdf, #btnCerrarVisorPdfFooter").on("click", function () { cerrarVisorPDF(); });

    $("#btnDescargarPdf").on("click", function () {
        const url = $(this).data("blob-url");
        const nombre = $(this).data("nombre-archivo");
        if (url) { const a = document.createElement("a"); a.href = url; a.download = nombre || "soporte.pdf"; document.body.appendChild(a); a.click(); document.body.removeChild(a); }
    });

    // Evento para abrir el modal de "Medios de Pago" desde la tabla de artículos/combos
    $(document).on("click", ".btn-ver-mediopago-grid", function () {
        const detalles = $(this).data("detalles");
        abrirModalVisualizarSegmento("Medios de Pago Seleccionados", detalles);
    });

    // Evento dinámico Otros Costos en Grilla
    $(document).on("click", ".btn-ver-otroscostos-grid", function () {
        const detalles = $(this).data("detalles");
        abrirModalVisualizarSegmento("Otros Costos Seleccionados", detalles);
    });
});

// ===================================================================
// VISOR DE PDF EMBEBIDO
// ===================================================================
function abrirVisorPDF(nombreArchivo) {
    $("#pdfSpinner").show(); $("#pdfVisorContenido").hide(); $("#pdfVisorError").hide(); $("#btnDescargarPdf").hide();
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
        .then(r => { if (!r.ok) return r.text().then(t => { throw new Error(t || `Error HTTP ${r.status}`); }); return r.blob(); })
        .then(blob => {
            const pdfBlob = new Blob([blob], { type: "application/pdf" });
            const blobUrl = URL.createObjectURL(pdfBlob);
            $("#pdfIframe").attr("src", blobUrl); $("#pdfSpinner").hide(); $("#pdfVisorContenido").show();
            const nombreLegible = obtenerNombreArchivo(nombreArchivo);
            $("#btnDescargarPdf").data("blob-url", blobUrl).data("nombre-archivo", nombreLegible || "soporte.pdf").show();
        })
        .catch(error => { $("#pdfSpinner").hide(); $("#pdfVisorError").html(`<i class="fa-solid fa-triangle-exclamation me-2"></i> ${error.message}`).show(); });
}

function cerrarVisorPDF() {
    const iframe = document.getElementById("pdfIframe");
    const blobUrl = $("#btnDescargarPdf").data("blob-url");
    if (blobUrl) { URL.revokeObjectURL(blobUrl); $("#btnDescargarPdf").removeData("blob-url"); }
    if (iframe) iframe.src = "about:blank";
    const modal = bootstrap.Modal.getInstance(document.getElementById("modalVisorPdf"));
    if (modal) modal.hide();
}

// ===================================================================
// BANDEJA
// ===================================================================
function cargarBandeja() {
    const usuario = obtenerUsuarioActual();
    if (!usuario) return;
    const payload = { code_app: "APP20260128155212346", http_method: "GET", endpoint_path: "api/Promocion/consultar-bandeja-aprobacion", client: "APL", endpoint_query_params: `/${usuario}` };
    $.ajax({
        url: "/api/apigee-router-proxy", method: "POST", contentType: "application/json", data: JSON.stringify(payload),
        success: function (response) {
            if (response && response.code_status === 200) { crearListado(response.json_response || []); }
            else { Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudieron cargar las promociones para aprobación' }); }
        },
        error: (xhr) => manejarErrorGlobal(xhr, "cargar la bandeja de aprobación de promociones")
    });
}

function crearListado(data) {
    if (tabla) tabla.destroy();
    if (!data || data.length === 0) { $('#tabla').html("<div class='alert alert-info text-center'>No hay promociones para aprobar.</div>"); return; }

    var html = `<table id='tabla-principal' class='table table-bordered table-striped table-hover'><thead>
        <tr><th colspan='13' style='background-color: #CC0000 !important; color: white; text-align: center; font-weight: bold; padding: 8px; font-size: 1rem;'>BANDEJA DE APROBACIÓN DE PROMOCIONES</th></tr>
        <tr><th>Acción</th><th>Solicitud</th><th>Id Promoción</th><th>Descripción</th><th>Motivo</th><th>Clase de Promoción</th><th>Fecha Solicitud</th><th>Usuario Solicita</th><th>Fecha Inicio</th><th>Fecha Fin</th><th>Regalo</th><th>Soporte</th><th>Estado</th></tr></thead><tbody>`;

    for (var i = 0; i < data.length; i++) {
        var promo = data[i];
        var viewButton = '<button type="button" class="btn-action view-btn" title="Visualizar/Aprobar" onclick="abrirModalEditar(' + promo.idpromocion + ', ' + promo.idaprobacion + ')"><i class="fa-regular fa-eye"></i></button>';
        var clasePromocionHTML = (promo.nombre_clase_promocion ?? "");
        if (promo.cantidad_articulos > 0) clasePromocionHTML += '<sup style="font-size: 0.8em; margin-left: 2px; font-weight: bold;">' + promo.cantidad_articulos + '</sup>';

        html += "<tr>";
        html += "<td class='text-center'>" + viewButton + "</td>";
        html += "<td class='text-center'>" + (promo.solicitud ?? "") + "</td>";
        html += "<td class='text-center'>" + (promo.idpromocion ?? "") + "</td>";
        html += "<td>" + (promo.descripcion ?? "") + "</td>";
        html += "<td>" + (promo.motivo ?? "") + "</td>";
        html += "<td>" + clasePromocionHTML + "</td>";
        html += "<td class='text-center'>" + formatearFecha(promo.fechasolicitud) + "</td>";
        html += "<td class='text-center'>" + (promo.nombreusersolicitud ?? "") + "</td>";
        html += "<td class='text-center'>" + formatearFecha(promo.fechahorainicio) + "</td>";
        html += "<td class='text-center'>" + formatearFecha(promo.fechahorafin) + "</td>";
        html += "<td class='text-center'>" + (promo.marcaregalo && promo.marcaregalo !== "N" ? "✓" : "") + "</td>";
        html += "<td>" + obtenerNombreArchivo(promo.archivosoporte) + "</td>";
        html += "<td class='text-center'>" + (promo.nombre_estado ?? "") + "</td>";
        html += "</tr>";
    }
    html += "</tbody></table>";
    $('#tabla').html(html);

    tabla = $('#tabla-principal').DataTable({
        pageLength: 10, lengthMenu: [5, 10, 25, 50], pagingType: 'full_numbers',
        columnDefs: [
            { targets: 0, width: "5%", className: "dt-center", orderable: false },
            { targets: 1, width: "8%", className: "dt-center" },
            { targets: 2, width: "8%", className: "dt-center" },
            { targets: [6, 8, 9], className: "dt-center" },
        ],
        order: [[2, 'desc']],
        language: { decimal: "", emptyTable: "No hay datos disponibles en la tabla", info: "Mostrando _START_ a _END_ de _TOTAL_ registros", infoEmpty: "Mostrando 0 a 0 de 0 registros", infoFiltered: "(filtrado de _MAX_ registros totales)", lengthMenu: "Mostrar _MENU_ registros", loadingRecords: "Cargando...", processing: "Procesando...", search: "Buscar:", zeroRecords: "No se encontraron registros coincidentes", paginate: { first: "Primero", last: "Último", next: "Siguiente", previous: "Anterior" } }
    });
}

// ===================================================================
// DETALLE (VISUALIZAR Y APROBAR)
// ===================================================================
function abrirModalEditar(idPromocion, idAprobacion) {
    if (!idAprobacion || isNaN(idAprobacion) || parseInt(idAprobacion) <= 0) {
        Swal.fire({ icon: 'warning', title: 'Sin Aprobación Pendiente', text: `La promoción #${idPromocion} no tiene un proceso de aprobación activo.` });
        return;
    }

    $('body').css('cursor', 'wait');
    datosAprobacionActual = null;

    if (dtArticulosDetalle) { dtArticulosDetalle.destroy(); dtArticulosDetalle = null; }

    $("#formVisualizar")[0].reset();
    $("#lblIdPromocion").text(idPromocion);
    $("#btnVerSoporte").data("soporte", "").removeData("soporte").attr("title", "Ver Soporte").removeClass("text-danger");

    $('#tabla-aprobaciones-promocion').html('');
    $('#contenedor-tabla-articulos').html('').hide();
    $('#contenedor-tabla-combos').html('').hide();
    $('#contenedor-tabla-combos-completa').html('').hide();

    $('#seccion-detalle-general').hide();
    $('#seccion-detalle-articulos').hide();
    $('#seccion-detalle-combos').hide();

    // ARTICULOS Y COMBOS
    $("#btnVerCanalArt, #btnVerGrupoAlmacenArt, #btnVerAlmacenArt, #btnVerTipoClienteArt, #btnVerCanalComb, #btnVerGrupoAlmacenComb, #btnVerAlmacenComb, #btnVerTipoClienteComb")
        .addClass("d-none").removeClass("btn-success").addClass("btn-outline-secondary")
        .html('<i class="fa-solid fa-list-check"></i>').off("click");

    // GENERAL
    $(".promo-col-value .icon-btn")
        .css({ "background-color": "#e8e8e8", "color": "#666", "cursor": "default" })
        .html('<i class="fa-solid fa-list-check"></i>')
        .prop("disabled", true)
        .off("click");

    const payload = { code_app: "APP20260128155212346", http_method: "GET", endpoint_path: "api/Promocion/bandeja-aprobacion-id", client: "APL", endpoint_query_params: `/${idPromocion}/${idAprobacion}` };

    $.ajax({
        url: "/api/apigee-router-proxy", method: "POST", contentType: "application/json", data: JSON.stringify(payload),
        success: function (response) {
            if (response && response.code_status === 200) {
                const data = response.json_response || {};
                const cab = data.cabecera || {};
                const segmentos = data.segmentos || [];
                const acuerdos = data.acuerdos || [];
                const articulosotros = data.articulosotros || [];
                const tipoPromocion = (cab.etiqueta_clase_promocion || data.tipopromocion || "").toUpperCase();

                datosAprobacionActual = {
                    entidad: cab.id_entidad || 0, identidad: cab.idpromocion || 0, idtipoproceso: cab.id_tipo_proceso || 0,
                    idetiquetatipoproceso: cab.tipo_proceso_etiqueta || "", idaprobacion: idAprobacion,
                    entidad_etiqueta: cab.entidad_etiqueta, idetiquetatestado: cab.etiqueta_estado_promocion || "", comentario: ""
                };

                $("#verPromocionHeader").val(`${cab.idpromocion ?? ""} - ${cab.nombre_clase_promocion ?? ""}`);

                const rutaSoporte = cab.archivosoporte ?? "";
                $("#btnVerSoporte").data("soporte", rutaSoporte).toggleClass("text-danger", !!rutaSoporte)
                    .attr("title", rutaSoporte ? `Ver Soporte: ${obtenerNombreArchivo(rutaSoporte)}` : "Sin soporte");

                $("#verDescripcion").val(cab.descripcion ?? "");
                $("#verMotivo").val(cab.nombre_motivo ?? "");
                $("#verFechaInicio").val(formatearFechaHora(cab.fecha_inicio));
                $("#verFechaFin").val(formatearFechaHora(cab.fecha_fin));
                $("#verEstado").val(cab.nombre_estado_promocion ?? "");
                $("#verRegalo").prop("checked", (cab.marcaregalo ?? "").toString().trim().toUpperCase() === "S");

                // =================================================================
                // DECIDIR VISTA SEGÚN TIPO DE PROMOCIÓN
                // =================================================================
                if (tipoPromocion === "PRARTICULO") {
                    $('#seccion-detalle-general').hide();
                    $('#seccion-detalle-combos').hide();
                    $('#seccion-detalle-articulos').show();

                    configurarCampoSegmentoArticulo("#verCanalArt", "#btnVerCanalArt", segmentos, "SEGCANAL", "Canales Seleccionados");
                    configurarCampoSegmentoArticulo("#verGrupoAlmacenArt", "#btnVerGrupoAlmacenArt", segmentos, "SEGGRUPOALMACEN", "Grupos Almacén Seleccionados");
                    configurarCampoSegmentoArticulo("#verAlmacenArt", "#btnVerAlmacenArt", segmentos, "SEGALMACEN", "Almacenes Seleccionados");
                    configurarCampoSegmentoArticulo("#verTipoClienteArt", "#btnVerTipoClienteArt", segmentos, "SEGTIPOCLIENTE", "Tipos de Cliente Seleccionados");

                    if (data.articulos && data.articulos.length > 0) {
                        renderizarTablaArticulosCompleta(data.articulos, data.articulossegmentos || [], data.articulosacuerdos || [], articulosotros);
                    } else {
                        $('#contenedor-tabla-articulos').html('<div class="alert alert-info text-center">No hay artículos en esta promoción.</div>').show();
                    }

                } else if (tipoPromocion === "PRCOMBO") {
                    $('#seccion-detalle-general').hide();
                    $('#seccion-detalle-articulos').hide();
                    $('#seccion-detalle-combos').show();

                    configurarCampoSegmentoArticulo("#verCanalComb", "#btnVerCanalComb", segmentos, "SEGCANAL", "Canales Seleccionados");
                    configurarCampoSegmentoArticulo("#verGrupoAlmacenComb", "#btnVerGrupoAlmacenComb", segmentos, "SEGGRUPOALMACEN", "Grupos Almacén Seleccionados");
                    configurarCampoSegmentoArticulo("#verAlmacenComb", "#btnVerAlmacenComb", segmentos, "SEGALMACEN", "Almacenes Seleccionados");
                    configurarCampoSegmentoArticulo("#verTipoClienteComb", "#btnVerTipoClienteComb", segmentos, "SEGTIPOCLIENTE", "Tipos de Cliente Seleccionados");

                    if (data.articulos && data.articulos.length > 0) {
                        renderizarTablaCombosCompleta(data.articulos, data.articulossegmentos || []);
                    } else {
                        $('#contenedor-tabla-combos-completa').html('<div class="alert alert-info text-center">No hay combos en esta promoción.</div>').show();
                    }

                } else {
                    $('#seccion-detalle-general').show();
                    $('#seccion-detalle-articulos').hide();
                    $('#seccion-detalle-combos').hide();

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
                $('body').css('cursor', 'default');

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
        error: function (xhr) { $('body').css('cursor', 'default'); manejarErrorGlobal(xhr, "cargar los datos de la promoción"); }
    });
}

function poblarResumenAcuerdos(acuerdos) {
    if (!acuerdos || acuerdos.length === 0) { $("#verDsctoProv, #verIdAcuerdoProv, #verComprometidoProv, #verDsctoProp, #verIdAcuerdoProp, #verComprometidoProp, #verDsctoTotal").val(""); return; }
    const acProv = acuerdos.find(a => a.etiqueta_tipo_fondo === "TFPROVEDOR");
    const acProp = acuerdos.find(a => a.etiqueta_tipo_fondo === "TFPROPIO");
    if (acProv) { $("#verDsctoProv").val((acProv.porcentaje_descuento ?? 0) + "%"); $("#verIdAcuerdoProv").val(`${acProv.idacuerdo ?? ""} - ${acProv.nombre_proveedor ?? ""} - ${acProv.descripcion_acuerdo ?? ""}`); $("#verComprometidoProv").val(formatearMoneda(acProv.valor_comprometido)); }
    if (acProp) { $("#verDsctoProp").val((acProp.porcentaje_descuento ?? 0) + "%"); $("#verIdAcuerdoProp").val(`${acProp.idacuerdo ?? ""} - ${acProp.nombre_proveedor ?? ""} - ${acProp.descripcion_acuerdo ?? ""}`); $("#verComprometidoProp").val(formatearMoneda(acProp.valor_comprometido)); }
    const totalDscto = acuerdos.reduce((sum, ac) => sum + (ac.porcentaje_descuento || 0), 0);
    $("#verDsctoTotal").val(totalDscto + "%");
}

// ===================================================================
// TABLA ARTÍCULOS SIMPLE (para General)
// ===================================================================
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

// ===================================================================
// TABLA ARTÍCULOS COMPLETA (para PRARTICULO)
// ===================================================================
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
                    <th class="custom-header-cons-bg">Vta M-12(u)</th>
                    <th class="custom-header-cons-bg">Vta M-12($)</th>
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

        // Pasamos el ID exacto del artículo para evitar duplicados en la visualización
        const medioPagoHtml = generarHtmlMedioPagoArticulo(articulossegmentos, idPromocionArticulo);
        const otrosCostosHtml = generarHtmlOtrosCostosArticulo(articulosotros, idPromocionArticulo);
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
            <td class="text-end">${art.m12unidades || 0}</td>
            <td class="text-end">${formatearMoneda(art.m12precio || 0)}</td>
            <td class="text-end">${art.unidadeslimite || 0}</td>
            <td class="text-end">${art.unidadesproyeccionventas || 0}</td>
            <td class="text-center align-middle">${medioPagoHtml}</td>
            <td class="text-center align-middle">${otrosCostosHtml}</td> 
            <td class="text-end">${formatearMoneda(art.preciolistacontado)}</td>
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
        destroy: true, deferRender: true, pageLength: 10, lengthMenu: [5, 10, 25, 50],
        pagingType: 'simple_numbers', searching: true, scrollX: true,
        dom: '<"row"<"col-12"tr>><"row mt-2"<"col-sm-5"i><"col-sm-7 d-flex justify-content-end"p>>',
        columnDefs: [{ targets: 0, className: "text-start" }],
        order: [[0, 'asc']],
        language: {
            decimal: "", emptyTable: "No hay artículos disponibles",
            info: "Mostrando _START_ a _END_ de _TOTAL_ artículos",
            infoEmpty: "Mostrando 0 a 0 de 0 artículos",
            infoFiltered: "(filtrado de _MAX_ artículos totales)",
            lengthMenu: "Mostrar _MENU_ artículos",
            loadingRecords: "Cargando...", processing: "Procesando...",
            search: "Buscar:", zeroRecords: "No se encontraron artículos coincidentes",
            paginate: { first: "Primero", last: "Último", next: "Siguiente", previous: "Anterior" }
        }
    });

    $("#buscarArticuloDetalle").off("keyup").on("keyup", function () {
        dtArticulosDetalle.search($(this).val()).draw();
    });
}

// ===================================================================
// TABLA COMBOS SIMPLE (para General)
// ===================================================================
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

// ===============================================================
// RENDERIZAR TABLA COMBOS COMPLETA (Específica para PRCOMBO)
// ===============================================================
function renderizarTablaCombosCompleta(articulos, articulossegmentos) {
    const combosMap = {};

    articulos.forEach((art, index) => {
        const cod = art.codigo_combo;
        if (!cod) return;

        // Se usa idpromocionarticulo para garantizar que cada registro de combo se muestre individualmente
        const key = art.idpromocionarticulo || `${cod}_${index}`;

        if (!combosMap[key]) {
            combosMap[key] = {
                id_promo_art: art.idpromocionarticulo,
                id_promo_combo: art.idpromocioncombo || 0,
                codigo: cod,
                descripcion: art.descripcion_combo,
                costo: art.costo_combo || 0,
                unidades_limite: art.combo_unidades_limite || 0,
                proyeccion: art.combo_unidades_proyeccion || 0,
                pl_contado: art.combo_precio_lista_contado || 0,
                pl_credito: art.combo_precio_lista_credito || 0,
                promo_contado: art.combo_precio_promo_contado || 0,
                promo_tc: art.combo_precio_promo_tc || 0,
                promo_credito: art.combo_precio_promo_credito || 0,
                dscto_contado: art.combo_desc_promo_contado || 0,
                dscto_tc: art.combo_desc_promo_tc || 0,
                dscto_credito: art.combo_desc_promo_credito || 0,
                margen_contado: art.combo_margen_promo_contado || 0,
                margen_tc: art.combo_margen_promo_tc || 0,
                margen_credito: art.combo_margen_promo_credito || 0,
                regalo: art.combo_marca_regalo === "S",
                stock_bodega: 0,
                stock_tienda: 0,
                inv_optimo: 0,
                excedente_u: 0,
                excedente_usd: 0
            };
        }

        // Sumatoria de inventarios de los componentes de este combo (si el array trae los componentes)
        if (art.comp_codigo_item) {
            combosMap[key].stock_bodega += (art.comp_stock_bodega || 0);
            combosMap[key].stock_tienda += (art.comp_stock_tienda || 0);
            combosMap[key].inv_optimo += (art.comp_inventario_optimo || 0);
            combosMap[key].excedente_u += (art.comp_excedente_unidad || 0);
            combosMap[key].excedente_usd += (art.comp_excedente_valor || 0);
        }
    });

    const combosArray = Object.values(combosMap);

    let html = `
        <div class="d-flex justify-content-between align-items-center mb-2 mt-2">
            <input type="text" id="buscarComboDetalleCompleto" class="form-control form-control-sm ms-auto" placeholder="Buscar combo..." style="width: 280px;">
        </div>
        <div class="table-responsive border rounded" style="overflow-x: auto;">
            <table id="dt-combos-detalle-completa" class="table table-bordered table-sm table-hover mb-0" style="width:100%">
                <thead class="sticky-top text-nowrap">
                    <tr class="text-center tabla-items-header">
                        <th class="custom-header-cons-bg" style="min-width: 220px;">Combo</th>
                        <th class="custom-header-cons-bg">Costo</th>
                        <th class="custom-header-cons-bg">Stock Bodega</th>
                        <th class="custom-header-cons-bg">Stock Tienda</th>
                        <th class="custom-header-cons-bg">Inv. Óptimo</th>
                        <th class="custom-header-cons-bg">Excedente(u)</th>
                        <th class="custom-header-cons-bg">Excedente($)</th>
                        <th class="custom-header-ingr-bg">Uds. Límite</th>
                        <th class="custom-header-ingr-bg">Proyección Vtas(u)</th>
                        <th class="custom-header-ingr-bg">Medio de Pago</th>
                        <th class="custom-header-cons-bg">Precio Lista Cont.</th>
                        <th class="custom-header-cons-bg">Precio Lista Créd.</th>
                        <th class="custom-header-ingr-bg">Precio Promo Cont.</th>
                        <th class="custom-header-ingr-bg">Precio Promo TC</th>
                        <th class="custom-header-ingr-bg">Precio Promo Créd.</th>
                        <th class="custom-header-calc-bg">Dscto Promo Cont.</th>
                        <th class="custom-header-calc-bg">Dscto Promo TC</th>
                        <th class="custom-header-calc-bg">Dscto Promo Créd.</th>
                        <th class="custom-header-calc-bg">Margen Promo Cont.</th>
                        <th class="custom-header-calc-bg">Margen Promo TC</th>
                        <th class="custom-header-calc-bg">Margen Promo Créd.</th>
                        <th class="custom-header-ingr-bg">Regalo</th>
                    </tr>
                </thead>
                <tbody class="text-nowrap tabla-items-body bg-white">`;

    combosArray.forEach(cmb => {
        const medioPagoHtml = generarHtmlMedioPagoCombo(articulossegmentos, cmb.id_promo_art, cmb.codigo, cmb.id_promo_combo);

        html += `<tr>
            <td class="fw-bold text-start">${cmb.codigo} - ${cmb.descripcion}</td>
            <td class="text-end">${formatearMoneda(cmb.costo)}</td>
            <td class="text-end">${cmb.stock_bodega}</td>
            <td class="text-end">${cmb.stock_tienda}</td>
            <td class="text-end">${cmb.inv_optimo}</td>
            <td class="text-end">${cmb.excedente_u}</td>
            <td class="text-end">${formatearMoneda(cmb.excedente_usd)}</td>
            <td class="text-end">${cmb.unidades_limite}</td>
            <td class="text-end">${cmb.proyeccion}</td>
            <td class="text-center align-middle">${medioPagoHtml}</td>
            <td class="text-end">${formatearMoneda(cmb.pl_contado)}</td>
            <td class="text-end">${formatearMoneda(cmb.pl_credito)}</td>
            <td class="text-end">${formatearMoneda(cmb.promo_contado)}</td>
            <td class="text-end">${formatearMoneda(cmb.promo_tc)}</td>
            <td class="text-end">${formatearMoneda(cmb.promo_credito)}</td>
            <td class="text-end">${formatearMoneda(cmb.dscto_contado)}</td>
            <td class="text-end">${formatearMoneda(cmb.dscto_tc)}</td>
            <td class="text-end">${formatearMoneda(cmb.dscto_credito)}</td>
            <td class="text-end">${cmb.margen_contado.toFixed(2)}%</td>
            <td class="text-end">${cmb.margen_tc.toFixed(2)}%</td>
            <td class="text-end">${cmb.margen_credito.toFixed(2)}%</td>
            <td class="text-center">${cmb.regalo ? '<i class="fa-solid fa-check text-success"></i>' : ''}</td>
        </tr>`;
    });

    html += `</tbody></table></div>`;
    $('#contenedor-tabla-combos-completa').html(html).fadeIn();

    const dtCombos = $('#dt-combos-detalle-completa').DataTable({
        destroy: true, deferRender: true, pageLength: 10, lengthMenu: [5, 10, 25, 50],
        pagingType: 'simple_numbers', searching: true, scrollX: true,
        dom: '<"row"<"col-12"tr>><"row mt-2"<"col-sm-5"i><"col-sm-7 d-flex justify-content-end"p>>',
        columnDefs: [{ targets: 0, className: "text-start" }],
        order: [[0, 'asc']],
        language: {
            decimal: "", emptyTable: "No hay combos disponibles",
            info: "Mostrando _START_ a _END_ de _TOTAL_ combos",
            infoEmpty: "Mostrando 0 a 0 de 0 combos",
            search: "Buscar:", zeroRecords: "No se encontraron combos coincidentes",
            paginate: { first: "Primero", last: "Último", next: "Siguiente", previous: "Anterior" }
        }
    });

    $("#buscarComboDetalleCompleto").off("keyup").on("keyup", function () {
        dtCombos.search($(this).val()).draw();
    });
}

function cerrarDetalle() {
    $("#vistaDetalle").fadeOut(200, function () { $("#vistaTabla").fadeIn(200); if (tabla) tabla.columns.adjust(); });
    datosAprobacionActual = null;
    if (dtArticulosDetalle) { dtArticulosDetalle.destroy(); dtArticulosDetalle = null; }
}

// ===================================================================
// HISTORIAL DE APROBACIONES
// ===================================================================
function cargarAprobacionesPromocion(entidad, idEntidad, tipoProceso) {
    if ($.fn.DataTable.isDataTable('#dt-historial')) { $('#dt-historial').DataTable().destroy(); }
    document.querySelectorAll('#tabla-aprobaciones-promocion [data-bs-toggle="popover"]').forEach(el => { const inst = bootstrap.Popover.getInstance(el); if (inst) inst.dispose(); });

    $('#tabla-aprobaciones-promocion').html(`<div class="text-center p-3"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Cargando...</span></div><p class="mt-2 small text-muted">Cargando historial...</p></div>`);

    const payload = { code_app: "APP20260128155212346", http_method: "GET", endpoint_path: "api/Aprobacion/consultar-aprobaciones-promocion", client: "APL", endpoint_query_params: `/ENTPROMOCION/${idEntidad}` };

    $.ajax({
        url: "/api/apigee-router-proxy", method: "POST", contentType: "application/json", data: JSON.stringify(payload),
        success: function (response) {
            if (response && response.code_status === 200) {
                let lista = response.json_response || [];
                if (!Array.isArray(lista)) lista = [lista];
                if (!lista || lista.length === 0) { $('#tabla-aprobaciones-promocion').html('<div class="alert alert-light text-center border">No hay historial de aprobaciones disponibles.</div>'); return; }

                let html = `<table id='dt-historial' class='table table-sm table-bordered table-hover w-100'><thead class="table-light"><tr>
                    <th class="text-center">Tipo Solicitud</th><th class="text-center">Usuario Solicita</th><th class="text-center">Fecha Solicitud</th>
                    <th class="text-center">Usuario Aprobador</th><th class="text-center">Fecha Aprobación</th><th class="text-center">Nivel</th>
                    <th class="text-center">Estado</th><th class="text-center">Lote</th></tr></thead><tbody>`;

                lista.forEach(apr => {
                    const tieneComentario = apr.comentario_aprobador && apr.comentario_aprobador.toString().trim() !== "";
                    const comentarioAttr = (apr.comentario_aprobador ?? "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
                    html += `<tr>
                        <td class="text-center">${apr.tipo_solicitud ?? ""}</td>
                        <td class="text-center">${apr.usuario_solicita ?? ""}</td>
                        <td class="text-center text-nowrap">${formatearFecha(apr.fecha_solicitud)}</td>
                        <td class="text-center"><span>${apr.usuario_aprobador ?? ""}</span>${tieneComentario ? `<button type="button" class="btn btn-sm btn-link p-0 ms-1 text-dark btn-comentario-popover" data-bs-toggle="popover" data-bs-trigger="focus" data-bs-placement="left" data-bs-title="Comentario de ${apr.usuario_aprobador ?? ""}" data-bs-content="${comentarioAttr}"><i class="fa-solid fa-message text-warning" style="font-size:0.9rem;"></i></button>` : ""}</td>
                        <td class="text-center text-nowrap">${formatearFecha(apr.fecha_aprobacion)}</td>
                        <td class="text-center">${apr.nivel ?? ""}</td>
                        <td class="text-center">${apr.estado ?? ""}</td>
                        <td class="text-center">${apr.lote ?? ""}</td></tr>`;
                });
                html += `</tbody></table>`;
                $('#tabla-aprobaciones-promocion').html(html);

                tablaHistorial = $('#dt-historial').DataTable({
                    pageLength: 5, lengthMenu: [5, 10, 25], pagingType: 'simple_numbers', searching: false,
                    columnDefs: [{ targets: [0, 5, 7], className: "dt-center" }, { targets: [2, 4], className: "dt-nowrap dt-center" }],
                    order: [],
                    language: { decimal: "", emptyTable: "No hay aprobaciones disponibles", info: "Mostrando _START_ a _END_ de _TOTAL_ aprobaciones", infoEmpty: "Mostrando 0 a 0 de 0 aprobaciones", infoFiltered: "(filtrado de _MAX_ aprobaciones totales)", lengthMenu: "Mostrar _MENU_ aprobaciones", loadingRecords: "Cargando...", processing: "Procesando...", search: "Buscar:", zeroRecords: "No se encontraron aprobaciones coincidentes", paginate: { first: "Primero", last: "Último", next: "Siguiente", previous: "Anterior" } },
                    drawCallback: function () { const popoverTriggerList = document.querySelectorAll('#dt-historial [data-bs-toggle="popover"]');[...popoverTriggerList].map(el => new bootstrap.Popover(el)); }
                });
            } else { $('#tabla-aprobaciones-promocion').html('<div class="text-danger small text-center p-3 border">Error al cargar historial.</div>'); }
        },
        error: function () { $('#tabla-aprobaciones-promocion').html('<div class="text-danger small text-center p-3 border">Error al cargar historial.</div>'); }
    });
}

// ===================================================================
// APROBAR/RECHAZAR PROMOCIONES
// ===================================================================
function procesarAprobacionPromocion(accion, comentario) {
    if (!datosAprobacionActual) { Swal.fire({ icon: 'error', title: 'Error', text: 'No hay datos de aprobación disponibles.' }); return; }
    let nuevoEstado = accion === "APROBAR" ? "ESTADOAPROBADO" : "ESTADONEGADO";
    let tituloAccion = accion === "APROBAR" ? "Aprobar Promoción" : "Rechazar Promoción";
    let mensajeAccion = accion === "APROBAR" ? "¿Está seguro que desea aprobar esta promoción?" : "¿Está seguro que desea rechazar esta promoción?";
    Swal.fire({ title: tituloAccion, text: mensajeAccion, icon: 'warning', showCancelButton: true, confirmButtonColor: accion == "APROBAR" ? '#28a745' : '#dc3545', cancelButtonColor: '#6c757d', confirmButtonText: accion == "APROBAR" ? 'Sí, aprobar' : 'Sí, rechazar', cancelButtonText: 'Cancelar' })
        .then((result) => { if (result.isConfirmed) ejecutarAprobacionPromocion(accion, nuevoEstado, comentario); });
}

function ejecutarAprobacionPromocion(accion, nuevoEstado, comentario) {
    const idOpcionActual = obtenerIdOpcionSeguro();
    const usuarioActual = obtenerUsuarioActual();
    const body = { entidad: datosAprobacionActual.entidad, identidad: datosAprobacionActual.identidad, idtipoproceso: datosAprobacionActual.idtipoproceso, idetiquetatipoproceso: datosAprobacionActual.idetiquetatipoproceso, comentario: comentario, idetiquetaestado: nuevoEstado, idaprobacion: datosAprobacionActual.idaprobacion, usuarioaprobador: usuarioActual, idopcion: idOpcionActual, idcontrolinterfaz: accion == "APROBAR" ? "BTNAPROBAR" : "BTNNEGAR", idevento: "EVCLICK", nombreusuario: usuarioActual };

    Swal.fire({ title: 'Procesando...', text: 'Por favor espere', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    const payload = { code_app: "APP20260128155212346", http_method: "POST", endpoint_path: "api/Promocion/aprobar-promocion", client: "APL", body_request: body };
    console.log("body: ", body);
    $.ajax({
        url: "/api/apigee-router-proxy", method: "POST", contentType: "application/json", data: JSON.stringify(payload),
        success: function (response) {
            if (response && response.code_status === 200) {
                cerrarDetalle();
                Swal.fire({ icon: 'success', title: '¡Operación Exitosa!', text: response.json_response?.respuesta || `Promoción ${accion === "APROBAR" ? "aprobada" : "rechazada"}`, confirmButtonText: 'Aceptar', timer: 2000, timerProgressBar: true })
                    .then(() => { datosAprobacionActual = null; cargarBandeja(); });
            } else { Swal.fire({ icon: 'error', title: 'Error', text: response.json_response?.mensaje || 'Error al procesar' }); }
        },
        error: function (xhr) { Swal.fire({ icon: 'error', title: 'Error', text: 'Error al procesar: ' + (xhr.responseJSON?.mensaje || '') }); }
    });
}

function configurarCampoSegmentoGeneral(inputId, btnId, segmentos, etiqueta, tituloModal) {
    const texto = obtenerTextoSegmento(segmentos, etiqueta);
    const detalles = obtenerDetallesSegmento(segmentos, etiqueta);

    $(inputId).val(texto);

    if (detalles.length > 1) {
        $(btnId)
            .css({ "background-color": "#198754", "color": "white", "cursor": "pointer" }) // Verde (Success)
            .html(`<i class="fa-solid fa-list-check"></i> <span style="font-size:0.6rem; margin-left:2px; font-weight:bold;">(${detalles.length})</span>`)
            .prop("disabled", false)
            .off("click")
            .on("click", function () {
                abrirModalVisualizarSegmento(tituloModal, detalles);
            });
    } else {
        $(btnId)
            .css({ "background-color": "#e8e8e8", "color": "#666", "cursor": "default" }) // Gris (Default)
            .html('<i class="fa-solid fa-list-check"></i>')
            .prop("disabled", true)
            .off("click");
    }
}