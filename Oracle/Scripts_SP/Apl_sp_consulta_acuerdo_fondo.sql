create or replace PROCEDURE apl_sp_consulta_acuerdo_fondo (
    p_idfondo        IN NUMBER,
    p_cursor         OUT SYS_REFCURSOR,
    p_codigo_salida  OUT NUMBER,
    p_mensaje_salida OUT VARCHAR2
) AS
BEGIN
    -- Validar que existe el fondo
    DECLARE
        v_existe NUMBER;
    BEGIN
        SELECT COUNT(*) INTO v_existe
        FROM apl_tb_fondo
        WHERE idfondo = p_idfondo;

        IF v_existe = 0 THEN
            p_codigo_salida := -1;
            p_mensaje_salida := 'ERROR: No existe el fondo con ID ' || p_idfondo;

            OPEN p_cursor FOR SELECT NULL FROM dual WHERE 1=0;
            RETURN;
        END IF;
    END;

    -- Abrir cursor con todos los acuerdos relacionados al fondo
    OPEN p_cursor FOR
        SELECT
            -- Datos del Fondo
            f.idfondo,
            f.descripcion AS fondo_descripcion,
            fpro.nombre   AS nombre_proveedor,
            f.idtipofondo,
            ctf.nombre AS tipo_fondo_nombre,
            ctf.idetiqueta AS tipo_fondo_etiqueta,
            f.valorfondo,
            TO_CHAR(f.fechainiciovigencia, 'YYYY-MM-DD') AS fondo_fecha_inicio,
            TO_CHAR(f.fechafinvigencia, 'YYYY-MM-DD') AS fondo_fecha_fin,
            f.valordisponible AS fondo_valor_disponible,
            f.valorcomprometido AS fondo_valor_comprometido,
            f.valorliquidado AS fondo_valor_liquidado,
            cef.nombre AS fondo_estado_nombre,
            cef.idetiqueta AS fondo_estado_etiqueta,

            -- Datos del Acuerdo-Fondo (relación)
            af.idacuerdofondo,
            af.valoraporte,
            af.valordisponible AS acuerdofondo_disponible,
            af.valorcomprometido AS acuerdofondo_comprometido,
            af.valorliquidado AS acuerdofondo_liquidado,
            ceaf.nombre AS acuerdofondo_estado_nombre,
            ceaf.idetiqueta AS acuerdofondo_estado_etiqueta,

            -- Datos del Acuerdo
            a.idacuerdo,
            a.descripcion AS acuerdo_descripcion,
            a.idtipoacuerdo,
            cta.nombre AS tipo_acuerdo_nombre,
            cta.idetiqueta AS tipo_acuerdo_etiqueta,
            a.idmotivoacuerdo,
            pma.nombre AS motivo_acuerdo_nombre,
            pma.idetiqueta AS motivo_acuerdo_etiqueta,
            TO_CHAR(a.fechainiciovigencia, 'YYYY-MM-DD') AS acuerdo_fecha_inicio,
            TO_CHAR(a.fechafinvigencia, 'YYYY-MM-DD') AS acuerdo_fecha_fin,
            cea.nombre AS acuerdo_estado_nombre,
            cea.idetiqueta AS acuerdo_estado_etiqueta,

            -- Fechas de auditoría
            TO_CHAR(f.fechaingreso, 'YYYY-MM-DD HH24:MI:SS') AS fondo_fecha_ingreso,
            TO_CHAR(a.fechaingreso, 'YYYY-MM-DD HH24:MI:SS') AS acuerdo_fecha_ingreso
        FROM
            apl_tb_fondo f
            -- Join con tabla intermedia
            INNER JOIN apl_tb_acuerdofondo af ON af.idfondo = f.idfondo
            -- Join con tabla de acuerdos
            INNER JOIN apl_tb_acuerdo a ON a.idacuerdo = af.idacuerdo
            -- Joins con catálogos para descripciones
            LEFT JOIN apl_tb_catalogo  ctf  ON ctf.idcatalogo  = f.idtipofondo
            LEFT JOIN apl_tb_catalogo  cef  ON cef.idcatalogo  = f.idestadoregistro
            LEFT JOIN apl_tb_catalogo  cta  ON cta.idcatalogo  = a.idtipoacuerdo
            LEFT JOIN apl_tb_parametro pma  ON pma.idparametro = a.idmotivoacuerdo
            LEFT JOIN apl_tb_catalogo  cea  ON cea.idcatalogo  = a.idestadoregistro
            LEFT JOIN apl_tb_catalogo  ceaf ON ceaf.idcatalogo = af.idestadoregistro
            LEFT JOIN apl_tb_artefacta_proveedor  fpro ON fpro.identificacion = f.idproveedor
        WHERE
            f.idfondo = p_idfondo
        ORDER BY
            a.fechainiciovigencia DESC,
            a.idacuerdo;

    p_codigo_salida := 0;
    p_mensaje_salida := 'OK';

EXCEPTION
    WHEN OTHERS THEN
        p_codigo_salida := -99;
        p_mensaje_salida := 'ERROR: ' || SQLERRM;

END apl_sp_consulta_acuerdo_fondo;