// ~/js/TipoCatalogo/TipoCatalogo.js

// Se ejecuta cuando el DOM está listo
let tabla; // GLOBAL
$(document).ready(function () {

    // Configuración inicial y carga de datos
    $.get("/config", function (config) {
        const apiBaseUrl = config.apiBaseUrl;
        // La base URL se mantiene, aunque no la usemos para el modal por ahora
        window.apiBaseUrl = apiBaseUrl;

        $.get(`${apiBaseUrl}/api/Catalogo/listar`, function (data) {
            console.log(data);
            crearListado(data);
        });
    });

    // -------------------------------------------------------------
    // FUNCIONALIDAD DEL BOTÓN AGREGAR (USANDO DELEGACIÓN PARA EL CLIC)
    // Usamos delegación en 'body' porque el botón se añade dinámicamente por JS
    // -------------------------------------------------------------
    $('body').on('click', '#btnAgregarNuevo', function () {
        abrirModalCrear();
    });

    // Lógica para manejar el cierre del modal y restaurar el estado de Edición
    $('#editarModal').on('hidden.bs.modal', function () {
        // Asegurarse de que el modal vuelva a su estado original de Edición
        $('#editarModalLabel').text('Editar Catálogo');
        // Restaurar el botón a Modificar (azul)
        $('#btnGuardarCambios')
            .html('<i class="fa-solid fa-pen-to-square me-2"></i> Modificar')
            .removeClass('btn-success')
            .addClass('btn-primary');
    });



    $("#btnGuardarCambios").on("click", function (e) {
        e.preventDefault(); // Evita que recargue la página

        const id = $("#modal-idCatalogo").val(); // si está vacío, es creación
        const isCrear = !id;


        const data = {
            nombre: $("#modal-nombre").val(),
            adicional: $("#modal-adicional").val(),
            abreviatura: $("#modal-abreviatura").val(),
            idCatalogoTipo: 3,
            idUsuarioCreacion: 1,
            fechaCreacion: new Date().toISOString(),
            idUsuarioModificacion: 1,
            fechaModificacion: new Date().toISOString(),
            idEstado: $("#modal-activo").is(":checked") ? 1 : 0,
            idEtiqueta: $("#modal-etiqueta").val()
        };

        // Solo para creación
        if (isCrear) {
            data.idUsuarioCreacion = 1;
            data.fechaCreacion = new Date().toISOString();
        }


        const url = id ? `${window.apiBaseUrl}/api/Catalogo/actualizar/${id}`
            : `${window.apiBaseUrl}/api/Catalogo/insertar`;

        const method = id ? "PUT" : "POST";



        console.log(data); // Verifica los valores antes de enviar
        console.log(window.apiBaseUrl);


        $.ajax({
            url: url,
            type: method,
            contentType: "application/json",
            data: JSON.stringify(data),
            success: function (response) {
                $("#editarModal").modal("hide"); // ✅ Cierra el modal
                alert("Guardado correctamente");
                // ✅ Recarga la tabla
                $.get(`${window.apiBaseUrl}/api/Catalogo/listar`, function (data) {
                    crearListado(data);
                });
            },
            error: function () {
                const mensaje = id ? "actualizar" : "guardar"
                alert(`Error al ${mensaje}`);
            }
        });
    });
});


function crearListado(data) {
    var html = "";
    // Asegúrate de usar la clase 'table-striped' de Bootstrap y 'display' de DataTables
    html += "<table id='tabla-curso' class='table table-striped display'>";
    html += "  <thead><tr><th>Id</th><th>Nombre</th><th>Adicional</th><th>Abreviatura</th><th>Opciones</th></tr></thead>";
    html += "  <tbody>";

    if (!data || data.length === 0) {
        html += "<tr><td colspan='4' class='text-center'>Sin datos</td></tr>";
    } else {
        for (var i = 0; i < data.length; i++) {
            var c = data[i];

            var id = c.idCatalogo;

            // 1. Botón Editar: Usando fa-solid fa-pen-to-square
            var editButton = '<button type="button" class="btn-action edit-btn" title="Editar" onclick="abrirModalEditar(' + id + ')">' +
                '<i class="fa-solid fa-pen-to-square"></i>' + // Ícono de edición actualizado
                '</button>';

            // 2. Botón Eliminar: Usando fa-regular fa-trash-can
            var deleteButton = '<button type="button" class="btn-action delete-btn" title="Eliminar" onclick="confirmDelete(' + id + ')">' +
                '<i class="fa-regular fa-trash-can"></i>' + // Ícono de eliminación actualizado
                '</button>';

            var optionsHtml = '<div class="action-buttons">' + editButton + deleteButton + '</div>';

            html += "<tr>";
            html += "  <td>" + (c.idCatalogo ?? "") + "</td>";
            html += "  <td>" + (c.nombre ?? "") + "</td>";
            html += "  <td>" + (c.adicional ?? "") + "</td>";
            html += "  <td>" + (c.abreviatura ?? "") + "</td>";
            // Insertamos los botones en la columna de Opciones
            html += "  <td>" + optionsHtml + "</td>";
            html += "</tr>";
        }
    }

    html += "  </tbody>";
    html += "</table>";

    $('#tabla').html(html);

    // Inicialización de DataTables
    tabla = $('#tabla-curso').DataTable({
        // ... opciones de DataTables ...
    });

    // -------------------------------------------------------------
    // INYECTAR BOTÓN AGREGAR EN EL CONTROL DE PÁGINAS DE DATATABLES
    // -------------------------------------------------------------
    const addButtonHtml = `
        <button type="button" class="btn btn-primary ms-2" id="btnAgregarNuevo" title="Agregar Nuevo" style="height: 38px;">
            <i class="fa-solid fa-plus"></i>
        </button>
    `;

    // El ID del contenedor de "entries per page" es 'tabla-curso_length'
    const lengthContainer = $('#tabla-curso_length');

    // 1. Inyectamos el botón (con margen a la izquierda de 2)
    lengthContainer.prepend(addButtonHtml);

    // 2. Aplicamos estilos flex para asegurar alineación vertical con el select
    lengthContainer.css('display', 'flex');
    lengthContainer.css('align-items', 'center');
}

