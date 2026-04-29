  CREATE OR REPLACE PROCEDURE apl_sp_consulta_articulos_equivalentes (
      p_codigo  IN  VARCHAR2,
      p_cursor  OUT SYS_REFCURSOR
  ) AS
  BEGIN
      OPEN p_cursor FOR
          SELECT a.*
          FROM Apl_Tb_Artefacta_ArticuloEquivalente ae
          INNER JOIN Apl_Tb_Artefacta_Articulo a ON a.codigo =
  ae.codigoarticuloequivalente
          WHERE ae.codigoarticulo = p_codigo;
  END apl_sp_consulta_articulos_equivalentes;