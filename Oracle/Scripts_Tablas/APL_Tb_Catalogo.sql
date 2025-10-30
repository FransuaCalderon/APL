CREATE TABLE APL_Tb_Catalogo (
  IDCATALOGO            NUMBER(10) GENERATED ALWAYS AS IDENTITY NOT NULL,
  NOMBRE                VARCHAR2(150 CHAR)  NOT NULL,
  ADICIONAL             VARCHAR2(300 CHAR),
  ABREVIATURA           CHAR(10 CHAR),
  IDCATALOGOTIPO        NUMBER(10)          NOT NULL,
  IDUSUARIOCREACION     NUMBER(10)          NOT NULL,
  FECHACREACION         DATE                NOT NULL,
  IDUSUARIOMODIFICACION NUMBER(10),
  FECHAMODIFICACION     DATE,
  IDESTADO              NUMBER(10)          NOT NULL,
  IDETIQUETA            VARCHAR2(30 CHAR),
  CONSTRAINT PK_APL_TB_CATALOGO
    PRIMARY KEY (IDCATALOGO),
  CONSTRAINT FK_APL_TB_CATALOGOTIPO
    FOREIGN KEY (IDCATALOGOTIPO)
    REFERENCES APL_TB_CATALOGOTIPO (IDCATALOGOTIPO)
);

=======================INSERT===============================

INSERT INTO APL_TB_CATALOGO (Nombre, Adicional, Abreviatura, IdCatalogoTipo, IdUsuarioCreacion, FechaCreacion, IdUsuarioModificacion, FechaModificacion, IdEstado, IdEtiqueta) 
VALUES ('Activo', 'AC', 'Act', 1, 1, SYSDATE, NULL, NULL, 1, 'ESTADOACTIVO');

INSERT INTO APL_TB_CATALOGO (Nombre, Adicional, Abreviatura, IdCatalogoTipo, IdUsuarioCreacion, FechaCreacion, IdUsuarioModificacion, FechaModificacion, IdEstado, IdEtiqueta) 
VALUES ('Nuevo', 'NU', 'Nue', 1, 1, SYSDATE, NULL, NULL, 1, 'ESTADONUEVO');

INSERT INTO APL_TB_CATALOGO (Nombre, Adicional, Abreviatura, IdCatalogoTipo, IdUsuarioCreacion, FechaCreacion, IdUsuarioModificacion, FechaModificacion, IdEstado, IdEtiqueta) 
VALUES ('Negado', ' NE', 'Neg', 1, 1, SYSDATE, NULL, NULL, 1, 'ESTADONEGADO');

INSERT INTO APL_TB_CATALOGO (Nombre, Adicional, Abreviatura, IdCatalogoTipo, IdUsuarioCreacion, FechaCreacion, IdUsuarioModificacion, FechaModificacion, IdEstado, IdEtiqueta) 
VALUES ('Aprobado', 'AP', 'Apr', 1, 1, SYSDATE, NULL, NULL, 1, 'ESTADOAPROBADO');

INSERT INTO APL_TB_CATALOGO (Nombre, Adicional, Abreviatura, IdCatalogoTipo, IdUsuarioCreacion, FechaCreacion, IdUsuarioModificacion, FechaModificacion, IdEstado, IdEtiqueta) 
VALUES ('Vigente', 'VI', 'Vig', 1, 1, SYSDATE, NULL, NULL, 1, 'ESTADOVIGENTE');

INSERT INTO APL_TB_CATALOGO (Nombre, Adicional, Abreviatura, IdCatalogoTipo, IdUsuarioCreacion, FechaCreacion, IdUsuarioModificacion, FechaModificacion, IdEstado, IdEtiqueta) 
VALUES ('Inactivo', 'IN', 'Ina', 1, 1, SYSDATE, NULL, NULL, 1, 'ESTADOINACTIVO');

INSERT INTO APL_TB_CATALOGO (Nombre, Adicional, Abreviatura, IdCatalogoTipo, IdUsuarioCreacion, FechaCreacion, IdUsuarioModificacion, FechaModificacion, IdEstado, IdEtiqueta) 
VALUES ('Cerrado', 'CE', 'Cer', 1, 1, SYSDATE, NULL, NULL, 1, 'ESTADOCERRADO');

INSERT INTO APL_TB_CATALOGO (Nombre, Adicional, Abreviatura, IdCatalogoTipo, IdUsuarioCreacion, FechaCreacion, IdUsuarioModificacion, FechaModificacion, IdEstado, IdEtiqueta) 
VALUES ('Liquidado', 'LI', 'Liq', 1, 1, SYSDATE, NULL, NULL, 1, 'ESTADOLIQUIDADO');

