CREATE OR REPLACE PROCEDURE apl_sp_datos_correo (
    p_entidad        IN VARCHAR2,
    p_tproceso       IN VARCHAR2,
    p_iddocumento    IN VARCHAR2,      
    p_cursor         OUT SYS_REFCURSOR,
    p_codigo_salida         OUT NUMBER,
    p_mensaje_salida        OUT VARCHAR2
) AS
    v_id_entidad   NUMBER;
    v_id_tproceso  NUMBER;
    v_idproveedor  VARCHAR2(15);
    v_iddocumento_num NUMBER;           
BEGIN
    -- Validar que p_iddocumento sea un número válido
    BEGIN
        v_iddocumento_num := TO_NUMBER(p_iddocumento);
    EXCEPTION
        WHEN VALUE_ERROR THEN
            p_codigo_salida        := -20009;
            p_mensaje_salida       := 'Error: p_iddocumento debe ser un número válido. Valor recibido: ' || p_iddocumento;  
    END;
    
    -- Obtener IDs de catálogo
    BEGIN
        SELECT idcatalogo 
        INTO v_id_entidad
        FROM apl_tb_catalogo 
        WHERE idetiqueta = p_entidad 
        AND ROWNUM = 1;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            p_codigo_salida        := -20010;
            p_mensaje_salida       := 'Error: No se encontró la etiqueta de entidad: ' || p_entidad;
    END;
    
    BEGIN
        SELECT idcatalogo 
        INTO v_id_tproceso
        FROM apl_tb_catalogo 
        WHERE idetiqueta = p_tproceso 
        AND ROWNUM = 1;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            p_codigo_salida        := -20011;
            p_mensaje_salida       := 'Error: No se encontró la etiqueta de tipo proceso: ' || p_tproceso;
    END;
    
    -- Obtener el proveedor del documento/fondo
    BEGIN
        SELECT idproveedor 
        INTO v_idproveedor
        FROM apl_tb_fondo
        WHERE idfondo = v_iddocumento_num;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            v_idproveedor := NULL;
    END;
    
    -- Retornar plantilla y destinatarios
    OPEN p_cursor FOR
        SELECT
            'PLANTILLA' AS tipo_registro,
            pm.idplantillamail AS id_registro,
            pm.nombrearchivo,
            NULL AS para,
            NULL AS cc,
            NULL AS cargo,
            NULL AS idproveedor,
            ce.idetiqueta AS etiqueta_entidad,
            cp.idetiqueta AS etiqueta_tipo_proceso
        FROM
            apl_tb_plantillamail pm
            LEFT JOIN apl_tb_catalogo ce ON ce.idcatalogo = pm.entidad
            LEFT JOIN apl_tb_catalogo cp ON cp.idcatalogo = pm.idtipoproceso
        WHERE
            pm.entidad = v_id_entidad
            AND pm.idtipoproceso = v_id_tproceso
            
        UNION ALL
        
        SELECT
            'DESTINATARIO' AS tipo_registro,
            dm.iddestinatariomail AS id_registro,
            NULL AS nombrearchivo,
            dm.para,
            dm.cc,
            dm.cargo,
            dm.idproveedor,
            ce.idetiqueta AS etiqueta_entidad,
            cp.idetiqueta AS etiqueta_tipo_proceso
        FROM
            apl_tb_destinatariomail dm
            LEFT JOIN apl_tb_catalogo ce ON ce.idcatalogo = dm.entidad
            LEFT JOIN apl_tb_catalogo cp ON cp.idcatalogo = dm.idtipoproceso
        WHERE
            dm.entidad = v_id_entidad
            AND dm.idtipoproceso = v_id_tproceso
            AND (v_idproveedor IS NULL OR dm.idproveedor = v_idproveedor)
        ORDER BY tipo_registro;
        
EXCEPTION
    WHEN OTHERS THEN
        p_codigo_salida        := -20008;
        p_mensaje_salida       := 'Error en apl_sp_datos_correo: ' || SQLERRM;
        
END apl_sp_datos_correo;
