using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppAPL.Dto.Opciones
{
    public sealed record OpcionDto(
    int IdOpcion,
    string Nombre,
    string Descripcion,
    int IdGrupo,
    string Vista,
    int IdEstado
);

    public sealed record CreateOpcionRequest(
        string Nombre,
        string Descripcion,
        int IdGrupo,
        string Vista,
        int IdUsuarioCreacion,
        int IdEstado
    );

    public sealed record UpdateOpcionRequest(
        int IdOpcion,
        string Nombre,
        string Descripcion,
        int IdGrupo,
        string Vista,
        int IdUsuarioModificacion,
        int IdEstado
    );
}
