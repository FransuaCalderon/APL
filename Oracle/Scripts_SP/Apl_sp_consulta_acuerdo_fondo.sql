CREATE OR REPLACE PROCEDURE apl_sp_consulta_acuerdo_fondo (
    p_idfondo        IN  NUMBER,
    p_cursor         OUT SYS_REFCURSOR,
    p_codigo_salida  OUT NUMBER,
    p_mensaje_salida OUT VARCHAR2
) AS
    v_existe NUMBER := 0;
BEGIN
    -- Validar que existen acuerdos relacionados al fondo
    SELECT COUNT(*)
    INTO v_existe
    FROM apl_tb_acuerdofondo
    WHERE idfondo = p_idfondo;

    IF v_existe = 0 THEN
        p_codigo_salida  := -1;
        p_mensaje_salida := 'ERROR: No existen acuerdos asociados al fondo con ID ' || p_idfondo;
        OPEN p_cursor FOR SELECT NULL FROM dual WHERE 1 = 0;
        RETURN;
    END IF;

    -- Abrir cursor con todos los acuerdos relacionados al fondo
    OPEN p_cursor FOR
        SELECT
            -- Datos del Acuerdo-Fondo (relación)
            af.idacuerdofondo,
            af.idfondo,
            af.valoraporte,
            af.valordisponible        AS acuerdofondo_disponible,
            af.valorcomprometido      AS acuerdofondo_comprometido,
            af.valorliquidado         AS acuerdofondo_liquidado,
            ceaf.nombre               AS acuerdofondo_estado_nombre,
            ceaf.idetiqueta           AS acuerdofondo_estado_etiqueta,
            -- Datos del Acuerdo
            a.idacuerdo,
            a.descripcion             AS acuerdo_descripcion,
            a.idtipoacuerdo,
            cta.nombre                AS tipo_acuerdo_nombre,
            cta.idetiqueta            AS tipo_acuerdo_etiqueta,
            a.idmotivoacuerdo,
            cma.nombre                AS motivo_acuerdo_nombre,
            cma.idetiqueta            AS motivo_acuerdo_etiqueta,
            TO_CHAR(a.fechainiciovigencia, 'YYYY-MM-DD')        AS acuerdo_fecha_inicio,
            TO_CHAR(a.fechafinvigencia,    'YYYY-MM-DD')        AS acuerdo_fecha_fin,
            cea.nombre                AS acuerdo_estado_nombre,
            cea.idetiqueta            AS acuerdo_estado_etiqueta,
            -- Fechas de auditoría
            TO_CHAR(a.fechaingreso,   'YYYY-MM-DD HH24:MI:SS') AS acuerdo_fecha_ingreso
        FROM
            apl_tb_acuerdofondo af
            -- Join con tabla de acuerdos
            INNER JOIN apl_tb_acuerdo    a    ON a.idacuerdo    = af.idacuerdo
            -- Catálogos del Acuerdo-Fondo
            LEFT JOIN  apl_tb_catalogo   ceaf ON ceaf.idcatalogo = af.idestadoregistro
            -- Catálogos del Acuerdo
            LEFT JOIN  apl_tb_catalogo   cta  ON cta.idcatalogo  = a.idtipoacuerdo
            LEFT JOIN  apl_tb_catalogo   cma  ON cma.idcatalogo  = a.idmotivoacuerdo
            LEFT JOIN  apl_tb_catalogo   cea  ON cea.idcatalogo  = a.idestadoregistro
        WHERE
            af.idfondo = p_idfondo
        ORDER BY
            a.fechainiciovigencia DESC,
            a.idacuerdo;

    p_codigo_salida  := 0;
    p_mensaje_salida := 'OK';

EXCEPTION
    WHEN OTHERS THEN
        p_codigo_salida  := -99;
        p_mensaje_salida := 'ERROR inesperado: ' || SQLERRM;
        IF p_cursor IS NULL THEN
            OPEN p_cursor FOR SELECT NULL FROM dual WHERE 1 = 0;
        END IF;
END apl_sp_consulta_acuerdo_fondo;