// ~/js/Promocion/InactivarPromocion.js

// ===============================================================
// Variables globales
// ===============================================================
let tabla;
let ultimaFilaModificada = null;

// ===============================================================
// FUNCIONES HELPER
// ===============================================================
function obtenerUsuarioActual() {
    return window.usuarioActual
        || sessionStorage.getItem('usuarioActual')
        || sessionStorage.getItem('usuario')
        || localStorage.getItem('usuarioActual')
        || "admin";
}

function getIdOpcionSeguro() {
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

function formatearMoneda(v) {
    return (v || 0).toLocaleString("es-EC", { style: "currency", currency: "USD" });
}

function formatearFecha(f) {
    if (!f) return "";
    const d = new Date(f);
    return d.toLocaleDateString("es-EC");
}

function formatearFechaHora(f) {
    if (!f) return "";
    const d = new Date(f);
    return d.toLocaleDateString("es-EC") + " " + d.toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" });
}

/**
 * Extrae el nombre del archivo desde una ruta completa, removiendo el GUID prefix
 */
function obtenerNombreArchivo(rutaCompleta) {
    if (!rutaCompleta) return "";
    var nombreArchivo = rutaCompleta.replace(/^.*[\\/]/, '');
    var sinGuid = nombreArchivo.replace(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}_/i, '');
    return sinGuid || nombreArchivo;
}

/**
 * Extrae el nombre del archivo CON el GUID desde la ruta del servidor.
 * Ej: "ArchivoSoportes\\ff92c807-..._Recomendaciones de Mejora.pdf"
 *   → "ff92c807-..._Recomendaciones de Mejora.pdf"
 */
function obtenerNombreArchivoConGuid(rutaCompleta) {
    if (!rutaCompleta) return "";
    return rutaCompleta.replace(/^.*[\\/]/, '');
}

/**
 * Busca un segmento por su etiqueta dentro del array de segmentos.
 */
function obtenerTextoSegmento(segmentos, etiqueta) {
    if (!segmentos || !Array.isArray(segmentos)) return "";

    const items = segmentos.filter(s => s.etiqueta_tipo_segmento === etiqueta);

    if (items.length === 0) return "";
    if (items.length === 1) {
        const item = items[0];
        return item.codigo_detalle
            ? `${item.codigo_detalle} - ${item.nombre_detalle || ""}`
            : (item.nombre_detalle || "");
    }

    return "Varios";
}

// ===============================================================
// DOCUMENT READY
// ===============================================================
$(document).ready(function () {
    console.log("=== INICIO - InactivarPromocion (Estructura Post-REST) ===");

    $.get("/config", function (config) {
        console.log("[config] Config cargada:", config);
        window.apiBaseUrl = config.apiBaseUrl;
        cargarBandeja();
    }).fail(function (xhr) {
        console.error("[config] Error al cargar /config:", xhr);
        console.warn("[config] Intentando cargar bandeja sin config...");
        cargarBandeja();
    });

    // Eventos de Navegación
    $("#btnVolverTabla, #btnVolverAbajo").on("click", function () {
        cerrarDetalle();
    });

    // Botón Limpiar Filtros
    $("body").on("click", "#btnLimpiar", function () {
        if (tabla) {
            tabla.search("").draw();
        }
    });

    // Botón Inactivar
    $("#btnInactivarPromocion").on("click", function () {
        inactivarPromocion();
    });

    // ─────────────────────────────────────────────────────────
    // Botón PDF - Ver Soporte (VISOR EMBEBIDO EN MODAL)
    // ─────────────────────────────────────────────────────────
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

    // Cerrar visor PDF
    $("#btnCerrarVisorPdf, #btnCerrarVisorPdfFooter").on("click", function () {
        cerrarVisorPDF();
    });

    // Botón descargar PDF desde el visor
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

    // Botón Registro de Log
    $("#btnVerLog").on("click", function () {
        const idPromocion = parseInt($("#lblIdPromocion").text(), 10);
        if (!idPromocion || isNaN(idPromocion)) {
            Swal.fire({ icon: "warning", title: "Atención", text: "No se pudo determinar el Id de la promoción." });
            return;
        }
        abrirModalLog(idPromocion);
    });

    // Botón Registro de Aprobaciones
    $("#btnVerAprobaciones").on("click", function () {
        const idPromocion = parseInt($("#lblIdPromocion").text(), 10);
        if (!idPromocion || isNaN(idPromocion)) {
            Swal.fire({ icon: "warning", title: "Atención", text: "No se pudo determinar el Id de la promoción." });
            return;
        }
        abrirModalAprobaciones(idPromocion);
    });
});

