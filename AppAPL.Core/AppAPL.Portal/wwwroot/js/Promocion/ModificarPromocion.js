// ~/js/Promocion/ModificarPromocion.js

// ===============================================================
// Variables globales
// ===============================================================
let tabla;
let ultimaFilaModificada = null;
let acuerdoSeleccionadoTemporal = null;
let promocionTemporal = null;

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

function formatearFecha(fechaString) {
    if (!fechaString) return "";
    const fecha = new Date(fechaString);
    if (isNaN(fecha.getTime())) return "";
    const dia = fecha.getUTCDate().toString().padStart(2, '0');
    const mes = (fecha.getUTCMonth() + 1).toString().padStart(2, '0');
    const anio = fecha.getUTCFullYear();
    return `${dia}/${mes}/${anio}`;
}

function formatearFechaHora(fechaString) {
    if (!fechaString) return "";
    const fecha = new Date(fechaString);
    if (isNaN(fecha.getTime())) return "";
    const dia = fecha.getUTCDate().toString().padStart(2, '0');
    const mes = (fecha.getUTCMonth() + 1).toString().padStart(2, '0');
    const anio = fecha.getUTCFullYear();
    const hora = fecha.getUTCHours().toString().padStart(2, '0');
    const min = fecha.getUTCMinutes().toString().padStart(2, '0');
    return `${dia}/${mes}/${anio} ${hora}:${min}`;
}

function obtenerNombreArchivo(rutaCompleta) {
    if (!rutaCompleta) return "";
    var nombreArchivo = rutaCompleta.replace(/^.*[\\/]/, '');
    var sinGuid = nombreArchivo.replace(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}_/i, '');
    return sinGuid || nombreArchivo;
}

