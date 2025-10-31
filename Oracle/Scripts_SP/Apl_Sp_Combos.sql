CREATE OR REPLACE PROCEDURE APL_SP_COMBOS (
    p_etiqueta IN VARCHAR2,
    p_cursor OUT SYS_REFCURSOR
)
AS
BEGIN
    OPEN p_cursor FOR
        SELECT cp.idcatalogotipo,
               cp.nombre AS nombre_tipoCatalogo,
               cp.idetiqueta AS idetiqeuta_tipoCatalogo,
               c.idcatalogo,
               c.nombre AS nombre_Catalogo,
               c.adicional AS adicional_Catalogo,
               c.abreviatura AS abreviatura_Catalogo,
               c.idetiqueta AS idetiqeuta_Catalogo
        FROM APL_TB_CATALOGOTIPO cp  
        INNER JOIN APL_TB_CATALOGO c ON cp.idcatalogotipo = c.idcatalogotipo
        WHERE cp.idetiqueta = p_etiqueta;
END APL_SP_COMBOS; 
    
    
    
    
    