// ===================================================================
// VISOR DE PDF EMBEBIDO
// ===================================================================

function abrirVisorPDF(nombreArchivo) {
    console.log("[abrirVisorPDF] Solicitando archivo:", nombreArchivo);

    // Mostrar modal con spinner
    $("#pdfSpinner").show();
    $("#pdfVisorContenido").hide();
    $("#pdfVisorError").hide();
    $("#btnDescargarPdf").hide();

    // Título del modal = nombre legible (sin GUID)
    const nombreLegible = obtenerNombreArchivo(nombreArchivo);
    $("#modalVisorPdfLabel .pdf-nombre-archivo").text(nombreLegible || "Soporte");

    const modal = new bootstrap.Modal(document.getElementById("modalVisorPdf"));
    modal.show();

    // ── Consumir el endpoint a través del proxy ──
    const payload = {
        code_app: "APP20260128155212346",
        http_method: "GET",
        endpoint_path: `api/Descargas/descargar/${nombreArchivo}`,
        client: "APL"
    };

    console.log("[abrirVisorPDF] Payload proxy:", JSON.stringify(payload));

    // Intentar primero con el proxy (por si devuelve base64 o JSON con el archivo)
    // Si el proxy no soporta binarios, usar fetch directo como fallback
    fetchPDFDirecto(nombreArchivo);
}

/**
 * Descarga el PDF consumiendo el endpoint a través del Proxy Apigee
 * y lo fuerza a visualizarse en el iframe.
 */
function fetchPDFDirecto(nombreArchivo) {
    // 1. Tomamos tu apiBaseUrl y le limpiamos la parte del proxy para llegar a la raíz del servidor
    let baseUrl = (window.apiBaseUrl || "http://localhost:5074").replace("/api/router-proxy/execute", "");

    // 2. Construimos la URL limpia (igual a la de Swagger)
    const url = `${baseUrl}/api/Descargas/descargar/${encodeURIComponent(nombreArchivo)}`;

    console.log("[fetchPDFDirecto] Fetching directo al API limpio:", url);

    fetch(url)
        .then(function (response) {
            if (!response.ok) {
                return response.text().then(function (txt) {
                    throw new Error(txt || `Error HTTP ${response.status}`);
                });
            }
            return response.blob();
        })
        .then(function (blob) {
            // Convertimos el binario directo en un PDF visualizable
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
            console.error("[fetchPDFDirecto] Error visualizando PDF:", error);
            $("#pdfSpinner").hide();
            $("#pdfVisorError")
                .html(`<i class="fa-solid fa-triangle-exclamation me-2"></i> ${error.message}`)
                .show();
        });
}
function cerrarVisorPDF() {
    // Limpiar el iframe y revocar blob URL
    const iframe = document.getElementById("pdfIframe");
    const blobUrl = $("#btnDescargarPdf").data("blob-url");

    if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
        $("#btnDescargarPdf").removeData("blob-url");
    }

    if (iframe) {
        iframe.src = "about:blank";
    }

    const modal = bootstrap.Modal.getInstance(document.getElementById("modalVisorPdf"));
    if (modal) modal.hide();
}

// ===================================================================
// FUNCIONES DE CARGA (BANDEJA)
// ===================================================================

