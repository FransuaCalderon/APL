using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppAPL.Dto.Opciones
{

    public sealed record PagedResult<T>(int Total, IReadOnlyList<T> Items);
}
