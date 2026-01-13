CREATE TABLE APL_Tb_Parametro (
  IDPARAMETRO            NUMBER(10) GENERATED ALWAYS AS IDENTITY (START WITH 1 INCREMENT BY 1 NOCACHE ORDER) NOT NULL,
  NOMBRE                VARCHAR2(150 CHAR)  NOT NULL,
  ADICIONAL             VARCHAR2(300 CHAR),
  ABREVIATURA           CHAR(10 CHAR),
  IDPARAMETROTIPO        NUMBER(10)          NOT NULL,
  IDUSUARIOCREACION     NUMBER(10)          NOT NULL,
  FECHACREACION         DATE                NOT NULL,
  IDUSUARIOMODIFICACION NUMBER(10),
  FECHAMODIFICACION     DATE,
  IDESTADO              NUMBER(10)          NOT NULL,
  IDETIQUETA            VARCHAR2(30 CHAR),
  CONSTRAINT PK_APL_TB_PARAMETRO
    PRIMARY KEY (IDPARAMETRO),
  CONSTRAINT FK_APL_TB_PARAMETROTIPO
    FOREIGN KEY (IDPARAMETROTIPO)
    REFERENCES APL_TB_PARAMETROTIPO (IDPARAMETROTIPO)
);

--Paramtros Acuerdo
INSERT INTO APL_Tb_Parametro (Nombre, Adicional, Abreviatura, IdParametroTipo, IdUsuarioCreacion, FechaCreacion, IdUsuarioModificacion, FechaModificacion, IdEstado, IdEtiqueta) 
VALUES ('Exceso Inventario', '', '', 1, 1, SYSDATE, NULL, NULL, 1, 'EXINVENTARIO');

INSERT INTO APL_Tb_Parametro (Nombre, Adicional, Abreviatura, IdParametroTipo, IdUsuarioCreacion, FechaCreacion, IdUsuarioModificacion, FechaModificacion, IdEstado, IdEtiqueta) 
VALUES ('Caducidad', '', '', 1, 1, SYSDATE, NULL, NULL, 1, 'CADUCIDAD');