function cargarBandeja() {
    console.log("[cargarBandeja] Iniciando carga de bandeja inactivacion promociones...");

    const payload = {
        code_app: "APP20260128155212346",
        http_method: "GET",
        endpoint_path: "api/Promocion/consultar-bandeja-inactivacion",
        client: "APL"
    };

    console.log("[cargarBandeja] Payload enviado:", JSON.stringify(payload));

    $.ajax({
        url: "/api/apigee-router-proxy",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(payload),
        success: function (response) {
            console.log("[cargarBandeja] Respuesta completa del proxy:", response);

            if (response && response.code_status === 200) {
                const data = response.json_response || [];
                console.log("[cargarBandeja] Datos recibidos:", data);
                console.log("[cargarBandeja] Total registros:", Array.isArray(data) ? data.length : "No es array");
                crearListado(data);
            } else {
                console.error("[cargarBandeja] code_status no es 200:", response?.code_status, response);
                Swal.fire({ icon: "error", title: "Error", text: "No se pudo cargar la bandeja de inactivación. Código: " + (response?.code_status || "desconocido") });
            }
        },
        error: function (xhr) {
            console.error("[cargarBandeja] Error AJAX:", xhr.status, xhr.responseText);
            manejarErrorGlobal(xhr, "cargar la bandeja de inactivación de promociones");
        }
    });
}

function crearListado(data) {
    if (tabla) tabla.destroy();

    if (!data || data.length === 0) {
        $('#tabla').html(
            "<div class='alert alert-info text-center'>No hay promociones para inactivar.</div>"
        );
        return;
    }

    let html = `
        <table id="tabla-principal" class="table table-bordered table-striped table-hover">
            <thead>
                <tr>
                    <th colspan="10" style="background-color: #CC0000 !important; color: white; text-align: center; font-weight: bold; padding: 8px; font-size: 1rem;">
                        BANDEJA DE INACTIVACIÓN DE PROMOCIONES
                    </th>
                </tr>
                <tr>
                    <th>Acción</th>
                    <th>Id Promoción</th>
                    <th>Descripción</th>
                    <th>Motivo</th>
                    <th>Clase de Promoción</th>
                    <th>Fecha Inicio</th>
                    <th>Fecha Fin</th>
                    <th>Regalo</th>
                    <th>Soporte</th>
                    <th>Estado</th>
                </tr>
            </thead>
            <tbody>`;

    data.forEach(promo => {
        html += `
            <tr>
                <td class="text-center">
                    <button type="button" class="btn-action edit-btn" title="Ver / Inactivar" onclick="abrirModalEditar(${promo.idpromocion})">
                        <i class="fa-regular fa-pen-to-square"></i>
                    </button>
                </td>
                <td class="text-center">${promo.idpromocion ?? ""}</td>
                <td>${promo.descripcion ?? ""}</td>
                <td>${promo.motivo ?? ""}</td>
                <td>${promo.clase_promocion ?? ""}</td>
                <td class="text-center">${formatearFecha(promo.fecha_inicio)}</td>
                <td class="text-center">${formatearFecha(promo.fecha_fin)}</td>
                <td class="text-center">${promo.regalo && promo.regalo !== "N" ? "✓" : ""}</td>
                <td>${obtenerNombreArchivo(promo.soporte)}</td>
                <td>${promo.estado ?? ""}</td>
            </tr>`;
    });

    html += `</tbody></table>`;
    $("#tabla").html(html);

    tabla = $("#tabla-principal").DataTable({
        pageLength: 10,
        lengthMenu: [5, 10, 25, 50],
        pagingType: 'full_numbers',
        columnDefs: [
            { targets: 0, width: "5%", className: "dt-center", orderable: false },
            { targets: 1, width: "8%", className: "dt-center" },
            { targets: [5, 6, 7], className: "dt-center" },
        ],
        order: [[1, "desc"]],
        language: {
            decimal: "",
            emptyTable: "No hay datos disponibles en la tabla",
            info: "Mostrando _START_ a _END_ de _TOTAL_ registros",
            infoEmpty: "Mostrando 0 a 0 de 0 registros",
            infoFiltered: "(filtrado de _MAX_ registros totales)",
            lengthMenu: "Mostrar _MENU_ registros",
            loadingRecords: "Cargando...",
            processing: "Procesando...",
            search: "Buscar:",
            zeroRecords: "No se encontraron registros coincidentes",
            paginate: { first: "Primero", last: "Último", next: "Siguiente", previous: "Anterior" }
        }
    });
}