function isValidDateDDMMYYYY(s) {
    if (!s || !/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return false;
    const [dd, mm, yyyy] = s.split("/").map(Number);
    const d = new Date(yyyy, mm - 1, dd);
    return d.getFullYear() === yyyy && d.getMonth() === mm - 1 && d.getDate() === dd;
}

function toISOFromDDMMYYYY(s) {
    if (!s || !isValidDateDDMMYYYY(s)) return null;
    const [dd, mm, yyyy] = s.split("/").map(Number);
    return new Date(yyyy, mm - 1, dd).toISOString();
}

function compareDatesDDMMYYYY(a, b) {
    const [da, ma, ya] = a.split("/").map(Number);
    const [db, mb, yb] = b.split("/").map(Number);
    return new Date(ya, ma - 1, da).getTime() - new Date(yb, mb - 1, db).getTime();
}

function parseCurrencyToNumber(monedaStr) {
    if (!monedaStr) return 0;
    let v = String(monedaStr).replace(/\$/g, "").replace(/\s/g, "").replace(/\./g, "");
    v = v.replace(",", ".");
    return parseFloat(v) || 0;
}

function formatCurrencySpanish(value) {
    let number = parseFloat(value);
    if (isNaN(number)) number = 0.0;
    const formatter = new Intl.NumberFormat("es-ES", {
        style: "decimal",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
    return `$ ${formatter.format(number)}`;
}

async function consultarCombos(etiqueta) {
    try {
        const payload = {
            code_app: "APP20260128155212346",
            http_method: "GET",
            endpoint_path: "api/Opciones/ConsultarCombos",
            client: "APL",
            endpoint_query_params: `/${etiqueta}`
        };
        const response = await $.ajax({
            url: "/api/apigee-router-proxy",
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify(payload)
        });
        return response.json_response || [];
    } catch (error) {
        console.error("Error consultarCombos:", error);
        return [];
    }
}

// ===============================================================
// DOCUMENT READY
// ===============================================================
$(document).ready(function () {
    console.log("=== INICIO - ModificarPromocion (Estructura Post-REST) ===");

    $.get("/config", function (config) {
        window.apiBaseUrl = config.apiBaseUrl;
        console.log("[config] Config cargada:", config);
        cargarBandeja();
    }).fail(function (xhr) {
        console.error("[config] Error al cargar /config:", xhr);
        cargarBandeja();
    });

    // Botón Limpiar Filtros
    $('body').on('click', '#btnLimpiar', function () {
        if (tabla) {
            tabla.search('').draw();
            tabla.page(0).draw('page');
        }
    });

    // Navegación: volver a la bandeja
    $('#btnVolverTabla, #btnVolverAbajo').on('click', function () {
        cerrarDetalle();
    });

    // Guardar modificación
    $('#btnGuardarModificacion').on('click', function () {
        guardarPromocion();
    });

    // Botones de gestión de acuerdos
    $('#btnAddAcuerdo').on('click', function (e) {
        e.preventDefault();
        cargarAcuerdosDisponibles();
        $('#modalConsultaAcuerdo').modal('show');
    });

    $('#btnModifyAcuerdo').on('click', function (e) {
        e.preventDefault();
        modificarAcuerdoSeleccionado();
    });

    $('#btnDeleteAcuerdo').on('click', function (e) {
        e.preventDefault();
        eliminarAcuerdoSeleccionado();
    });

    // Aceptar acuerdo del modal
    $('#btnAceptarAcuerdo').on('click', function () {
        const $selected = $('#tablaAcuerdosConsulta tbody input[name="selectAcuerdo"]:checked');
        if ($selected.length === 0) {
            Swal.fire({ icon: 'info', title: 'Atención', text: 'Debe seleccionar un acuerdo.' });
            return;
        }
        const item = {
            idacuerdo: $selected.data('idacuerdo'),
            descripcion: $selected.data('descripcion'),
            porcentajedescuento: 0,
            valorcomprometido: 0,
        };
        agregarAcuerdoATabla([item]);
        $('#modalConsultaAcuerdo').modal('hide');
    });

    // Selección de fila en tabla acuerdos
    $(document).on('change', '.acuerdo-row-radio', function () {
        $('#tablaAcuerdosBody tr').removeClass('fila-seleccionada');
        $(this).closest('tr').addClass('fila-seleccionada');
    });

    initDatepickers();
});

// ===================================================================
// FUNCIONES DE CARGA (BANDEJA)
// ===================================================================

function cargarBandeja() {
    console.log("[cargarBandeja] Iniciando carga de bandeja modificación promociones...");

    const payload = {
        code_app: "APP20260128155212346",
        http_method: "GET",
        endpoint_path: "api/Promocion/consultar-bandeja-modificacion",
        client: "APL"
    };

    $.ajax({
        url: "/api/apigee-router-proxy",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(payload),
        success: function (response) {
            if (response && response.code_status === 200) {
                const data = response.json_response || [];
                console.log("[cargarBandeja] Datos recibidos:", data);
                crearListado(data);
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se pudo cargar la bandeja. Código: ' + (response?.code_status || "desconocido")
                });
            }
        },
        error: function (xhr) {
            manejarErrorGlobal(xhr, "cargar la bandeja de modificación de promociones");
        }
    });
}

function crearListado(data) {
    if (tabla) tabla.destroy();

    if (!data || data.length === 0) {
        $('#tabla').html("<div class='alert alert-info text-center'>No hay promociones para modificar.</div>");
        return;
    }

    let html = `
        <table id="tabla-principal" class="table table-bordered table-striped table-hover">
            <thead>
                <tr>
                    <th colspan="10" style="background-color: #CC0000 !important; color: white; text-align: center; font-weight: bold; padding: 8px; font-size: 1rem;">
                        BANDEJA DE MODIFICACIÓN DE PROMOCIONES
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
                    <button type="button" class="btn-action edit-btn" title="Modificar" onclick="abrirModalEditar(${promo.idpromocion})">
                        <i class="fa-regular fa-pen-to-square"></i>
                    </button>
                </td>
                <td class="text-center">${promo.idpromocion ?? ""}</td>
                <td>${promo.descripcion ?? ""}</td>
                <td>${promo.motivo ?? ""}</td>
                <td>${promo.clase_promocion ?? ""}</td>
                <td class="text-center">${formatearFecha(promo.fecha_inicio)}</td>
                <td class="text-center">${formatearFecha(promo.fecha_fin)}</td>
                <td class="text-center">${promo.marcaregalo ?? ""}</td>
                <td>${obtenerNombreArchivo(promo.archivosoporte)}</td>
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
// ABRIR DETALLE / EDITAR
// ===================================================================

function abrirModalEditar(idPromocion) {
    console.log("[abrirModalEditar] Cargando promoción ID:", idPromocion);
    $('body').css('cursor', 'wait');

    // Limpiar formulario
    resetFormulario();
    $('#lblIdPromocion').text(idPromocion);
    $('#modalPromocionId').val(idPromocion);

    const payload = {
        code_app: "APP20260128155212346",
        http_method: "GET",
        endpoint_path: "api/Promocion/bandeja-modificacion-id",
        client: "APL",
        endpoint_query_params: `/${idPromocion}`
    };

    $.ajax({
        url: "/api/apigee-router-proxy",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(payload),
        success: function (response) {
            $('body').css('cursor', 'default');
            if (response && response.code_status === 200) {
                const data = response.json_response || {};
                console.log("[abrirModalEditar] Datos recibidos:", data);
                promocionTemporal = data;

                poblarFormulario(data);

                $('#vistaTabla').fadeOut(200, function () {
                    $('#vistaDetalle').fadeIn(200);
                });
            } else {
                Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo obtener el detalle de la promoción.' });
            }
        },
        error: function (xhr) {
            $('body').css('cursor', 'default');
            manejarErrorGlobal(xhr, "obtener el detalle de la promoción");
        }
    });
}

function poblarFormulario(data) {
    const cab = data.cabecera;
    const acuerdos = data.acuerdos || [];

    // Cabecera
    $('#promocionDescripcion').val(cab.descripcion ?? "");
    $('#promocionMarcaRegalo').val(cab.marcaregalo ?? "N");
    $('#promocionFechaInicio').val(formatearFecha(cab.fecha_inicio));
    $('#promocionFechaFin').val(formatearFecha(cab.fecha_fin));
    $('#lblClasePromocion').text(cab.nombre_clase_promocion ?? "");
    $('#lblEstadoPromocion').text(cab.nombre_estado_promocion ?? "");
    $('#lblArchivoActual').text(obtenerNombreArchivo(cab.archivosoporte) || "Sin archivo");
    $('#modalTipoPromocion').val(cab.etiqueta_clase_promocion ?? "");

    // Cargar motivos y luego setear el valor
    cargarMotivos(function () {
        $('#promocionMotivo').val(cab.id_motivo);
    });

    // Poblar tabla de acuerdos
    $('#tablaAcuerdosBody').empty();
    if (acuerdos.length > 0) {
        agregarAcuerdosExistentesATabla(acuerdos);
    }
}

function resetFormulario() {
    $('#promocionDescripcion').val('');
    $('#promocionMotivo').val('');
    $('#promocionFechaInicio').val('');
    $('#promocionFechaFin').val('');
    $('#promocionMarcaRegalo').val('S');
    $('#lblClasePromocion').text('');
    $('#lblEstadoPromocion').text('');
    $('#lblArchivoActual').text('Sin archivo');
    $('#inputArchivoSoporte').val('');
    $('#tablaAcuerdosBody').empty();
    $('#modalPromocionId').val('');
    $('#modalTipoPromocion').val('');
}

function cerrarDetalle() {
    $('#vistaDetalle').fadeOut(200, function () {
        $('#vistaTabla').fadeIn(200);
    });
}

// ===================================================================
// CARGAR MOTIVOS
// ===================================================================

function cargarMotivos(callback) {
    const $select = $('#promocionMotivo');
    $select.empty().append($('<option>').val('').text('Cargando...'));

    const payload = {
        code_app: "APP20260128155212346",
        http_method: "GET",
        endpoint_path: "api/Opciones/ConsultarCombos",
        client: "APL",
        endpoint_query_params: "/PRMOTIVOS"
    };

    $.ajax({
        url: "/api/apigee-router-proxy",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(payload),
        success: function (response) {
            const data = response.json_response || [];
            $select.empty().append($('<option>').val('').text('Seleccione...'));
            if (Array.isArray(data) && data.length > 0) {
                data.forEach(function (item) {
                    $select.append($('<option>').val(item.idcatalogo).text(item.nombre_catalogo));
                });
            }
            if (typeof callback === 'function') callback();
        },
        error: function (xhr) {
            console.error("Error cargando motivos:", xhr.responseText);
            $select.empty().append($('<option>').val('').text('Error al cargar'));
        }
    });
}

// ===================================================================
// GESTIÓN DE ACUERDOS EN TABLA
// ===================================================================

function agregarAcuerdosExistentesATabla(acuerdos) {
    const $tbody = $('#tablaAcuerdosBody');

    acuerdos.forEach(function (acuerdo) {
        const fila = construirFilaAcuerdo({
            idpromocionacuerdo: acuerdo.idpromocionacuerdo,
            idacuerdo: acuerdo.idacuerdo,
            descripcion: acuerdo.descripcion_acuerdo,
            porcentajedescuento: acuerdo.porcentaje_descuento,
            valorcomprometido: acuerdo.valor_comprometido,
            accion: 'U'
        });
        $tbody.append(fila);
    });
}

function agregarAcuerdoATabla(items) {
    const $tbody = $('#tablaAcuerdosBody');

    items.forEach(function (item) {
        const existe = $tbody.find(`tr[data-idacuerdo="${item.idacuerdo}"]`).length > 0;

        if (existe) {
            const $filaExistente = $tbody.find(`tr[data-idacuerdo="${item.idacuerdo}"]`);
            const $accion = $filaExistente.find('.acuerdo-accion');

            if ($accion.val() === 'D') {
                $accion.val('U');
                $filaExistente.show();
                Swal.fire({ toast: true, position: 'top-end', icon: 'info', title: 'Acuerdo restaurado', showConfirmButton: false, timer: 1500 });
            } else {
                Swal.fire({ title: 'Advertencia', text: `El acuerdo #${item.idacuerdo} ya está en la tabla.`, icon: 'warning' });
            }
            return;
        }

        const fila = construirFilaAcuerdo({
            idpromocionacuerdo: 0,
            idacuerdo: item.idacuerdo,
            descripcion: item.descripcion,
            porcentajedescuento: item.porcentajedescuento || 0,
            valorcomprometido: item.valorcomprometido || 0,
            accion: 'I'
        });
        $tbody.append(fila);
    });
}

