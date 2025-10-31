﻿using AppAPL.Dto.CatalogoTipo;
using AppAPL.Dto.Grupo;
using AppAPL.Dto.Opciones;
using AppAPL.Negocio.Abstracciones;
using Microsoft.AspNetCore.Mvc;

namespace AppAPL.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class OpcionesController(IOpcionServicio servicio, ILogger<OpcionesController> logger) : ControllerBase
    {
        [HttpGet("listar")]
        public async Task<ActionResult<List<OpcionDTO>>> ObtenerTodos()
        {
           
            var listaOpciones = await servicio.ListarAsync();

            return listaOpciones.ToList();
        }

        [HttpGet("ListarOpcionesAutorizadasInternas/{idUsuario:int}")]
        public async Task<ActionResult<GrupoOpcionDTO>> listarPorRol(int idUsuario)
        {
            var listaOpcionesPorRol = await servicio.ListarOpcionesAutorizadasInternas(idUsuario);

            /*
            var grupos = (from filtrado in listaOpcionesPorRol
                          select filtrado.IdGrupo)
             .Distinct();*/

            var grupos = listaOpcionesPorRol
                .Select(x => new GrupoDistinctDTO { IdGrupo = x.IdGrupo, Grupo = x.Grupo })
                .DistinctBy(x => new { x.IdGrupo, x.Grupo }) // 👈 necesitas System.Linq (NET 6+)
                .ToList();

            var listaConvertido = listaOpcionesPorRol.ToList();


            var grupoOpciones = new GrupoOpcionDTO()
            {
                Grupos = grupos,
                Opciones = listaConvertido
            };

            return grupoOpciones;
        }

        [HttpGet("ConsultarComboTipoServicio")]
        public async Task<ActionResult<List<ComboTipoServicioDTO>>> ConsultarComboTipoServicio()
        {
            var listaCombo = await servicio.ConsultarComboTipoServicio();
            return listaCombo.ToList();
        }

        [HttpGet("obtener/{id:int}")]
        public async Task<ActionResult<OpcionDTO>> ObtenerPorId(int id)
        {
            var item = await servicio.ObtenerPorIdAsync(id);
            if (item == null)
                return NotFound(new { mensaje = "No se encontró la opcion" });
            return item;
        }

        [HttpPost("insertar")]
        public async Task<ActionResult> Insertar(CrearActualizarOpcionRequest opcionesDTO)
        {
            int idNuevo = await servicio.CrearAsync(opcionesDTO);

            return Ok(new
            {
                mensaje = "Registro insertado correctamente",
                idGenerado = idNuevo
            });
        }

        [HttpPut("actualizar/{idOpcion:int}")]
        public async Task<ActionResult> Actualizar(CrearActualizarOpcionRequest dto, int idOpcion)
        {
            /*
            if (idCatalogoTipo is null)
                return BadRequest(new { mensaje = "El campo IdCatalogoTipo es obligatorio." });*/

            await servicio.ActualizarAsync(dto, idOpcion);
            return Ok(new { mensaje = "Actualizado correctamente" });
        }

        [HttpDelete("eliminar/{id}")]
        public async Task<ActionResult> Eliminar(int id)
        {
            await servicio.EliminarAsync(id);
            return Ok(new { mensaje = "Eliminado correctamente" });
        }
    }
}