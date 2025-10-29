$(document).ready(function () {
    console.log("cargnado fondos");

    $.get("/config", function (config) {
        const apiBaseUrl = config.apiBaseUrl;
        window.apiBaseUrl = apiBaseUrl;

        //console.log("apiBaseUrl ",apiBaseUrl);
    });


    $("#btnGuardarFondos").on("click", function (e) {
        e.preventDefault();
        console.log("Guardando fondos");


        Swal.fire({
            title: 'Confirmar Guardado de fondos',
            text: "¿Estás seguro de que deseas guardar el fondo ",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#009845',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, Guardar',
            cancelButtonText: 'Cancelar',
        }).then((result) => {
            const data = {
                descripcion_fondo: $("#inputDescripcion").val(),
                idproveedor: 0,
                tipo_fondo: 0,
                valor_fondo: 0,
                fecha_inicio_vigencia: $("#inputFecha1").val(),
                fecha_fin_vigencia: $("#inputFecha2").val(),
                valor_disponible: 0,
                valor_comprometido: 0,
                valor_liquidado: 0,
                estado_registro: 0,
                indicador_creacion: 0
            };


            console.log("data antes de enviar", data);


            if (result.isConfirmed) {
                
                const url = `${window.apiBaseUrl}/api/Fondo/insertar`;
                const method = "POST";

                $.ajax({
                    url: url,
                    type: method,
                    contentType: "application/json",
                    data: JSON.stringify(data),
                    headers: {
                        "idopcion": "1",
                        "usuario": "admin"
                    },
                    success: function (response) {
                        //$("#editarModal").modal("hide");

                        Swal.fire({
                            icon: 'success',
                            title: '¡Guardado!',
                            text: 'El registro se ha guardado correctamente.',
                            showConfirmButton: false,
                            timer: 1500
                        });

                        // Si es edición, mantén el ID para marcarlo
                        /*
                        if (!isCrear && id) {
                            ultimaFilaModificada = id;
                        }
                        
                        $.get(`${window.apiBaseUrl}/api/CatalogoTipo/listar`, function (data) {
                            crearListado(data);
                        });*/
                    },
                    error: function () {
                        const mensaje = "guardar";
                        Swal.fire({
                            icon: 'error',
                            title: 'Oops...',
                            text: `¡Algo salió mal al ${mensaje} el registro!`
                        });
                    }
                });
            }

           

        });
        
        
        


    });
});