// Autor: JEAN FRANCOIS CALDERON VEAS | Empresa: BMTECSA | Proyecto: SOFTWARE APL
// ~/js/Fondo/ModificarFondo.js

// ===============================================================
// Variables globales
// ===============================================================
let tabla;
let ultimaFilaModificada = null;
let dtProveedoresModificar = null;
let cacheProveedoresModificar = null;

// ===============================================================
// FUNCIÓN HELPER PARA OBTENER USUARIO
// ===============================================================
function obtenerUsuarioActual() {
    return window.usuarioActual
        || sessionStorage.getItem('usuarioActual')
        || sessionStorage.getItem('usuario')
        || localStorage.getItem('usuarioActual')
        || localStorage.getItem('usuario')
        || "admin";
}

// ===============================================================
// DOCUMENT READY
// ===============================================================
$(document).ready(function () {
    console.log("=== INICIO DE CARGA DE PÁGINA - ModificarFondo (Estructura Post-REST) ===");

    const usuarioFinal = obtenerUsuarioActual();
    console.log("Usuario actual capturado:", usuarioFinal);

    // Configuración inicial y carga de datos
    $.get("/config", function (config) {
        window.apiBaseUrl = config.apiBaseUrl;
        console.log("API Base URL configurada:", config.apiBaseUrl);

        const idOpcionActual = window.obtenerIdOpcionActual();
        if (!idOpcionActual) {
            Swal.fire({
                icon: 'error',
                title: 'Error de Contexto',
                text: 'No se detectó el ID de opción. Acceda desde el menú lateral.'
            });
            return;
        }

        cargarTipoFondo();
        cargarBandeja();
    });

    // ===== BOTÓN LIMPIAR =====
    $('body').on('click', '#btnLimpiar', function () {
        if (tabla) {
            tabla.search('').draw();
            tabla.page(0).draw('page');
            ultimaFilaModificada = null;
            if (typeof limpiarSeleccion === 'function') {
                limpiarSeleccion('#tabla-principal');
            }
        }
    });

    // Cargar proveedores cuando se abre el modal y pasar el RUC actual
    $('#modalConsultaProveedor').on('show.bs.modal', function () {
        $("#buscarProveedorInputModificar").val(""); // Limpiar búsqueda
        const rucActual = $("#modal-fondo-idproveedor-hidden").val(); // Obtener el RUC pre-cargado
        consultarProveedor(rucActual);
    });

    // Botón "Aceptar" del modal de proveedores (Modificación)
    $("#btnAceptarProveedorModificar").on("click", function () {
        const $selected = $("#tablaProveedores tbody input[name='selectProveedor']:checked");

        if ($selected.length > 0) {
            const proveedorNombre = $selected.data("nombre");
            const proveedorRuc = $selected.data("ruc");

            const textoVisible = `${proveedorRuc} - ${proveedorNombre}`;

            console.log("Proveedor seleccionado para modificar:", { nombre: proveedorNombre, ruc: proveedorRuc });

            $("#modal-fondo-proveedor").val(textoVisible);
            $("#modal-fondo-idproveedor-hidden").val(proveedorRuc);

            $('#modalConsultaProveedor').modal('hide');
        } else {
            Swal.fire('Atención', 'Por favor, seleccione un proveedor de la lista.', 'info');
        }
    });

});

// ===================================================================
// LÓGICA DE DATOS (API)
// ===================================================================

function cargarBandeja() {
    const idOpcionActual = window.obtenerIdOpcionActual();

    if (!idOpcionActual) {
        console.error("No se pudo obtener el idOpcion para cargar la bandeja");
        return;
    }

    console.log('Cargando bandeja con idOpcion:', idOpcionActual);

    const payload = {
        code_app: "APP20260128155212346",
        http_method: "GET",
        endpoint_path: "api/Fondo/bandeja-modificacion",
        client: "APL",
        endpoint_query_params: ""
    };

    $.ajax({
        url: "/api/apigee-router-proxy",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(payload),
        success: function (response) {
            console.log("Respuesta de bandeja-modificacion:", response);

            if (response && response.code_status === 200) {
                console.log("Datos de bandeja:", response.json_response);
                crearListado(response.json_response);
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se pudieron cargar los fondos'
                });
            }
        },
        error: (xhr) => manejarErrorGlobal(xhr, "cargar la bandeja de modificación")
    });
}

