using AppAPL.Dto.Acuerdo;
using AutoMapper;
using Microsoft.AspNetCore.SignalR.Protocol;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace AppAPL.Negocio.Utilidades
{
    public class AutoMapperProfiles: Profile
    {
        public AutoMapperProfiles()
        {
            CreateMap<BandejaAprobacionAcuerdoRawDTO, BandejaAprobacionAcuerdoDTO>()
                .ForMember(dto => dto.articulos,
                config => config.MapFrom(bandapro => this.DeserializarArticulos(bandapro.articulos_json)));
                
        }

        private List<AcuerdoArticuloDTO>? DeserializarArticulos(string articulos_json)
        {
            List<AcuerdoArticuloDTO>? articulosDeserializados = null;
            if (!string.IsNullOrEmpty(articulos_json))
            {
                // 2. Deserialización: Si falla, la excepción subirá al filtro global.
                articulosDeserializados = JsonSerializer.Deserialize<List<AcuerdoArticuloDTO>>(articulos_json);
            }

            return articulosDeserializados;
        }

    }
}
