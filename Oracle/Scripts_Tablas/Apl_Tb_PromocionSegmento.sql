CREATE TABLE Apl_Tb_PromocionSegmento (
    IdPromocionSegmento     NUMBER(18,0) GENERATED ALWAYS AS IDENTITY (START WITH 1 INCREMENT BY 1 NOCACHE ORDER) NOT NULL,
    IdPromocion             NUMBER(18,0) NOT NULL,
    IdTipoSegmento          VARCHAR2(10) NOT NULL,
	TipoAsignacion          CHAR(1)      NOT NULL,
    EstadoRegistro          NUMBER(10)   NOT NULL,
    CONSTRAINT PK_Apl_Tb_PromocionSegmento 
        PRIMARY KEY (IdPromocionSegmento),
    CONSTRAINT FK_Apl_Tb_PromSegmento_Promo 
        FOREIGN KEY (IdPromocion)
        REFERENCES Apl_Tb_Promocion (IdPromocion)
);
