CREATE OR REPLACE PROCEDURE Apl_Sp_ComboTipoServicio (
    p_cursor OUT SYS_REFCURSOR
)
AS
BEGIN
    OPEN p_cursor FOR
        SELECT idcatalogo AS id, 
               nombre AS nombre 
        FROM APL_TB_CATALOGO  
        WHERE idcatalogotipo = 3 
          AND idestado = 1 
        ORDER BY nombre;
END Apl_Sp_ComboTipoServicio;