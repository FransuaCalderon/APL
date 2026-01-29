CREATE TABLE Apl_Tb_PromocionSegmentoDetalle (
    IdPromocionSegmentoDetalle  NUMBER(18,0) GENERATED ALWAYS AS IDENTITY (START WITH 1 INCREMENT BY 1 NOCACHE ORDER) NOT NULL,
    IdPromocionSegmento         NUMBER(18,0) NOT NULL,
    Codigo                      VARCHAR2(13) NOT NULL,
    EstadoRegistro              NUMBER(10)   NOT NULL,
    CONSTRAINT PK_Apl_Tb_PromocionSegmentoDetalle 
        PRIMARY KEY (IdPromocionSegmentoDetalle),
    CONSTRAINT FK_Apl_Tb_PromSegDet_PromSeg 
        FOREIGN KEY (IdPromocionSegmento)
        REFERENCES Apl_Tb_PromocionSegmento (IdPromocionSegmento)
);