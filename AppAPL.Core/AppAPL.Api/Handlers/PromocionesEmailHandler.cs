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
                    if (reqCreacion.Acuerdos == null || !reqCreacion.Acuerdos.Any())
                    {
                        logger.LogWarning("No se puede procesar el envío: La lista de acuerdos es nula o está vacía.");
                        return;
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

                    var promocionCreacion = await promocionRepo.ObtenerBandGenPromoPorId((int)retorno.Id);

                    string marcas = this.ObtenerDetalleSegmentoBandejaPorTipo(promocionCreacion.segmentos, "SEGMARCA");
                    string divisiones = this.ObtenerDetalleSegmentoBandejaPorTipo(promocionCreacion.segmentos, "SEGDIVISION");
                    string clases = this.ObtenerDetalleSegmentoBandejaPorTipo(promocionCreacion.segmentos, "SEGCLASE");
                    string departamentos = this.ObtenerDetalleSegmentoBandejaPorTipo(promocionCreacion.segmentos, "SEGDEPARTAMENTO");

                    string canales = this.ObtenerDetalleSegmentoBandejaPorTipo(promocionCreacion.segmentos, "SEGCANAL");
                    string gruposalmacenes = this.ObtenerDetalleSegmentoBandejaPorTipo(promocionCreacion.segmentos, "SEGGRUPOALMACEN");
                    string almacenes = this.ObtenerDetalleSegmentoBandejaPorTipo(promocionCreacion.segmentos, "SEGALMACEN");
                    string tiposclientes = this.ObtenerDetalleSegmentoBandejaPorTipo(promocionCreacion.segmentos, "SEGTIPOCLIENTE");
                    string mediospagos = this.ObtenerDetalleSegmentoBandejaPorTipo(promocionCreacion.segmentos, "SEGMEDIOPAGO");

                    var motivo = await catalogoRepo.ObtenerPorIdAsync(reqCreacion.Promocion.motivo);


                    var descuentoTotal = reqCreacion.Acuerdos?.Sum(a => a.ValorComprometido) ?? 0;

                    // Extraemos los acuerdos de forma segura (si no existen, serán null en lugar de dar error)
                    var acProveedorReg = reqCreacion.Acuerdos.FirstOrDefault(a => a.etiqueta_tipo_fondo?.Trim().ToUpper() == "TFPROVEDOR");
                    var acPropioReg = reqCreacion.Acuerdos.FirstOrDefault(a => a.etiqueta_tipo_fondo?.Trim().ToUpper() == "TFPROPIO");
                   


                    var camposBase = new Dictionary<string, string>
                        {
                           
                            { "IdPromocion",  retorno.Id.ToString() },
                            { "Descripcion",  reqCreacion.Promocion.descripcion },
                            { "Motivo",  motivo.Nombre },
                            { "FechaInicio",  reqCreacion.Promocion.fechaHoraInicio.ToString() },
                            { "FechaFin",  reqCreacion.Promocion.fechaHoraFin.ToString() },
                            { "Estado",  "Nuevo" },
                            { "DescuentoTotal",  descuentoTotal.ToString("N2") },
                            { "Regalo",  reqCreacion.Promocion.marcaRegalo },

                            { "Marca",  marcas },
                            { "Division",  divisiones },
                            { "Departamento",  departamentos },
                            { "Clase",  clases },

                            { "Canal",  canales },
                            { "Grupo",  gruposalmacenes },
                            { "Almacen",  almacenes },
                            { "TipoCliente",  tiposclientes },
                            { "MedioPago",  mediospagos },

                            { "AcuerdoProveedor",  acProveedorReg?.IdAcuerdo.ToString() ?? "" },
                            { "PorcentajeProveedor",  acProveedorReg?.PorcentajeDescuento.ToString("N2") ?? "" },
                            { "ValorComprometidoProveedor",  acProveedorReg?.ValorComprometido.ToString("N2") ?? "" },

                            { "AcuerdoPropio",  acPropioReg?.IdAcuerdo.ToString() ?? "" },
                            { "PorcentajePropio",  acPropioReg?.PorcentajeDescuento.ToString("N2") ?? "" },
                            { "ValorComprometidoPropio",  acPropioReg?.ValorComprometido.ToString("N2") ?? "" },

                            { "Firma",  reqCreacion.Promocion.nombreUsuario },
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


                    if (reqModif.Acuerdos == null || !reqModif.Acuerdos.Any())
                    {
                        logger.LogWarning("No se puede procesar el envío: La lista de acuerdos es nula o está vacía.");
                        return;
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


                    var promocionModificacion = await promocionRepo.ObtenerBandGenPromoPorId(reqModif.IdPromocion);

                    string marcas2 = this.ObtenerDetalleSegmentoBandejaPorTipo(promocionModificacion.segmentos, "SEGMARCA");
                    string divisiones2 = this.ObtenerDetalleSegmentoBandejaPorTipo(promocionModificacion.segmentos, "SEGDIVISION");
                    string clases2 = this.ObtenerDetalleSegmentoBandejaPorTipo(promocionModificacion.segmentos, "SEGCLASE");
                    string departamentos2 = this.ObtenerDetalleSegmentoBandejaPorTipo(promocionModificacion.segmentos, "SEGDEPARTAMENTO");

                    string canales2 = this.ObtenerDetalleSegmentoBandejaPorTipo(promocionModificacion.segmentos, "SEGCANAL");
                    string gruposalmacenes2 = this.ObtenerDetalleSegmentoBandejaPorTipo(promocionModificacion.segmentos, "SEGGRUPOALMACEN");
                    string almacenes2 = this.ObtenerDetalleSegmentoBandejaPorTipo(promocionModificacion.segmentos, "SEGALMACEN");
                    string tiposclientes2 = this.ObtenerDetalleSegmentoBandejaPorTipo(promocionModificacion.segmentos, "SEGTIPOCLIENTE");
                    string mediospagos2 = this.ObtenerDetalleSegmentoBandejaPorTipo(promocionModificacion.segmentos, "SEGMEDIOPAGO");

                    var motivo2 = await catalogoRepo.ObtenerPorIdAsync(reqModif.Promocion.Motivo);

                    var descuentoTotal3 = reqModif.Acuerdos?.Sum(a => a.ValorComprometido) ?? 0;

                    // Extraemos los acuerdos de forma segura (si no existen, serán null en lugar de dar error)
                    var acProveedorReg2 = reqModif.Acuerdos.FirstOrDefault(a => a.etiqueta_tipo_fondo?.Trim().ToUpper() == "TFPROVEDOR");
                    var acProveedorAnt2 = promocionAntiguo.acuerdos.FirstOrDefault(a => a.etiqueta_tipo_fondo.Trim().ToUpper() == "TFPROVEDOR");

                    var acPropioReg2 = reqModif.Acuerdos.FirstOrDefault(a => a.etiqueta_tipo_fondo?.Trim().ToUpper() == "TFPROPIO");
                    var acPropioAnt2 = promocionAntiguo.acuerdos.FirstOrDefault(a => a.etiqueta_tipo_fondo.Trim().ToUpper() == "TFPROPIO");


                    var camposBase3 = new Dictionary<string, string>
                    {
                        { "IdPromocion", Comparar(reqModif.IdPromocion.ToString(), promocionAntiguo.cabecera.IdPromocion.ToString()) },
                        { "Descripcion", Comparar(reqModif.Promocion.Descripcion, promocionAntiguo.cabecera.Descripcion) },
                        { "Motivo", Comparar(motivo2?.Nombre ?? "", promocionAntiguo.cabecera.nombre_motivo) },
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


                        // --- ACUERDO PROVEEDOR ---
                        { "AcuerdoProveedor", Comparar(acProveedorReg2?.IdAcuerdo.ToString() ?? "",
                                                      acProveedorAnt2?.IDACUERDO.ToString() ?? "") },

                        { "PorcentajeProveedor", Comparar(acProveedorReg2?.PorcentajeDescuento.ToString("N2") ?? "0.00",
                                                         acProveedorAnt2?.porcentaje_descuento.ToString("N2") ?? "0.00") },

                        { "ValorComprometidoProveedor", Comparar(acProveedorReg2?.ValorComprometido.ToString("N2") ?? "0.00",
                                                                acProveedorAnt2?.valor_comprometido.ToString("N2") ?? "0.00") },

                        // --- ACUERDO PROPIO ---
                        { "AcuerdoPropio", Comparar(acPropioReg2?.IdAcuerdo.ToString() ?? "",
                                                   acPropioAnt2?.IDACUERDO.ToString() ?? "") },

                        { "PorcentajePropio", Comparar(acPropioReg2?.PorcentajeDescuento.ToString("N2") ?? "0.00",
                                                      acPropioAnt2?.porcentaje_descuento.ToString("N2") ?? "0.00") },

                        { "ValorComprometidoPropio", Comparar(acPropioReg2?.ValorComprometido.ToString("N2") ?? "0.00",
                                                             acPropioAnt2?.valor_comprometido.ToString("N2") ?? "0.00") },
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
                    /*
                    string etiquetaTipoProceso = reqAprobacion.IdEtiquetaTipoProceso switch
                    {
                        "TPCREACION" => "CREACION",
                        "TPINACTIVACION" => "INACTIVACION"
                    };*/

                    if (reqAprobacion.IdEtiquetaTipoProceso == "TPINACTIVACION")
                    {
                        tipoProcEtiqueta = "TPAPROBACIONINACTIVACION";
                        tipoProceso = TipoProceso.AprobacionInactivacion;
                    }


                    var promocionAprobacion = await promocionRepo.ObtenerBandGenPromoPorId((int)reqAprobacion.Identidad);

                    

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


                    var descuentoTotal2 = promocionAprobacion.acuerdos?.Sum(a => a.valor_comprometido) ?? 0;

                    var acProveedorReg3 = promocionAprobacion.acuerdos.FirstOrDefault(a => a.etiqueta_tipo_fondo?.Trim().ToUpper() == "TFPROVEDOR");
                    var acPropioReg3 = promocionAprobacion.acuerdos.FirstOrDefault(a => a.etiqueta_tipo_fondo?.Trim().ToUpper() == "TFPROPIO");

                    var camposBase2 = new Dictionary<string, string>
                        {
                        //nombre
                            { "estadoCorreo", estadoCorreo },
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
                            

                            { "AcuerdoProveedor",  acProveedorReg3?.IDACUERDO.ToString() ?? "" },
                            { "PorcentajeProveedor",  acProveedorReg3?.porcentaje_descuento.ToString("N2") ?? "" },
                            { "ValorComprometidoProveedor",  acProveedorReg3?.valor_comprometido.ToString("N2") ?? "" },

                            { "AcuerdoPropio",  acPropioReg3?.IDACUERDO.ToString() ?? "" },
                            { "PorcentajePropio",  acPropioReg3?.porcentaje_descuento.ToString("N2") ?? "" },
                            { "ValorComprometidoPropio",  acPropioReg3?.valor_comprometido.ToString("N2") ?? "" },

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

                    
                    

                    string marcas4 = this.ObtenerDetalleSegmentoBandejaPorTipo(promocioninactivar.segmentos, "SEGMARCA");
                    string divisiones4 = this.ObtenerDetalleSegmentoBandejaPorTipo(promocioninactivar.segmentos, "SEGDIVISION");
                    string clases4 = this.ObtenerDetalleSegmentoBandejaPorTipo(promocioninactivar.segmentos, "SEGCLASE");
                    string departamentos4 = this.ObtenerDetalleSegmentoBandejaPorTipo(promocioninactivar.segmentos, "SEGDEPARTAMENTO");

                    string canales4 = this.ObtenerDetalleSegmentoBandejaPorTipo(promocioninactivar.segmentos, "SEGCANAL");
                    string gruposalmacenes4 = this.ObtenerDetalleSegmentoBandejaPorTipo(promocioninactivar.segmentos, "SEGGRUPOALMACEN");
                    string almacenes4 = this.ObtenerDetalleSegmentoBandejaPorTipo(promocioninactivar.segmentos, "SEGALMACEN");
                    string tiposclientes4 = this.ObtenerDetalleSegmentoBandejaPorTipo(promocioninactivar.segmentos, "SEGTIPOCLIENTE");
                    string mediospagos4 = this.ObtenerDetalleSegmentoBandejaPorTipo(promocioninactivar.segmentos, "SEGMEDIOPAGO");


                    var descuentoTotal4 = promocioninactivar.acuerdos?.Sum(a => a.valor_comprometido) ?? 0;
                    var acProveedorReg4 = promocioninactivar.acuerdos.FirstOrDefault(a => a.etiqueta_tipo_fondo?.Trim().ToUpper() == "TFPROVEDOR");
                    var acPropioReg4 = promocioninactivar.acuerdos.FirstOrDefault(a => a.etiqueta_tipo_fondo?.Trim().ToUpper() == "TFPROPIO");


                    var camposBase4 = new Dictionary<string, string>
                        {
                            //nombre
                            { "IdPromocion",  reqInactivacion.IdPromocion.ToString() },
                            { "Descripcion",  promocioninactivar.cabecera.Descripcion },
                            { "Motivo",  promocioninactivar.cabecera.nombre_motivo },
                            { "FechaInicio",  promocioninactivar.cabecera.fecha_inicio.ToString() },
                            { "FechaFin",  promocioninactivar.cabecera.fecha_fin.ToString() },
                            { "Estado",  "Inactivo" },
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
                            

                            { "AcuerdoProveedor",  acProveedorReg4?.IDACUERDO.ToString() ?? "" },
                            { "PorcentajeProveedor",  acProveedorReg4?.porcentaje_descuento.ToString("N2") ?? "" },
                            { "ValorComprometidoProveedor",  acProveedorReg4?.valor_comprometido.ToString("N2") ?? "" },

                            { "AcuerdoPropio",  acPropioReg4?.IDACUERDO.ToString() ?? "" },
                            { "PorcentajePropio",  acPropioReg4?.porcentaje_descuento.ToString("N2") ?? "" },
                            { "ValorComprometidoPropio",  acPropioReg4?.valor_comprometido.ToString("N2") ?? "" },

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


                    var descuentoTotal5 = promocionAprobacion2.acuerdos?.Sum(a => a.valor_comprometido) ?? 0;
                    var acProveedorReg5 = promocionAprobacion2.acuerdos.FirstOrDefault(a => a.etiqueta_tipo_fondo?.Trim().ToUpper() == "TFPROVEDOR");
                    var acPropioReg5 = promocionAprobacion2.acuerdos.FirstOrDefault(a => a.etiqueta_tipo_fondo?.Trim().ToUpper() == "TFPROPIO");

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


                            { "AcuerdoProveedor",  acProveedorReg5?.IDACUERDO.ToString() ?? "" },
                            { "PorcentajeProveedor",  acProveedorReg5?.porcentaje_descuento.ToString("N2") ?? "" },
                            { "ValorComprometidoProveedor",  acProveedorReg5?.valor_comprometido.ToString("N2") ?? "" },

                            { "AcuerdoPropio",  acPropioReg5?.IDACUERDO.ToString() ?? "" },
                            { "PorcentajePropio",  acPropioReg5?.porcentaje_descuento.ToString("N2") ?? "" },
                            { "ValorComprometidoPropio",  acPropioReg5?.valor_comprometido.ToString("N2") ?? "" },

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
                s.tipoSegmento.Equals(tipoSegmentoBusqueda, StringComparison.OrdinalIgnoreCase));

            // 2. Si no existe el segmento, devolvemos un string vacío
            if (segmento == null) return string.Empty;

            // 3. Si el tipo de asignación es 'T' (Todos), devolvemos solo esa palabra
            if (segmento.tipoAsignacion == "T")
            {
                return "TODOS";
            }

            // 4. Si tiene códigos, los unimos usando <br> para el HTML
            if (segmento.codigos != null && segmento.codigos.Any())
            {
                return string.Join("<br>", segmento.codigos);
            }

            return "Sin códigos";
        }


        private string ObtenerDetalleSegmentoBandejaPorTipo(List<SegmentoBandejaDTO> segmentos, string tipoSegmentoBusqueda)
        {
            if (segmentos == null || !segmentos.Any()) return string.Empty;

            // 1. Filtramos primero por el tipo de segmento
            var filtrados = segmentos
                .Where(s => s.etiqueta_tipo_segmento.Equals(tipoSegmentoBusqueda, StringComparison.OrdinalIgnoreCase))
                .ToList();

            if (!filtrados.Any()) return string.Empty;

            // 2. Verificamos si alguno tiene "TODOS" en la descripción (case-insensitive)
            bool esAsignacionTotal = filtrados.Any(s =>
                !string.IsNullOrEmpty(s.descripcion_asignacion) &&
                s.descripcion_asignacion.Equals("TODOS", StringComparison.OrdinalIgnoreCase));

            if (esAsignacionTotal)
            {
                return "TODOS";
            }

            // 3. Si no es "TODOS", proyectamos la combinación código - nombre
            var detallesCombinados = filtrados
                .Select(s => $"{s.codigo_detalle} - {s.nombre_detalle}")
                .Where(d => !string.IsNullOrWhiteSpace(d) && d != " - ");

            // 4. Unimos con el separador <br>
            return string.Join("<br>", detallesCombinados);
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
