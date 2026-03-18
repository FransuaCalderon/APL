create or replace PROCEDURE sp_consulta_aprobacion_general (
    p_entidad_etiqueta IN  VARCHAR2,      -- etiqueta del catálogo (ej: 'ENTPROMOCION')
    p_identidad        IN  NUMBER,
    p_cursor           OUT SYS_REFCURSOR,
    p_codigo_salida    OUT NUMBER,
    p_mensaje_salida   OUT VARCHAR2
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
        OPEN p_cursor FOR SELECT NULL AS tipo_solicitud FROM DUAL WHERE 1 = 0;
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
            OPEN p_cursor FOR SELECT NULL AS tipo_solicitud FROM DUAL WHERE 1 = 0;
            RETURN;
    END;

    -- =========================================================================
    -- Consulta principal
    -- =========================================================================
    OPEN p_cursor FOR
        SELECT
            -- -- Tipo de Solicitud (nombre desde catálogo) -------------
            cat_tipo.nombre                         AS tipo_solicitud,

            -- -- Datos del Solicitante ---------------------------------
            apr.idusersolicitud                     AS usuario_solicita,
            CAST(apr.fechasolicitud AS DATE)        AS fecha_solicitud,

            -- -- Datos del Aprobador -----------------------------------
            apr.iduseraprobador                     AS usuario_aprobador,
            apr.comentario                          AS comentario_aprobador,
            CAST(apr.fechaaprobacion AS DATE)       AS fecha_aprobacion,

            -- -- Nivel de Aprobación -----------------------------------
            apr.nivelaprobacion                     AS nivel,

            -- -- Estado (nombre desde catálogo) ------------------------
            cat_estado.nombre                       AS estado,

            -- -- Lote: secuencial desde apl_tb_lote -------------------
            lot.secuencial                          AS lote

        FROM apl_tb_aprobacion apr

            -- Nombre del Tipo de Proceso
            LEFT JOIN apl_tb_catalogo cat_tipo
                ON  cat_tipo.idcatalogo = apr.idtipoproceso

            -- Nombre del Estado del Registro
            LEFT JOIN apl_tb_catalogo cat_estado
                ON  cat_estado.idcatalogo = apr.idestadoregistro

            -- Número de Lote / Secuencial
            LEFT JOIN apl_tb_lote lot
                ON  lot.secuencial = apr.numeroloteaprobacion
                AND lot.entidad    = apr.entidad

        WHERE apr.entidad   = v_entidad        -- << usa el ID resuelto desde catálogo
          AND apr.identidad = p_identidad

        ORDER BY apr.fechasolicitud ASC,
                 apr.nivelaprobacion ASC;

EXCEPTION
    WHEN OTHERS THEN
        p_codigo_salida  := 1;
        p_mensaje_salida := 'sp_consulta_aprobacion_general => ' || SQLCODE || ' - ' || SQLERRM;
        OPEN p_cursor FOR SELECT NULL AS tipo_solicitud FROM DUAL WHERE 1 = 0;

END sp_consulta_aprobacion_general;