function construirFilaAcuerdo(data) {
    return `
    <tr data-idacuerdo="${data.idacuerdo}">
        <td class="text-center align-middle">
            <input type="radio" class="form-check-input acuerdo-row-radio" name="acuerdoSeleccionado">
        </td>
        <td class="align-middle text-center">${data.idacuerdo}</td>
        <td class="align-middle">${data.descripcion ?? ""}</td>
        <td class="align-middle celda-editable">
            <input type="number" class="form-control form-control-sm text-end acuerdo-porcentaje"
                   value="${data.porcentajedescuento ?? 0}" min="0" max="100" step="0.01" disabled>
        </td>
        <td class="align-middle celda-editable">
            <input type="text" class="form-control form-control-sm text-end acuerdo-valor"
                   value="${formatCurrencySpanish(data.valorcomprometido ?? 0)}" disabled>
        </td>
        <input type="hidden" class="acuerdo-idpromocionacuerdo" value="${data.idpromocionacuerdo}">
        <input type="hidden" class="acuerdo-accion" value="${data.accion}">
    </tr>`;
}

function modificarAcuerdoSeleccionado() {
    const $radioSeleccionado = $('#tablaAcuerdosBody .acuerdo-row-radio:checked');

    if ($radioSeleccionado.length === 0) {
        Swal.fire({ icon: 'warning', title: 'Atención', text: 'Debe seleccionar un acuerdo para modificar.' });
        return;
    }

    const $fila = $radioSeleccionado.closest('tr');
    const yaEnEdicion = !$fila.find('.acuerdo-porcentaje').prop('disabled');

    if (yaEnEdicion) {
        Swal.fire({
            title: 'Guardar Cambios',
            text: '¿Desea confirmar los cambios realizados?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#009845',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Sí, Confirmar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                $fila.find('.celda-editable input').prop('disabled', true);
                // Formatear valor al cerrar edición
                const rawVal = $fila.find('.acuerdo-valor').val().replace(/[^0-9.,]/g, '').replace(',', '.');
                $fila.find('.acuerdo-valor').val(formatCurrencySpanish(parseFloat(rawVal) || 0));

                Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Cambios confirmados', showConfirmButton: false, timer: 1500 });
            }
        });
    } else {
        $fila.find('.celda-editable input').prop('disabled', false);
        $fila.find('.acuerdo-porcentaje').focus();
        Swal.fire({ toast: true, position: 'top-end', icon: 'info', title: 'Modo edición activado', showConfirmButton: false, timer: 1500 });
    }
}

