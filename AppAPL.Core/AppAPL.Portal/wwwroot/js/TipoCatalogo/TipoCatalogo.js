// Se ejecuta cuando el DOM está listo
$.get("/config", function (config) {
    const apiBaseUrl = config.apiBaseUrl;
    $.get(`${apiBaseUrl}/api/CatalogoTipo/listar`, function (data) {
        console.log(data);
        crearListado(data);
    });
});

function crearListado(data) {
    var html = "";
    html += "<table id='tabla-curso' class='table table-striped'>";
    html += "  <thead><tr><th>Id</th><th>Nombre</th><th>Descripcion</th><th>Opciones</th></tr></thead>";
    html += "  <tbody>";

    if (!data || data.length === 0) {
        html += "<tr><td colspan='3' class='text-center'>Sin datos</td></tr>";
    } else {
        for (var i = 0; i < data.length; i++) {
            var c = data[i];
            html += "<tr>";
            html += "  <td>" + (c.idCatalogoTipo ?? "") + "</td>";
            html += "  <td>" + (c.nombre ?? "") + "</td>";
            html += "  <td>" + (c.descripcion ?? "") + "</td>";
            html += "  <td>" + "<button type='button' class='btn btn - success'>Success</button><button type='button' class='btn btn - danger'>Danger</button>" + "</td>";
            html += "</tr>";
        }
    }

    html += "  </tbody>";
    html += "</table>";

    $('#tabla').html(html);

    $('#tabla-curso').DataTable(
        {
            //searching: false,
            //lengthChange: false,
            //info: false,
        }
    );
}

/*
<table class="table">
    <thead>
        <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Descripción</th>
        </tr>
    </thead>
    <tbody>
        @foreach (var item in Model)
        {
            <tr>
                <td>@item.IdCatalogoTipo</td>
                <td>@item.Nombre</td>
                <td>@item.Descripcion</td>
            </tr>
        }
    </tbody>
</table>*/