INSERT INTO APL_TB_CATALOGO (Nombre, Adicional, Abreviatura, IdCatalogoTipo, IdUsuarioCreacion, FechaCreacion, IdUsuarioModificacion, FechaModificacion, IdEstado, IdEtiqueta) 
VALUES ('Eliminado', 'EL', 'Eli', 1, 1, SYSDATE, NULL, NULL, 1, 'ESTADOELIMINADO');

INSERT INTO APL_TB_CATALOGO (Nombre, Adicional, Abreviatura, IdCatalogoTipo, IdUsuarioCreacion, FechaCreacion, IdUsuarioModificacion, FechaModificacion, IdEstado, IdEtiqueta) 
VALUES ('Modificado', 'MO', 'Mod', 1, 1, SYSDATE, NULL, NULL, 1, 'ESTADOMODIFICADO');

--Grupo
INSERT INTO APL_TB_CATALOGO (Nombre, Adicional, Abreviatura, IdCatalogoTipo, IdUsuarioCreacion, FechaCreacion, IdUsuarioModificacion, FechaModificacion, IdEstado, IdEtiqueta) 
VALUES ('Configuracion', 'fas fa-cog', '', 2, 1, SYSDATE, NULL, NULL, 1, 'GRCONFIGURACION');

INSERT INTO APL_TB_CATALOGO (Nombre, Adicional, Abreviatura, IdCatalogoTipo, IdUsuarioCreacion, FechaCreacion, IdUsuarioModificacion, FechaModificacion, IdEstado, IdEtiqueta) 
VALUES ('Parametrizacion', 'fas fa-cog', '', 2, 1, SYSDATE, NULL, NULL, 1, 'GRPARAMETRIZACION');

INSERT INTO APL_TB_CATALOGO (Nombre, Adicional, Abreviatura, IdCatalogoTipo, IdUsuarioCreacion, FechaCreacion, IdUsuarioModificacion, FechaModificacion, IdEstado, IdEtiqueta) 
VALUES ('Fondo', 'far fa-address-card', '', 2, 1, SYSDATE, NULL, NULL, 1, 'GRFONDO');

INSERT INTO APL_TB_CATALOGO (Nombre, Adicional, Abreviatura, IdCatalogoTipo, IdUsuarioCreacion, FechaCreacion, IdUsuarioModificacion, FechaModificacion, IdEstado, IdEtiqueta) 
VALUES ('Acuerdo', 'far fa-address-card', '', 2, 1, SYSDATE, NULL, NULL, 1, 'GRACUERDO');

INSERT INTO APL_TB_CATALOGO (Nombre, Adicional, Abreviatura, IdCatalogoTipo, IdUsuarioCreacion, FechaCreacion, IdUsuarioModificacion, FechaModificacion, IdEstado, IdEtiqueta) 
VALUES ('Promocion', 'far fa-address-card', '', 2, 1, SYSDATE, NULL, NULL, 1, 'GRPROMOCION');

INSERT INTO APL_TB_CATALOGO (Nombre, Adicional, Abreviatura, IdCatalogoTipo, IdUsuarioCreacion, FechaCreacion, IdUsuarioModificacion, FechaModificacion, IdEstado, IdEtiqueta) 
VALUES ('Procesos', 'far fa-address-card', '', 2, 1, SYSDATE, NULL, NULL, 1, 'GRPROCESOS');

INSERT INTO APL_TB_CATALOGO (Nombre, Adicional, Abreviatura, IdCatalogoTipo, IdUsuarioCreacion, FechaCreacion, IdUsuarioModificacion, FechaModificacion, IdEstado, IdEtiqueta) 
VALUES ('Reportes', 'far fa-address-card', '', 2, 1, SYSDATE, NULL, NULL, 1, 'GRREPORTE');

--Módulos
INSERT INTO APL_TB_CATALOGO (Nombre, Adicional, Abreviatura, IdCatalogoTipo, IdUsuarioCreacion, FechaCreacion, IdUsuarioModificacion, FechaModificacion, IdEstado, IdEtiqueta) 
VALUES ('Modulo Administrador del Sistemas', '', '', 3, 1, SYSDATE, NULL, NULL, 1, 'MODULOADMINSYS');

INSERT INTO APL_TB_CATALOGO (Nombre, Adicional, Abreviatura, IdCatalogoTipo, IdUsuarioCreacion, FechaCreacion, IdUsuarioModificacion, FechaModificacion, IdEstado, IdEtiqueta) 
VALUES ('Modulo APL (Acuerdo-Promoción-Liquidación)', '', '', 3, 1, SYSDATE, NULL, NULL, 1, 'MODULOAPL');

-- País
INSERT INTO APL_TB_CATALOGO (Nombre, Adicional, Abreviatura, IdCatalogoTipo, IdUsuarioCreacion, FechaCreacion, IdUsuarioModificacion, FechaModificacion, IdEstado, IdEtiqueta) 
VALUES ('Ecuador', 'EC', 'ECU', 4, 1, SYSDATE, NULL, NULL, 1, 'ECUADOR');

