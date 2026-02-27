using AppAPL.AccesoDatos.Abstracciones;
using AppAPL.Api.Attributes;
using AppAPL.Api.Handlers.Interfaces;
using AppAPL.Dto;
using AppAPL.Dto.Fondos;
using AppAPL.Dto.Promocion;
using AppAPL.Dto.Proveedor;
using System.Text.Json;

namespace AppAPL.Api.Handlers
{
    public class PromocionesEmailHandler (IEmailRepositorio emailRepo, ILogger<PromocionesEmailHandler> logger, IFondoRepositorio fondoRepo, IAcuerdoRepositorio acuerdoRepo,
        ICatalogoRepositorio catalogoRepo, IPromocionRepositorio promocionRepo) 
        : HandlerBase (emailRepo, logger) ,IPromocionesEmailHandler
    {

        public async Task HandleAsync(string entidad, TipoProceso tipoProceso, string requestBody, BandModPromocionIDDTO? promocionAntiguo = null, string? responseBody = null)
        {
            logger.LogInformation($"[PromocionesHandler] Procesando correo. Entidad={entidad}, TipoProceso={tipoProceso}");
            var jsonOptions = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };

            // 🔹 Mapear el enum a la etiqueta que usa el SP
            string tipoProcEtiqueta = tipoProceso switch
            {
                TipoProceso.Creacion => "TPCREACION",
                TipoProceso.Modificacion => "TPMODIFICACION",
                TipoProceso.Aprobacion => "TPAPROBACION",
                TipoProceso.Inactivacion => "TPINACTIVACION",
                TipoProceso.AprobacionInactivacion => "TPAPROBACIONINACTIVACION",
                _ => tipoProceso.ToString().ToUpper()
            };

            // 1. Declaramos las variables que llenará el switch
            var proveedores = new List<ProveedorDTO>();
            //Dictionary<string, string> camposPlantilla = null;
            string notificacion = "";

            // 2. Aplicamos el "Strategy Pattern". 
            // Cada 'case' es una estrategia completa: deserializa el DTO correcto
            // y construye los campos de plantilla específicos para ese DTO.

            switch (tipoProceso)
            {
                case TipoProceso.Creacion:
                    
                    var reqCreacion = JsonSerializer.Deserialize<CrearPromocionRequestDTO>(requestBody, jsonOptions);
                    

                    var retorno = JsonSerializer.Deserialize<ControlErroresDTO>(responseBody, jsonOptions);
                    if (retorno == null)
                    {
                        logger.LogWarning("No existe Response body");
                        return;
                    }
                    


                    // 1. Validación de seguridad para los Acuerdos
                    if (reqCreacion.Acuerdos == null || reqCreacion.Acuerdos.Count < 2)
                    {
                        logger.LogWarning("No se puede procesar el envío: Faltan acuerdos (Proveedor y Propio).");
                        return; // O lanza una excepción controlada
                    }

                    //proceso para obtener los proveedores de los acuerdos
                    foreach (var item in reqCreacion.Acuerdos)
                    {
                        var acuerdo = await acuerdoRepo.ObtenerBandejaConsultaPorId(item.IdAcuerdo);

                        var fondo = await fondoRepo.ObtenerPorIdAsync(acuerdo.cabecera.idfondo);

                        var proveedor = new ProveedorDTO
                        {
                            Identificacion = fondo.IdProveedor,
                            Nombre = fondo.nombre_proveedor
                        };

                        proveedores.Add(proveedor);
                    }

                    
                    notificacion = $"apl solicitud {tipoProceso} promocion".ToUpper();

                    string marcas = this.ObtenerDetalleSegmentoPorTipo(reqCreacion.Segmentos, "SEGMARCA");
                    string divisiones = this.ObtenerDetalleSegmentoPorTipo(reqCreacion.Segmentos, "SEGDIVISION");
                    string clases = this.ObtenerDetalleSegmentoPorTipo(reqCreacion.Segmentos, "SEGCLASE");
                    string departamentos = this.ObtenerDetalleSegmentoPorTipo(reqCreacion.Segmentos, "SEGDEPARTAMENTO");

                    string canales = this.ObtenerDetalleSegmentoPorTipo(reqCreacion.Segmentos, "SEGCANAL");
                    string gruposalmacenes = this.ObtenerDetalleSegmentoPorTipo(reqCreacion.Segmentos, "SEGGRUPOALMACEN");
                    string almacenes = this.ObtenerDetalleSegmentoPorTipo(reqCreacion.Segmentos, "SEGALMACEN");
                    string tiposclientes = this.ObtenerDetalleSegmentoPorTipo(reqCreacion.Segmentos, "SEGTIPOCLIENTE");
                    string mediospagos = this.ObtenerDetalleSegmentoPorTipo(reqCreacion.Segmentos, "SEGMEDIOPAGO");

                    var motivo = await catalogoRepo.ObtenerPorIdAsync(reqCreacion.Promocion.Motivo);


                    var descuentoTotal = reqCreacion.Acuerdos[0].ValorComprometido + reqCreacion.Acuerdos[1].ValorComprometido;
                    var camposBase = new Dictionary<string, string>
                        {
                           
                            { "IdPromocion",  retorno.Id.ToString() },
                            { "Descripcion",  reqCreacion.Promocion.Descripcion },
                            { "Motivo",  motivo.Nombre },
                            { "FechaInicio",  reqCreacion.Promocion.FechaHoraInicio.ToString() },
                            { "FechaFin",  reqCreacion.Promocion.FechaHoraFin.ToString() },
                            { "Estado",  "Nuevo" },
                            { "DescuentoTotal",  descuentoTotal.ToString("N2") },
                            { "Regalo",  reqCreacion.Promocion.MarcaRegalo },

                            { "Marca",  marcas },
                            { "Division",  divisiones },
                            { "Departamento",  departamentos },
                            { "Clase",  clases },

                            { "Canal",  canales },
                            { "Grupo",  gruposalmacenes },
                            { "Almacen",  almacenes },
                            { "TipoCliente",  tiposclientes },
                            { "MedioPago",  mediospagos },

                            { "AcuerdoProveedor",  reqCreacion.Acuerdos[0].IdAcuerdo.ToString() },
                            { "PorcentajeProveedor",  reqCreacion.Acuerdos[0].PorcentajeDescuento.ToString("N2") },
                            { "ValorComprometidoProveedor",  reqCreacion.Acuerdos[0].ValorComprometido.ToString("N2") },

                            { "AcuerdoPropio",  reqCreacion.Acuerdos[1].IdAcuerdo.ToString() },
                            { "PorcentajePropio",  reqCreacion.Acuerdos[1].PorcentajeDescuento.ToString("N2") },
                            { "ValorComprometidoPropio",  reqCreacion.Acuerdos[1].ValorComprometido.ToString("N2") },

                            { "Firma",  reqCreacion.Promocion.NombreUsuario },
                        };

                    foreach (var proveedor in proveedores)
                    {

                        // 2. Creamos una copia del diccionario base para este proveedor específico
                        var camposPlantilla = new Dictionary<string, string>(camposBase);

                        // 3. Solo agregamos/actualizamos lo que cambia
                        camposPlantilla["Nombre"] = proveedor.Nombre;

                        // 4. Enviamos el correo
                        await EnviarCorreo(entidad, tipoProcEtiqueta, proveedor.Identificacion, tipoProceso, camposPlantilla, notificacion);

                        logger.LogInformation($"Enviando correo a {proveedor.Nombre}");

                        
                    }

                    break;
                    
                case TipoProceso.Modificacion:

                    
                    // Asumo que tienes un DTO 'ModificarFondoRequest'
                    var reqModif = JsonSerializer.Deserialize<ActualizarPromocionRequest>(requestBody, jsonOptions);
                    if (reqModif == null)
                    {
                        logger.LogWarning("⚠️ [PromocionesHandler] No se pudo obtener IdProveedor de ActualizarPromocionRequest.");
                        return;
                    }

                    if (promocionAntiguo == null)
                    {
                        logger.LogWarning("⚠️ [PromocionesHandler] No se pudo obtener promocion antiguo");
                        return;
                    }


                    if (reqModif.Acuerdos == null || reqModif.Acuerdos.Count < 2)
                    {
                        logger.LogWarning("No se puede procesar el envío: Faltan acuerdos (Proveedor y Propio).");
                        return; // O lanza una excepción controlada
                    }


                    //proceso para obtener los proveedores de los acuerdos
                    foreach (var item in reqModif.Acuerdos)
                    {
                        var acuerdo = await acuerdoRepo.ObtenerBandejaConsultaPorId(item.IdAcuerdo);

                        var fondo = await fondoRepo.ObtenerPorIdAsync(acuerdo.cabecera.idfondo);

                        var proveedor = new ProveedorDTO
                        {
                            Identificacion = fondo.IdProveedor,
                            Nombre = fondo.nombre_proveedor
                        };

                        proveedores.Add(proveedor);
                    }

                    string marcas2 = this.ObtenerDetalleSegmentoPorTipo(reqModif.Segmentos, "SEGMARCA");
                    string divisiones2 = this.ObtenerDetalleSegmentoPorTipo(reqModif.Segmentos, "SEGDIVISION");
                    string clases2 = this.ObtenerDetalleSegmentoPorTipo(reqModif.Segmentos, "SEGCLASE");
                    string departamentos2 = this.ObtenerDetalleSegmentoPorTipo(reqModif.Segmentos, "SEGDEPARTAMENTO");

                    string canales2 = this.ObtenerDetalleSegmentoPorTipo(reqModif.Segmentos, "SEGCANAL");
                    string gruposalmacenes2 = this.ObtenerDetalleSegmentoPorTipo(reqModif.Segmentos, "SEGGRUPOALMACEN");
                    string almacenes2 = this.ObtenerDetalleSegmentoPorTipo(reqModif.Segmentos, "SEGALMACEN");
                    string tiposclientes2 = this.ObtenerDetalleSegmentoPorTipo(reqModif.Segmentos, "SEGTIPOCLIENTE");
                    string mediospagos2 = this.ObtenerDetalleSegmentoPorTipo(reqModif.Segmentos, "SEGMEDIOPAGO");

                    var motivo2 = await catalogoRepo.ObtenerPorIdAsync(reqModif.Promocion.Motivo);

                    var descuentoTotal3 = reqModif.Acuerdos[0].ValorComprometido + reqModif.Acuerdos[1].ValorComprometido;

                    var camposBase3 = new Dictionary<string, string>
                    {
                        { "IdPromocion", Comparar(reqModif.IdPromocion.ToString(), promocionAntiguo.cabecera.IdPromocion.ToString()) },
                        { "Descripcion", Comparar(reqModif.Promocion.Descripcion, promocionAntiguo.cabecera.Descripcion) },
                        { "Motivo", Comparar(motivo2.Nombre, promocionAntiguo.cabecera.nombre_motivo) },
                        { "FechaInicio", Comparar(reqModif.Promocion.FechaHoraInicio.ToString("yyyy-MM-dd HH:mm"),
                                                  promocionAntiguo.cabecera.fecha_inicio.ToString("yyyy-MM-dd HH:mm")) },
                        { "FechaFin", Comparar(reqModif.Promocion.FechaHoraFin.ToString("yyyy-MM-dd HH:mm"),
                                               promocionAntiguo.cabecera.fecha_fin.ToString("yyyy-MM-dd HH:mm")) },
                        { "Estado", "Modificado" },
                        { "DescuentoTotal", descuentoTotal3.ToString("N2")},
                        { "Regalo", Comparar(reqModif.Promocion.MarcaRegalo, promocionAntiguo.cabecera.MarcaRegalo) },


                        { "Marca",  marcas2 },
                            { "Division",  divisiones2 },
                            { "Departamento",  departamentos2 },
                            { "Clase",  clases2 },

                            { "Canal",  canales2 },
                            { "Grupo",  gruposalmacenes2 },
                            { "Almacen",  almacenes2 },
                            { "TipoCliente",  tiposclientes2 },
                            { "MedioPago",  mediospagos2 },


                        // ACUERDO PROVEEDOR
                        { "AcuerdoProveedor", Comparar(reqModif.Acuerdos[0].IdAcuerdo.ToString(),
                                                      promocionAntiguo.acuerdos[0].IDACUERDO.ToString()) },
                        { "PorcentajeProveedor", Comparar(reqModif.Acuerdos[0].PorcentajeDescuento.ToString("N2"),
                                                         promocionAntiguo.acuerdos[0].porcentaje_descuento.ToString("N2")) },
                        { "ValorComprometidoProveedor", Comparar(reqModif.Acuerdos[0].ValorComprometido.ToString("N2"),
                                                                promocionAntiguo.acuerdos[0].valor_comprometido.ToString("N2")) },
                        // ACUERDO PROPIO
                        { "AcuerdoPropio", Comparar(reqModif.Acuerdos[1].IdAcuerdo.ToString(),
                                                   promocionAntiguo.acuerdos[1].IDACUERDO.ToString()) },
                        { "PorcentajePropio", Comparar(reqModif.Acuerdos[1].PorcentajeDescuento.ToString("N2"),
                                                      promocionAntiguo.acuerdos[1].porcentaje_descuento.ToString("N2")) },
                        { "ValorComprometidoPropio", Comparar(reqModif.Acuerdos[1].ValorComprometido.ToString("N2"),
                                                             promocionAntiguo.acuerdos[1].valor_comprometido.ToString("N2")) },
                        { "Firma", reqModif.Promocion.NombreUsuario } // Este no suele compararse, es quien firma la modif.
                    };

                    

                    notificacion = $"apl solicitud {tipoProceso} promocion".ToUpper();


                    
                    foreach (var proveedor in proveedores)
                    {

                        // 2. Creamos una copia del diccionario base para este proveedor específico
                        var camposPlantilla = new Dictionary<string, string>(camposBase3);

                        // 3. Solo agregamos/actualizamos lo que cambia
                        camposPlantilla["Nombre"] = proveedor.Nombre;

                        // 4. Enviamos el correo
                        await EnviarCorreo(entidad, tipoProcEtiqueta, proveedor.Identificacion, tipoProceso, camposPlantilla, notificacion);

                        logger.LogInformation($"Enviando correo a {proveedor.Nombre}");


                    }

                    break;
                    

                case TipoProceso.Aprobacion:
                    
                    var reqAprobacion = JsonSerializer.Deserialize<AprobarPromocionRequest>(requestBody, jsonOptions);


                    var retorno2 = JsonSerializer.Deserialize<ControlErroresDTO>(responseBody, jsonOptions);
                    if (retorno2 == null)
                    {
                        logger.LogWarning("No existe Response body");
                        return;
                    }


                    if (reqAprobacion == null)
                    {
                        logger.LogWarning("No existe request body");
                        return;
                    }

                    string estadoCorreo = reqAprobacion.IdEtiquetaEstado switch
                    {
                        "ESTADOAPROBADO" => "APROBADO",
                        "ESTADONEGADO" => "NEGADO"
                    };

                    string etiquetaTipoProceso = reqAprobacion.IdEtiquetaTipoProceso switch
                    {
                        "TPCREACION" => "CREACION",
                        "TPINACTIVACION" => "INACTIVACION"
                    };


                    var promocionAprobacion = await promocionRepo.ObtenerBandGenPromoPorId((int)reqAprobacion.Identidad);

                    var descuentoTotal2 = promocionAprobacion.acuerdos[0].valor_comprometido + promocionAprobacion.acuerdos[1].valor_comprometido;


                    //proceso para obtener los proveedores de los acuerdos
                    foreach (var item in promocionAprobacion.acuerdos)
                    {
                        var acuerdo = await acuerdoRepo.ObtenerBandejaConsultaPorId(item.IDACUERDO);

                        var fondo = await fondoRepo.ObtenerPorIdAsync(acuerdo.cabecera.idfondo);

                        var proveedor = new ProveedorDTO
                        {
                            Identificacion = fondo.IdProveedor,
                            Nombre = fondo.nombre_proveedor
                        };

                        proveedores.Add(proveedor);
                    }


                    string marcas5 = this.ObtenerDetalleSegmentoBandejaPorTipo(promocionAprobacion.segmentos, "SEGMARCA");
                    string divisiones5 = this.ObtenerDetalleSegmentoBandejaPorTipo(promocionAprobacion.segmentos, "SEGDIVISION");
                    string clases5 = this.ObtenerDetalleSegmentoBandejaPorTipo(promocionAprobacion.segmentos, "SEGCLASE");
                    string departamentos5 = this.ObtenerDetalleSegmentoBandejaPorTipo(promocionAprobacion.segmentos, "SEGDEPARTAMENTO");

                    string canales5 = this.ObtenerDetalleSegmentoBandejaPorTipo(promocionAprobacion.segmentos, "SEGCANAL");
                    string gruposalmacenes5 = this.ObtenerDetalleSegmentoBandejaPorTipo(promocionAprobacion.segmentos, "SEGGRUPOALMACEN");
                    string almacenes5 = this.ObtenerDetalleSegmentoBandejaPorTipo(promocionAprobacion.segmentos, "SEGALMACEN");
                    string tiposclientes5 = this.ObtenerDetalleSegmentoBandejaPorTipo(promocionAprobacion.segmentos, "SEGTIPOCLIENTE");
                    string mediospagos5 = this.ObtenerDetalleSegmentoBandejaPorTipo(promocionAprobacion.segmentos, "SEGMEDIOPAGO");


                    var camposBase2 = new Dictionary<string, string>
                        {
                            //nombre
                            { "IdPromocion",  promocionAprobacion.cabecera.IdPromocion.ToString() },
                            { "Descripcion",  promocionAprobacion.cabecera.Descripcion },
                            { "Motivo",  promocionAprobacion.cabecera.nombre_motivo },
                            { "FechaInicio",  promocionAprobacion.cabecera.fecha_inicio.ToString() },
                            { "FechaFin",  promocionAprobacion.cabecera.fecha_fin.ToString() },
                            { "Estado",  estadoCorreo }, 
                            { "DescuentoTotal",  descuentoTotal2.ToString("N2") },
                            { "Regalo",  promocionAprobacion.cabecera.MarcaRegalo },

                            
                            { "Marca",  marcas5 },
                            { "Division",  divisiones5 },
                            { "Departamento",  departamentos5 },
                            { "Clase",  clases5 },

                            { "Canal",  canales5 },
                            { "Grupo",  gruposalmacenes5 },
                            { "Almacen",  almacenes5 },
                            { "TipoCliente",  tiposclientes5 },
                            { "MedioPago",  mediospagos5 },
                            

                            { "AcuerdoProveedor",  promocionAprobacion.acuerdos[0].IDACUERDO.ToString() },
                            { "PorcentajeProveedor",  promocionAprobacion.acuerdos[0].porcentaje_descuento.ToString("N2") },
                            { "ValorComprometidoProveedor",  promocionAprobacion.acuerdos[0].valor_comprometido.ToString("N2") },

                            { "AcuerdoPropio",  promocionAprobacion.acuerdos[1].IDACUERDO.ToString() },
                            { "PorcentajePropio",  promocionAprobacion.acuerdos[1].porcentaje_descuento.ToString("N2") },
                            { "ValorComprometidoPropio",  promocionAprobacion.acuerdos[1].valor_comprometido.ToString("N2") },

                            { "Firma",  reqAprobacion.NombreUsuario },
                        };


                    notificacion = $"apl solicitud {tipoProceso} promocion".ToUpper();


                    foreach (var proveedor in proveedores)
                    {

                        // 2. Creamos una copia del diccionario base para este proveedor específico
                        var camposPlantilla = new Dictionary<string, string>(camposBase2);

                        // 3. Solo agregamos/actualizamos lo que cambia
                        camposPlantilla["Nombre"] = proveedor.Nombre;

                        // 4. Enviamos el correo
                        await EnviarCorreo(entidad, tipoProcEtiqueta, proveedor.Identificacion, tipoProceso, camposPlantilla, notificacion);

                        logger.LogInformation($"Enviando correo a {proveedor.Nombre}");


                    }

                    break;


                case TipoProceso.Inactivacion:
                    
                    var reqInactivacion = JsonSerializer.Deserialize<InactivarPromocionRequest>(requestBody, jsonOptions);
                    if (reqInactivacion == null)
                    {
                        logger.LogWarning("⚠️ [PromocionesHandler] No se pudo obtener Identidad de AprobarFondoRequest.");
                        return;
                    }

                    var retorno3 = JsonSerializer.Deserialize<ControlErroresDTO>(responseBody, jsonOptions);
                    if (retorno3 == null)
                    {
                        logger.LogWarning("No existe Response body");
                        return;
                    }

                    var promocioninactivar = await promocionRepo.ObtenerBandInacPromoPorId(reqInactivacion.IdPromocion);

                    //proceso para obtener los proveedores de los acuerdos
                    foreach (var item in promocioninactivar.acuerdos)
                    {
                        var acuerdo = await acuerdoRepo.ObtenerBandejaConsultaPorId(item.IDACUERDO);

                        var fondo = await fondoRepo.ObtenerPorIdAsync(acuerdo.cabecera.idfondo);

                        var proveedor = new ProveedorDTO
                        {
                            Identificacion = fondo.IdProveedor,
                            Nombre = fondo.nombre_proveedor
                        };

                        proveedores.Add(proveedor);
                    }

                    var descuentoTotal4 = promocioninactivar.acuerdos[0].valor_comprometido + promocioninactivar.acuerdos[1].valor_comprometido;


                    string marcas4 = this.ObtenerDetalleSegmentoBandejaPorTipo(promocioninactivar.segmentos, "SEGMARCA");
                    string divisiones4 = this.ObtenerDetalleSegmentoBandejaPorTipo(promocioninactivar.segmentos, "SEGDIVISION");
                    string clases4 = this.ObtenerDetalleSegmentoBandejaPorTipo(promocioninactivar.segmentos, "SEGCLASE");
                    string departamentos4 = this.ObtenerDetalleSegmentoBandejaPorTipo(promocioninactivar.segmentos, "SEGDEPARTAMENTO");

                    string canales4 = this.ObtenerDetalleSegmentoBandejaPorTipo(promocioninactivar.segmentos, "SEGCANAL");
                    string gruposalmacenes4 = this.ObtenerDetalleSegmentoBandejaPorTipo(promocioninactivar.segmentos, "SEGGRUPOALMACEN");
                    string almacenes4 = this.ObtenerDetalleSegmentoBandejaPorTipo(promocioninactivar.segmentos, "SEGALMACEN");
                    string tiposclientes4 = this.ObtenerDetalleSegmentoBandejaPorTipo(promocioninactivar.segmentos, "SEGTIPOCLIENTE");
                    string mediospagos4 = this.ObtenerDetalleSegmentoBandejaPorTipo(promocioninactivar.segmentos, "SEGMEDIOPAGO");

                    var camposBase4 = new Dictionary<string, string>
                        {
                            //nombre
                            { "IdPromocion",  reqInactivacion.IdPromocion.ToString() },
                            { "Descripcion",  promocioninactivar.cabecera.Descripcion },
                            { "Motivo",  promocioninactivar.cabecera.nombre_motivo },
                            { "FechaInicio",  promocioninactivar.cabecera.fecha_inicio.ToString() },
                            { "FechaFin",  promocioninactivar.cabecera.fecha_fin.ToString() },
                            { "Estado",  promocioninactivar.cabecera.nombre_estado_promocion },
                            { "DescuentoTotal",  descuentoTotal4.ToString("N2") },
                            { "Regalo",  promocioninactivar.cabecera.MarcaRegalo },

                            
                            { "Marca",  marcas4 },
                            { "Division",  divisiones4 },
                            { "Departamento",  departamentos4 },
                            { "Clase",  clases4 },

                            { "Canal",  canales4 },
                            { "Grupo",  gruposalmacenes4 },
                            { "Almacen",  almacenes4 },
                            { "TipoCliente",  tiposclientes4 },
                            { "MedioPago",  mediospagos4 },
                            

                            { "AcuerdoProveedor",  promocioninactivar.acuerdos[0].IDACUERDO.ToString() },
                            { "PorcentajeProveedor",  promocioninactivar.acuerdos[0].porcentaje_descuento.ToString("N2") },
                            { "ValorComprometidoProveedor",  promocioninactivar.acuerdos[0].valor_comprometido.ToString("N2") },

                            { "AcuerdoPropio",  promocioninactivar.acuerdos[1].IDACUERDO.ToString() },
                            { "PorcentajePropio",  promocioninactivar.acuerdos[1].porcentaje_descuento.ToString("N2") },
                            { "ValorComprometidoPropio",  promocioninactivar.acuerdos[1].valor_comprometido.ToString("N2") },

                            { "Firma",  "Sistema APL" },
                        };

                    notificacion = $"apl solicitud {tipoProceso} promocion".ToUpper();


                    foreach (var proveedor in proveedores)
                    {

                        // 2. Creamos una copia del diccionario base para este proveedor específico
                        var camposPlantilla = new Dictionary<string, string>(camposBase4);

                        // 3. Solo agregamos/actualizamos lo que cambia
                        camposPlantilla["Nombre"] = proveedor.Nombre;

                        // 4. Enviamos el correo
                        await EnviarCorreo(entidad, tipoProcEtiqueta, proveedor.Identificacion, tipoProceso, camposPlantilla, notificacion);

                        logger.LogInformation($"Enviando correo a {proveedor.Nombre}");


                    }
                    break;


                case TipoProceso.AprobacionInactivacion:

                    var reqAprobacion2 = JsonSerializer.Deserialize<AprobarPromocionRequest>(requestBody, jsonOptions);


                    var retorno4 = JsonSerializer.Deserialize<ControlErroresDTO>(responseBody, jsonOptions);
                    if (retorno4 == null)
                    {
                        logger.LogWarning("No existe Response body");
                        return;
                    }


                    if (reqAprobacion2 == null)
                    {
                        logger.LogWarning("No existe request body");
                        return;
                    }

                    string estadoCorreo2 = reqAprobacion2.IdEtiquetaEstado switch
                    {
                        "ESTADOAPROBADO" => "APROBADO",
                        "ESTADONEGADO" => "NEGADO"
                    };

                    string etiquetaTipoProceso2 = reqAprobacion2.IdEtiquetaTipoProceso switch
                    {
                        "TPCREACION" => "CREACION",
                        "TPINACTIVACION" => "INACTIVACION"
                    };


                    var promocionAprobacion2 = await promocionRepo.ObtenerBandGenPromoPorId((int)reqAprobacion2.Identidad);

                    var descuentoTotal5 = promocionAprobacion2.acuerdos[0].valor_comprometido + promocionAprobacion2.acuerdos[1].valor_comprometido;


                    //proceso para obtener los proveedores de los acuerdos
                    foreach (var item in promocionAprobacion2.acuerdos)
                    {
                        var acuerdo = await acuerdoRepo.ObtenerBandejaConsultaPorId(item.IDACUERDO);

                        var fondo = await fondoRepo.ObtenerPorIdAsync(acuerdo.cabecera.idfondo);

                        var proveedor = new ProveedorDTO
                        {
                            Identificacion = fondo.IdProveedor,
                            Nombre = fondo.nombre_proveedor
                        };

                        proveedores.Add(proveedor);
                    }


                    string marcas6 = this.ObtenerDetalleSegmentoBandejaPorTipo(promocionAprobacion2.segmentos, "SEGMARCA");
                    string divisiones6 = this.ObtenerDetalleSegmentoBandejaPorTipo(promocionAprobacion2.segmentos, "SEGDIVISION");
                    string clases6 = this.ObtenerDetalleSegmentoBandejaPorTipo(promocionAprobacion2.segmentos, "SEGCLASE");
                    string departamentos6 = this.ObtenerDetalleSegmentoBandejaPorTipo(promocionAprobacion2.segmentos, "SEGDEPARTAMENTO");

                    string canales6 = this.ObtenerDetalleSegmentoBandejaPorTipo(promocionAprobacion2.segmentos, "SEGCANAL");
                    string gruposalmacenes6 = this.ObtenerDetalleSegmentoBandejaPorTipo(promocionAprobacion2.segmentos, "SEGGRUPOALMACEN");
                    string almacenes6 = this.ObtenerDetalleSegmentoBandejaPorTipo(promocionAprobacion2.segmentos, "SEGALMACEN");
                    string tiposclientes6 = this.ObtenerDetalleSegmentoBandejaPorTipo(promocionAprobacion2.segmentos, "SEGTIPOCLIENTE");
                    string mediospagos6 = this.ObtenerDetalleSegmentoBandejaPorTipo(promocionAprobacion2.segmentos, "SEGMEDIOPAGO");


                    var camposBase5 = new Dictionary<string, string>
                        {
                            //nombre
                            { "IdPromocion",  promocionAprobacion2.cabecera.IdPromocion.ToString() },
                            { "Descripcion",  promocionAprobacion2.cabecera.Descripcion },
                            { "Motivo",  promocionAprobacion2.cabecera.nombre_motivo },
                            { "FechaInicio",  promocionAprobacion2.cabecera.fecha_inicio.ToString() },
                            { "FechaFin",  promocionAprobacion2.cabecera.fecha_fin.ToString() },
                            { "Estado",  estadoCorreo2 },
                            { "DescuentoTotal",  descuentoTotal5.ToString("N2") },
                            { "Regalo",  promocionAprobacion2.cabecera.MarcaRegalo },


                            { "Marca",  marcas6 },
                            { "Division",  divisiones6 },
                            { "Departamento",  departamentos6 },
                            { "Clase",  clases6 },

                            { "Canal",  canales6 },
                            { "Grupo",  gruposalmacenes6 },
                            { "Almacen",  almacenes6 },
                            { "TipoCliente",  tiposclientes6 },
                            { "MedioPago",  mediospagos6 },


                            { "AcuerdoProveedor",  promocionAprobacion2.acuerdos[0].IDACUERDO.ToString() },
                            { "PorcentajeProveedor",  promocionAprobacion2.acuerdos[0].porcentaje_descuento.ToString("N2") },
                            { "ValorComprometidoProveedor",  promocionAprobacion2.acuerdos[0].valor_comprometido.ToString("N2") },

                            { "AcuerdoPropio",  promocionAprobacion2.acuerdos[1].IDACUERDO.ToString() },
                            { "PorcentajePropio",  promocionAprobacion2.acuerdos[1].porcentaje_descuento.ToString("N2") },
                            { "ValorComprometidoPropio",  promocionAprobacion2.acuerdos[1].valor_comprometido.ToString("N2") },

                            { "Firma",  reqAprobacion2.NombreUsuario },
                        };


                    notificacion = $"apl solicitud {tipoProceso} promocion".ToUpper();


                    foreach (var proveedor in proveedores)
                    {

                        // 2. Creamos una copia del diccionario base para este proveedor específico
                        var camposPlantilla = new Dictionary<string, string>(camposBase5);

                        // 3. Solo agregamos/actualizamos lo que cambia
                        camposPlantilla["Nombre"] = proveedor.Nombre;

                        // 4. Enviamos el correo
                        await EnviarCorreo(entidad, tipoProcEtiqueta, proveedor.Identificacion, tipoProceso, camposPlantilla, notificacion);

                        logger.LogInformation($"Enviando correo a {proveedor.Nombre}");


                    }
                    break;

                default:
                    logger.LogWarning($"[PromocionesHandler] TipoProceso no reconocido o sin estrategia definida: {tipoProceso}.");
                    return;
            }

            // 3. A partir de aquí, la lógica es común y ya tiene los datos correctos
            //    (IdProveedor y camposPlantilla) sin importar qué 'case' se ejecutó.

            /*
            if (camposPlantilla != null)
            {
                await EnviarCorreo(entidad, tipoProcEtiqueta, proveedores, tipoProceso, camposPlantilla, notificacion);
                logger.LogInformation("Enviando correo");
            }
            else
            {
                logger.LogWarning($"[PromocionesHandler] campos para plantilla de email no definido");
            }*/
        }

