CREATE TABLE Apl_Tb_PromocionArticulo (
    IdPromocionArticulo     NUMBER(18,0)    GENERATED ALWAYS AS IDENTITY (START WITH 1 INCREMENT BY 1 NOCACHE ORDER) NOT NULL,
    IdPromocion             NUMBER(18,0)    NOT NULL,
    IdPromocionCombo        NUMBER(18,0)    NOT NULL,
    CodigoItem              VARCHAR2(10)    NOT NULL,
    Descripcion             VARCHAR2(100)   NOT NULL,
    Costo                   NUMBER(18,2)    NOT NULL,
    StockDisponible         NUMBER(10)      NOT NULL,
    InventarioOptimo        NUMBER(10)      NOT NULL,
    ExcedenteUnidad         NUMBER(10)      NOT NULL,
    ExcedenteValor          NUMBER(18,2)    NOT NULL,
    CantidadVendidaPeriodo1 NUMBER(10)      NOT NULL,
    CantidadVendidaPeriodo2 NUMBER(10)      NOT NULL,
    CantidadVendidaPeriodo3 NUMBER(10)      NOT NULL,
    PrecioMinimo            NUMBER(18,2)    NOT NULL,
    UnidadesLimite          NUMBER(10)      NOT NULL,
    UnidadesProyeccionVentas NUMBER(10)     NOT NULL,
    PrecioActual            NUMBER(18,2)    NOT NULL,
    PrecioPromocion         NUMBER(18,2)    NOT NULL,
    DescuentoActual         NUMBER(18,2)    NOT NULL,
    DescuentoPromocion      NUMBER(18,2)    NOT NULL,
    MargenActual            NUMBER(18,2)    NOT NULL,
    MargenPromocion         NUMBER(18,2)    NOT NULL,
    UtilidadActual          NUMBER(18,2)    NOT NULL,
    UtilidadPromocion       NUMBER(18,2)    NOT NULL,
    PorcentajeComision      NUMBER(18,2)    NOT NULL,
    ValorComision           NUMBER(18,2)    NOT NULL,
    EstadoRegistro          NUMBER(10)      NOT NULL,
    
    CONSTRAINT PK_Apl_Tb_PromocionesItems PRIMARY KEY (IdPromocionArticulo)
);

ALTER TABLE Apl_Tb_PromocionArticulo
ADD CONSTRAINT FK_Apl_Tb_PromocItems_Promocion
    FOREIGN KEY (IdPromocion)
    REFERENCES Apl_Tb_Promocion (IdPromocion);
	

-- =============================================
-- Inserción de 10 registros de ejemplo
-- Tabla: Apl_Tb_PromocionArticulo
-- Relacionados con IdPromocion: 1 al 10
-- =============================================

-- Artículo 1: Promoción Navidad 2025 (IdPromocion = 1)
INSERT INTO Apl_Tb_PromocionArticulo (
    IdPromocion, IdPromocionCombo, CodigoItem, Descripcion, Costo, 
    StockDisponible, InventarioOptimo, ExcedenteUnidad, ExcedenteValor,
    CantidadVendidaPeriodo1, CantidadVendidaPeriodo2, CantidadVendidaPeriodo3,
    PrecioMinimo, UnidadesLimite, UnidadesProyeccionVentas,
    PrecioActual, PrecioPromocion, DescuentoActual, DescuentoPromocion,
    MargenActual, MargenPromocion, UtilidadActual, UtilidadPromocion,
    PorcentajeComision, ValorComision, EstadoRegistro
) VALUES (
    1, 0, 'ART001', 'Televisor LED 55 pulgadas Samsung', 450.00,
    150, 80, 70, 31500.00,
    45, 52, 48,
    500.00, 100, 120,
    799.99, 649.99, 0.00, 150.00,
    43.75, 30.77, 349.99, 199.99,
    2.50, 16.25, 1
);

-- Artículo 2: Promoción Navidad 2025 (IdPromocion = 1)
INSERT INTO Apl_Tb_PromocionArticulo (
    IdPromocion, IdPromocionCombo, CodigoItem, Descripcion, Costo, 
    StockDisponible, InventarioOptimo, ExcedenteUnidad, ExcedenteValor,
    CantidadVendidaPeriodo1, CantidadVendidaPeriodo2, CantidadVendidaPeriodo3,
    PrecioMinimo, UnidadesLimite, UnidadesProyeccionVentas,
    PrecioActual, PrecioPromocion, DescuentoActual, DescuentoPromocion,
    MargenActual, MargenPromocion, UtilidadActual, UtilidadPromocion,
    PorcentajeComision, ValorComision, EstadoRegistro
) VALUES (
    1, 0, 'ART002', 'Laptop HP Pavilion 15', 520.00,
    85, 50, 35, 18200.00,
    30, 28, 35,
    580.00, 60, 75,
    899.99, 749.99, 0.00, 150.00,
    42.22, 30.67, 379.99, 229.99,
    3.00, 22.50, 1
);

