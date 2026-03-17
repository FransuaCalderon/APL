CREATE OR REPLACE PROCEDURE apl_sp_ListarArtefactaProveedores (
    p_etiqueta IN VARCHAR2,
    p_cursor   OUT SYS_REFCURSOR
)
AS
    v_ruc VARCHAR2(13);
BEGIN
    -- Obtener RUC una sola vez
    SELECT SUBSTR(ADICIONAL, 1, 13)
      INTO v_ruc
      FROM APL_TB_CATALOGO
     WHERE IDETIQUETA = 'RUCPROPIO'
       AND ROWNUM = 1;

    IF UPPER(p_etiqueta) IN ('TFPROPIO', 'TFCREDITO') THEN
        OPEN p_cursor FOR
            SELECT CODIGO,
                   IDENTIFICACION,
                   NOMBRE,
                   NOMBRECONTACTO1 AS CONTACTO,
                   MAILCONTACTO1   AS MAIL
              FROM APL_TB_ARTEFACTA_PROVEEDOR
             WHERE IDENTIFICACION = v_ruc
             ORDER BY CODIGO;

    ELSIF UPPER(p_etiqueta) IN ('TFREBATE', 'TFPROVEDOR') THEN
        OPEN p_cursor FOR
            SELECT CODIGO,
                   IDENTIFICACION,
                   NOMBRE,
                   NOMBRECONTACTO1 AS CONTACTO,
                   MAILCONTACTO1   AS MAIL
              FROM APL_TB_ARTEFACTA_PROVEEDOR
             WHERE IDENTIFICACION != v_ruc
             ORDER BY CODIGO;
    ELSE
        OPEN p_cursor FOR
            SELECT CODIGO,
                   IDENTIFICACION,
                   NOMBRE,
                   NOMBRECONTACTO1 AS CONTACTO,
                   MAILCONTACTO1   AS MAIL
              FROM APL_TB_ARTEFACTA_PROVEEDOR
             ORDER BY CODIGO;
    END IF;
END apl_sp_ListarArtefactaProveedores;