// ===================================================================
// LÓGICA DE DETALLE
// ===================================================================

function abrirModalEditar(idPromocion) {
    console.log("Consultando detalle idPromocion:", idPromocion);
    $("body").css("cursor", "wait");

    // Limpiar campos
    $("#formVisualizar")[0].reset();
    $("#lblIdPromocion").text(idPromocion);
    $("#verPromocionHeader").val("");
    $("#btnVerSoporte").data("soporte", "").removeData("soporte").attr("title", "Ver Soporte").removeClass("text-danger");
    $("#contenedor-tabla-articulos").hide().html("");

    // Limpiar campos de segmentos
    $("#verMarca, #verDivision, #verDepartamento, #verClase, #verArticulo").val("");
    $("#verCanal, #verGrupoAlmacen, #verAlmacen, #verTipoCliente, #verMedioPago").val("");

    // Limpiar campos de acuerdos resumen
    $("#verDsctoProv, #verIdAcuerdoProv, #verComprometidoProv").val("");
    $("#verDsctoProp, #verIdAcuerdoProp, #verComprometidoProp").val("");
    $("#verDsctoTotal").val("");

    const payload = {
        code_app: "APP20260128155212346",
        http_method: "GET",
        endpoint_path: "api/Promocion/bandeja-inactivacion-id",
        client: "APL",
        endpoint_query_params: `/${idPromocion}`
    };

    $.ajax({
        url: "/api/apigee-router-proxy",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(payload),
        success: function (response) {
            if (response && response.code_status === 200) {
                const data = response.json_response || {};
                const cab = data?.cabecera || {};
                const segmentos = data?.segmentos || [];
                const acuerdos = data?.acuerdos || [];

                console.log(`Datos de la promoción (${idPromocion}):`, data);

                // ── FILA 1: Header ──
                const idStr = cab.idpromocion ?? "";
                const claseStr = cab.nombre_clase_promocion ?? "";
                $("#verPromocionHeader").val(`${idStr} - ${claseStr}`);

                // Guardar ruta de soporte en el botón PDF
                const rutaSoporte = cab.archivosoporte ?? "";
                $("#btnVerSoporte").data("soporte", rutaSoporte)
                    .toggleClass("text-danger", !!rutaSoporte)
                    .attr("title", rutaSoporte ? `Ver Soporte: ${obtenerNombreArchivo(rutaSoporte)}` : "Sin soporte");

                // ── FILA 2 ──
                $("#verDescripcion").val(cab.descripcion ?? "");
                $("#verMotivo").val(cab.nombre_motivo ?? "");
                $("#verFechaInicio").val(formatearFechaHora(cab.fecha_inicio));
                $("#verFechaFin").val(formatearFechaHora(cab.fecha_fin));
                $("#verEstado").val(cab.nombre_estado_promocion ?? "");

                const esRegalo = (cab.marcaregalo ?? "").toString().trim().toUpperCase() === "S";
                $("#verRegalo").prop("checked", esRegalo);

                // ── FILA 3: Segmentos de Producto ──
                $("#verMarca").val(obtenerTextoSegmento(segmentos, "SEGMARCA") || "Todos");
                $("#verDivision").val(obtenerTextoSegmento(segmentos, "SEGDIVISION") || "Todos");
                $("#verDepartamento").val(obtenerTextoSegmento(segmentos, "SEGDEPARTAMENTO") || "Todos");
                $("#verClase").val(obtenerTextoSegmento(segmentos, "SEGCLASE") || "Todos");
                $("#verArticulo").val(obtenerTextoSegmento(segmentos, "SEGARTICULO") || "");

                // ── FILA 4: Segmentos Canal/Almacén/Cliente/Pago ──
                $("#verCanal").val(obtenerTextoSegmento(segmentos, "SEGCANAL") || "Todos");
                $("#verGrupoAlmacen").val(obtenerTextoSegmento(segmentos, "SEGGRUPOALMACEN") || "Todos");
                $("#verAlmacen").val(obtenerTextoSegmento(segmentos, "SEGALMACEN") || "Todos");
                $("#verTipoCliente").val(obtenerTextoSegmento(segmentos, "SEGTIPOCLIENTE") || "Todos");
                $("#verMedioPago").val(obtenerTextoSegmento(segmentos, "SEGMEDIOPAGO") || "Todos");

                // ── FILA 5: Resumen de Acuerdos ──
                poblarResumenAcuerdos(acuerdos);

                // ── ARTÍCULOS ──
                if (data?.articulos && data.articulos.length > 0) {
                    renderizarTablaArticulos(data.articulos);
                }

                $("#vistaTabla").fadeOut(200, function () {
                    $("#vistaDetalle").fadeIn(200);
                });
                $("body").css("cursor", "default");

            } else {
                $("body").css("cursor", "default");
                Swal.fire({ icon: "error", title: "Error", text: "No se pudo obtener el detalle de la promoción." });
            }
        },
        error: function (xhr) {
            $("body").css("cursor", "default");
            manejarErrorGlobal(xhr, "obtener el detalle de la promoción");
        }
    });
}

