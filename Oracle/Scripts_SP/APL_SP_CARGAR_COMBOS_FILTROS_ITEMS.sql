create or replace PROCEDURE APL_SP_CARGAR_COMBOS_FILTROS_ITEMS(
    p_cur_marcas        OUT SYS_REFCURSOR,
    p_cur_divisiones    OUT SYS_REFCURSOR,
    p_cur_departamentos OUT SYS_REFCURSOR,
    p_cur_clases        OUT SYS_REFCURSOR
) AS
BEGIN
    -- Marcas
    OPEN p_cur_marcas FOR
        SELECT CODIGO, NOMBRE 
        FROM APL_TB_ARTEFACTA_MARCA 
        ORDER BY NOMBRE;

    -- Divisiones
    OPEN p_cur_divisiones FOR
        SELECT CODIGO, NOMBRE 
        FROM APL_TB_ARTEFACTA_DIVISION 
        ORDER BY NOMBRE;

    -- Departamentos
    OPEN p_cur_departamentos FOR
        SELECT CODIGO, NOMBRE 
        FROM APL_TB_ARTEFACTA_DEPARTAMENTO 
        ORDER BY NOMBRE;

    -- Clases
    OPEN p_cur_clases FOR
        SELECT CODIGO, NOMBRE 
        FROM APL_TB_ARTEFACTA_CLASE 
        ORDER BY NOMBRE;

EXCEPTION
    WHEN OTHERS THEN
        RAISE_APPLICATION_ERROR(-20001, 'Error en SP_CARGAR_COMBOS_FILTROS: ' || SQLERRM);
END APL_SP_CARGAR_COMBOS_FILTROS_ITEMS;


