create or replace PROCEDURE sp_consulta_log_general (
    p_entidad_etiqueta  IN  VARCHAR2,
    p_identidad         IN  NUMBER,
    p_cursor            OUT SYS_REFCURSOR,
    p_codigo_salida     OUT NUMBER,
    p_mensaje_salida    OUT VARCHAR2
)
AS
    -- Variable para almacenar el ID de entidad resuelto desde el catálogo
    v_entidad   NUMBER;

BEGIN

    -- =========================================================================
    -- Inicializar parámetros de salida
    -- =========================================================================
    p_codigo_salida  := 0;
    p_mensaje_salida := 'OK';

    -- =========================================================================
    -- Validación: parámetros obligatorios
    -- =========================================================================
    IF p_entidad_etiqueta IS NULL OR p_identidad IS NULL THEN
        p_codigo_salida  := 1;
        p_mensaje_salida := 'ERROR: Los parámetros p_entidad_etiqueta y p_identidad son obligatorios';
        OPEN p_cursor FOR SELECT NULL AS "IdLog" FROM DUAL WHERE 1 = 0;
        RETURN;
    END IF;

    -- =========================================================================
    -- Resolver el ID de entidad desde apl_tb_catalogo usando la etiqueta
    -- =========================================================================
    BEGIN
        SELECT idcatalogo INTO v_entidad
          FROM apl_tb_catalogo
         WHERE TRIM(idetiqueta) = TRIM(p_entidad_etiqueta)
           AND ROWNUM = 1;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            p_codigo_salida  := 1;
            p_mensaje_salida := 'ERROR: No se encontró la entidad con etiqueta: ' || p_entidad_etiqueta;
            OPEN p_cursor FOR SELECT NULL AS "IdLog" FROM DUAL WHERE 1 = 0;
            RETURN;
    END;

    -- =========================================================================
    -- Consulta principal
    -- =========================================================================
    OPEN p_cursor FOR
        SELECT
            -- IdLog
            lg.IDLOG                                AS "IdLog",

            -- Fecha formateada
            TO_CHAR(
                lg.FECHAHORATRX,
                'YYYY-MM-DD HH24:MI:SS'
            )                                       AS "Fecha",

            -- Usuario
            lg.IDUSER                               AS "Usuario",

            -- Nombre de la Opción desde catálogo
            cat_op.NOMBRE                           AS "Opción",

            -- Nombre del Evento / Acción desde catálogo
            cat_ev.NOMBRE                           AS "Acción",

            -- Nombre de la Entidad desde catálogo
            cat_en.NOMBRE                           AS "Entidad",

            -- Nombre del Tipo de Proceso desde catálogo
            cat_tp.NOMBRE                           AS "Tipo_Proceso",

            -- Datos auditados (CLOB)
            lg.DATOS                                AS "Datos"

        FROM APL_TB_LOG lg

            INNER JOIN APL_TB_CATALOGO cat_op
                ON cat_op.IDCATALOGO = lg.IDOPCION

            INNER JOIN APL_TB_CATALOGO cat_ev
                ON cat_ev.IDCATALOGO = lg.IDEVENTO

            INNER JOIN APL_TB_CATALOGO cat_en
                ON cat_en.IDCATALOGO = lg.ENTIDAD

            INNER JOIN APL_TB_CATALOGO cat_tp
                ON cat_tp.IDCATALOGO = lg.IDTIPOPROCESO

        WHERE lg.ENTIDAD   = v_entidad       -- << usa el ID resuelto desde catálogo
          AND lg.IDENTIDAD = p_identidad

        ORDER BY lg.IDLOG DESC;

EXCEPTION
    WHEN OTHERS THEN
        p_codigo_salida  := 1;
        p_mensaje_salida := 'sp_consulta_log_general => ' || SQLCODE || ' - ' || SQLERRM;
        OPEN p_cursor FOR SELECT NULL AS "IdLog" FROM DUAL WHERE 1 = 0;

END sp_consulta_log_general;