-- Moneda 
INSERT INTO APL_TB_CATALOGO (Nombre, Adicional, Abreviatura, IdCatalogoTipo, IdUsuarioCreacion, FechaCreacion, IdUsuarioModificacion, FechaModificacion, IdEstado, IdEtiqueta) 
VALUES ('Dolar', 'UDS$', 'DOL', 5, 1, SYSDATE, NULL, NULL, 1, 'DÓLAR');

-- Tipo Login
INSERT INTO APL_TB_CATALOGO (Nombre, Adicional, Abreviatura, IdCatalogoTipo, IdUsuarioCreacion, FechaCreacion, IdUsuarioModificacion, FechaModificacion, IdEstado, IdEtiqueta) 
VALUES ('Autenticacion Interna', '', '', 6, 1, SYSDATE, NULL, NULL, 1, 'LOGININTERNO');

INSERT INTO APL_TB_CATALOGO (Nombre, Adicional, Abreviatura, IdCatalogoTipo, IdUsuarioCreacion, FechaCreacion, IdUsuarioModificacion, FechaModificacion, IdEstado, IdEtiqueta) 
VALUES ('Autenticacion Corporativa', '', '', 6, 1, SYSDATE, NULL, NULL, 1, 'LOGINCORPORATIVO');

-- Botones
INSERT INTO APL_TB_CATALOGO (Nombre, Adicional, Abreviatura, IdCatalogoTipo, IdUsuarioCreacion, FechaCreacion, IdUsuarioModificacion, FechaModificacion, IdEstado, IdEtiqueta) 
VALUES ('Boton Grabar', '', '', 7, 1, SYSDATE, NULL, NULL, 1, 'BTNGRABAR');

INSERT INTO APL_TB_CATALOGO (Nombre, Adicional, Abreviatura, IdCatalogoTipo, IdUsuarioCreacion, FechaCreacion, IdUsuarioModificacion, FechaModificacion, IdEstado, IdEtiqueta) 
VALUES ('Boton Modificar', '', '', 7, 1, SYSDATE, NULL, NULL, 1, 'BTNMODIFICAR');

INSERT INTO APL_TB_CATALOGO (Nombre, Adicional, Abreviatura, IdCatalogoTipo, IdUsuarioCreacion, FechaCreacion, IdUsuarioModificacion, FechaModificacion, IdEstado, IdEtiqueta) 
VALUES ('Boton Aprobar', '', '', 7, 1, SYSDATE, NULL, NULL, 1, 'BTNAPROBAR');

INSERT INTO APL_TB_CATALOGO (Nombre, Adicional, Abreviatura, IdCatalogoTipo, IdUsuarioCreacion, FechaCreacion, IdUsuarioModificacion, FechaModificacion, IdEstado, IdEtiqueta) 
VALUES ('Boton Negar', '', '', 7, 1, SYSDATE, NULL, NULL, 1, 'BTNNEGAR');

INSERT INTO APL_TB_CATALOGO (Nombre, Adicional, Abreviatura, IdCatalogoTipo, IdUsuarioCreacion, FechaCreacion, IdUsuarioModificacion, FechaModificacion, IdEstado, IdEtiqueta) 
VALUES ('Boton Inactivar', '', '', 7, 1, SYSDATE, NULL, NULL, 1, 'BTNINACTIVAR');

-- Eventos
INSERT INTO APL_TB_CATALOGO (Nombre, Adicional, Abreviatura, IdCatalogoTipo, IdUsuarioCreacion, FechaCreacion, IdUsuarioModificacion, FechaModificacion, IdEstado, IdEtiqueta) 
VALUES ('Click', '', '', 8, 1, SYSDATE, NULL, NULL, 1, 'EVCLICK');

INSERT INTO APL_TB_CATALOGO (Nombre, Adicional, Abreviatura, IdCatalogoTipo, IdUsuarioCreacion, FechaCreacion, IdUsuarioModificacion, FechaModificacion, IdEstado, IdEtiqueta) 
VALUES ('Doble Click', '', '', 8, 1, SYSDATE, NULL, NULL, 1, 'EVDBLCLICK');

INSERT INTO APL_TB_CATALOGO (Nombre, Adicional, Abreviatura, IdCatalogoTipo, IdUsuarioCreacion, FechaCreacion, IdUsuarioModificacion, FechaModificacion, IdEstado, IdEtiqueta) 
VALUES ('Change', '', '', 8, 1, SYSDATE, NULL, NULL, 1, 'EVCHANGE');

