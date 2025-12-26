CREATE OR REPLACE PROCEDURE apl_sp_ListarArtefactaProveedores (
    p_etiqueta IN VARCHAR2,        -- 'RUCPROPIO', 'TFREBATE', 'TFPROVEDOR'
    p_cursor   OUT SYS_REFCURSOR
)
AS
BEGIN
    IF UPPER(p_etiqueta) = 'RUCPROPIO' THEN
        -- Fondo Propio: Solo mostrar RUC específico
        OPEN p_cursor FOR
            SELECT * 
            FROM APL_TB_ARTEFACTA_PROVEEDOR
            WHERE IDENTIFICACION = '1790895548001';
            
    ELSIF UPPER(p_etiqueta) IN ('TFREBATE', 'TFPROVEDOR') THEN
        -- Rebate o Proveedor: Ocultar ese RUC
        OPEN p_cursor FOR
            SELECT * 
            FROM APL_TB_ARTEFACTA_PROVEEDOR
            WHERE IDENTIFICACION != '1790895548001';
            
    ELSE
        -- Otros casos: Mostrar todos
        OPEN p_cursor FOR
            SELECT * 
            FROM APL_TB_ARTEFACTA_PROVEEDOR;
    END IF;
    
END apl_sp_ListarArtefactaProveedores;