function poblarResumenAcuerdos(acuerdos) {
    if (!acuerdos || acuerdos.length === 0) {
        $("#verDsctoProv, #verIdAcuerdoProv, #verComprometidoProv").val("");
        $("#verDsctoProp, #verIdAcuerdoProp, #verComprometidoProp").val("");
        $("#verDsctoTotal").val("");
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
        <h6 class="fw-bold mb-2"><i class="fa fa-list"></i> Detalle de Artículos</h6>
        <div class="table-responsive" style="max-height: 300px; overflow-y: auto;">
            <table class="table table-bordered table-sm mb-0">
                <thead class="sticky-top text-nowrap">
                    <tr class="text-center tabla-items-header">
                        <th scope="col" class="custom-header-cons-bg">Item</th>
                        <th scope="col" class="custom-header-cons-bg">Descripción</th>
                        <th scope="col" class="custom-header-ingr-bg">Precio Contado</th>
                        <th scope="col" class="custom-header-ingr-bg">Precio TC</th>
                        <th scope="col" class="custom-header-ingr-bg">Precio Crédito</th>
                        <th scope="col" class="custom-header-calc-bg">% Descuento</th>
                        <th scope="col" class="custom-header-calc-bg">Valor Descuento</th>
                    </tr>
                </thead>
                <tbody class="text-nowrap tabla-items-body bg-white">`;

    articulos.forEach(art => {
        html += `
            <tr>
                <td class="fw-bold text-center">${art.codigoarticulo || ""}</td>
                <td>${art.descripcion || ""}</td>
                <td class="text-end">${formatearMoneda(art.preciocontado)}</td>
                <td class="text-end">${formatearMoneda(art.preciotarjetacredito)}</td>
                <td class="text-end">${formatearMoneda(art.preciocredito)}</td>
                <td class="text-center fw-bold text-primary">${art.porcentajedescuento ?? 0}%</td>
                <td class="text-end fw-bold">${formatearMoneda(art.valordescuento)}</td>
            </tr>`;
    });

    html += `</tbody></table></div>`;
    $("#contenedor-tabla-articulos").html(html).fadeIn();
}

function cerrarDetalle() {
    $("#contenedor-tabla-articulos").hide().html("");
    $("#vistaDetalle").fadeOut(200, function () {
        $("#vistaTabla").fadeIn(200);
        if (tabla) tabla.columns.adjust();
    });
}

// ===================================================================
// INACTIVAR PROMOCIÓN
// ===================================================================

function inactivarPromocion() {
    const usuario = obtenerUsuarioActual();
    const idOpcionActual = getIdOpcionSeguro();
    const idPromocion = parseInt($("#lblIdPromocion").text(), 10);

    if (!idPromocion || isNaN(idPromocion)) {
        Swal.fire({ icon: "warning", title: "Atención", text: "No se pudo determinar el Id de la promoción." });
        return;
    }

    if (idOpcionActual === "0" || !idOpcionActual) {
        Swal.fire({
            icon: "error",
            title: "Error de Sesión",
            text: "No se pudo obtener el ID de la opción. Por favor, reingrese desde el menú."
        });
        return;
    }

    Swal.fire({
        icon: "question",
        title: "Confirmar inactivación",
        text: `¿Deseas inactivar la Promoción #${idPromocion}?`,
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: "Sí, inactivar",
        cancelButtonText: "Cancelar"
    }).then((r) => {
        if (!r.isConfirmed) return;

        $("body").css("cursor", "wait");

        Swal.fire({
            title: 'Procesando...',
            text: 'Por favor espere',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });

        const body = {
            idpromocion: idPromocion,
            nombreusuarioingreso: usuario,
            idopcion: idOpcionActual,
            idcontrolinterfaz: "BTNINACTIVAR",
            idevento: "EVCLICK",
            nombreusuario: usuario
        };

        console.log("Enviando inactivación de promoción:", body);

        const payload = {
            code_app: "APP20260128155212346",
            http_method: "POST",
            endpoint_path: "api/Promocion/inactivar-promocion",
            client: "APL",
            body_request: body
        };

        $.ajax({
            url: "/api/apigee-router-proxy",
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify(payload),
            success: function (response) {
                $("body").css("cursor", "default");

                if (response && response.code_status === 200) {
                    const data = response.json_response || {};
                    Swal.fire({
                        icon: "success",
                        title: "¡Operación Exitosa!",
                        text: data.respuesta || "Promoción inactivada correctamente.",
                        confirmButtonText: "Aceptar",
                        timer: 2000,
                        timerProgressBar: true
                    }).then(() => {
                        cerrarDetalle();
                        cargarBandeja();
                    });
                } else {
                    const msg = response.json_response?.mensaje || "No se pudo inactivar la promoción.";
                    Swal.fire({ icon: "error", title: "Error", text: msg });
                }
            },
            error: function (xhr) {
                $("body").css("cursor", "default");
                const msg = xhr?.responseJSON?.mensaje || xhr?.responseText || "No se pudo inactivar la promoción.";
                Swal.fire({ icon: "error", title: "Error", text: msg });
            }
        });
    });
}