-- Entidades
INSERT INTO APL_TB_CATALOGO (Nombre, Adicional, Abreviatura, IdCatalogoTipo, IdUsuarioCreacion, FechaCreacion, IdUsuarioModificacion, FechaModificacion, IdEstado, IdEtiqueta) 
VALUES ('Fondo', '', '', 9, 1, SYSDATE, NULL, NULL, 1, 'ENTFONDO');

INSERT INTO APL_TB_CATALOGO (Nombre, Adicional, Abreviatura, IdCatalogoTipo, IdUsuarioCreacion, FechaCreacion, IdUsuarioModificacion, FechaModificacion, IdEstado, IdEtiqueta) 
VALUES ('Acuerdo', '', '', 9, 1, SYSDATE, NULL, NULL, 1, 'ENTACUERDO');

INSERT INTO APL_TB_CATALOGO (Nombre, Adicional, Abreviatura, IdCatalogoTipo, IdUsuarioCreacion, FechaCreacion, IdUsuarioModificacion, FechaModificacion, IdEstado, IdEtiqueta) 
VALUES ('Promoción', '', '', 9, 1, SYSDATE, NULL, NULL, 1, 'ENTPROMOCION');

-- Tipo Fondo
INSERT INTO APL_TB_CATALOGO (Nombre, Adicional, Abreviatura, IdCatalogoTipo, IdUsuarioCreacion, FechaCreacion, IdUsuarioModificacion, FechaModificacion, IdEstado, IdEtiqueta) 
VALUES ('Fondo Proveedor', '', '', 10, 1, SYSDATE, NULL, NULL, 1, 'TFPROVEDOR');

INSERT INTO APL_TB_CATALOGO (Nombre, Adicional, Abreviatura, IdCatalogoTipo, IdUsuarioCreacion, FechaCreacion, IdUsuarioModificacion, FechaModificacion, IdEstado, IdEtiqueta) 
VALUES ('Fondo Rebate', '', '', 10, 1, SYSDATE, NULL, NULL, 1, 'TFREBATE');

INSERT INTO APL_TB_CATALOGO (Nombre, Adicional, Abreviatura, IdCatalogoTipo, IdUsuarioCreacion, FechaCreacion, IdUsuarioModificacion, FechaModificacion, IdEstado, IdEtiqueta) 
VALUES ('Fondo Propio', '', '', 10, 1, SYSDATE, NULL, NULL, 1, 'TFPROPIO');

-- Indicador Incremento

INSERT INTO APL_TB_CATALOGO (Nombre, Adicional, Abreviatura, IdCatalogoTipo, IdUsuarioCreacion, FechaCreacion, IdUsuarioModificacion, FechaModificacion, IdEstado, IdEtiqueta) 
VALUES ('Manual', '', '', 11, 1, SYSDATE, NULL, NULL, 1, 'INDCREMANUAL');

INSERT INTO APL_TB_CATALOGO (Nombre, Adicional, Abreviatura, IdCatalogoTipo, IdUsuarioCreacion, FechaCreacion, IdUsuarioModificacion, FechaModificacion, IdEstado, IdEtiqueta) 
VALUES ('Automático', '', '', 11, 1, SYSDATE, NULL, NULL, 1, 'INCREAUTOMATICO');

--Tipo de Proceso 

INSERT INTO APL_TB_CATALOGO (Nombre, Adicional, Abreviatura, IdCatalogoTipo, IdUsuarioCreacion, FechaCreacion, IdUsuarioModificacion, FechaModificacion, IdEstado, IdEtiqueta) 
VALUES ('Creacion', '', '', 12, 1, SYSDATE, NULL, NULL, 1, 'TPCREACION');

INSERT INTO APL_TB_CATALOGO (Nombre, Adicional, Abreviatura, IdCatalogoTipo, IdUsuarioCreacion, FechaCreacion, IdUsuarioModificacion, FechaModificacion, IdEstado, IdEtiqueta) 
VALUES ('Modificacion', '', '', 12, 1, SYSDATE, NULL, NULL, 1, 'TPMODIFICACION');

INSERT INTO APL_TB_CATALOGO (Nombre, Adicional, Abreviatura, IdCatalogoTipo, IdUsuarioCreacion, FechaCreacion, IdUsuarioModificacion, FechaModificacion, IdEstado, IdEtiqueta) 
VALUES ('Aprobacion', '', '', 12, 1, SYSDATE, NULL, NULL, 1, 'TPAPROBACION');

INSERT INTO APL_TB_CATALOGO (Nombre, Adicional, Abreviatura, IdCatalogoTipo, IdUsuarioCreacion, FechaCreacion, IdUsuarioModificacion, FechaModificacion, IdEstado, IdEtiqueta) 
VALUES ('Inactivacion', '', '', 12, 1, SYSDATE, NULL, NULL, 1, 'TPINACTIVACION');