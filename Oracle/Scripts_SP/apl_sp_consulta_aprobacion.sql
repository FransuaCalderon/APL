CREATE OR REPLACE PROCEDURE apl_sp_consulta_aprobacion (
    p_identidad      IN NUMBER,
    p_entidad        IN VARCHAR2,
    p_tipoproceso    IN VARCHAR2,
    p_cursor         OUT SYS_REFCURSOR,
    p_codigo_salida  OUT NUMBER,
    p_mensaje_salida OUT VARCHAR2
) AS
    v_id_entidad         NUMBER;
    v_id_tipoproceso     NUMBER;
    v_numerolote         NUMBER;
BEGIN
    -- Obtener IDs de catálogo
    SELECT idcatalogo INTO v_id_entidad 
    FROM apl_tb_catalogo WHERE idetiqueta = p_entidad;
    
    SELECT idcatalogo INTO v_id_tipoproceso 
    FROM apl_tb_catalogo WHERE idetiqueta = p_tipoproceso;
   
    -- Obtener el número de lote según la entidad
    IF p_entidad = 'ENTFONDO' THEN
        SELECT numeroloteaprobacion INTO v_numerolote 
        FROM apl_tb_fondo 
        WHERE idfondo = p_identidad;
        
    ELSIF p_entidad = 'ENTACUERDO' THEN
        SELECT numeroloteaprobacion INTO v_numerolote 
        FROM apl_tb_acuerdo  -- O la tabla que corresponda para acuerdos
        WHERE idacuerdo = p_identidad;
        
    -- Agrega más entidades según necesites
    -- ELSIF p_entidad = 'OTRA_ENTIDAD' THEN
    --     SELECT numeroloteaprobacion INTO v_numerolote 
    --     FROM otra_tabla WHERE id = p_identidad;
        
    ELSE
        -- Entidad no soportada
        p_codigo_salida := -1;
        p_mensaje_salida := 'Entidad no soportada: ' || p_entidad;
        OPEN p_cursor FOR SELECT NULL FROM DUAL WHERE 1=0;
        RETURN;
    END IF;
   
    -- Consulta con información descriptiva
    OPEN p_cursor FOR
        SELECT
            a.idaprobacion,
            a.identidad,
            a.entidad AS entidad_id,
            ce.nombre AS entidad_nombre,
            ce.idetiqueta AS entidad_etiqueta,
            a.idtipoproceso AS tipoproceso_id,
            ctp.nombre AS tipoproceso_nombre,
            ctp.idetiqueta AS tipoproceso_etiqueta,
            a.idusersolicitud,
            a.nombreusersolicitud,
            TO_CHAR(a.fechasolicitud, 'YYYY-MM-DD HH24:MI:SS') AS fechasolicitud,
            a.iduseraprobador,
            a.comentario,
            a.nivelaprobacion,
            a.idestadoregistro AS estado_id,
            ces.nombre AS estado_nombre,
            ces.idetiqueta AS estado_etiqueta
        FROM
            apl_tb_aprobacion a
            LEFT JOIN apl_tb_catalogo ce ON ce.idcatalogo = a.entidad
            LEFT JOIN apl_tb_catalogo ctp ON ctp.idcatalogo = a.idtipoproceso
            LEFT JOIN apl_tb_catalogo ces ON ces.idcatalogo = a.idestadoregistro
        WHERE
            a.identidad = p_identidad
            AND a.entidad = v_id_entidad
            AND a.idtipoproceso = v_id_tipoproceso
            AND a.numeroloteaprobacion = v_numerolote  -- Ahora usa la variable
        ORDER BY
            a.nivelaprobacion ASC;
            
    p_codigo_salida := 0;
    p_mensaje_salida := 'OK';
    
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        p_codigo_salida := -2;
        p_mensaje_salida := 'No se encontró registro para la entidad/identidad especificada';
        OPEN p_cursor FOR SELECT NULL FROM DUAL WHERE 1=0;
    WHEN OTHERS THEN
        p_codigo_salida := -99;
        p_mensaje_salida := 'ERROR: ' || SQLERRM;
END apl_sp_consulta_aprobacion;