// ===================================================================
// REGISTRO DE LOG
// ===================================================================

function abrirModalLog(idPromocion) {
    console.log("[abrirModalLog] Consultando logs para idPromocion:", idPromocion);

    $("#tbodyLog").empty();
    $("#logSinDatos").hide();
    $("#contenedorTablaLog").hide();
    $("#logSpinner").show();

    const modal = new bootstrap.Modal(document.getElementById("modalRegistroLog"));
    modal.show();

    const payload = {
        code_app: "APP20260128155212346",
        http_method: "GET",
        endpoint_path: "api/Auditoria/consultar-logs-general",
        client: "APL",
        endpoint_query_params: `/ENTPROMOCION/${idPromocion}`
    };

    console.log("[abrirModalLog] Payload enviado:", JSON.stringify(payload));

    $.ajax({
        url: "/api/apigee-router-proxy",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(payload),
        success: function (response) {
            $("#logSpinner").hide();
            $("#contenedorTablaLog").show();

            console.log("[abrirModalLog] Respuesta:", response);

            if (response && response.code_status === 200) {
                const logs = response.json_response || [];

                if (!Array.isArray(logs) || logs.length === 0) {
                    $("#logSinDatos").show();
                    return;
                }

                let html = "";
                logs.forEach(function (log) {
                    const opcion = log["opción"] ?? log["opcion"] ?? "";
                    const accion = log["acción"] ?? log["accion"] ?? "";
                    const tieneDatos = log.datos && log.datos.toString().trim() !== "";

                    html += `
                        <tr>
                            <td class="text-center fw-bold">${log.idlog ?? ""}</td>
                            <td class="text-center text-nowrap">${log.fecha ?? ""}</td>
                            <td class="text-center">${log.usuario ?? ""}</td>
                            <td>${opcion}</td>
                            <td>${accion}</td>
                            <td class="text-center">${log.entidad ?? ""}</td>
                            <td class="text-center">${log.tipo_proceso ?? ""}</td>
                            <td class="text-center">
                                ${tieneDatos
                            ? `<button type="button" class="btn btn-sm btn-outline-secondary py-0 px-1"
                                               title="Ver datos" onclick="verDatosLog(${log.idlog})">
                                               <i class="fa-regular fa-file-lines"></i>
                                           </button>`
                            : ""}
                            </td>
                        </tr>`;
                });

                window._logsCache = {};
                logs.forEach(function (log) {
                    window._logsCache[log.idlog] = log.datos;
                });

                $("#tbodyLog").html(html);

            } else {
                $("#logSinDatos").show();
                console.warn("[abrirModalLog] code_status no es 200:", response?.code_status);
            }
        },
        error: function (xhr) {
            $("#logSpinner").hide();
            $("#contenedorTablaLog").show();
            $("#logSinDatos").show();
            console.error("[abrirModalLog] Error AJAX:", xhr.status, xhr.responseText);
        }
    });
}