function cargarTipoFondo() {
    const idOpcionActual = window.obtenerIdOpcionActual();

    if (!idOpcionActual) {
        console.error("No se pudo obtener el idOpcion para cargar tipos de fondo");
        return;
    }

    console.log('Cargando tipos de fondo con idOpcion:', idOpcionActual);

    const payload = {
        code_app: "APP20260128155212346",
        http_method: "GET",
        endpoint_path: "api/Opciones/ConsultarCombos",
        client: "APL",
        endpoint_query_params: "/TIPOFONDO"
    };

    $.ajax({
        url: "/api/apigee-router-proxy",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(payload),
        success: function (response) {
            console.log("Respuesta de tipos de fondo:", response);

            if (response && response.code_status === 200) {
                const data = response.json_response || [];
                console.log("Tipos de fondo procesados:", data);

                const $selectFondoTipo = $("#modal-fondo-tipofondo");
                $selectFondoTipo.empty();
                $selectFondoTipo.append($('<option></option>').val("").text("Seleccione..."));

                if (data && data.length > 0) {
                    data.forEach(function (item) {
                        $selectFondoTipo.append(
                            $('<option></option>')
                                .val(item.idcatalogo)
                                .text(item.nombre_catalogo)
                        );
                    });
                }
            }
        },
        error: (xhr) => manejarErrorGlobal(xhr, "cargar tipos de fondo")
    });
}

function abrirModalEditar(id) {
    const idOpcionActual = window.obtenerIdOpcionActual();

    if (!idOpcionActual) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo obtener el ID de la opción. Por favor, acceda nuevamente desde el menú.'
        });
        return;
    }

    console.log('Abriendo modal para editar fondo ID:', id);

    const payload = {
        code_app: "APP20260128155212346",
        http_method: "GET",
        endpoint_path: "api/Fondo/bandeja-modificacion-id",
        client: "APL",
        endpoint_query_params: `/${id}`
    };

    $.ajax({
        url: "/api/apigee-router-proxy",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(payload),
        success: function (response) {
            console.log("Respuesta del fondo:", response);

            if (!response || response.code_status !== 200) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se pudieron cargar los datos del fondo.'
                });
                return;
            }

            const data = Array.isArray(response.json_response)
                ? response.json_response[0]
                : response.json_response;

            if (!data) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se encontraron datos del fondo.'
                });
                return;
            }

            console.log("Datos procesados del fondo:", data);

            const idProveedor = data.proveedor || '';
            const nombreProveedor = data.nombre_proveedor || '';
            const proveedorCompleto = (idProveedor && nombreProveedor)
                ? `${idProveedor} - ${nombreProveedor}`
                : idProveedor || nombreProveedor || '';

            const datosModal = {
                idfondo: data.idfondo,
                descripcion: data.descripcion,
                proveedor: proveedorCompleto,
                idproveedor: idProveedor,
                tipo_fondo: data.nombre_tipo_fondo,
                valor_fondo: formatearMoneda(data.valor_fondo),
                valor_disponible: formatearMoneda(data.valor_disponible),
                valor_comprometido: formatearMoneda(data.valor_comprometido),
                valor_liquidado: formatearMoneda(data.valor_liquidado),
                fecha_inicio: formatDateForInput(data.fecha_inicio),
                fecha_fin: formatDateForInput(data.fecha_fin),
                estado: data.estado
            };

            console.log("datosModal:", datosModal);
            abrirModalFondo(datosModal);
        },
        error: (xhr) => manejarErrorGlobal(xhr, "obtener datos del fondo")
    });
}

