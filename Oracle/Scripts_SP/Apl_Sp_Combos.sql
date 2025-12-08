create or replace PROCEDURE APL_SP_COMBOS (
    p_etiqueta IN VARCHAR2,
    p_cursor   OUT SYS_REFCURSOR
)
AS
/*
================================================================================
  Descripción  : Busca registros por etiqueta en las tablas APL_TB_CATALOGOTIPO 
                 o APL_TB_CATALOGO y retorna la información relacionada.    
================================================================================
*/
BEGIN
    OPEN p_cursor FOR
        SELECT CASE 
                   WHEN cp.idetiqueta = p_etiqueta THEN 'CATALOGOTIPO'
                   WHEN c.idetiqueta = p_etiqueta THEN 'CATALOGO'
               END AS origen_etiqueta,
               cp.idcatalogotipo,
               cp.nombre AS nombre_tipoCatalogo,
               cp.idetiqueta AS idetiqueta_tipoCatalogo,
               c.idcatalogo,
               c.nombre AS nombre_Catalogo,
               c.adicional AS adicional_Catalogo,
               c.abreviatura AS abreviatura_Catalogo,
               c.idetiqueta AS idetiqueta_Catalogo
        FROM APL_TB_CATALOGOTIPO cp  
        INNER JOIN APL_TB_CATALOGO c ON cp.idcatalogotipo = c.idcatalogotipo
        WHERE cp.idetiqueta = p_etiqueta 
           OR c.idetiqueta = p_etiqueta;
        
END APL_SP_COMBOS;