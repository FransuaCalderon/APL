// ~/js/Promocion/ConsultarPromocion.js

// ===============================================================
// Variables globales
// ===============================================================
let tabla;
let dtArticulosDetalle = null;
let dtCombosDetalle = null; // Variable para manejar la instancia DataTable de combos

// ===============================================================
// FUNCIONES HELPER
// ===============================================================
function obtenerUsuarioActual() {
    return window.usuarioActual || sessionStorage.getItem('usuarioActual') || sessionStorage.getItem('usuario') || localStorage.getItem('usuarioActual') || "admin";
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

function obtenerNombreArchivoRaw(rutaCompleta) {
    if (!rutaCompleta) return "";
    return rutaCompleta.replace(/^.*[\\/]/, '');
}

// ===============================================================
// LÓGICA DE SEGMENTOS Y "VARIOS"
// ===============================================================
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

function generarHtmlMedioPagoArticulo(articulossegmentodetalle, idPromocionArticulo) {
    if (!articulossegmentodetalle || !Array.isArray(articulossegmentodetalle)) return "Todos";

    // Filtramos directamente los detalles que pertenecen al artículo y tienen datos de medio de pago
    const items = articulossegmentodetalle.filter(s =>
        s.idpromocionarticulo === idPromocionArticulo &&
        (s.codigo_medio_pago || s.nombre_medio_pago)
    );

    if (items.length === 0) return "Todos";

    const mapa = {};
    items.forEach(i => {
        const cod = (i.codigo_medio_pago || i.codigo_detalle || "").toString().trim();
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
        if (cod && nom) return `${cod} - ${nom}`;
        return cod || nom || "Todos";
    }

    return "Todos";
}

function generarHtmlMedioPagoCombo(articulossegmentodetalle, idPromocionArticulo, codigoCombo) {
    if (!articulossegmentodetalle || !Array.isArray(articulossegmentodetalle)) return "Todos";

    // Filtramos buscando que coincida el codigo_combo o el idpromocionarticulo
    const items = articulossegmentodetalle.filter(s => {
        let coincide = false;
        // Priorizamos la búsqueda por código de combo
        if (codigoCombo && s.codigo_combo === codigoCombo) {
            coincide = true;
        } else if (idPromocionArticulo && s.idpromocionarticulo === idPromocionArticulo) {
            coincide = true;
        }
        return coincide && (s.codigo_medio_pago || s.nombre_medio_pago);
    });

    if (items.length === 0) return "Todos";

    const mapa = {};
    items.forEach(i => {
        const cod = (i.codigo_medio_pago || i.codigo_detalle || "").toString().trim();
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
        if (cod && nom) return `${cod} - ${nom}`;
        return cod || nom || "Todos";
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
    console.log("=== INICIO - ConsultarPromocion (Estructura Híbrida) ===");

    $.get("/config", function (config) {
        window.apiBaseUrl = config.apiBaseUrl;
        cargarBandeja();
    }).fail(function () {
        cargarBandeja();
    });

    $("#btnVolverTabla, #btnVolverAbajo").on("click", function () { cerrarDetalle(); });

    $("body").on("click", "#btnLimpiar", function () { if (tabla) { tabla.search("").draw(); tabla.page(0).draw('page'); } });

    // Botones PDF
    $("#btnVerSoporte").on("click", function () {
        const archivoRaw = $(this).data("archivo");
        if (!archivoRaw) { Swal.fire({ icon: "info", title: "Sin soporte", text: "Esta promoción no tiene un archivo de soporte adjunto." }); return; }
        abrirVisualizadorPdf(archivoRaw);
    });

    $("#btnCerrarVisorPdf, #btnCerrarVisorPdfFooter").on("click", function () { cerrarVisorPDF(); });

    // Botones Auditoría
    $("#btnVerLog").on("click", function () { const idPromocion = parseInt($("#lblIdPromocion").text(), 10); if (idPromocion) abrirModalLog(idPromocion); });
    $("#btnVerAprobaciones").on("click", function () { const idPromocion = parseInt($("#lblIdPromocion").text(), 10); if (idPromocion) abrirModalAprobaciones(idPromocion); });
    $("#btnVerAprobaciones2").on("click", function () { const idPromocion = parseInt($("#lblIdPromocion").text(), 10); if (idPromocion) abrirModalAprobaciones(idPromocion); });

    // Evento dinámico Medios de Pago en Grilla
    $(document).on("click", ".btn-ver-mediopago-grid", function () {
        const detalles = $(this).data("detalles");
        abrirModalVisualizarSegmento("Medios de Pago Seleccionados", detalles);
    });

    // Evento dinámico Otros Costos en Grilla
    $(document).on("click", ".btn-ver-otroscostos-grid", function () {
        const detalles = $(this).data("detalles");
        abrirModalVisualizarSegmento("Otros Costos Seleccionados", detalles);
    });



    //LOGICA PARA MODAL DE ARTICULOS EN COMBO
    // 1. Mostrar/Ocultar botón en la cabecera según tipo de promoción
    // Para esto interceptamos la llamada de ajax original de 'abrirModalEditar'
    const ajaxOriginal = $.ajax;
    $.ajax = function (opciones) {
        if (opciones.url === "/api/apigee-router-proxy" && opciones.data && opciones.data.includes("bandeja-general-id")) {
            const successOriginal = opciones.success;
            opciones.success = function (res) {
                if (res && res.code_status === 200) {
                    window.promocionConsultadaData = res.json_response; // Guardamos la data global

                    // Validamos el campo clase_promocion
                    const clasePromocion = (res.json_response.clase_promocion || "").toUpperCase();
                    if (clasePromocion === "PRCOMBO") {
                        $("#btnVerEstructuraCombo").show();
                    } else {
                        $("#btnVerEstructuraCombo").hide();
                    }
                }
                if (successOriginal) successOriginal(res);
            };
        }
        return ajaxOriginal.apply(this, arguments);
    };

    // Delegamos el evento click para los botones que se generan dinámicamente en la tabla
    $(document).on("click", ".btn-ver-estructura-combo", function () {
        // Obtenemos la fila a la que pertenece el botón
        const $fila = $(this).closest("tr");

        // Obtenemos los datos desde los atributos data- que pusimos en el <tr>
        const codigoComboSeleccionado = $fila.data("codigo");
        const nombreCombo = $fila.data("descripcion");

        // Accedemos a la data global
        const componentesTotales = window.promocionConsultadaData?.articuloscomponente || [];

        console.log("componentesTotales: ", componentesTotales);

        // Filtramos solo los componentes que hacen match con el combo seleccionado
        const componentes = componentesTotales.filter(c => String(c.codigo_combo) === String(codigoComboSeleccionado));

        // Buscamos el combo padre para saber si está marcado como regalo
        const comboPadre = articulosTotales.find(a => String(a.codigo_combo) === String(codigoComboSeleccionado));
        const comboEsRegalo = (comboPadre && comboPadre.combo_marca_regalo && comboPadre.combo_marca_regalo.toUpperCase() === 'S');

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

        // Dibujar las columnas mapeando con los nombres exactos del payload
        componentes.forEach(comp => {
            const codItem = comp.componente_codigoitem || "-";
            const descItem = comp.componente_descripcion || "-";
            const idComp = comp.idpromocionarticulocomponente || 0;

            // Extraemos los acuerdos específicos de este componente
            const misAcuerdos = acuerdosComponentesTotales.filter(a => a.idpromocionarticulocomponente === idComp);

            const acProv = misAcuerdos.filter(a => (a.etiqueta_tipo_fondo || "").toUpperCase() === "TFPROVEDOR");
            const acProv1 = acProv.length > 0 ? acProv[0] : null;
            const acProv2 = acProv.length > 1 ? acProv[1] : null;

            const acProp = misAcuerdos.filter(a => (a.etiqueta_tipo_fondo || "").toUpperCase() === "TFPROPIO");
            const acProp1 = acProp.length > 0 ? acProp[0] : null;
            const acProp2 = acProp.length > 1 ? acProp[1] : null;

            const acRebate = misAcuerdos.find(a => (a.etiqueta_tipo_fondo || "").toUpperCase() === "TFREBATE");

            // Añadir cabecera dinámica idéntica al diseño de Modificación (Código + Descripción)
            const th = `
            <th class="table-dark" style="min-width: 200px;">
                <button class="btn btn-dark btn-sm border-0 w-100 header-combo-btn" type="button" title="${codItem} - ${descItem}" style="cursor: default; pointer-events: none;">
                    <span class="header-combo-content d-flex flex-column align-items-center">
                        <span class="header-combo-codigo fw-bold">${codItem}</span>
                        <span class="header-combo-desc text-truncate fw-normal" style="max-width: 180px; font-size: 0.75rem;">${descItem}</span>
                    </span>
                </button>
            </th>`;
            $("#trHeadersConsultaCombo").append(th);

            const formatCur = (val) => formatearMoneda(val);
            const formatAcuerdo = (ac) => ac ? `${ac.idacuerdo} - ${ac.nombre_proveedor || ""}` : "-";

            const addTd = (campo, valor, alineacion = "text-end") => {
                $(`#tablaConsultaComboEstructura tbody tr[data-campo='${campo}']`).append(`<td class="${alineacion}">${valor}</td>`);
            };

            // Inyectar datos en las filas correspondientes
            addTd("art_codigo", codItem, "text-center fw-bold");
            addTd("art_descripcion", comp.componente_descripcion || "-", "text-start text-wrap");
            addTd("costo", formatCur(comp.componente_costo));
            addTd("stock_bodega", comp.componente_stock_bodega || 0);
            addTd("stock_tienda", comp.componente_stock_tienda || 0);
            addTd("inv_optimo", comp.componente_inventario_optimo || 0);
            addTd("excedentes_u", comp.componente_excedente_unidad || 0);
            addTd("excedentes_usd", formatCur(comp.componente_excedente_valor));

            addTd("m0_u", comp.componente_m0_unidades || 0);
            addTd("m0_usd", formatCur(comp.componente_m0_precio || 0));
            addTd("m1_u", comp.componente_m1_unidades || 0);
            addTd("m1_usd", formatCur(comp.componente_m1_precio || 0));
            addTd("m2_u", comp.componente_m2_unidades || 0);
            addTd("m2_usd", formatCur(comp.componente_m2_precio || 0));
            addTd("m12_u", comp.componente_m12_unidades || 0);
            addTd("m12_usd", formatCur(comp.componente_m12_precio || 0));

            addTd("igualar_precio", formatCur(comp.componente_igualar_precio || 0));
            addTd("dias_antiguedad", comp.componente_dias_antiguedad || 0);

            addTd("margen_min_cont", `${Number(comp.componente_margen_min_contado || 0).toFixed(2)}%`);
            addTd("margen_min_tc", `${Number(comp.componente_margen_min_tc || 0).toFixed(2)}%`);
            addTd("margen_min_cred", `${Number(comp.componente_margen_min_credito || 0).toFixed(2)}%`);
            addTd("margen_min_igual", `${Number(comp.componente_margen_min_igualar || 0).toFixed(2)}%`);

            addTd("unidades_limite", comp.componente_unidades_limite || 0);
            addTd("proyeccion_vta", comp.componente_proyeccion_vta || 0);

            // Medio de pago (Check visual)
            addTd("medio_pago", comp.componente_medio_pago ? "✓" : "-", "text-center fw-bold");

            addTd("precio_lista_contado", formatCur(comp.componente_precio_lista_contado));
            addTd("precio_lista_credito", formatCur(comp.componente_precio_lista_credito));

            addTd("promo_contado", formatCur(comp.componente_precio_promo_contado));
            addTd("promo_tc", formatCur(comp.componente_precio_promo_tc));
            addTd("promo_credito", formatCur(comp.componente_precio_promo_credito));

            addTd("dscto_contado", formatCur(comp.componente_desc_promo_contado));
            addTd("dscto_tc", formatCur(comp.componente_desc_promo_tc));
            addTd("dscto_credito", formatCur(comp.componente_desc_promo_credito));

            // Aportes
            addTd("aporte_prov", formatCur(comp.componente_aporte_proveedor || 0));
            addTd("aporte_prov_id", comp.componente_id_acuerdo_proveedor || "-");
            addTd("aporte_prov2", formatCur(comp.componente_aporte_proveedor2 || 0));
            addTd("aporte_prov2_id", comp.componente_id_acuerdo_proveedor2 || "-");
            addTd("aporte_rebate", formatCur(comp.componente_aporte_rebate || 0));
            addTd("aporte_rebate_id", comp.componente_id_acuerdo_rebate || "-");
            addTd("aporte_propio", formatCur(comp.componente_aporte_propio || 0));
            addTd("aporte_propio_id", comp.componente_id_acuerdo_propio || "-");
            addTd("aporte_propio2", formatCur(comp.componente_aporte_propio2 || 0));
            addTd("aporte_propio2_id", comp.componente_id_acuerdo_propio2 || "-");

            // Márgenes
            addTd("margen_pl_contado", `${Number(comp.componente_margen_pl_contado || 0).toFixed(2)}%`);
            addTd("margen_pl_credito", `${Number(comp.componente_margen_pl_credito || 0).toFixed(2)}%`);
            addTd("margen_promo_contado", `${Number(comp.componente_margen_promo_contado || 0).toFixed(2)}%`);
            addTd("margen_promo_tc", `${Number(comp.componente_margen_promo_tc || 0).toFixed(2)}%`);
            addTd("margen_promo_cred", `${Number(comp.componente_margen_promo_credito || 0).toFixed(2)}%`);
            addTd("margen_pl_contado", `${Number(comp.componente_margen_pl_contado || 0).toFixed(2)}%`);
            addTd("margen_pl_credito", `${Number(comp.componente_margen_pl_credito || 0).toFixed(2)}%`);

            addTd("aporte_prov", formatCur(acProv1 ? acProv1.valor_aporte : 0));
            addTd("aporte_prov_id", formatAcuerdo(acProv1), "text-start text-nowrap");
            addTd("aporte_prov2", formatCur(acProv2 ? acProv2.valor_aporte : 0));
            addTd("aporte_prov2_id", formatAcuerdo(acProv2), "text-start text-nowrap");

            addTd("aporte_rebate", formatCur(acRebate ? acRebate.valor_aporte : 0));
            addTd("aporte_rebate_id", formatAcuerdo(acRebate), "text-start text-nowrap");

            addTd("aporte_propio", formatCur(acProp1 ? acProp1.valor_aporte : 0));
            addTd("aporte_propio_id", formatAcuerdo(acProp1), "text-start text-nowrap");
            addTd("aporte_propio2", formatCur(acProp2 ? acProp2.valor_aporte : 0));
            addTd("aporte_propio2_id", formatAcuerdo(acProp2), "text-start text-nowrap");

            addTd("comp_proveedor", formatCur(acProv1 ? acProv1.valor_comprometido : 0));
            addTd("comp_proveedor2", formatCur(acProv2 ? acProv2.valor_comprometido : 0));
            addTd("comp_rebate", formatCur(acRebate ? acRebate.valor_comprometido : 0));
            addTd("comp_propio", formatCur(acProp1 ? acProp1.valor_comprometido : 0));
            addTd("comp_propio2", formatCur(acProp2 ? acProp2.valor_comprometido : 0));

            // Validamos si el componente tiene marca de regalo O si el combo padre entero es un regalo
            const esComponenteRegalo = (comp.componente_marca_regalo && comp.componente_marca_regalo.toUpperCase() === 'S') || comboEsRegalo;
            addTd("regalo", esComponenteRegalo ? '<i class="fa-solid fa-check text-success"></i>' : "-", "text-center");
        });

        // Mostrar el Modal
        new bootstrap.Modal(document.getElementById("modalConsultaComboEstructura")).show();
    });
});

// ===================================================================
// VISUALIZADOR DE PDF
// ===================================================================

/*
function abrirVisualizadorPdf(nombreArchivo) {
    $("#pdfSpinner").show(); $("#pdfVisorContenido").hide(); $("#pdfError").hide(); $("#btnDescargarPdf").hide();
    $("#modalPdfLabel .pdf-nombre-archivo").text(obtenerNombreArchivo(nombreArchivo) || "Soporte");
    new bootstrap.Modal(document.getElementById("modalVisualizadorPdf")).show();

    let baseUrl = (window.apiBaseUrl || "http://localhost:5074").replace("/api/router-proxy/execute", "");
    const url = `${baseUrl}/api/Descargas/descargar/${encodeURIComponent(nombreArchivo)}`;

    fetch(url).then(r => { if (!r.ok) return r.text().then(t => { throw new Error(t || `Error HTTP ${r.status}`); }); return r.blob(); })
        .then(blob => {
            const blobUrl = URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
            $("#pdfIframe").attr("src", blobUrl); $("#pdfSpinner").hide(); $("#pdfVisorContenido").show();
            $("#btnDescargarPdf").data("blob-url", blobUrl).data("nombre-archivo", obtenerNombreArchivo(nombreArchivo) || "soporte.pdf").show();

            $("#btnDescargarPdf").off("click").on("click", function () {
                const a = document.createElement("a"); a.href = blobUrl; a.download = $(this).data("nombre-archivo");
                document.body.appendChild(a); a.click(); document.body.removeChild(a);
            });
        }).catch(error => {
            $("#pdfSpinner").hide(); $("#pdfError").html(`<i class="fa-solid fa-triangle-exclamation me-2"></i> ${error.message}`).show();
        });
}*/

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

function abrirVisualizadorPdf(nombreArchivo) {
    $("#pdfSpinner").show();
    $("#pdfVisorContenido").hide();
    $("#pdfError").hide();
    $("#btnDescargarPdf").hide();
    $("#modalPdfLabel .pdf-nombre-archivo").text(obtenerNombreArchivo(nombreArchivo) || "Soporte");

    new bootstrap.Modal(document.getElementById("modalVisualizadorPdf")).show();

    const payload = {
        code_app: "APP20260128155212346",
        http_method: "GET",
        endpoint_path: `api/Descargas/descargar`,
        client: "APL",
        endpoint_query_params: `/${encodeURIComponent(nombreArchivo)}`
    };

    $.ajax({
        url: "/api/apigee-router-proxy",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(payload),
        success: function (response) {
            // 1. Vemos la respuesta cruda de Apigee
            console.log("1. Respuesta cruda de Apigee:", response);

            if (response && response.code_status === 200) {
                try {
                    const data = typeof response.json_response === "string"
                        ? JSON.parse(response.json_response)
                        : response.json_response;

                    // 2. Vemos cómo quedó el objeto parseado
                    console.log("2. Objeto data parseado:", data);

                    // Validamos temporalmente qué propiedades trae para evitar que se rompa
                    const base64 = data.archivobase64;
                    const contentType = data.contenttype || "application/pdf";
                    const nombre = data.nombrearchivo || "soporte.pdf";

                    if (!base64) {
                        throw new Error("No se encontró la propiedad del Base64 en el JSON. Revisa la estructura en el console.log #2.");
                    }

                    // Reconstruimos el archivo binario
                    const blob = base64ToBlob(base64, contentType);
                    const blobUrl = URL.createObjectURL(blob);

                    $("#pdfIframe").attr("src", blobUrl);
                    $("#pdfSpinner").hide();
                    $("#pdfVisorContenido").show();

                    $("#btnDescargarPdf").data("blob-url", blobUrl)
                        .data("nombre-archivo", nombre)
                        .show();

                    $("#btnDescargarPdf").off("click").on("click", function () {
                        const a = document.createElement("a");
                        a.href = $(this).data("blob-url");
                        a.download = $(this).data("nombre-archivo");
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                    });
                } catch (e) {
                    // 3. Imprimimos el error exacto en consola
                    console.error("3. Error en el try/catch:", e.message);
                    $("#pdfSpinner").hide();
                    $("#pdfError").html(`<i class="fa-solid fa-triangle-exclamation me-2"></i> Error interno: ${e.message}`).show();
                }
            } else {
                $("#pdfSpinner").hide();
                $("#pdfError").html(`<i class="fa-solid fa-triangle-exclamation me-2"></i> Error del servidor: código no es 200.`).show();
            }
        },
        error: function (xhr) {
            $("#pdfSpinner").hide();
            $("#pdfError").html(`<i class="fa-solid fa-triangle-exclamation me-2"></i> Error de conexión.`).show();
        }
    });
}

function cerrarVisorPDF() {
    const blobUrl = $("#btnDescargarPdf").data("blob-url");
    if (blobUrl) { URL.revokeObjectURL(blobUrl); $("#btnDescargarPdf").removeData("blob-url"); }
    const iframe = document.getElementById("pdfIframe"); if (iframe) iframe.src = "about:blank";
    const modal = bootstrap.Modal.getInstance(document.getElementById("modalVisualizadorPdf")); if (modal) modal.hide();
}

$(function () {
    $('#modalVisualizadorPdf').on('hidden.bs.modal', function () { cerrarVisorPDF(); });
});

// ===================================================================
// BANDEJA DE CONSULTA
// ===================================================================
function cargarBandeja() {
    const payload = { code_app: "APP20260128155212346", http_method: "GET", endpoint_path: "api/Promocion/consultar-bandeja-general", client: "APL" };
    $.ajax({
        url: "/api/apigee-router-proxy", method: "POST", contentType: "application/json", data: JSON.stringify(payload),
        success: function (response) {
            if (response && response.code_status === 200) crearListado(response.json_response || []);
            else Swal.fire({ icon: "error", title: "Error", text: "No se pudo cargar la bandeja." });
        },
        error: function (xhr) { manejarErrorGlobal(xhr, "cargar la bandeja de consulta"); }
    });
}

function crearListado(data) {
    if (tabla) tabla.destroy();
    const datos = Array.isArray(data) ? data : (data.data || []);
    if (!datos || datos.length === 0) { $('#tabla').html("<div class='alert alert-info text-center'>No hay promociones disponibles.</div>"); return; }

    let html = `<table id="tabla-principal" class="table table-bordered table-striped table-hover"><thead>
        <tr><th colspan="10" style="background-color: #CC0000 !important; color: white; text-align: center; font-weight: bold; padding: 8px;">BANDEJA DE CONSULTA DE PROMOCIONES</th></tr>
        <tr><th>Acción</th><th>Id Promoción</th><th>Descripción</th><th>Motivo</th><th>Clase de Promoción</th><th>Fecha Inicio</th><th>Fecha Fin</th><th>Regalo</th><th>Soporte</th><th>Estado</th></tr></thead><tbody>`;

    datos.forEach(promo => {
        html += `<tr>
            <td class="text-center"><button type="button" class="btn-action view-btn" title="Ver Detalle" onclick="abrirModalEditar(${promo.idpromocion})"  style="border:none; background:none; color:#0d6efd;"><i class="fa-regular fa-eye"></i></button></td>
            <td class="text-center">${promo.idpromocion ?? ""}</td><td>${promo.descripcion ?? ""}</td><td>${promo.nombre_motivo ?? ""}</td><td>${promo.clase_promocion ?? ""}</td>
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
    if (dtCombosDetalle) { dtCombosDetalle.destroy(); dtCombosDetalle = null; }

    $("#formVisualizar")[0].reset();
    $("#lblIdPromocion").text(idPromocion);
    $("#btnVerSoporte").removeData("soporte").removeData("archivo").attr("title", "Ver Soporte").removeClass("text-danger");

    $('#contenedor-tabla-articulos').html('').hide();
    $('#contenedor-tabla-combos').html('').hide();
    $('#contenedor-tabla-combos-completa').html('').hide();

    $('#seccion-detalle-general').hide();
    $('#seccion-detalle-articulos').hide();
    $('#seccion-detalle-combos').hide();

    // Reset botones de Segmentos Artículos/Combos
    $("#btnVerCanalArt, #btnVerGrupoAlmacenArt, #btnVerAlmacenArt, #btnVerTipoClienteArt, #btnVerCanalComb, #btnVerGrupoAlmacenComb, #btnVerAlmacenComb, #btnVerTipoClienteComb")
        .addClass("d-none").removeClass("btn-success").addClass("btn-outline-secondary")
        .html('<i class="fa-solid fa-list-check"></i>').off("click");

    // Reset botones de Segmentos Generales
    $(".promo-col-value .icon-btn")
        .css({ "background-color": "#e8e8e8", "color": "#666", "cursor": "default" })
        .html('<i class="fa-solid fa-list-check"></i>').prop("disabled", true).off("click");

    const payload = { code_app: "APP20260128155212346", http_method: "GET", endpoint_path: "api/Promocion/bandeja-general-id", client: "APL", endpoint_query_params: `/${idPromocion}` };

    $.ajax({
        url: "/api/apigee-router-proxy", method: "POST", contentType: "application/json", data: JSON.stringify(payload),
        success: function (response) {
            if (response && response.code_status === 200) {
                const data = response.json_response || {};
                const cab = data?.cabecera || {};
                const segmentos = data?.segmentos || [];
                const acuerdos = data?.acuerdos || [];
                const articulosotros = data?.articulosotros || [];
                const tipoPromocion = (cab.etiqueta_clase_promocion || data.tipopromocion || "").toUpperCase();

                $("#verPromocionHeader").val(`${cab.idpromocion ?? ""} - ${cab.nombre_clase_promocion ?? ""}`);

                const rutaSoporte = cab.archivosoporte ?? "";
                const archivoRaw = obtenerNombreArchivoRaw(rutaSoporte);
                $("#btnVerSoporte").data("archivo", archivoRaw).toggleClass("text-danger", !!rutaSoporte).attr("title", rutaSoporte ? `Ver Soporte: ${obtenerNombreArchivo(rutaSoporte)}` : "Sin soporte");

                $("#verDescripcion").val(cab.descripcion ?? "");
                $("#verMotivo").val(cab.nombre_motivo ?? "");
                $("#verFechaInicio").val(formatearFechaHora(cab.fecha_inicio));
                $("#verFechaFin").val(formatearFechaHora(cab.fecha_fin));
                $("#verEstado").val(cab.nombre_estado_promocion ?? "");

                const valorRegalo = (cab.marcaregalo ?? "").toString().trim().toUpperCase();
                $("#verRegalo").prop("checked", valorRegalo !== "" && valorRegalo !== "N");

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
                        renderizarTablaArticulosCompleta(data.articulos, data.articulossegmentodetalle || [], data.articulosacuerdos || [], articulosotros);
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
                        renderizarTablaCombosCompleta(data.articulos, data.articulossegmentodetalle || []);
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
    const combosMap = {};

    console.log("articulos: ", articulos);

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
        const medioPagoHtml = generarHtmlMedioPagoCombo(articulossegmentos, cmb.id_promo_art, cmb.codigo);

        html += `<tr data-codigo="${cmb.codigo}" data-descripcion="${cmb.descripcion}">
            <td class="text-center align-middle">
                <button type="button" class="btn btn-sm btn-outline-info btn-ver-estructura-combo" title="Ver Estructura">
                    <i class="fa-solid fa-layer-group"></i>
                </button>
            </td>
            <td class="fw-bold text-start align-middle">${cmb.codigo} - ${cmb.descripcion}</td>
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