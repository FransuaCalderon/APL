create or replace PROCEDURE apl_sp_consulta_aprobacion_id (
    -- Parámetros de entrada (filtros)
    p_entidad           IN  NUMBER,                     -- Filtro por ENTIDAD (requerido)
    p_identidad         IN  NUMBER,                     -- Filtro por IDENTIDAD (requerido)
    
    -- Parámetro de salida (cursor con los resultados)
    p_cursor            OUT SYS_REFCURSOR,
    
    -- Parámetros de control
    p_codigo_error      OUT NUMBER,
    p_mensaje_error     OUT VARCHAR2
)
AS
BEGIN
    -- Inicializar parámetros de salida
    p_codigo_error  := 0;
    p_mensaje_error := 'OK';

    -- Validar parámetros de entrada
    IF p_entidad IS NULL THEN
        p_codigo_error  := -1;
        p_mensaje_error := 'El parámetro ENTIDAD es requerido.';

        -- Abrir cursor vacío
        OPEN p_cursor FOR
            SELECT NULL AS tipoproceso, NULL AS idusariosolicitud, NULL AS nombreusersolicitud,
                   NULL AS fechasolicitud, NULL AS iduseraprobador, NULL AS fechaaprobacion,
                   NULL AS comentario, NULL AS nivelaprobacion, NULL AS idestadoregistro
            FROM DUAL WHERE 1 = 0;
        RETURN;
    END IF;

    IF p_identidad IS NULL THEN
        p_codigo_error  := -2;
        p_mensaje_error := 'El parámetro IDENTIDAD es requerido.';

        -- Abrir cursor vacío
        OPEN p_cursor FOR
            SELECT NULL AS tipoproceso, NULL AS idusariosolicitud, NULL AS nombreusersolicitud,
                   NULL AS fechasolicitud, NULL AS iduseraprobador, NULL AS fechaaprobacion,
                   NULL AS comentario, NULL AS nivelaprobacion, NULL AS idestadoregistro
            FROM DUAL WHERE 1 = 0;
        RETURN;
    END IF;

    -- Abrir cursor con la consulta filtrada por ENTIDAD e IDENTIDAD
    OPEN p_cursor FOR
        SELECT 
            ap.IDTIPOPROCESO           AS tipoproceso,
            ctp.NOMBRE                 AS nombre_tipo_proceso,
            ap.IDUSERSOLICITUD         AS idusariosolicitud,
            ap.NOMBREUSERSOLICITUD     AS nombreusersolicitud,
            ap.FECHASOLICITUD          AS fechasolicitud,
            ap.IDUSERAPROBADOR         AS iduseraprobador,
            ap.FECHAAPROBACION         AS fechaaprobacion,
            ap.COMENTARIO              AS comentario,
            ap.NIVELAPROBACION         AS nivelaprobacion,
            ap.IDESTADOREGISTRO        AS idestadoregistro,
            cer.NOMBRE                 AS nombre_estado_registro
        FROM 
            apl_tb_aprobacion ap
            INNER JOIN apl_tb_catalogo ctp ON ap.idtipoproceso = ctp.idcatalogo
            INNER JOIN apl_tb_catalogo cer ON ap.idestadoregistro = cer.idcatalogo
        WHERE 
            ENTIDAD = p_entidad
            AND IDENTIDAD = p_identidad
        ORDER BY 
            FECHASOLICITUD ASC,        -- Ordenar por fecha de solicitud descendente
            NIVELAPROBACION ASC;       -- Ordenar por nivel de aprobación descendente

EXCEPTION
    WHEN NO_DATA_FOUND THEN
        p_codigo_error  := 1;
        p_mensaje_error := 'No se encontraron registros para ENTIDAD: ' || p_entidad || ' e IDENTIDAD: ' || p_identidad;

        -- Abrir cursor vacío
        OPEN p_cursor FOR
            SELECT NULL AS tipoproceso, NULL AS idusariosolicitud, NULL AS nombreusersolicitud,
                   NULL AS fechasolicitud, NULL AS iduseraprobador, NULL AS fechaaprobacion,
                   NULL AS comentario, NULL AS nivelaprobacion, NULL AS idestadoregistro
            FROM DUAL WHERE 1 = 0;

    WHEN OTHERS THEN
        p_codigo_error  := SQLCODE;
        p_mensaje_error := 'Error: ' || SQLERRM;

        -- Abrir cursor vacío en caso de error
        OPEN p_cursor FOR
            SELECT NULL AS tipoproceso, NULL AS idusariosolicitud, NULL AS nombreusersolicitud,
                   NULL AS fechasolicitud, NULL AS iduseraprobador, NULL AS fechaaprobacion,
                   NULL AS comentario, NULL AS nivelaprobacion, NULL AS idestadoregistro
            FROM DUAL WHERE 1 = 0;

END apl_sp_consulta_aprobacion_id;