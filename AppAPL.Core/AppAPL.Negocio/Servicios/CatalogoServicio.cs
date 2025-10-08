using AppAPL.AccesoDatos.Abstracciones;
using AppAPL.Dto.Catalogo;
using AppAPL.Negocio.Abstracciones;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppAPL.Negocio.Servicios
{
    public class CatalogoServicio(ICatalogoRepositorio repo) : ICatalogoServicio
    {
        public Task ActualizarAsync(CrearActualizarCatalogoRequest catalogo, int IdCatalogo)
            => repo.ActualizarAsync(catalogo, IdCatalogo);
        

        public Task<int> CrearAsync(CrearActualizarCatalogoRequest catalogo)
            => repo.CrearAsync(catalogo);
        

        public Task EliminarAsync(int idCatalogo)
            => repo.EliminarAsync(idCatalogo);

        public Task<IEnumerable<CatalogoDTO>> ListarAsync(string? nombre = null, int? idCatalogoTipo = null, int? idEstado = null, DateTime? creadoDesde = null, DateTime? creadoHasta = null, int pageNumber = 1, int pageSize = 50)
            => repo.ListarAsync(nombre, idCatalogoTipo, idEstado, creadoDesde, creadoHasta, pageNumber, pageSize);


        public Task<CatalogoDTO?> ObtenerPorIdAsync(int idCatalogo)
            => repo.ObtenerPorIdAsync(idCatalogo);
    }
}