function eliminarAcuerdoSeleccionado() {
    const $radioSeleccionado = $('#tablaAcuerdosBody .acuerdo-row-radio:checked');

    if ($radioSeleccionado.length === 0) {
        Swal.fire({ icon: 'warning', title: 'Atención', text: 'Debe seleccionar un acuerdo para eliminar.' });
        return;
    }

    const $fila = $radioSeleccionado.closest('tr');
    const idAcuerdo = $fila.data('idacuerdo');

    Swal.fire({
        title: '¿Está seguro?',
        html: `Se eliminará el acuerdo <strong>#${idAcuerdo}</strong>`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, Eliminar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            const idPromocionAcuerdo = parseInt($fila.find('.acuerdo-idpromocionacuerdo').val(), 10) || 0;

            if (idPromocionAcuerdo === 0) {
                // Es nuevo, eliminar directamente de la tabla
                $fila.remove();
            } else {
                $fila.find('.acuerdo-accion').val('D');
                $fila.hide();
            }

            $radioSeleccionado.prop('checked', false);
            $fila.removeClass('fila-seleccionada');

            Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Acuerdo eliminado', showConfirmButton: false, timer: 1500 });
        }
    });
}

function leerDetalleAcuerdosDesdeTabla() {
    const acuerdos = [];

    $('#tablaAcuerdosBody tr').each(function () {
        const $tr = $(this);
        const accion = $tr.find('.acuerdo-accion').val();
        const idpromocionacuerdo = parseInt($tr.find('.acuerdo-idpromocionacuerdo').val(), 10) || 0;

        // Omitir filas nuevas que fueron eliminadas antes de guardar
        if (idpromocionacuerdo === 0 && accion === 'D') return;

        const idacuerdo = parseInt($tr.data('idacuerdo'), 10) || 0;
        const porcentaje = parseFloat($tr.find('.acuerdo-porcentaje').val()) || 0;
        const valorStr = $tr.find('.acuerdo-valor').val();
        const valor = parseCurrencyToNumber(valorStr);

        acuerdos.push({
            accion: accion,
            idpromocionacuerdo: idpromocionacuerdo,
            idacuerdo: idacuerdo,
            porcentajedescuento: porcentaje,
            valorcomprometido: valor
        });
    });

    console.log("Acuerdos a enviar:", acuerdos);
    return acuerdos;
}