function guardarCambiosFondo() {
    const idOpcionActual = window.obtenerIdOpcionActual();
    const usuario = obtenerUsuarioActual();

    if (!idOpcionActual) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo obtener el ID de la opción. Por favor, acceda nuevamente desde el menú.'
        });
        return;
    }

    console.log('Guardando cambios con idOpcion:', idOpcionActual, 'y usuario:', usuario);

    const id = $("#modal-fondo-id").val();
    const valorFondo = desformatearMoneda($("#modal-fondo-valor").val());

    const body = {
        idfondo: parseInt(id),
        descripcion: $("#modal-fondo-descripcion").val(),
        idproveedor: $("#modal-fondo-idproveedor-hidden").val(),
        idtipofondo: parseInt($("#modal-fondo-tipofondo").val()),
        valorfondo: parseFloat(valorFondo),
        fechainiciovigencia: $("#modal-fondo-fechainicio").val(),
        fechafinvigencia: $("#modal-fondo-fechafin").val(),
        idusuariomodifica: usuario,
        nombreusuariomodifica: usuario,
        idopcion: idOpcionActual,
        idcontrolinterfaz: "BTNMODIFICAR",
        idevento: "EVCLICK",
        nombreusuario: usuario
    };

    console.log("Datos a guardar:", body);

    Swal.fire({
        title: 'Guardando...',
        text: 'Por favor espere',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
    });

    const payload = {
        code_app: "APP20260128155212346",
        http_method: "POST",
        endpoint_path: "api/Fondo/actualizar",
        client: "APL",
        endpoint_query_params: `/${id}`,
        body_request: body
    };

    $.ajax({
        url: "/api/apigee-router-proxy",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(payload),
        success: function (response) {
            console.log("Respuesta de actualizar:", response);

            if (response && response.code_status === 200) {
                if (response.json_response?.codigoretorno && response.json_response.codigoretorno < 0) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: response.json_response.mensaje || 'Error al actualizar el fondo'
                    });
                    return;
                }

                // ✅ MODIFICADO: Ignoramos el mensaje con el 'Log ID' y forzamos el texto solicitado
                const mensajeExito = `Fondo Actualizado Correctamente ${id}`;

                Swal.fire({
                    icon: 'success',
                    title: '¡Operación Exitosa!',
                    text: mensajeExito,
                    showConfirmButton: false,
                    timer: 2000,
                    timerProgressBar: true
                }).then(() => {
                    ultimaFilaModificada = id;
                    cerrarModalFondo();
                    cargarBandeja();
                });
            } else {
                const mensajeError = response.json_response?.mensaje || 'Error al guardar';
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: mensajeError
                });
            }
        },
        error: (xhr) => {
            manejarErrorGlobal(xhr, "guardar los cambios del fondo");
            cerrarModalFondo();
        }
    });
}

function consultarProveedor(rucActualSeleccionado) {
    const idOpcionActual = window.obtenerIdOpcionActual();

    if (!idOpcionActual) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo obtener el ID de la opción. Por favor, acceda nuevamente desde el menú.'
        });
        return;
    }

    function renderizarTabla(data) {
        const filas = data.map(p => {
            const ruc = p.identificacion ?? '';
            const contacto = p.nombrecontacto1 || p.nombrecontacto2 || '';
            const mail = p.mailcontacto1 || p.mailcontacto2 || '';

            const isChecked = (ruc !== '' && ruc === rucActualSeleccionado) ? 'checked' : '';

            return [
                `<input type="radio" name="selectProveedor" data-id="${p.codigo}" data-nombre="${p.nombre}" data-ruc="${ruc}" ${isChecked}>`,
                p.codigo,
                ruc,
                p.nombre,
                contacto,
                mail,
                '-'
            ];
        });

        if (dtProveedoresModificar) {
            dtProveedoresModificar.destroy();
            $("#tablaProveedores tbody").empty();
        }

        dtProveedoresModificar = $("#tablaProveedores").DataTable({
            data: filas,
            columns: [
                { title: "Seleccionar", className: "text-center", orderable: false, searchable: false },
                { title: "Código" },
                { title: "RUC" },
                { title: "Nombre Proveedor" },
                { title: "Contacto" },
                { title: "Mail" },
                { title: "Teléfono", searchable: false }
            ],
            deferRender: true,
            pageLength: 10,
            lengthChange: false,
            dom: '<"row"<"col-12"tr>><"row"<"col-12 text-center"i>><"row"<"col-12 d-flex justify-content-center"p>>',
            language: {
                search: "Buscar:",
                zeroRecords: "No se encontraron proveedores.",
                info: "Mostrando _START_ a _END_ de _TOTAL_ proveedores",
                infoEmpty: "Sin proveedores",
                infoFiltered: "(filtrado de _MAX_ totales)",
                paginate: { first: "«", last: "»", next: "›", previous: "‹" }
            },
            order: [[3, 'asc']],
            initComplete: function () {
                const wrapper = $("#tablaProveedores_wrapper");
                wrapper.find(".dataTables_paginate").attr("style",
                    "text-align:center !important; float:none !important; display:block !important; width:100% !important; padding-top:0.5rem;"
                );
                wrapper.find(".dataTables_info").attr("style",
                    "text-align:center !important; float:none !important; display:block !important; width:100% !important; font-size:0.8rem; padding-top:0.5rem;"
                );
            },
            drawCallback: function () {
                const wrapper = $("#tablaProveedores_wrapper");
                wrapper.find(".dataTables_paginate").attr("style",
                    "text-align:center !important; float:none !important; display:block !important; width:100% !important; padding-top:0.5rem;"
                );
            }
        });

        $("#buscarProveedorInputModificar").off("keyup").on("keyup", function () {
            dtProveedoresModificar.search($(this).val()).draw();
        });
    }

    // Uso de caché para no golpear la API cada vez que abren el modal
    if (cacheProveedoresModificar) {
        renderizarTabla(cacheProveedoresModificar);
        return;
    }

    const $tbody = $("#tablaProveedores tbody");
    $tbody.empty().append('<tr><td colspan="7" class="text-center">Cargando proveedores...</td></tr>');

    const payload = {
        code_app: "APP20260128155212346",
        http_method: "GET",
        endpoint_path: "api/Proveedor/Listar",
        client: "APL",
        endpoint_query_params: ""
    };

    $.ajax({
        url: "/api/apigee-router-proxy",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(payload),
        success: function (response) {
            const data = response.json_response || [];
            cacheProveedoresModificar = data;
            renderizarTabla(data);
        },
        error: function (xhr) {
            console.error("Error al cargar proveedores:", xhr.responseText);
            $tbody.empty().append('<tr><td colspan="7" class="text-center text-danger">Error al cargar datos.</td></tr>');
        }
    });
}