function verDatosLog(idLog) {
    const datos = window._logsCache && window._logsCache[idLog];

    if (!datos) {
        Swal.fire({ icon: "info", title: `Log #${idLog}`, text: "No hay datos disponibles para este registro." });
        return;
    }

    let contenido = datos;
    try {
        const parsed = JSON.parse(datos);
        contenido = JSON.stringify(parsed, null, 2);
    } catch (e) {
        contenido = datos;
    }

    Swal.fire({
        icon: "info",
        title: `Datos del Log #${idLog}`,
        html: `<pre style="text-align:left; font-size:0.78rem; max-height:350px; overflow-y:auto; background:#f8f8f8; border:1px solid #ddd; border-radius:4px; padding:10px; white-space:pre-wrap; word-break:break-all;">${contenido}</pre>`,
        width: 700,
        confirmButtonText: "Cerrar"
    });
}

// ===================================================================
// REGISTRO DE APROBACIONES
// ===================================================================

function abrirModalAprobaciones(idPromocion) {
    console.log("[abrirModalAprobaciones] Consultando aprobaciones para idPromocion:", idPromocion);

    document.querySelectorAll('#tbodyAprobaciones [data-bs-toggle="popover"]').forEach(function (el) {
        const instance = bootstrap.Popover.getInstance(el);
        if (instance) instance.dispose();
    });

    $("#tbodyAprobaciones").empty();
    $("#aprobacionesSinDatos").hide();
    $("#contenedorTablaAprobaciones").hide();
    $("#aprobacionesSpinner").show();

    const modal = new bootstrap.Modal(document.getElementById("modalRegistroAprobaciones"));
    modal.show();

    const payload = {
        code_app: "APP20260128155212346",
        http_method: "GET",
        endpoint_path: "api/Aprobacion/consultar-aprobaciones-generales",
        client: "APL",
        endpoint_query_params: `/ENTPROMOCION/${idPromocion}`
    };

    console.log("[abrirModalAprobaciones] Payload enviado:", JSON.stringify(payload));

    $.ajax({
        url: "/api/apigee-router-proxy",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(payload),
        success: function (response) {
            $("#aprobacionesSpinner").hide();
            $("#contenedorTablaAprobaciones").show();

            console.log("[abrirModalAprobaciones] Respuesta:", response);

            if (response && response.code_status === 200) {
                const aprobaciones = response.json_response || [];

                if (!Array.isArray(aprobaciones) || aprobaciones.length === 0) {
                    $("#aprobacionesSinDatos").show();
                    return;
                }

                let html = "";
                aprobaciones.forEach(function (apr) {
                    const tieneComentario = apr.comentario_aprobador && apr.comentario_aprobador.toString().trim() !== "";

                    const comentarioAttr = (apr.comentario_aprobador ?? "")
                        .replace(/&/g, "&amp;")
                        .replace(/"/g, "&quot;")
                        .replace(/'/g, "&#39;")
                        .replace(/</g, "&lt;")
                        .replace(/>/g, "&gt;");

                    html += `
                        <tr>
                            <td class="text-center">${apr.tipo_solicitud ?? ""}</td>
                            <td class="text-center">${apr.usuario_solicita ?? ""}</td>
                            <td class="text-center text-nowrap">${formatearFecha(apr.fecha_solicitud)}</td>
                            <td class="text-center">
                                <span>${apr.usuario_aprobador ?? ""}</span>
                                ${tieneComentario
                            ? `<button type="button"
                                               class="btn btn-sm btn-link p-0 ms-1 text-dark btn-comentario-popover"
                                               data-bs-toggle="popover"
                                               data-bs-trigger="click"
                                               data-bs-placement="left"
                                               data-bs-title="Comentario de ${apr.usuario_aprobador ?? ""}"
                                               data-bs-content="${comentarioAttr}">
                                               <i class="fa-solid fa-message" style="font-size:0.8rem;"></i>
                                           </button>`
                            : ""}
                            </td>
                            <td class="text-center text-nowrap">${formatearFecha(apr.fecha_aprobacion)}</td>
                            <td class="text-center">${apr.nivel ?? ""}</td>
                            <td class="text-center">${apr.estado ?? ""}</td>
                            <td class="text-center">${apr.lote ?? ""}</td>
                        </tr>`;
                });

                $("#tbodyAprobaciones").html(html);

                document.querySelectorAll('#tbodyAprobaciones [data-bs-toggle="popover"]').forEach(function (el) {
                    new bootstrap.Popover(el, {
                        trigger: 'click',
                        container: '#modalRegistroAprobaciones'
                    });

                    el.addEventListener('show.bs.popover', function () {
                        document.querySelectorAll('#tbodyAprobaciones [data-bs-toggle="popover"]').forEach(function (other) {
                            if (other !== el) {
                                const instance = bootstrap.Popover.getInstance(other);
                                if (instance) instance.hide();
                            }
                        });
                    });
                });

                document.getElementById("modalRegistroAprobaciones")
                    .addEventListener("click", function handler(e) {
                        if (!e.target.closest('.btn-comentario-popover') && !e.target.closest('.popover')) {
                            document.querySelectorAll('#tbodyAprobaciones [data-bs-toggle="popover"]').forEach(function (el) {
                                const instance = bootstrap.Popover.getInstance(el);
                                if (instance) instance.hide();
                            });
                        }
                    });

            } else {
                $("#aprobacionesSinDatos").show();
                console.warn("[abrirModalAprobaciones] code_status no es 200:", response?.code_status);
            }
        },
        error: function (xhr) {
            $("#aprobacionesSpinner").hide();
            $("#contenedorTablaAprobaciones").show();
            $("#aprobacionesSinDatos").show();
            console.error("[abrirModalAprobaciones] Error AJAX:", xhr.status, xhr.responseText);
        }
    });
}

// Autor: JEAN FRANCOIS CALDERON VEAS | Empresa: BMTECSA | Proyecto: SOFTWARE APL