// ===================================================================
// CARGAR ACUERDOS DISPONIBLES (MODAL)
// ===================================================================

function cargarAcuerdosDisponibles() {
    const $tbody = $('#tablaAcuerdosConsulta tbody');
    $tbody.empty().append('<tr><td colspan="5" class="text-center">Cargando...</td></tr>');

    const payload = {
        code_app: "APP20260128155212346",
        http_method: "GET",
        endpoint_path: "api/Acuerdo/consultar-bandeja-modificacion",
        client: "APL"
    };

    $.ajax({
        url: "/api/apigee-router-proxy",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(payload),
        success: function (response) {
            const data = response.json_response || [];
            $tbody.empty();

            if (!Array.isArray(data) || data.length === 0) {
                $tbody.append('<tr><td colspan="5" class="text-center text-muted">No hay acuerdos disponibles.</td></tr>');
                return;
            }

            data.forEach(function (acuerdo) {
                const fila = `
                <tr>
                    <td class="text-center align-middle">
                        <input type="radio" class="form-check-input" name="selectAcuerdo"
                            data-idacuerdo="${acuerdo.idacuerdo}"
                            data-descripcion="${(acuerdo.descripcion ?? '').replace(/"/g, '&quot;')}">
                    </td>
                    <td class="align-middle">${acuerdo.idacuerdo ?? ""}</td>
                    <td class="align-middle">${acuerdo.descripcion ?? ""}</td>
                    <td class="align-middle text-center">${acuerdo.clase_acuerdo ?? ""}</td>
                    <td class="align-middle">${acuerdo.estado ?? ""}</td>
                </tr>`;
                $tbody.append(fila);
            });
        },
        error: function (xhr) {
            $tbody.empty().append('<tr><td colspan="5" class="text-center text-danger">Error al cargar acuerdos.</td></tr>');
            console.error("Error cargando acuerdos:", xhr.responseText);
        }
    });
}

