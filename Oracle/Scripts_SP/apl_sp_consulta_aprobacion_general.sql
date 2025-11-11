create or replace PROCEDURE apl_sp_consulta_aprobacion_general (
    p_entidad       IN VARCHAR2,           -- Etiqueta de entidad
    p_identidad     IN NUMBER,             -- ID del fondo
    p_idtipoproceso IN VARCHAR2 DEFAULT NULL,  -- Etiqueta tipo proceso (opcional)
    p_cursor        OUT SYS_REFCURSOR,      -- Cursor de salida
    p_codigo_salida             OUT NUMBER,
    p_mensaje_salida            OUT VARCHAR2
) AS
    v_id_entidad     NUMBER;
    v_id_tipoproceso NUMBER := NULL;  -- Inicializar en NULL
BEGIN
    -- ===== PASO 1: Obtener ID de entidad =====
    BEGIN
        SELECT idcatalogo
        INTO v_id_entidad
        FROM apl_tb_catalogo
        WHERE idetiqueta = p_entidad
        AND ROWNUM = 1;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            OPEN p_cursor FOR 
                SELECT * FROM apl_tb_aprobacion WHERE 1 = 0;
            RETURN;
    END;
    
    -- ===== PASO 2: Obtener ID de tipo proceso SOLO si viene informado =====
    IF p_idtipoproceso IS NOT NULL AND TRIM(p_idtipoproceso) != '' THEN
        BEGIN
            SELECT idcatalogo
            INTO v_id_tipoproceso
            FROM apl_tb_catalogo
            WHERE idetiqueta = p_idtipoproceso
            AND ROWNUM = 1;
        EXCEPTION
            WHEN NO_DATA_FOUND THEN
                -- Si no encuentra el tipo proceso, retorna vacío
                OPEN p_cursor FOR 
                    SELECT * FROM apl_tb_aprobacion WHERE 1 = 0;
                RETURN;
        END;
    END IF;
    
    -- ===== PASO 3: Ejecutar consulta según si hay filtro de tipo proceso =====
    IF v_id_tipoproceso IS NOT NULL THEN
        -- Consulta CON filtro de tipo proceso
        OPEN p_cursor FOR 
            SELECT
                a.idaprobacion,
                a.entidad                                           AS id_entidad,
                ce.nombre                                           AS nombre_entidad,
                ce.idetiqueta                                       AS etiqueta_entidad_fondo,
                a.identidad,
                a.idtipoproceso                                     AS id_tipo_proceso_aprobacion,
                cp.nombre                                           AS nombre_tipo_proceso_aprobacion,
                cp.idetiqueta                                       AS etiqueta_tipo_proceso_aprobacion,
                a.idusersolicitud,--
                a.nombreusersolicitud,--
                a.fechasolicitud,--
                a.iduseraprobador,
                a.fechaaprobacion,
                a.comentario,
                a.nivelaprobacion,
                a.idestadoregistro                                  AS id_estado_aprobacion,
                ca.nombre                                           AS nombre_estado_aprobacion,
                ca.idetiqueta                                       AS etiqueta_estado_aprobacion
            FROM
                apl_tb_aprobacion a
                LEFT JOIN apl_tb_catalogo ce ON ce.idcatalogo = a.entidad
                LEFT JOIN apl_tb_catalogo cp ON cp.idcatalogo = a.idtipoproceso
                LEFT JOIN apl_tb_catalogo ca ON ca.idcatalogo = a.idestadoregistro
            WHERE
                a.entidad = v_id_entidad
                AND a.identidad = p_identidad
                AND a.idtipoproceso = v_id_tipoproceso
            ORDER BY
                a.entidad,
                a.identidad,
                a.idtipoproceso,
                a.nivelaprobacion;
    ELSE
        -- Consulta SIN filtro de tipo proceso (trae todos)
        OPEN p_cursor FOR 
            SELECT
                a.idaprobacion,
                a.entidad                                           AS id_entidad,
                ce.nombre                                           AS nombre_entidad,
                ce.idetiqueta                                       AS etiqueta_entidad_fondo,
                a.identidad,
                a.idtipoproceso                                     AS id_tipo_proceso_aprobacion,
                cp.nombre                                           AS nombre_tipo_proceso_aprobacion,
                cp.idetiqueta                                       AS etiqueta_tipo_proceso_aprobacion,
                a.idusersolicitud,--
                a.nombreusersolicitud,--
                a.fechasolicitud,--
                a.iduseraprobador,
                a.fechaaprobacion,
                a.comentario,
                a.nivelaprobacion,
                a.idestadoregistro                                  AS id_estado_aprobacion,
                ca.nombre                                           AS nombre_estado_aprobacion,
                ca.idetiqueta                                       AS etiqueta_estado_aprobacion
            FROM
                apl_tb_aprobacion a
                LEFT JOIN apl_tb_catalogo ce ON ce.idcatalogo = a.entidad
                LEFT JOIN apl_tb_catalogo cp ON cp.idcatalogo = a.idtipoproceso
                LEFT JOIN apl_tb_catalogo ca ON ca.idcatalogo = a.idestadoregistro
            WHERE
                a.entidad = v_id_entidad
                AND a.identidad = p_identidad
            ORDER BY
                a.entidad,
                a.identidad,
                a.idtipoproceso,
                a.nivelaprobacion;
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        p_codigo_salida      := -20007;        
        p_mensaje_salida     := 'Error en consulta de aprobaciones: ' || SQLERRM;      
        
END apl_sp_consulta_aprobacion_general;