        private string ObtenerDetalleSegmentoPorTipo(List<SegmentoDTO> segmentos, string tipoSegmentoBusqueda)
        {
            // 1. Buscamos el segmento específico dentro de la lista del DTO
            var segmento = segmentos?.FirstOrDefault(s =>
                s.TipoSegmento.Equals(tipoSegmentoBusqueda, StringComparison.OrdinalIgnoreCase));

            // 2. Si no existe el segmento, devolvemos un string vacío
            if (segmento == null) return string.Empty;

            // 3. Si el tipo de asignación es 'T' (Todos), devolvemos solo esa palabra
            if (segmento.TipoAsignacion == "T")
            {
                return "TODOS";
            }

            // 4. Si tiene códigos, los unimos usando <br> para el HTML
            if (segmento.Codigos != null && segmento.Codigos.Any())
            {
                return string.Join("<br>", segmento.Codigos);
            }

            return "Sin códigos";
        }


        private string ObtenerDetalleSegmentoBandejaPorTipo(List<SegmentoBandejaDTO> segmentos, string tipoSegmentoBusqueda)
        {
            if (segmentos == null || !segmentos.Any()) return string.Empty;

            // 1. Filtramos todos los que coincidan con el tipo
            // 2. Seleccionamos solo la propiedad 'codigo_detalle'
            // 3. Eliminamos nulos o vacíos para evitar <br> innecesarios
            var codigos = segmentos
                .Where(s => s.etiqueta_tipo_segmento.Equals(tipoSegmentoBusqueda, StringComparison.OrdinalIgnoreCase))
                .Select(s => s.codigo_detalle)
                .Where(c => !string.IsNullOrEmpty(c));

            // 4. Unimos todos con el separador <br>
            return string.Join("<br>", codigos);
        }




        // 2. Función auxiliar para comparar (puedes ponerla dentro del mismo método)
        private string Comparar(string valorNuevo, string valorViejo)
        {
            string asterisco = " <span style='color: black; font-weight: bold;'>*</span>";
            // Normalizamos para evitar diferencias por espacios o nulos
            string vn = valorNuevo?.Trim() ?? "";
            string vv = valorViejo?.Trim() ?? "";

            return vn != vv ? $"{vn}{asterisco}" : vn;
        }


    }
}