// ===================================================================
// VALIDACIONES
// ===================================================================

function validarPromocion() {
    const descripcion = $('#promocionDescripcion').val();
    const motivo = $('#promocionMotivo').val();
    const fechaInicio = $('#promocionFechaInicio').val();
    const fechaFin = $('#promocionFechaFin').val();

    if (!descripcion || descripcion.trim().length < 3) {
        Swal.fire('Validación', 'Debe ingresar una descripción (mínimo 3 caracteres).', 'warning');
        return false;
    }
    if (!motivo || motivo.trim() === '') {
        Swal.fire('Validación', 'Debe seleccionar un motivo.', 'warning');
        return false;
    }
    if (!isValidDateDDMMYYYY(fechaInicio) || !isValidDateDDMMYYYY(fechaFin)) {
        Swal.fire('Validación', 'Fechas inválidas. Use el formato dd/mm/aaaa.', 'warning');
        return false;
    }
    if (compareDatesDDMMYYYY(fechaInicio, fechaFin) > 0) {
        Swal.fire('Validación', 'La fecha inicio no puede ser mayor que la fecha fin.', 'warning');
        return false;
    }

    const acuerdosActivos = $('#tablaAcuerdosBody tr').filter(function () {
        return $(this).find('.acuerdo-accion').val() !== 'D';
    });

    if (acuerdosActivos.length === 0) {
        Swal.fire('Validación', 'Debe existir al menos un acuerdo activo.', 'warning');
        return false;
    }

    return true;
}

// ===================================================================
// GUARDAR MODIFICACIÓN
// ===================================================================

