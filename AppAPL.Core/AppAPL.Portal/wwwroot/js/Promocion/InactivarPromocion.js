// ~/js/Promocion/InactivarPromocion.js

let tabla;
let dtArticulosDetalle = null;
let dtCombosDetalle = null; // NUEVO: Variable para la tabla de combos

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

function generarHtmlMedioPagoCombo(articulossegmentos, idPromocionArticulo) {
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
        if (!nom && !isNaN(cod) && parseInt(cod) > 1) return `Varios (${cod})`;
        if (cod.toUpperCase() === "TODOS") return "Todos";
        return nom || cod || "Todos";
    }
    return "Todos";
}

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
$(function () {
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

    // Eventos dinámicos en Grilla
    $(document).on("click", ".btn-ver-mediopago-grid", function () {
        const detalles = $(this).data("detalles");
        abrirModalVisualizarSegmento("Medios de Pago Seleccionados", detalles);
    });

    $(document).on("click", ".btn-ver-otroscostos-grid", function () {
        const detalles = $(this).data("detalles");
        abrirModalVisualizarSegmento("Otros Costos Seleccionados", detalles);
    });

    // Evento dinámico para el modal de Estructura de Combo en Inactivaciones
    $(document).on("click", ".btn-ver-estructura-combo", function () {
        const $fila = $(this).closest("tr");
        const codigoComboSeleccionado = $fila.data("codigo");
        const nombreCombo = $fila.data("descripcion");

        // 1. CAMBIO CLAVE: Leer directamente del arreglo 'articulos' en lugar de 'articuloscomponente'
        const articulosTotales = window.promocionInactivacionData?.articulos || [];

        console.log("articulosTotales: ", articulosTotales);

        // 2. Filtramos los registros de ese combo específico (ignorando los que no tengan código de ítem/artículo)
        const componentes = articulosTotales.filter(art =>
            String(art.codigo_combo) === String(codigoComboSeleccionado) &&
            (art.comp_codigo_item || art.codigoarticulo || art.codigoitem)
        );
        
        if (componentes.length === 0) {
            Swal.fire("Sin Detalle", "Este combo no tiene artículos estructurados registrados.", "info");
            return;
        }

        $("#lblNombreComboConsulta").text(`[${codigoComboSeleccionado}] ${nombreCombo}`);

        // Limpiar cabeceras y celdas previas
        $("#trHeadersConsultaCombo").find("th:gt(0)").remove();
        $("#tablaConsultaComboEstructura tbody tr").each(function () {
            $(this).find("td:gt(0)").remove();
        });

        // Dibujar las columnas iterando los componentes
        componentes.forEach(comp => {
            const codItem = comp.comp_codigo_item || comp.codigoarticulo || comp.codigoitem || "-";

            // Añadir cabecera
            const th = `<th class="table-dark text-center" style="min-width: 180px;">${codItem}</th>`;
            $("#trHeadersConsultaCombo").append(th);

            const formatCur = (val) => formatearMoneda(val);
            const addTd = (campo, valor, alineacion = "text-end") => {
                $(`#tablaConsultaComboEstructura tbody tr[data-campo='${campo}']`).append(`<td class="${alineacion}">${valor}</td>`);
            };

            addTd("art_descripcion", comp.comp_descripcion || comp.descripcion || "-", "text-start text-wrap");
            addTd("costo", formatCur(comp.comp_costo || comp.costo));
            addTd("stock_bodega", comp.comp_stock_bodega || comp.stockbodega || 0);
            addTd("stock_tienda", comp.comp_stock_tienda || comp.stocktienda || 0);
            addTd("inv_optimo", comp.comp_inventario_optimo || comp.inventariooptimo || 0);
            addTd("excedentes_u", comp.comp_excedente_unidad || comp.excedenteunidad || 0);
            addTd("excedentes_usd", formatCur(comp.comp_excedente_valor || comp.excedentevalor));

            addTd("m0_u", comp.comp_m0_unidades || comp.m0unidades || 0);
            addTd("m0_usd", formatCur(comp.comp_m0_precio || comp.m0precio || 0));
            addTd("m1_u", comp.comp_m1_unidades || comp.m1unidades || 0);
            addTd("m1_usd", formatCur(comp.comp_m1_precio || comp.m1precio || 0));
            addTd("m2_u", comp.comp_m2_unidades || comp.m2unidades || 0);
            addTd("m2_usd", formatCur(comp.comp_m2_precio || comp.m2precio || 0));
            addTd("m12_u", comp.comp_m12_unidades || comp.m12unidades || 0);
            addTd("m12_usd", formatCur(comp.comp_m12_precio || comp.m12precio || 0));

            addTd("igualar_precio", formatCur(comp.comp_igualar_precio || comp.igualarprecio || 0));
            addTd("dias_antiguedad", comp.comp_dias_antiguedad || comp.diasantiguedad || 0);

            addTd("margen_min_cont", `${Number(comp.comp_margen_min_contado || comp.margenminimocontado || 0).toFixed(2)}%`);
            addTd("margen_min_tc", `${Number(comp.comp_margen_min_tc || comp.margenminimotarjetacredito || 0).toFixed(2)}%`);
            addTd("margen_min_cred", `${Number(comp.comp_margen_min_credito || comp.margenminimocredito || 0).toFixed(2)}%`);
            addTd("margen_min_igual", `${Number(comp.comp_margen_min_igualar || comp.margenminimoigualar || 0).toFixed(2)}%`);

            addTd("precio_lista_contado", formatCur(comp.comp_precio_lista_contado || comp.preciolistacontado));
            addTd("precio_lista_credito", formatCur(comp.comp_precio_lista_credito || comp.preciolistacredito));
            addTd("promo_contado", formatCur(comp.comp_precio_promo_contado || comp.preciopromocioncontado));
            addTd("promo_tc", formatCur(comp.comp_precio_promo_tc || comp.preciopromociontarjetacredito));
            addTd("promo_credito", formatCur(comp.comp_precio_promo_credito || comp.preciopromocioncredito));

            addTd("dscto_contado", formatCur(comp.comp_desc_promo_contado || comp.descuentopromocioncontado));
            addTd("dscto_tc", formatCur(comp.comp_desc_promo_tc || comp.descuentopromociontarjetacredito));
            addTd("dscto_credito", formatCur(comp.comp_desc_promo_credito || comp.descuentopromocioncredito));

            addTd("aporte_prov", formatCur(comp.comp_aporte_proveedor || comp.aporteproveedor || 0));
            addTd("aporte_prov_id", comp.comp_id_acuerdo_proveedor || comp.idacuerdoproveedor || "-");
            addTd("aporte_prov2", formatCur(comp.comp_aporte_proveedor2 || comp.aporteproveedor2 || 0));
            addTd("aporte_prov2_id", comp.comp_id_acuerdo_proveedor2 || comp.idacuerdoproveedor2 || "-");
            addTd("aporte_rebate", formatCur(comp.comp_aporte_rebate || comp.aporterebate || 0));
            addTd("aporte_rebate_id", comp.comp_id_acuerdo_rebate || comp.idacuerdorebate || "-");
            addTd("aporte_propio", formatCur(comp.comp_aporte_propio || comp.aportepropio || 0));
            addTd("aporte_propio_id", comp.comp_id_acuerdo_propio || comp.idacuerdopropio || "-");
            addTd("aporte_propio2", formatCur(comp.comp_aporte_propio2 || comp.aportepropio2 || 0));
            addTd("aporte_propio2_id", comp.comp_id_acuerdo_propio2 || comp.idacuerdopropio2 || "-");

            addTd("margen_pl_contado", `${Number(comp.comp_margen_pl_contado || comp.margenpreciolistacontado || 0).toFixed(2)}%`);
            addTd("margen_pl_credito", `${Number(comp.comp_margen_pl_credito || comp.margenpreciolistacredito || 0).toFixed(2)}%`);
            addTd("margen_promo_contado", `${Number(comp.comp_margen_promo_contado || comp.margenpromocioncontado || 0).toFixed(2)}%`);
            addTd("margen_promo_tc", `${Number(comp.comp_margen_promo_tc || comp.margenpromociontarjetacredito || 0).toFixed(2)}%`);
            addTd("margen_promo_cred", `${Number(comp.comp_margen_promo_credito || comp.margenpromocioncredito || 0).toFixed(2)}%`);

            addTd("comp_proveedor", formatCur(comp.comp_comp_proveedor || comp.valorcomprometidoproveedor || 0));
            addTd("comp_proveedor2", formatCur(comp.comp_comp_proveedor2 || comp.valorcomprometidoproveedor2 || 0));
            addTd("comp_rebate", formatCur(comp.comp_comp_rebate || comp.valorcomprometidorebate || 0));
            addTd("comp_propio", formatCur(comp.comp_comp_propio || comp.valorcomprometidopropio || 0));
            addTd("comp_propio2", formatCur(comp.comp_comp_propio2 || comp.valorcomprometidopropio2 || 0));

        });

        // Mostrar el Modal
        new bootstrap.Modal(document.getElementById("modalConsultaComboEstructura")).show();
    });
});