// -------------------------------------------------------------
// FUNCIONALIDAD DEL MODAL DE EDICIÓN
// -------------------------------------------------------------

function abrirModalEditar(id) {

    // 1. Limpiar el formulario del modal antes de cargar nuevos datos
    $('#formEditar')[0].reset();

    // 2. Establecer el ID para la acción de Edición
    $('#modal-idCatalogo').val(id);

    // 3. Restaurar título y botón a modo Edición (en caso de que estuviera en modo Creación)
    $('#editarModalLabel').text('Editar Catálogo');
    $('#btnGuardarCambios')
        .html('<i class="fa-solid fa-pen-to-square me-2"></i> Modificar')
        .removeClass('btn-success')
        .addClass('btn-primary');


    // Obtén los datos del registro por ID desde la API
    $.get(`${window.apiBaseUrl}/api/Catalogo/obtener/${id}`, function (data) {

        console.log(data);

        // Llena el formulario del modal
        $("#IdCatalogo").val(data.idCatalogo);
        $("#modal-nombre").val(data.nombre);
        $("#modal-adicional").val(data.adicional);
        $("#modal-abreviatura").val(data.abreviatura);
     

        // Supongamos que `data.activo` viene como 1 o 0
        $("#modal-activo").prop("checked", data.idEstado === 1);

        $("#modal-etiqueta").val(data.idEtiqueta);
        // Cambia el texto del botón y abre el modal
        $("#btnGuardar").text("Actualizar");
        $("#editarModal").modal("show");
    });


    // 4. Mostrar el modal de Bootstrap
    var editarModal = new bootstrap.Modal(document.getElementById('editarModal'));
    editarModal.show();

    // **TODO:** Aquí iría la lógica AJAX para cargar los datos del ID
}

// -------------------------------------------------------------
// NUEVA FUNCIONALIDAD: ABRIR MODAL PARA CREACIÓN
// -------------------------------------------------------------

function abrirModalCrear() {
    // 1. Limpiar el formulario y resetear el ID
    $('#formEditar')[0].reset();
    $('#modal-idCatalogoTipo').val('');

    // 2. Cambiar el título del modal y el texto del botón para la acción de Creación
    $('#editarModalLabel').text('Crear Nuevo Catálogo');
    $('#btnGuardarCambios')
        // Usamos el ícono de más y cambiamos el color a verde (btn-success) para distinguirlo
        .html('<i class="fa-solid fa-plus me-2"></i> Crear')
        .removeClass('btn-primary')
        .addClass('btn-success');

    // 3. Mostrar el modal de Bootstrap
    var crearModal = new bootstrap.Modal(document.getElementById('editarModal'));
    crearModal.show();
}

// -------------------------------------------------------------
// FUNCIONALIDAD DE ELIMINACIÓN
// -------------------------------------------------------------

function confirmDelete(id) {

    Swal.fire({
        title: 'Confirmar Eliminacion',
        text: "¿Estás seguro de que deseas eliminar el registro con ID: " + id + "?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#009845',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, Eliminar',
        cancelButtonText: 'Cancelar',
    }).then(async (result) => {
        if (result.isConfirmed) {
            // **TODO:** Aquí debes implementar la llamada AJAX (POST) a tu controlador
            console.log("Procediendo a eliminar el registro: " + id);


            $.ajax({
                url: `${window.apiBaseUrl}/api/Catalogo/eliminar/${id}`,
                type: "DELETE",
                success: function () {
                    alert("Registro eliminado correctamente");

                    // Recarga la tabla
                    $.get(`${window.apiBaseUrl}/api/Catalogo/listar`, function (data) {
                        crearListado(data);
                    });
                },
                error: function () {
                    alert("Error al eliminar");
                }
            });
        }
    });

}



