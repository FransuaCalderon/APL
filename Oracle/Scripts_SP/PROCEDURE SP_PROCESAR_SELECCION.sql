CREATE OR REPLACE PROCEDURE SP_PROCESAR_SELECCION(
    p_marcas         IN VARCHAR2 DEFAULT NULL,  -- 'Samsung,LG,Sony'
    p_divisiones     IN VARCHAR2 DEFAULT NULL,  -- 'Electrónica,Hogar'
    p_departamentos  IN VARCHAR2 DEFAULT NULL,  -- 'Audio y Video,Cocina'
    p_clases         IN VARCHAR2 DEFAULT NULL,  -- 'Televisores,Laptops'
    p_codigo         IN VARCHAR2 DEFAULT NULL,  -- Código artículo directo
    p_cursor         OUT SYS_REFCURSOR
) AS
BEGIN
    OPEN p_cursor FOR
        SELECT
            CODIGO,
            DESCRIPCION,
            COSTO,
            (STOCK_BODEGA + STOCK_TIENDAS) AS STOCK,
            INVENTARIO_OPTIMO AS OPTIMO,
            EXCEDENTES_UNIDADES AS EXCEDENTE_U,
            EXCEDENTES_DOLARES AS EXCEDENTE_D,
            M0_UNIDADES AS M0_U,
            M0_DOLARES AS M0_D,
            M1_UNIDADES AS M1_U,
            M1_DOLARES AS M1_D,
            M2_UNIDADES AS M2_U,
            M2_DOLARES AS M2_D
        FROM APL_TB_ARTEFACTA_ARTICULO
        WHERE 
            (p_codigo IS NULL OR UPPER(CODIGO) LIKE '%' || UPPER(p_codigo) || '%')
            AND (p_marcas IS NULL OR INSTR(',' || p_marcas || ',', ',' || MARCA || ',') > 0)
            AND (p_divisiones IS NULL OR INSTR(',' || p_divisiones || ',', ',' || DIVISION || ',') > 0)
            AND (p_departamentos IS NULL OR INSTR(',' || p_departamentos || ',', ',' || DEPARTAMENTO || ',') > 0)
            AND (p_clases IS NULL OR INSTR(',' || p_clases || ',', ',' || CLASE || ',') > 0)
        ORDER BY CODIGO;

EXCEPTION
    WHEN OTHERS THEN
        RAISE_APPLICATION_ERROR(-20001, 'Error en SP_PROCESAR_SELECCION: ' || SQLERRM);
END SP_PROCESAR_SELECCION;