// ===================================================================
// VISOR PDF
// ===================================================================

// Función auxiliar para convertir el Base64 a Blob
function base64ToBlob(base64, contentType) {
    const byteCharacters = atob(base64); // Decodifica el Base64
    const byteArrays = [];

    // Procesamos en fragmentos para no saturar la memoria con archivos grandes
    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
        const slice = byteCharacters.slice(offset, offset + 512);
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
    }
    return new Blob(byteArrays, { type: contentType });
}
/*
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
}*/

function abrirVisorPDF(nombreArchivo) {
    $("#pdfSpinner").show();
    $("#pdfVisorContenido").hide();
    $("#pdfVisorError").hide();
    $("#btnDescargarPdf").hide();

    $("#modalVisorPdfLabel .pdf-nombre-archivo").text(obtenerNombreArchivo(nombreArchivo) || "Soporte");

    new bootstrap.Modal(document.getElementById("modalVisorPdf")).show();

    fetchPDFDirecto(nombreArchivo);
}

function fetchPDFDirecto(nombreArchivo) {
    // 1. Armamos el payload con la estructura que espera tu proxy
    const payload = {
        code_app: "APP20260128155212346",
        http_method: "GET",
        endpoint_path: `api/Descargas/descargar`,
        client: "APL",
        endpoint_query_params: `/${encodeURIComponent(nombreArchivo)}`
    };

    // 2. Hacemos la petición POST al proxy
    $.ajax({
        url: "/api/apigee-router-proxy",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(payload),
        success: function (response) {
            if (response && response.code_status === 200) {
                try {
                    // Parseamos la respuesta si viene como string
                    const data = typeof response.json_response === "string"
                        ? JSON.parse(response.json_response)
                        : response.json_response;

                    // Extraemos los valores garantizando que estén en minúsculas
                    const base64 = data.archivobase64;
                    const contentType = data.contenttype || "application/pdf";
                    const nombre = data.nombrearchivo || "soporte.pdf";

                    if (!base64) {
                        throw new Error("El archivo base64 vino vacío o no se encontró.");
                    }

                    // Convertimos el base64 a Blob
                    const blob = base64ToBlob(base64, contentType);
                    const blobUrl = URL.createObjectURL(blob);

                    // Actualizamos el iframe y la vista
                    $("#pdfIframe").attr("src", blobUrl);
                    $("#pdfSpinner").hide();
                    $("#pdfVisorContenido").show();

                    // Asignamos la data al botón de descargar
                    $("#btnDescargarPdf")
                        .data("blob-url", blobUrl)
                        .data("nombre-archivo", obtenerNombreArchivo(nombreArchivo) || nombre)
                        .show();

                    // Configuramos el evento click para la descarga
                    $("#btnDescargarPdf").off("click").on("click", function () {
                        const a = document.createElement("a");
                        a.href = $(this).data("blob-url");
                        a.download = $(this).data("nombre-archivo");
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                    });

                } catch (e) {
                    console.error("Error al procesar el PDF:", e);
                    $("#pdfSpinner").hide();
                    $("#pdfVisorError").html(`<i class="fa-solid fa-triangle-exclamation me-2"></i> Error al visualizar: ${e.message}`).show();
                }
            } else {
                $("#pdfSpinner").hide();
                $("#pdfVisorError").html(`<i class="fa-solid fa-triangle-exclamation me-2"></i> No se pudo obtener el documento.`).show();
            }
        },
        error: function (xhr) {
            $("#pdfSpinner").hide();
            $("#pdfVisorError").html(`<i class="fa-solid fa-triangle-exclamation me-2"></i> Error de conexión con el servidor.`).show();
        }
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
            <td class="text-center"><button type="button" class="btn-action edit-btn" title="Ver / Inactivar" onclick="abrirModalEditar(${promo.idpromocion})" style="border:none; background:none; color:#0d6efd;"><i class="fa-regular fa-pen-to-square"></i></button></td>
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
    if (dtCombosDetalle) { dtCombosDetalle.destroy(); dtCombosDetalle = null; } // NUEVO

    $("#formVisualizar")[0].reset();
    $("#lblIdPromocion").text(idPromocion);
    $("#btnVerSoporte").data("soporte", "").removeData("soporte").attr("title", "Ver Soporte").removeClass("text-danger");

    $('#contenedor-tabla-articulos').html('').hide();
    $('#contenedor-tabla-combos').html('').hide();
    $('#contenedor-tabla-combos-completa').html('').hide(); // NUEVO

    $('#seccion-detalle-general').hide();
    $('#seccion-detalle-articulos').hide();
    $('#seccion-detalle-combos').hide(); // NUEVO

    // Reset botones de Segmentos Artículos y Combos
    $("#btnVerCanalArt, #btnVerGrupoAlmacenArt, #btnVerAlmacenArt, #btnVerTipoClienteArt, #btnVerCanalComb, #btnVerGrupoAlmacenComb, #btnVerAlmacenComb, #btnVerTipoClienteComb")
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

                // --- AGREGAR ESTA LÍNEA AQUÍ ---
                window.promocionInactivacionData = data;

                const cab = data?.cabecera || {};
                const segmentos = data?.segmentos || [];
                const acuerdos = data?.acuerdos || [];
                const articulosotros = data?.articulosotros || [];
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
                    <th class="custom-header-cons-bg">Vta Igualar</th>
                    <th class="custom-header-cons-bg">Dias Igualar</th>
                    <th class="custom-header-cons-bg">Marg.Min Contado</th>
                    <th class="custom-header-cons-bg">Marg.Min TC</th>
                    <th class="custom-header-cons-bg">Marg.Min Crédito</th>
                    <th class="custom-header-cons-bg">Marg.Min Igualar</th>
                    <th class="custom-header-ingr-bg">Uds. Límite</th>
                    <th class="custom-header-ingr-bg">Proyección Vtas(u)</th>
                    <th class="custom-header-ingr-bg">Medio de Pago</th>
                    <th class="custom-header-ingr-bg">Otros Costos</th>
                    <th class="custom-header-cons-bg">Precio Lista Contado</th>
                    <th class="custom-header-cons-bg">Precio Lista Crédito</th>
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
                    <th class="custom-header-calc-bg">Margen PL Contado</th>
                    <th class="custom-header-calc-bg">Margen PL Crédito</th>
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
            <td class="text-end">${formatearMoneda(art.igualarprecio || 0)}</td>
            <td class="text-end">${art.diasantiguedad || 0}</td>
            <td class="text-end">${(art.margenminimocontado || 0).toFixed(2)}%</td>
            <td class="text-end">${(art.margenminimotarjetacredito || 0).toFixed(2)}%</td>
            <td class="text-end">${(art.margenminimocredito || 0).toFixed(2)}%</td>
            <td class="text-end">${(art.margenminimoigualar || 0).toFixed(2)}%</td>
            <td class="text-end">${art.unidadeslimite || 0}</td>
            <td class="text-end">${art.unidadesproyeccionventas || 0}</td>
            <td class="text-center align-middle">${medioPagoHtml}</td>
            <td class="text-center align-middle">${otrosCostosHtml}</td>
            <td class="text-end">${formatearMoneda(art.preciolistacontado)}</td>
            <td class="text-end">${formatearMoneda(art.preciolistacredito)}</td>
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
            <td class="text-end">${(art.margenpreciolistacredito || 0).toFixed(2)}%</td>
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

function renderizarTablaCombosCompleta(articulos, articulossegmentos) {
    console.log("articulos: ", articulos);
    const combosMap = {};

    articulos.forEach((art, index) => {
        const cod = art.codigo_combo;
        if (!cod) return;

        const key = art.idpromocionarticulo || `${cod}_${index}`;

        if (!combosMap[key]) {
            combosMap[key] = {
                id_promo_art: art.idpromocionarticulo,
                codigo: cod,
                descripcion: art.descripcion_combo,
                costo: art.costo_combo || 0,

                margen_min_contado: art.combo_margen_min_contado || 0,
                margen_min_tc: art.combo_margen_min_tc || 0,
                margen_min_credito: art.combo_margen_min_credito || 0,
                margen_min_igualar: art.combo_margen_min_igualar || 0,

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

                margen_pl_contado: art.combo_margen_pl_contado || 0,
                margen_pl_credito: art.combo_margen_pl_credito || 0,

                margen_contado: art.combo_margen_promo_contado || 0,
                margen_tc: art.combo_margen_promo_tc || 0,
                margen_credito: art.combo_margen_promo_credito || 0,

                regalo: art.combo_marca_regalo === "S"
            };
        }

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
                    <th style="width: 50px; background-color: #a4c995;" class="text-center">Acción</th>
                        <th class="custom-header-cons-bg" style="min-width: 220px;">Combo</th>
                        <th class="custom-header-cons-bg">Costo</th>

                        <th class="custom-header-calc-bg">Margen Minimo Cont.</th>
                        <th class="custom-header-calc-bg">Margen Minimo TC</th>
                        <th class="custom-header-calc-bg">Margen Minimo Créd.</th>
                        <th class="custom-header-calc-bg">Margen Minimo Igualar Precio</th>

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

                        <th class="custom-header-calc-bg">Margen de Precio Lista Contado</th>
                        <th class="custom-header-calc-bg">Margen de Precio Lista Credito</th>


                        <th class="custom-header-calc-bg">Margen Promo Cont.</th>
                        <th class="custom-header-calc-bg">Margen Promo TC</th>
                        <th class="custom-header-calc-bg">Margen Promo Créd.</th>

                        <th class="custom-header-ingr-bg">Regalo</th>
                    </tr>
                </thead>
                <tbody class="text-nowrap tabla-items-body bg-white">`;

    combosArray.forEach(cmb => {
        const medioPagoHtml = generarHtmlMedioPagoCombo(articulossegmentos, cmb.id_promo_art);

        html += `<tr data-codigo="${cmb.codigo}" data-descripcion="${cmb.descripcion}">
            
            <td class="text-center align-middle">
                <button type="button" class="btn btn-sm btn-outline-info btn-ver-estructura-combo" title="Ver Estructura">
                    <i class="fa-solid fa-layer-group"></i>
                </button>
            </td>
            <td class="fw-bold text-start">${cmb.codigo} - ${cmb.descripcion}</td>
            <td class="text-end">${formatearMoneda(cmb.costo)}</td>

            <td class="text-end">${cmb.margen_min_contado}</td>
            <td class="text-end">${cmb.margen_min_tc}</td>
            <td class="text-end">${cmb.margen_min_credito}</td>
            <td class="text-end">${cmb.margen_min_igualar}</td>

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

            <td class="text-end">${cmb.margen_pl_contado.toFixed(2)}%</td>
            <td class="text-end">${cmb.margen_pl_credito.toFixed(2)}%</td>

            <td class="text-end">${cmb.margen_contado.toFixed(2)}%</td>
            <td class="text-end">${cmb.margen_tc.toFixed(2)}%</td>
            <td class="text-end">${cmb.margen_credito.toFixed(2)}%</td>
            <td class="text-center">${cmb.regalo ? '<i class="fa-solid fa-check text-success"></i>' : ''}</td>
        </tr>`;
    });

    html += `</tbody></table></div>`;
    $('#contenedor-tabla-combos-completa').html(html).fadeIn();

    dtCombosDetalle = $('#dt-combos-detalle-completa').DataTable({
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
        dtCombosDetalle.search($(this).val()).draw();
    });
}

function cerrarDetalle() {
    if (dtArticulosDetalle) { dtArticulosDetalle.destroy(); dtArticulosDetalle = null; }
    if (dtCombosDetalle) { dtCombosDetalle.destroy(); dtCombosDetalle = null; }
    $("#contenedor-tabla-articulos").hide().html("");
    $("#contenedor-tabla-combos").hide().html("");
    $("#contenedor-tabla-combos-completa").hide().html("");
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

// Autor: JEAN FRANCOIS CALDERON VEAS | Empresa: BMTECSA | Proyecto: SOFTWARE APL