async function guardarPromocion() {
    if (!validarPromocion()) return;

    const idOpcionActual = getIdOpcionSeguro();
    const usuarioActual = obtenerUsuarioActual();

    const combos = await consultarCombos("TPMODIFICACION");
    let tipoProceso = null;
    if (combos && combos.length > 0) {
        tipoProceso = combos[0];
    }

    if (!tipoProceso) {
        Swal.fire('Error', 'No se pudo obtener el tipo de proceso de modificación.', 'error');
        return;
    }

    const acuerdos = leerDetalleAcuerdosDesdeTabla();
    const fechaInicioISO = toISOFromDDMMYYYY($('#promocionFechaInicio').val());
    const fechaFinISO = toISOFromDDMMYYYY($('#promocionFechaFin').val());

    // Archivo soporte (si hay nuevo archivo)
    let archivoSoporte = "";
    const $fileInput = $('#inputArchivoSoporte')[0];
    if ($fileInput && $fileInput.files && $fileInput.files.length > 0) {
        archivoSoporte = $fileInput.files[0].name; // En un caso real se subiría el archivo
    }

    const body = {
        idpromocion: parseInt($('#modalPromocionId').val(), 10) || 0,
        clasepromocion: $('#modalTipoPromocion').val() || "",
        promocion: {
            descripcion: $('#promocionDescripcion').val(),
            motivo: parseInt($('#promocionMotivo').val(), 10) || 0,
            fechahorainicio: fechaInicioISO,
            fechahorafin: fechaFinISO,
            marcaregalo: $('#promocionMarcaRegalo').val(),
            idusuariomodifica: usuarioActual,
            nombreusuario: usuarioActual
        },
        acuerdos: acuerdos,
        segmentos: [],
        archivosoporte: archivoSoporte,
        idtipoproceso: tipoProceso.idcatalogo,
        idopcion: idOpcionActual,
        idcontrolinterfaz: "BTNGRABAR",
        ideventoetiqueta: "EVCLICK"
    };

    console.log("📤 Enviando JSON Modificar Promoción:", body);

    Swal.fire({
        title: 'Confirmar Modificación',
        html: `¿Desea guardar los cambios de la Promoción <strong>#${body.idpromocion}</strong>?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#009845',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, Guardar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (!result.isConfirmed) return;

        Swal.fire({
            title: 'Guardando...',
            text: 'Por favor espere',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });

        const payload = {
            code_app: "APP20260128155212346",
            http_method: "POST",
            endpoint_path: "api/Promocion/actualizar-promocion",
            client: "APL",
            body_request: body
        };

        $.ajax({
            url: "/api/apigee-router-proxy",
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify(payload),
            success: function (response) {
                if (response && response.code_status === 200) {
                    console.log("✅ Respuesta exitosa:", response.json_response);
                    Swal.fire({
                        icon: 'success',
                        title: '¡Guardado!',
                        text: 'La promoción se modificó correctamente.',
                        showConfirmButton: false,
                        timer: 1600
                    });
                    cargarBandeja();
                    cerrarDetalle();
                } else {
                    const mensajeError = response.json_response?.mensaje || 'Error al guardar la promoción.';
                    Swal.fire({ icon: 'error', title: 'Error al Guardar', text: mensajeError });
                }
            },
            error: function (xhr) {
                console.error("❌ Error guardando promoción:", xhr.status, xhr.responseText);
                let mensajeError = "Algo salió mal al guardar la promoción.";
                try {
                    const errorResponse = JSON.parse(xhr.responseText);
                    mensajeError = errorResponse.message || errorResponse.title || mensajeError;
                } catch (e) {
                    if (xhr.responseText) mensajeError = xhr.responseText;
                }
                Swal.fire({
                    icon: 'error',
                    title: 'Error al Guardar',
                    text: mensajeError,
                    footer: `<small>Código: ${xhr.status}</small>`
                });
            }
        });
    });
}

// ===================================================================
// DATEPICKERS
// ===================================================================

function initDatepickers() {
    if (!$.datepicker) {
        console.warn("jQuery UI Datepicker no está disponible.");
        return;
    }

    $.datepicker.setDefaults($.datepicker.regional["es"] || {});

    const commonOptions = {
        dateFormat: "dd/mm/yy",
        changeMonth: true,
        changeYear: true,
        showButtonPanel: true,
        beforeShow: function (input, inst) {
            setTimeout(function () {
                const buttonPane = $(inst.dpDiv).find(".ui-datepicker-buttonpane");
                const doneButton = buttonPane.find(".ui-datepicker-close");
                doneButton.text("Borrar");
                doneButton.off("click").on("click", function () {
                    $(input).val("");
                    $.datepicker._hideDatepicker();
                });
                buttonPane.find(".ui-datepicker-current").text("Hoy");
            }, 1);
        }
    };

    $('#promocionFechaInicio').datepicker({
        ...commonOptions,
        onSelect: function (dateText) {
            const startDate = $(this).datepicker("getDate");
            if (startDate) {
                const minEndDate = new Date(startDate.getTime());
                minEndDate.setDate(minEndDate.getDate() + 1);
                $('#promocionFechaFin').datepicker("option", "minDate", minEndDate);
                const currentEnd = $('#promocionFechaFin').datepicker("getDate");
                if (currentEnd && currentEnd <= startDate) $('#promocionFechaFin').val('');
            }
        }
    });

    $('#promocionFechaFin').datepicker({ ...commonOptions, minDate: 1 });

    $('#btnFechaInicio').on('click', function () { $('#promocionFechaInicio').datepicker('show'); });
    $('#btnFechaFin').on('click', function () { $('#promocionFechaFin').datepicker('show'); });
}

// Autor: JEAN FRANCOIS CALDERON VEAS | Empresa: BMTECSA | Proyecto: SOFTWARE APL