-- Artículo 3: Liquidación Fin de Año (IdPromocion = 2)
INSERT INTO Apl_Tb_PromocionArticulo (
    IdPromocion, IdPromocionCombo, CodigoItem, Descripcion, Costo, 
    StockDisponible, InventarioOptimo, ExcedenteUnidad, ExcedenteValor,
    CantidadVendidaPeriodo1, CantidadVendidaPeriodo2, CantidadVendidaPeriodo3,
    PrecioMinimo, UnidadesLimite, UnidadesProyeccionVentas,
    PrecioActual, PrecioPromocion, DescuentoActual, DescuentoPromocion,
    MargenActual, MargenPromocion, UtilidadActual, UtilidadPromocion,
    PorcentajeComision, ValorComision, EstadoRegistro
) VALUES (
    2, 0, 'ART003', 'Refrigeradora LG 18 pies', 680.00,
    45, 25, 20, 13600.00,
    12, 15, 10,
    750.00, 30, 40,
    1199.99, 899.99, 0.00, 300.00,
    43.33, 24.44, 519.99, 219.99,
    2.00, 18.00, 1
);

-- Artículo 4: Promoción Año Nuevo 2026 (IdPromocion = 3)
INSERT INTO Apl_Tb_PromocionArticulo (
    IdPromocion, IdPromocionCombo, CodigoItem, Descripcion, Costo, 
    StockDisponible, InventarioOptimo, ExcedenteUnidad, ExcedenteValor,
    CantidadVendidaPeriodo1, CantidadVendidaPeriodo2, CantidadVendidaPeriodo3,
    PrecioMinimo, UnidadesLimite, UnidadesProyeccionVentas,
    PrecioActual, PrecioPromocion, DescuentoActual, DescuentoPromocion,
    MargenActual, MargenPromocion, UtilidadActual, UtilidadPromocion,
    PorcentajeComision, ValorComision, EstadoRegistro
) VALUES (
    3, 1, 'ART004', 'Smartphone iPhone 15 Pro 128GB', 850.00,
    200, 120, 80, 68000.00,
    65, 72, 80,
    920.00, 150, 180,
    1299.99, 1099.99, 0.00, 200.00,
    34.62, 22.73, 449.99, 249.99,
    1.50, 16.50, 1
);

-- Artículo 5: Descuento Electrodomésticos (IdPromocion = 4)
INSERT INTO Apl_Tb_PromocionArticulo (
    IdPromocion, IdPromocionCombo, CodigoItem, Descripcion, Costo, 
    StockDisponible, InventarioOptimo, ExcedenteUnidad, ExcedenteValor,
    CantidadVendidaPeriodo1, CantidadVendidaPeriodo2, CantidadVendidaPeriodo3,
    PrecioMinimo, UnidadesLimite, UnidadesProyeccionVentas,
    PrecioActual, PrecioPromocion, DescuentoActual, DescuentoPromocion,
    MargenActual, MargenPromocion, UtilidadActual, UtilidadPromocion,
    PorcentajeComision, ValorComision, EstadoRegistro
) VALUES (
    4, 0, 'ART005', 'Lavadora Whirlpool 17kg', 380.00,
    60, 40, 20, 7600.00,
    18, 22, 20,
    420.00, 45, 55,
    649.99, 499.99, 0.00, 150.00,
    41.54, 24.00, 269.99, 119.99,
    2.50, 12.50, 1
);

-- Artículo 6: 2x1 en Ropa de Temporada (IdPromocion = 5)
INSERT INTO Apl_Tb_PromocionArticulo (
    IdPromocion, IdPromocionCombo, CodigoItem, Descripcion, Costo, 
    StockDisponible, InventarioOptimo, ExcedenteUnidad, ExcedenteValor,
    CantidadVendidaPeriodo1, CantidadVendidaPeriodo2, CantidadVendidaPeriodo3,
    PrecioMinimo, UnidadesLimite, UnidadesProyeccionVentas,
    PrecioActual, PrecioPromocion, DescuentoActual, DescuentoPromocion,
    MargenActual, MargenPromocion, UtilidadActual, UtilidadPromocion,
    PorcentajeComision, ValorComision, EstadoRegistro
) VALUES (
    5, 2, 'ART006', 'Chaqueta de Invierno North Face', 45.00,
    300, 150, 150, 6750.00,
    85, 90, 78,
    55.00, 200, 250,
    129.99, 64.99, 0.00, 65.00,
    65.38, 30.77, 84.99, 19.99,
    4.00, 2.60, 1
);

