create or replace PROCEDURE APL_SP_ListarArtefactaProveedores_por_identificacion (
    p_identificacion IN VARCHAR2,
    p_cursor OUT SYS_REFCURSOR
)
AS
BEGIN
    OPEN p_cursor FOR
        SELECT 
            *
        FROM 
            APL_TB_ARTEFACTA_PROVEEDOR
        WHERE 
            IDENTIFICACION = p_identificacion;  -- Ajusta el nombre del campo según tu tabla

END APL_SP_ListarArtefactaProveedores_por_identificacion;