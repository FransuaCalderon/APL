create or replace PROCEDURE apl_sp_consulta_alamacenes_Artefacta (
    p_codigoAlmacen  IN  Apl_Tb_Artefacta_almacen.codigo%TYPE DEFAULT NULL,
    p_rc_almacen     OUT SYS_REFCURSOR
)
AS
BEGIN
    OPEN p_rc_almacen FOR
        SELECT codigo, nombre
        FROM Apl_Tb_Artefacta_almacen
        WHERE codigo IS NOT NULL
          AND nombre IS NOT NULL
          AND (p_codigoAlmacen IS NULL OR codigo = p_codigoAlmacen)
        ORDER BY nombre;

EXCEPTION
    WHEN OTHERS THEN
        IF p_rc_almacen%ISOPEN THEN
            CLOSE p_rc_almacen;
        END IF;
        RAISE;
END apl_sp_consulta_alamacenes_Artefacta;