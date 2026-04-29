--new 
CREATE TABLE Apl_Tb_PromocionArticuloComponenteAcuerdo (
    IdPromocionArticuloComponenteAcuerdo   NUMBER(18,0)    GENERATED ALWAYS AS IDENTITY (START WITH 1 INCREMENT BY 1 NOCACHE ORDER),
    IdPromocionArticuloComponente          NUMBER(18,0)    NOT NULL,
    IdAcuerdo                              NUMBER(18,0)    NOT NULL,
    ValorAporte                            NUMBER(18,2)    DEFAULT 0,
    ValorComprometido                      NUMBER(18,2)    DEFAULT 0,
	ValorDisponible                        NUMBER(18,2)    NOT NULL,
    ValorLiquidado                         NUMBER(18,2)    DEFAULT 0,
    EstadoRegistro                         NUMBER(10,0)    DEFAULT 1 NOT NULL,

    -- CONSTRAINT: LLAVE PRIMARIA
    CONSTRAINT PK_PromoArtCompAcuerdo
        PRIMARY KEY (IdPromocionArticuloComponenteAcuerdo),

    -- CONSTRAINT: FK -> Apl_Tb_PromocionArticuloComponente
    CONSTRAINT FK_PromoArtCompAcuerdo_Comp
        FOREIGN KEY (IdPromocionArticuloComponente)
        REFERENCES Apl_Tb_PromocionArticuloComponente (IdPromocionArticuloComponente)
        ON DELETE CASCADE,

    -- CONSTRAINT: FK -> Apl_Tb_Acuerdo
    CONSTRAINT FK_PromoArtCompAcuerdo_Acuerdo
        FOREIGN KEY (IdAcuerdo)
        REFERENCES Apl_Tb_Acuerdo (IdAcuerdo)
        ON DELETE CASCADE
);





---old 
CREATE TABLE Apl_Tb_PromocionArticuloComponenteAcuerdo (
    IdPromocionArticuloComponenteAcuerdo   NUMBER(18,0)    GENERATED ALWAYS AS IDENTITY (START WITH 1 INCREMENT BY 1 NOCACHE ORDER),
    IdPromocionArticuloComponente          NUMBER(18,0)    NOT NULL,
    IdPromocionAcuerdo                     NUMBER(18,0)    NOT NULL,
    ValorAporte                            NUMBER(18,2)    DEFAULT 0,
    ValorComprometido                      NUMBER(18,2)    DEFAULT 0,
	ValorDisponible                        NUMBER(18,2)    NOT NULL,
    ValorLiquidado                         NUMBER(18,2)    DEFAULT 0,
    EstadoRegistro                         NUMBER(10,0)    DEFAULT 1 NOT NULL,

    -- CONSTRAINT: LLAVE PRIMARIA
    CONSTRAINT PK_PromoArtCompAcuerdo
        PRIMARY KEY (IdPromocionArticuloComponenteAcuerdo),

    -- CONSTRAINT: FK -> Apl_Tb_PromocionArticuloComponente
    CONSTRAINT FK_PromoArtCompAcuerdo_Comp
        FOREIGN KEY (IdPromocionArticuloComponente)
        REFERENCES Apl_Tb_PromocionArticuloComponente (IdPromocionArticuloComponente)
        ON DELETE CASCADE,

    -- CONSTRAINT: FK -> Apl_Tb_PromocionAcuerdo
    CONSTRAINT FK_PromoArtCompAcuerdo_Acuerdo
        FOREIGN KEY (IdPromocionAcuerdo)
        REFERENCES Apl_Tb_PromocionAcuerdo (IdPromocionAcuerdo)
        ON DELETE CASCADE
);

-- ÍNDICES
CREATE INDEX IDX_PromoArtCompAcuerdo_Comp
    ON Apl_Tb_PromocionArticuloComponenteAcuerdo (IdPromocionArticuloComponente);

CREATE INDEX IDX_PromoArtCompAcuerdo_Acuerdo
    ON Apl_Tb_PromocionArticuloComponenteAcuerdo (IdPromocionAcuerdo);
	
