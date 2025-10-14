// ~/js/TipoCatalogo/TipoCatalogo.js

// Se ejecuta cuando el DOM está listo
$(document).ready(function () {

    // Configuración inicial y carga de datos
    $.get("/config", function (config) {
        const apiBaseUrl = config.apiBaseUrl;
        // La base URL se mantiene, aunque no la usemos para el modal por ahora
        window.apiBaseUrl = apiBaseUrl;

        $.get(`${apiBaseUrl}/api/CatalogoTipo/listar`, function (data) {
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
        $('#editarModalLabel').text('Editar Tipo de Catálogo');
        // Restaurar el botón a Modificar (azul)
        $('#btnGuardarCambios')
            .html('<i class="fa-solid fa-pen-to-square me-2"></i> Modificar')
            .removeClass('btn-success')
            .addClass('btn-primary');
    });
});


function crearListado(data) {
    var html = "";
    // Asegúrate de usar la clase 'table-striped' de Bootstrap y 'display' de DataTables
    html += "<table id='tabla-curso' class='table table-striped display'>";
    html += "  <thead><tr><th>Id</th><th>Nombre</th><th>Descripcion</th><th>Opciones</th></tr></thead>";
    html += "  <tbody>";

    if (!data || data.length === 0) {
        html += "<tr><td colspan='4' class='text-center'>Sin datos</td></tr>";
    } else {
        for (var i = 0; i < data.length; i++) {
            var c = data[i];

            var id = c.idCatalogoTipo;

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
            html += "  <td>" + (c.idCatalogoTipo ?? "") + "</td>";
            html += "  <td>" + (c.nombre ?? "") + "</td>";
            html += "  <td>" + (c.descripcion ?? "") + "</td>";
            // Insertamos los botones en la columna de Opciones
            html += "  <td>" + optionsHtml + "</td>";
            html += "</tr>";
        }
    }

    html += "  </tbody>";
    html += "</table>";

    $('#tabla').html(html);

    // Inicialización de DataTables
    $('#tabla-curso').DataTable({
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
    $('#modal-idCatalogoTipo').val(id);

    // 3. Restaurar título y botón a modo Edición (en caso de que estuviera en modo Creación)
    $('#editarModalLabel').text('Editar Tipo de Catálogo');
    $('#btnGuardarCambios')
        .html('<i class="fa-solid fa-pen-to-square me-2"></i> Modificar')
        .removeClass('btn-success')
        .addClass('btn-primary');

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
    $('#editarModalLabel').text('Crear Nuevo Tipo de Catálogo');
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
    if (confirm("¿Estás seguro de que deseas eliminar el registro con ID: " + id + "?")) {
        // **TODO:** Aquí debes implementar la llamada AJAX (POST) a tu controlador
        console.log("Procediendo a eliminar el registro: " + id);
    }
}