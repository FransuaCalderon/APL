// ~/js/Promocion/Liquidacion.js

let tabla;
let dtArticulosDetalle = null;
let dtCombosDetalle = null;

// ===============================================================
// FUNCIONES HELPER
// ===============================================================
function obtenerUsuarioActual() { return window.usuarioActual || sessionStorage.getItem('usuarioActual') || sessionStorage.getItem('usuario') || localStorage.getItem('usuarioActual') || "admin"; }
function getIdOpcionSeguro() { try { return ((window.obtenerIdOpcionActual && window.obtenerIdOpcionActual()) || (window.obtenerInfoOpcionActual && window.obtenerInfoOpcionActual().idOpcion) || "0"); } catch (e) { return "0"; } }
function manejarErrorGlobal(xhr, accion) { console.error(`Error al ${accion}:`, xhr.responseText); Swal.fire({ icon: 'error', title: 'Error de Comunicación', text: `No se pudo completar la acción: ${accion}.` }); }
function formatearMoneda(valor) { var numero = parseFloat(valor); if (isNaN(numero) || valor === null || valor === undefined) return "$ 0.00"; return '$ ' + numero.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function formatearFecha(f) { if (!f) return ""; try { var fecha = new Date(f); if (isNaN(fecha)) return f; var dia = String(fecha.getDate()).padStart(2, '0'); var mes = String(fecha.getMonth() + 1).padStart(2, '0'); var anio = fecha.getFullYear(); return `${dia}/${mes}/${anio}`; } catch (e) { return f; } }
function formatearFechaHora(f) { if (!f) return ""; const d = new Date(f); if (isNaN(d)) return f; return d.toLocaleDateString("es-EC") + " " + d.toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" }); }
function obtenerNombreArchivo(rutaCompleta) { if (!rutaCompleta) return ""; var nombreArchivo = rutaCompleta.replace(/^.*[\\/]/, ''); var sinGuid = nombreArchivo.replace(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}_/i, ''); return sinGuid || nombreArchivo; }
function obtenerNombreArchivoConGuid(rutaCompleta) { if (!rutaCompleta) return ""; return rutaCompleta.replace(/^.*[\\/]/, ''); }

// ===============================================================
// DOCUMENT READY
// ===============================================================
$(function () {
    console.log("=== INICIO - Liquidacion ===");

    $.get("/config", function (config) {
        window.apiBaseUrl = config.apiBaseUrl;
        cargarBandeja();
    }).fail(function () {
        cargarBandeja();
    });

    $("#btnVolverTabla, #btnVolverAbajo").on("click", function () { cerrarDetalle(); });

    $("body").on("click", "#btnLimpiar", function () { if (tabla) tabla.search("").draw(); });

    // Eventos de Liquidación
    $("#btnLiquidarMasivo").on("click", function () { liquidarMasivo(); });
    $("#btnLiquidarPromocion").on("click", function () { liquidarIndividual(); });

    // Checkbox seleccionar todos
    $(document).on("change", "#chkTodos", function () {
        if (tabla) {
            const isChecked = $(this).prop("checked");
            tabla.$(".chk-promo").prop("checked", isChecked);
        }
    });

    // Control del Checkbox general si se desmarca uno individual
    $(document).on("change", ".chk-promo", function () {
        if (!$(this).prop("checked")) {
            $("#chkTodos").prop("checked", false);
        }
    });
});

// ===================================================================
// BANDEJA
// ===================================================================
function cargarBandeja() {
    const payload = { code_app: "APP20260128155212346", http_method: "GET", endpoint_path: "api/Promocion/consultar-bandeja-liquidacion", client: "APL" };
    $.ajax({
        url: "/api/apigee-router-proxy", method: "POST", contentType: "application/json", data: JSON.stringify(payload),
        success: function (response) {
            if (response && response.code_status === 200) crearListado(response.json_response || []);
            else Swal.fire({ icon: "error", title: "Error", text: "No se pudo cargar la bandeja." });
        },
        error: function (xhr) { manejarErrorGlobal(xhr, "cargar la bandeja de liquidación"); }
    });
}

function crearListado(data) {
    if (tabla) tabla.destroy();
    if (!data || data.length === 0) { $('#tabla').html("<div class='alert alert-info text-center'>No hay promociones para liquidar.</div>"); return; }

    let html = `<table id="tabla-principal" class="table table-bordered table-striped table-hover"><thead>
        <tr><th colspan="11" style="background-color: #CC0000 !important; color: white; text-align: center; font-weight: bold; padding: 8px;">BANDEJA DE LIQUIDACIÓN DE PROMOCIONES</th></tr>
        <tr>
            <th class="text-center"><input type="checkbox" id="chkTodos"></th>
            <th>Acción</th><th>Id Promoción</th><th>Descripción</th><th>Motivo</th><th>Clase de Promoción</th><th>Fecha Inicio</th><th>Fecha Fin</th><th>Regalo</th><th>Soporte</th><th>Estado</th>
        </tr></thead><tbody>`;

    data.forEach(promo => {
        html += `<tr>
            <td class="text-center"><input type="checkbox" class="chk-promo" value="${promo.idpromocion}"></td>
            
            <!-- Aquí está el cambio: Botón de Visualizar convertido a Liquidar Directo -->
            <td class="text-center">
                <button type="button" class="btn-action edit-btn text-primary" title="Liquidar Promoción" onclick="procesarLiquidacion([${promo.idpromocion}])">
                    <i class="fa-solid fa-check-double"></i>
                </button>
            </td>

            <td class="text-center">${promo.idpromocion ?? ""}</td><td>${promo.descripcion ?? ""}</td><td>${promo.motivo ?? ""}</td><td>${promo.clase_promocion ?? ""}</td>
            <td class="text-center">${formatearFecha(promo.fecha_inicio)}</td><td class="text-center">${formatearFecha(promo.fecha_fin)}</td>
            <td class="text-center">${promo.regalo && promo.regalo !== "N" ? "✓" : ""}</td><td>${obtenerNombreArchivo(promo.soporte)}</td><td>${promo.estado ?? ""}</td>
        </tr>`;
    });

    html += `</tbody></table>`;
    $("#tabla").html(html);

    tabla = $("#tabla-principal").DataTable({
        pageLength: 10, lengthMenu: [5, 10, 25, 50], pagingType: 'full_numbers',
        columnDefs: [
            { targets: 0, width: "3%", className: "dt-center", orderable: false },
            { targets: 1, width: "5%", className: "dt-center", orderable: false },
            { targets: 2, width: "8%", className: "dt-center" },
            { targets: [6, 7, 8], className: "dt-center" }
        ],
        order: [[2, "desc"]],
        language: { decimal: "", emptyTable: "No hay datos disponibles en la tabla", info: "Mostrando _START_ a _END_ de _TOTAL_ registros", infoEmpty: "Mostrando 0 a 0 de 0 registros", infoFiltered: "(filtrado de _MAX_ registros totales)", lengthMenu: "Mostrar _MENU_ registros", loadingRecords: "Cargando...", processing: "Procesando...", search: "Buscar:", zeroRecords: "No se encontraron registros coincidentes", paginate: { first: "Primero", last: "Último", next: "Siguiente", previous: "Anterior" } }
    });
}

// ===================================================================
// LIQUIDAR MASIVO Y DESDE DETALLE
// ===================================================================
function liquidarMasivo() {
    if (!tabla) return;
    const seleccionados = tabla.$(".chk-promo:checked").map(function () {
        return parseInt($(this).val(), 10);
    }).get();

    if (seleccionados.length === 0) {
        Swal.fire({ icon: "warning", title: "Atención", text: "Debes seleccionar al menos una promoción para liquidar." });
        return;
    }
    procesarLiquidacion(seleccionados);
}

function liquidarIndividual() {
    const idPromocion = parseInt($("#lblIdPromocion").text(), 10);
    if (!idPromocion || isNaN(idPromocion)) {
        Swal.fire({ icon: "warning", title: "Atención", text: "No se pudo determinar el Id de la promoción." });
        return;
    }
    procesarLiquidacion([idPromocion]);
}

function procesarLiquidacion(idsArray) {
    const usuario = obtenerUsuarioActual();

    const mensaje = idsArray.length === 1
        ? `¿Deseas liquidar la Promoción #${idsArray[0]}?`
        : `¿Deseas liquidar las ${idsArray.length} promociones seleccionadas?`;

    Swal.fire({
        icon: "question", title: "Confirmar Liquidación", text: mensaje,
        showCancelButton: true, confirmButtonColor: '#0d6efd', cancelButtonColor: '#6c757d', confirmButtonText: "Sí, liquidar", cancelButtonText: "Cancelar"
    }).then(async (r) => {
        if (!r.isConfirmed) return;

        $("body").css("cursor", "wait");
        Swal.fire({ title: 'Procesando...', text: 'Por favor espere', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

        try {
            // Se crea un arreglo de peticiones AJAX, una por cada ID seleccionado
            const peticiones = idsArray.map(id => {
                const body = {
                    idpromocion: id,
                    usuario: usuario
                };

                const payload = {
                    code_app: "APP20260128155212346",
                    http_method: "POST",
                    endpoint_path: "api/Promocion/liquidar-promociones",
                    client: "APL",
                    body_request: body
                };

                return $.ajax({
                    url: "/api/apigee-router-proxy",
                    method: "POST",
                    contentType: "application/json",
                    data: JSON.stringify(payload)
                });
            });

            // Promise.all espera a que TODAS las peticiones terminen
            const resultados = await Promise.all(peticiones);

            // Validamos que todas hayan devuelto code_status === 200
            const exitos = resultados.filter(res => res.code_status === 200);

            if (exitos.length === idsArray.length) {
                Swal.fire({
                    icon: "success",
                    title: "¡Operación Exitosa!",
                    text: "Promoción(es) liquidada(s) correctamente.",
                    confirmButtonText: "Aceptar",
                    timer: 2000,
                    timerProgressBar: true
                }).then(() => {
                    if (typeof cerrarDetalle === "function") cerrarDetalle();
                    cargarBandeja();
                    $("#chkTodos").prop("checked", false); // Limpia el checkbox maestro
                });
            } else {
                Swal.fire({
                    icon: "warning",
                    title: "Atención",
                    text: `Se liquidaron ${exitos.length} de ${idsArray.length} promociones. Revisa la bandeja para ver el estado actual.`
                }).then(() => {
                    cargarBandeja();
                });
            }

        } catch (error) {
            console.error("Error en liquidación:", error);
            Swal.fire({
                icon: "error",
                title: "Error",
                text: "Ocurrió un error de comunicación al intentar liquidar las promociones."
            });
        } finally {
            $("body").css("cursor", "default");
        }
    });
}

// Autor: JEAN FRANCOIS CALDERON VEAS | Empresa: BMTECSA | Proyecto: SOFTWARE APL