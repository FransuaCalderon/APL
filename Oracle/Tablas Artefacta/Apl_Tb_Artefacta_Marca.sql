CREATE TABLE Apl_Tb_Artefacta_Marca(
    CODIGO    VARCHAR2(50)    NOT NULL,
    NOMBRE    VARCHAR2(255),
    CONSTRAINT PK_MARCA PRIMARY KEY (CODIGO)
);

----

INSERT INTO apl_tb_artefacta_marca (CODIGO, NOMBRE) VALUES ('CAT-001', 'Categoría Principal');
INSERT INTO apl_tb_artefacta_marca (CODIGO, NOMBRE) VALUES ('CAT-002', 'Categoría Secundaria');

COMMIT;