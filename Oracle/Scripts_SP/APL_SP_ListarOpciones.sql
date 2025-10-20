create or replace PROCEDURE APL_SP_ListarOpciones 
( 
  p_usuarioRol IN VARCHAR2,
  p_cursor     OUT SYS_REFCURSOR 
) 
AS 
BEGIN 
  OPEN p_cursor FOR 
    SELECT 
      o.idopcion, 
      o.nombre        AS opcion_nombre, 
      o.descripcion   AS opcion_descripcion, 
      o.vista, 
      o.idestado, 
      c.idcatalogo, 
      c.nombre        AS catalogo_nombre, 
      c.adicional, 
      c.abreviatura, 
      c.idcatalogotipo, 
      ct.nombre       AS catalogotipo_nombre 
    FROM   APL_TB_OPCIONES      o 
    JOIN   APL_TB_CATALOGO      c  ON c.idcatalogo      = o.idgrupo 
    JOIN   APL_TB_CATALOGOTIPO  ct ON ct.idcatalogotipo = c.idcatalogotipo 
    ORDER BY ct.nombre, c.nombre, o.nombre; 
END APL_SP_ListarOpciones;



===========================PRUEBAS
VAR cursor REFCURSOR;
EXEC APL_SP_ListarOpciones(p_usuarioRol => 'ADMIN', p_cursor => :cursor);
PRINT cursor;