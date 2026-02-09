CREATE TABLE Apl_Tb_PromocionArticuloSegmentoDetalle (
    IdPromocionArticuloSegmentoDetalle  NUMBER(18,0) GENERATED ALWAYS AS IDENTITY (START WITH 1 INCREMENT BY 1 NOCACHE ORDER) NOT NULL,                 
    IdPromocionArticuloSegmento     NUMBER(18,0) NOT NULL,
    Codigo                          VARCHAR2(13) NOT NULL,
    EstadoRegistro                  NUMBER(10) NOT NULL,
    
    -- Primary Key
    CONSTRAINT PK_Apl_Tb_PromocionArticuloSegmentoDetalle PRIMARY KEY (IdPromocionArticuloSegmentoDetalle)
);


ALTER TABLE Apl_Tb_PromocionArticuloSegmentoDetalle
ADD CONSTRAINT FK_PROMOARTSEGDET_PROMOARTSEG 
FOREIGN KEY (IdPromocionArticuloSegmento) 
REFERENCES APL_TB_PROMOCIONARTICULOSEGMENTO (IdPromocionArticuloSegmento);