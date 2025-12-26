create or replace PROCEDURE apl_sp_consulta_aprobacion (
    p_identidad      IN NUMBER,
    p_entidad        IN VARCHAR2,
    p_tipoproceso    IN VARCHAR2,
    p_cursor         OUT SYS_REFCURSOR,
    p_codigo_salida  OUT NUMBER,
    p_mensaje_salida OUT VARCHAR2
) AS
    v_id_entidad     NUMBER;
    v_id_tipoproceso NUMBER;
BEGIN
    -- Obtener IDs de catálogo
    BEGIN
        SELECT idcatalogo INTO v_id_entidad
        FROM apl_tb_catalogo
        WHERE idetiqueta = p_entidad AND ROWNUM = 1;

        SELECT idcatalogo INTO v_id_tipoproceso
        FROM apl_tb_catalogo
        WHERE idetiqueta = p_tipoproceso AND ROWNUM = 1;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            p_codigo_salida := -1;
            p_mensaje_salida := 'ERROR: No se encontraron las etiquetas en el catálogo';
            OPEN p_cursor FOR SELECT NULL FROM dual WHERE 1=0;
            RETURN;
    END;

    -- Consulta con información descriptiva
    OPEN p_cursor FOR
        SELECT
            a.idaprobacion,
            a.identidad,

            -- Información de entidad
            a.entidad AS entidad_id,
            ce.nombre AS entidad_nombre,
            ce.idetiqueta AS entidad_etiqueta,

            -- Información de tipo proceso
            a.idtipoproceso AS tipoproceso_id,
            ctp.nombre AS tipoproceso_nombre,
            ctp.idetiqueta AS tipoproceso_etiqueta,

            -- Información de usuario solicitante
            a.idusersolicitud,
            a.nombreusersolicitud,
            TO_CHAR(a.fechasolicitud, 'YYYY-MM-DD HH24:MI:SS') AS fechasolicitud,

            -- Información de usuario aprobador
            a.iduseraprobador,
            

            -- Comentario y nivel
            a.comentario,
            a.nivelaprobacion,

            -- Información de estado
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
            AND a.numeroloteaprobacion = (SELECT numeroloteaprobacion FROM apl_tb_fondo WHERE idfondo = p_identidad)
        ORDER BY
            a.nivelaprobacion  ASC;

    p_codigo_salida := 0;
    p_mensaje_salida := 'OK';

EXCEPTION
    WHEN OTHERS THEN
        p_codigo_salida := -99;
        p_mensaje_salida := 'ERROR: ' || SQLERRM;

END apl_sp_consulta_aprobacion;