// ===================================================================
// UI Y RENDERIZADO
// ===================================================================

function crearListado(data) {
    if (tabla) {
        tabla.destroy();
    }

    if (!data || data.length === 0) {
        $('#tabla').html(
            "<div class='alert alert-info text-center'>No hay fondos disponibles para modificar.</div>"
        );
        return;
    }

    var html = "";
    html += "<table id='tabla-principal' class='table table-bordered table-striped table-hover'>";
    html += "  <thead>";
    html += "    <tr>";
    html += "      <th colspan='13' style='background-color: #CC0000 !important; color: white; text-align: center; font-weight: bold; padding: 8px; font-size: 1rem;'>";
    html += "         BANDEJA DE MODIFICACIÓN DE FONDOS";
    html += "      </th>";
    html += "    </tr>";
    html += "    <tr>";
    html += "      <th>Acción</th>";
    html += "      <th>IDFondo</th>";
    html += "      <th>Descripción</th>";
    html += "      <th>RUC</th>";
    html += "      <th>Proveedor</th>";
    html += "      <th>Tipo Fondo</th>";
    html += "      <th>$ Fondo</th>";
    html += "      <th>Fecha Inicio</th>";
    html += "      <th>Fecha Fin</th>";
    html += "      <th>$ Disponible</th>";
    html += "      <th>$ Comprometido</th>";
    html += "      <th>$ Liquidado</th>";
    html += "      <th>Estado</th>";
    html += "    </tr>";
    html += "  </thead>";
    html += "  <tbody>";

    for (var i = 0; i < data.length; i++) {
        var fondo = data[i];
        var id = fondo.idfondo;

        var editButton = '<button type="button" class="btn-action edit-btn" title="Editar" onclick="abrirModalEditar(' + id + ')">' +
            '<i class="fa-regular fa-pen-to-square"></i>' +
            '</button>';

        html += "<tr>";
        html += "  <td class='text-center'>" + editButton + "</td>";
        html += "  <td>" + (fondo.idfondo ?? "") + "</td>";
        html += "  <td>" + (fondo.descripcion ?? "") + "</td>";
        html += "  <td>" + (fondo.proveedor ?? "") + "</td>";
        html += "  <td>" + (fondo.nombre_proveedor ?? "") + "</td>";
        html += "  <td>" + (fondo.nombre_tipo_fondo ?? "") + "</td>";
        html += "  <td class='text-end'>" + formatearMoneda(fondo.valor_fondo) + "</td>";
        html += "  <td class='text-center'>" + formatearFecha(fondo.fecha_inicio) + "</td>";
        html += "  <td class='text-center'>" + formatearFecha(fondo.fecha_fin) + "</td>";
        html += "  <td class='text-end'>" + formatearMoneda(fondo.valor_disponible) + "</td>";
        html += "  <td class='text-end'>" + formatearMoneda(fondo.valor_comprometido) + "</td>";
        html += "  <td class='text-end'>" + formatearMoneda(fondo.valor_liquidado) + "</td>";
        html += "  <td>" + (fondo.estado ?? "") + "</td>";
        html += "</tr>";
    }

    html += "  </tbody>";
    html += "</table>";

    $('#tabla').html(html);

    tabla = $('#tabla-principal').DataTable({
        pageLength: 10,
        lengthMenu: [5, 10, 25, 50],
        pagingType: 'full_numbers',
        columnDefs: [
            { targets: 0, width: "8%", className: "dt-center", orderable: false },
            { targets: 1, width: "6%", className: "dt-center" },
            { targets: [5, 8, 9, 10], className: "dt-right" },
            { targets: [6, 7], className: "dt-center" },
        ],
        order: [[1, 'desc']],
        language: {
            url: "https://cdn.datatables.net/plug-ins/1.10.25/i18n/Spanish.json"
        },
        drawCallback: function () {
            if (ultimaFilaModificada !== null && typeof marcarFilaPorId === 'function') {
                marcarFilaPorId('#tabla-principal', ultimaFilaModificada);
            }
        }
    });

    if (typeof inicializarMarcadoFilas === 'function') {
        inicializarMarcadoFilas('#tabla-principal');
    }
}