-- Artículo 7: Combo Familiar Alimentos (IdPromocion = 6)
INSERT INTO Apl_Tb_PromocionArticulo (
    IdPromocion, IdPromocionCombo, CodigoItem, Descripcion, Costo, 
    StockDisponible, InventarioOptimo, ExcedenteUnidad, ExcedenteValor,
    CantidadVendidaPeriodo1, CantidadVendidaPeriodo2, CantidadVendidaPeriodo3,
    PrecioMinimo, UnidadesLimite, UnidadesProyeccionVentas,
    PrecioActual, PrecioPromocion, DescuentoActual, DescuentoPromocion,
    MargenActual, MargenPromocion, UtilidadActual, UtilidadPromocion,
    PorcentajeComision, ValorComision, EstadoRegistro
) VALUES (
    6, 3, 'ART007', 'Canasta Navideña Premium', 35.00,
    500, 300, 200, 7000.00,
    120, 150, 180,
    42.00, 400, 450,
    79.99, 59.99, 0.00, 20.00,
    56.26, 41.68, 44.99, 24.99,
    3.50, 2.10, 1
);

-- Artículo 8: Black Friday Extendido (IdPromocion = 7)
INSERT INTO Apl_Tb_PromocionArticulo (
    IdPromocion, IdPromocionCombo, CodigoItem, Descripcion, Costo, 
    StockDisponible, InventarioOptimo, ExcedenteUnidad, ExcedenteValor,
    CantidadVendidaPeriodo1, CantidadVendidaPeriodo2, CantidadVendidaPeriodo3,
    PrecioMinimo, UnidadesLimite, UnidadesProyeccionVentas,
    PrecioActual, PrecioPromocion, DescuentoActual, DescuentoPromocion,
    MargenActual, MargenPromocion, UtilidadActual, UtilidadPromocion,
    PorcentajeComision, ValorComision, EstadoRegistro
) VALUES (
    7, 0, 'ART008', 'Consola PlayStation 5', 420.00,
    75, 50, 25, 10500.00,
    40, 38, 45,
    470.00, 60, 80,
    599.99, 499.99, 0.00, 100.00,
    30.00, 16.00, 179.99, 79.99,
    1.00, 5.00, 0
);

-- Artículo 9: Promoción Día de Reyes (IdPromocion = 8)
INSERT INTO Apl_Tb_PromocionArticulo (
    IdPromocion, IdPromocionCombo, CodigoItem, Descripcion, Costo, 
    StockDisponible, InventarioOptimo, ExcedenteUnidad, ExcedenteValor,
    CantidadVendidaPeriodo1, CantidadVendidaPeriodo2, CantidadVendidaPeriodo3,
    PrecioMinimo, UnidadesLimite, UnidadesProyeccionVentas,
    PrecioActual, PrecioPromocion, DescuentoActual, DescuentoPromocion,
    MargenActual, MargenPromocion, UtilidadActual, UtilidadPromocion,
    PorcentajeComision, ValorComision, EstadoRegistro
) VALUES (
    8, 4, 'ART009', 'Bicicleta Infantil Aro 16', 65.00,
    120, 80, 40, 2600.00,
    35, 42, 50,
    75.00, 100, 110,
    149.99, 119.99, 0.00, 30.00,
    56.67, 45.84, 84.99, 54.99,
    2.00, 2.40, 1
);

-- Artículo 10: Ofertas de Inventario (IdPromocion = 10)
INSERT INTO Apl_Tb_PromocionArticulo (
    IdPromocion, IdPromocionCombo, CodigoItem, Descripcion, Costo, 
    StockDisponible, InventarioOptimo, ExcedenteUnidad, ExcedenteValor,
    CantidadVendidaPeriodo1, CantidadVendidaPeriodo2, CantidadVendidaPeriodo3,
    PrecioMinimo, UnidadesLimite, UnidadesProyeccionVentas,
    PrecioActual, PrecioPromocion, DescuentoActual, DescuentoPromocion,
    MargenActual, MargenPromocion, UtilidadActual, UtilidadPromocion,
    PorcentajeComision, ValorComision, EstadoRegistro
) VALUES (
    10, 0, 'ART010', 'Aire Acondicionado Split 12000 BTU', 280.00,
    90, 40, 50, 14000.00,
    25, 30, 22,
    320.00, 70, 85,
    549.99, 399.99, 0.00, 150.00,
    49.09, 30.00, 269.99, 119.99,
    2.50, 10.00, 1
);

-- Confirmar transacción
COMMIT;