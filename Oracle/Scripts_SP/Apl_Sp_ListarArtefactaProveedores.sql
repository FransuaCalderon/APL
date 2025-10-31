CREATE OR REPLACE PROCEDURE APL_SP_ListarArtefactaProveedores (
    p_cursor OUT SYS_REFCURSOR
)
AS
BEGIN
    OPEN p_cursor FOR
        SELECT * 
        FROM APL_TB_ARTEFACTA_PROVEEDOR;
END APL_SP_ListarArtefactaProveedores;