// ===================================================================
// FUNCIONES DEL MODAL
// ===================================================================

function abrirModalFondo(datos) {
    const modal = document.getElementById('modalEditarFondo');

    document.getElementById('modal-fondo-id').value = datos.idfondo || '';
    document.getElementById('modal-fondo-descripcion').value = datos.descripcion || '';
    document.getElementById('modal-fondo-proveedor').value = datos.proveedor || 'Seleccione...';
    document.getElementById('modal-fondo-idproveedor-hidden').value = datos.idproveedor || '';

    const selectTipoFondo = document.getElementById('modal-fondo-tipofondo');
    const textoTipoFondoBuscado = datos.tipo_fondo || '';
    const opcionesArray = Array.from(selectTipoFondo.options);
    const opcionEncontrada = opcionesArray.find(option => option.text === textoTipoFondoBuscado);
    if (opcionEncontrada) {
        selectTipoFondo.value = opcionEncontrada.value;
    } else {
        selectTipoFondo.value = '';
    }

    document.getElementById('modal-fondo-fechainicio').value = datos.fecha_inicio || '';
    document.getElementById('modal-fondo-fechafin').value = datos.fecha_fin || '';
    document.getElementById('modal-fondo-valor').value = datos.valor_fondo || '';
    document.getElementById('modal-fondo-estado').value = datos.estado || '';
    document.getElementById('modal-fondo-disponible').value = datos.valor_disponible ?? '';
    document.getElementById('modal-fondo-comprometido').value = datos.valor_comprometido ?? '';
    document.getElementById('modal-fondo-liquidado').value = datos.valor_liquidado ?? '';

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function cerrarModalFondo() {
    const modal = document.getElementById('modalEditarFondo');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';

    document.getElementById('formEditarFondo').reset();
}

// ===================================================================
// HELPERS DE UTILIDAD
// ===================================================================

function formatearMoneda(valor) {
    var numero = parseFloat(valor);
    if (isNaN(numero) || valor === null || valor === undefined) {
        return "$ 0.00";
    }
    return '$ ' + numero.toLocaleString('es-EC', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function desformatearMoneda(valorString) {
    if (!valorString || typeof valorString !== 'string') {
        return 0.00;
    }

    let limpio = valorString.replace('$', '').trim();
    limpio = limpio.replace(/\./g, '');
    limpio = limpio.replace(',', '.');
    const numero = parseFloat(limpio);

    return isNaN(numero) ? 0.00 : numero;
}

function formatearFecha(fechaString) {
    try {
        if (!fechaString) return '';
        var fecha = new Date(fechaString);
        if (isNaN(fecha)) return fechaString;

        var dia = String(fecha.getDate()).padStart(2, '0');
        var mes = String(fecha.getMonth() + 1).padStart(2, '0');
        var anio = fecha.getFullYear();

        return `${dia}/${mes}/${anio}`;
    } catch (e) {
        console.warn("Error formateando fecha:", fechaString);
        return fechaString;
    }
}

function formatDateForInput(fechaString) {
    if (!fechaString) return "";
    return fechaString.split('T')[0];
}

function obtenerPrimerValorValido(...valores) {
    for (let valor of valores) {
        if (valor != null && String(valor).trim() !== '') {
            return String(valor).trim();
        }
    }
    return '';
}

function manejarErrorGlobal(xhr, accion) {
    console.error(`QA Report - Error al ${accion}:`, xhr.responseText);
    Swal.fire({
        icon: 'error',
        title: 'Error de Comunicación',
        text: `No se pudo completar la acción: ${accion}.`
    });
}

// ===================================================================
// EVENT LISTENERS PARA EL MODAL
// ===================================================================

document.addEventListener('DOMContentLoaded', function () {
    const modal = document.getElementById('modalEditarFondo');
    if (modal) {
        modal.addEventListener('click', function (e) {
            if (e.target === this) {
                cerrarModalFondo();
            }
        });
    }
});