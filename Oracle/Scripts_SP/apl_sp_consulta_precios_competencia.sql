CREATE OR REPLACE PROCEDURE apl_sp_consulta_precios_competencia (
      p_codigo  IN  VARCHAR2,
      p_cursor  OUT SYS_REFCURSOR
  ) AS
  BEGIN
      OPEN p_cursor FOR
          SELECT pd.CODIGORELACION1  AS ARTICULO,
                 pd.CODIGORELACION2  AS NOMBRE_COMPETENCIA,
                 pd.VALOR1           AS PRECIO_CONTADO
          FROM Apl_Tb_ParametroDato pd
          INNER JOIN Apl_Tb_Parametro pa ON pa.idparametro = pd.idparametro
          WHERE pa.IDPARAMETROTIPO  = 3
            AND pa.CODIGOPARAMETRO  = 4
            AND pd.CODIGORELACION1  = p_codigo;
  END apl_sp_consulta_precios_competencia;