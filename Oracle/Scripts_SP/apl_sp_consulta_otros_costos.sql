CREATE OR REPLACE PROCEDURE apl_sp_consulta_otros_costos (
      p_cursor  OUT SYS_REFCURSOR
  ) AS
  BEGIN
      OPEN p_cursor FOR
          SELECT pa.codigoparametro  AS CODIGO,
                 pa.NOMBRE,
                 pd.VALOR1           AS VALOR
          FROM Apl_Tb_ParametroDato   pd
          INNER JOIN Apl_Tb_Parametro     pa  ON pa.idparametro     = pd.idparametro
                                             AND pa.codigoparametro =
  pd.codigoparametro
          INNER JOIN Apl_Tb_ParametroTipo pt  ON pt.idparametrotipo =
  pa.idparametrotipo
          WHERE pt.nombre = 4;  -- reemplaza el 4
  END apl_sp_consulta_otros_costos;