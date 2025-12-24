create or replace PROCEDURE apl_sp_consulta_acuerdo_promociones (
    p_idacuerdo     IN  NUMBER DEFAULT NULL,
    p_cursor        OUT SYS_REFCURSOR
)
AS
    v_estado_nuevo      NUMBER;
    v_estado_modificado NUMBER;
    v_estado_aprobado   NUMBER;
    v_estado_vigente    NUMBER;
BEGIN
    -- Obtener los IDs de los estados permitidos
    SELECT idcatalogo 
    INTO v_estado_nuevo 
    FROM apl_tb_catalogo 
    WHERE idetiqueta = 'ESTADONUEVO';
	
    SELECT idcatalogo 
    INTO v_estado_modificado 
    FROM apl_tb_catalogo 
    WHERE idetiqueta = 'ESTADOMODIFICADO';
	
    SELECT idcatalogo 
    INTO v_estado_aprobado
    FROM apl_tb_catalogo 
    WHERE idetiqueta = 'ESTADOAPROBADO';
	
    SELECT idcatalogo 
    INTO v_estado_vigente 
    FROM apl_tb_catalogo 
    WHERE idetiqueta = 'ESTADOVIGENTE';

    OPEN p_cursor FOR
        SELECT 
            p.IDPROMOCION,
            p.DESCRIPCION,
            p.MOTIVO                                            AS ID_MOTIVO,
            cat_motivo.NOMBRE                                   AS MOTIVO_NOMBRE,
            p.CLASEPROMOCION                                    AS ID_CLASE_ACUERDO,
            cat_clase.NOMBRE                                    AS CLASE_ACUERDO,
            NVL(art.cantidad_articulos, 0)                      AS cantidad_articulos,
            pa.VALORCOMPROMETIDO,
            TO_CHAR(p.FECHAHORAINICIO, 'YYYY-MM-DD')          AS FECHA_INICIO,
            TO_CHAR(p.FECHAHORAFIN, 'YYYY-MM-DD')             AS FECHA_FIN,
            CASE 
                WHEN p.MARCAREGALO = '1' THEN pa.VALORCOMPROMETIDO 
                ELSE NULL 
            END                                                 AS MARCA_REGALO,
            p.ESTADOREGISTRO                                    AS ID_ESTADO,
            cat_estado.NOMBRE                                   AS ESTADO
        FROM 
            apl_tb_promocion p 
        INNER JOIN 
            apl_tb_promocionacuerdo pa 
            ON p.IDPROMOCION = pa.IDPROMOCION
        INNER JOIN 
            apl_tb_promocionarticulo part 
            ON p.IDPROMOCION = part.IDPROMOCION
        INNER JOIN 
            apl_tb_acuerdo a 
            ON pa.IDACUERDO = a.IDACUERDO
        LEFT JOIN 
            apl_tb_catalogo cat_estado 
            ON p.ESTADOREGISTRO = cat_estado.IDCATALOGO
        LEFT JOIN 
            apl_tb_catalogo cat_motivo 
            ON p.MOTIVO = cat_motivo.IDCATALOGO
        LEFT JOIN 
            apl_tb_catalogo cat_clase 
            ON p.CLASEPROMOCION = cat_clase.IDCATALOGO
            LEFT JOIN (SELECT idacuerdo, COUNT(*) AS cantidad_articulos FROM apl_tb_acuerdoarticulo GROUP BY idacuerdo) art ON art.idacuerdo = a.idacuerdo
        WHERE 
            p.ESTADOREGISTRO IN (v_estado_nuevo, v_estado_modificado, v_estado_aprobado, v_estado_vigente)
            AND (p_idacuerdo IS NULL OR a.IDACUERDO = p_idacuerdo)
        ORDER BY 
            p.IDPROMOCION;
            
END apl_sp_consulta_acuerdo_promociones;