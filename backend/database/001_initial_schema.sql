SET XACT_ABORT ON;
BEGIN TRANSACTION;

IF OBJECT_ID('dbo.Roles', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Roles (
        Id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Roles PRIMARY KEY,
        Name NVARCHAR(80) NOT NULL CONSTRAINT UQ_Roles_Name UNIQUE,
        IsSystem BIT NOT NULL CONSTRAINT DF_Roles_IsSystem DEFAULT (0),
        CreatedAtUtc DATETIME2 NOT NULL CONSTRAINT DF_Roles_Created DEFAULT (SYSUTCDATETIME())
    );
END;

IF OBJECT_ID('dbo.Modules', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Modules (
        Id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Modules PRIMARY KEY,
        [Key] NVARCHAR(80) NOT NULL CONSTRAINT UQ_Modules_Key UNIQUE,
        Label NVARCHAR(100) NOT NULL,
        Icon NVARCHAR(50) NOT NULL,
        GroupName NVARCHAR(80) NOT NULL,
        SortOrder INT NOT NULL,
        IsActive BIT NOT NULL CONSTRAINT DF_Modules_IsActive DEFAULT (1)
    );
END;

IF OBJECT_ID('dbo.Permissions', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Permissions (
        Id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Permissions PRIMARY KEY,
        ModuleId INT NOT NULL,
        Permission NVARCHAR(20) NOT NULL,
        CONSTRAINT FK_Permissions_Modules FOREIGN KEY (ModuleId) REFERENCES dbo.Modules(Id),
        CONSTRAINT UQ_Permissions_ModulePermission UNIQUE (ModuleId, Permission)
    );
END;

IF OBJECT_ID('dbo.RolePermissions', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.RolePermissions (
        RoleId INT NOT NULL,
        PermissionId INT NOT NULL,
        CONSTRAINT PK_RolePermissions PRIMARY KEY (RoleId, PermissionId),
        CONSTRAINT FK_RolePermissions_Roles FOREIGN KEY (RoleId) REFERENCES dbo.Roles(Id),
        CONSTRAINT FK_RolePermissions_Permissions FOREIGN KEY (PermissionId) REFERENCES dbo.Permissions(Id)
    );
END;

IF OBJECT_ID('dbo.Users', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Users (
        Id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Users PRIMARY KEY,
        FullName NVARCHAR(100) NOT NULL,
        Email NVARCHAR(256) NOT NULL CONSTRAINT UQ_Users_Email UNIQUE,
        PasswordHash NVARCHAR(500) NOT NULL,
        RoleId INT NOT NULL,
        IsActive BIT NOT NULL CONSTRAINT DF_Users_IsActive DEFAULT (1),
        CreatedAtUtc DATETIME2 NOT NULL CONSTRAINT DF_Users_Created DEFAULT (SYSUTCDATETIME()),
        UpdatedAtUtc DATETIME2 NULL,
        CONSTRAINT FK_Users_Roles FOREIGN KEY (RoleId) REFERENCES dbo.Roles(Id)
    );
END;

IF OBJECT_ID('dbo.Medicines', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Medicines (
        Id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Medicines PRIMARY KEY,
        Name NVARCHAR(160) NOT NULL,
        GenericName NVARCHAR(160) NOT NULL,
        Category NVARCHAR(80) NOT NULL,
        Manufacturer NVARCHAR(160) NOT NULL CONSTRAINT DF_Medicines_Manufacturer DEFAULT (''),
        DosageForm NVARCHAR(40) NOT NULL CONSTRAINT DF_Medicines_DosageForm DEFAULT (''),
        Strength NVARCHAR(40) NOT NULL CONSTRAINT DF_Medicines_Strength DEFAULT (''),
        BatchNumber NVARCHAR(80) NOT NULL,
        ExpiryDate DATE NOT NULL,
        PurchasePrice DECIMAL(18,2) NOT NULL,
        SalePrice DECIMAL(18,2) NOT NULL,
        Stock INT NOT NULL,
        MinimumStock INT NOT NULL,
        GstRate DECIMAL(5,2) NOT NULL,
        RackNumber NVARCHAR(40) NOT NULL CONSTRAINT DF_Medicines_Rack DEFAULT (''),
        IsDeleted BIT NOT NULL CONSTRAINT DF_Medicines_IsDeleted DEFAULT (0),
        CreatedByUserId BIGINT NOT NULL,
        CreatedAtUtc DATETIME2 NOT NULL CONSTRAINT DF_Medicines_Created DEFAULT (SYSUTCDATETIME()),
        UpdatedByUserId BIGINT NULL,
        UpdatedAtUtc DATETIME2 NULL,
        RowVersion ROWVERSION NOT NULL,
        CONSTRAINT FK_Medicines_CreatedBy FOREIGN KEY (CreatedByUserId) REFERENCES dbo.Users(Id),
        CONSTRAINT FK_Medicines_UpdatedBy FOREIGN KEY (UpdatedByUserId) REFERENCES dbo.Users(Id),
        CONSTRAINT CK_Medicines_Prices CHECK (PurchasePrice >= 0 AND SalePrice >= PurchasePrice),
        CONSTRAINT CK_Medicines_Stock CHECK (Stock >= 0 AND MinimumStock >= 0),
        CONSTRAINT CK_Medicines_Gst CHECK (GstRate >= 0 AND GstRate <= 100)
    );
    CREATE UNIQUE INDEX UX_Medicines_Batch_Active ON dbo.Medicines(BatchNumber) WHERE IsDeleted=0;
    CREATE INDEX IX_Medicines_Search ON dbo.Medicines(Name, GenericName) INCLUDE (Category, Stock, MinimumStock, ExpiryDate) WHERE IsDeleted=0;
END;

IF OBJECT_ID('dbo.InventoryMovements', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.InventoryMovements (
        Id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_InventoryMovements PRIMARY KEY,
        MedicineId BIGINT NOT NULL,
        MovementType NVARCHAR(40) NOT NULL,
        QuantityChange INT NOT NULL,
        PreviousStock INT NOT NULL,
        NewStock INT NOT NULL,
        Reason NVARCHAR(300) NOT NULL,
        ReferenceNumber NVARCHAR(80) NULL,
        CreatedByUserId BIGINT NOT NULL,
        CreatedAtUtc DATETIME2 NOT NULL CONSTRAINT DF_InventoryMovements_Created DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT FK_InventoryMovements_Medicines FOREIGN KEY (MedicineId) REFERENCES dbo.Medicines(Id),
        CONSTRAINT FK_InventoryMovements_Users FOREIGN KEY (CreatedByUserId) REFERENCES dbo.Users(Id),
        CONSTRAINT CK_InventoryMovements_Change CHECK (QuantityChange <> 0),
        CONSTRAINT CK_InventoryMovements_Stock CHECK (PreviousStock >= 0 AND NewStock >= 0)
    );
    CREATE INDEX IX_InventoryMovements_MedicineDate ON dbo.InventoryMovements(MedicineId, CreatedAtUtc DESC);
END;

IF OBJECT_ID('dbo.MedicineMasters', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.MedicineMasters (
        Id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_MedicineMasters PRIMARY KEY,
        MasterType NVARCHAR(30) NOT NULL,
        Name NVARCHAR(160) NOT NULL,
        Description NVARCHAR(300) NULL,
        IsActive BIT NOT NULL CONSTRAINT DF_MedicineMasters_IsActive DEFAULT (1),
        IsDeleted BIT NOT NULL CONSTRAINT DF_MedicineMasters_IsDeleted DEFAULT (0),
        CreatedByUserId BIGINT NOT NULL,
        CreatedAtUtc DATETIME2 NOT NULL CONSTRAINT DF_MedicineMasters_Created DEFAULT (SYSUTCDATETIME()),
        UpdatedByUserId BIGINT NULL,
        UpdatedAtUtc DATETIME2 NULL,
        RowVersion ROWVERSION NOT NULL,
        CONSTRAINT FK_MedicineMasters_CreatedBy FOREIGN KEY (CreatedByUserId) REFERENCES dbo.Users(Id),
        CONSTRAINT FK_MedicineMasters_UpdatedBy FOREIGN KEY (UpdatedByUserId) REFERENCES dbo.Users(Id),
        CONSTRAINT CK_MedicineMasters_Type CHECK (MasterType IN ('Category','Manufacturer','Generic'))
    );
    CREATE UNIQUE INDEX UX_MedicineMasters_TypeName_Active ON dbo.MedicineMasters(MasterType, Name) WHERE IsDeleted=0;
    CREATE INDEX IX_MedicineMasters_TypeActive ON dbo.MedicineMasters(MasterType, IsActive) INCLUDE (Name) WHERE IsDeleted=0;
END;

IF OBJECT_ID('dbo.Suppliers', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Suppliers (
        Id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Suppliers PRIMARY KEY,
        BusinessName NVARCHAR(160) NOT NULL,
        ContactPerson NVARCHAR(120) NOT NULL,
        Phone NVARCHAR(18) NOT NULL,
        Email NVARCHAR(256) NULL,
        Gstin NVARCHAR(15) NULL,
        DrugLicenseNumber NVARCHAR(80) NULL,
        Address NVARCHAR(300) NULL,
        City NVARCHAR(100) NOT NULL,
        State NVARCHAR(100) NOT NULL,
        PostalCode NVARCHAR(6) NULL,
        OutstandingBalance DECIMAL(18,2) NOT NULL CONSTRAINT DF_Suppliers_Balance DEFAULT (0),
        IsActive BIT NOT NULL CONSTRAINT DF_Suppliers_IsActive DEFAULT (1),
        IsDeleted BIT NOT NULL CONSTRAINT DF_Suppliers_IsDeleted DEFAULT (0),
        CreatedByUserId BIGINT NOT NULL,
        CreatedAtUtc DATETIME2 NOT NULL CONSTRAINT DF_Suppliers_Created DEFAULT (SYSUTCDATETIME()),
        UpdatedByUserId BIGINT NULL,
        UpdatedAtUtc DATETIME2 NULL,
        RowVersion ROWVERSION NOT NULL,
        CONSTRAINT FK_Suppliers_CreatedBy FOREIGN KEY (CreatedByUserId) REFERENCES dbo.Users(Id),
        CONSTRAINT FK_Suppliers_UpdatedBy FOREIGN KEY (UpdatedByUserId) REFERENCES dbo.Users(Id),
        CONSTRAINT CK_Suppliers_Balance CHECK (OutstandingBalance >= 0)
    );
    CREATE UNIQUE INDEX UX_Suppliers_Name_Active ON dbo.Suppliers(BusinessName) WHERE IsDeleted=0;
    CREATE UNIQUE INDEX UX_Suppliers_Gstin_Active ON dbo.Suppliers(Gstin) WHERE Gstin IS NOT NULL AND IsDeleted=0;
    CREATE INDEX IX_Suppliers_Search ON dbo.Suppliers(BusinessName, ContactPerson, City) INCLUDE (Phone, OutstandingBalance, IsActive) WHERE IsDeleted=0;
END;

IF OBJECT_ID('dbo.Purchases', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Purchases (
        Id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Purchases PRIMARY KEY,
        SupplierId BIGINT NOT NULL,
        SupplierInvoiceNumber NVARCHAR(80) NOT NULL,
        InvoiceDate DATE NOT NULL,
        Subtotal DECIMAL(18,2) NOT NULL,
        DiscountTotal DECIMAL(18,2) NOT NULL,
        TaxTotal DECIMAL(18,2) NOT NULL,
        GrandTotal DECIMAL(18,2) NOT NULL,
        AmountPaid DECIMAL(18,2) NOT NULL,
        AmountDue DECIMAL(18,2) NOT NULL,
        PaymentMethod NVARCHAR(20) NOT NULL,
        PaymentStatus NVARCHAR(20) NOT NULL,
        Status NVARCHAR(20) NOT NULL CONSTRAINT DF_Purchases_Status DEFAULT ('Received'),
        Notes NVARCHAR(500) NULL,
        IsDeleted BIT NOT NULL CONSTRAINT DF_Purchases_IsDeleted DEFAULT (0),
        CreatedByUserId BIGINT NOT NULL,
        CreatedAtUtc DATETIME2 NOT NULL CONSTRAINT DF_Purchases_Created DEFAULT (SYSUTCDATETIME()),
        UpdatedByUserId BIGINT NULL,
        UpdatedAtUtc DATETIME2 NULL,
        CancelledByUserId BIGINT NULL,
        CancelledAtUtc DATETIME2 NULL,
        RowVersion ROWVERSION NOT NULL,
        CONSTRAINT FK_Purchases_Suppliers FOREIGN KEY (SupplierId) REFERENCES dbo.Suppliers(Id),
        CONSTRAINT FK_Purchases_CreatedBy FOREIGN KEY (CreatedByUserId) REFERENCES dbo.Users(Id),
        CONSTRAINT FK_Purchases_UpdatedBy FOREIGN KEY (UpdatedByUserId) REFERENCES dbo.Users(Id),
        CONSTRAINT FK_Purchases_CancelledBy FOREIGN KEY (CancelledByUserId) REFERENCES dbo.Users(Id),
        CONSTRAINT CK_Purchases_Amounts CHECK (Subtotal >= 0 AND DiscountTotal >= 0 AND TaxTotal >= 0 AND GrandTotal >= 0 AND AmountPaid >= 0 AND AmountDue >= 0 AND AmountPaid + AmountDue = GrandTotal),
        CONSTRAINT CK_Purchases_PaymentMethod CHECK (PaymentMethod IN ('Cash','Bank','UPI','Credit')),
        CONSTRAINT CK_Purchases_PaymentStatus CHECK (PaymentStatus IN ('Paid','Part paid','Credit')),
        CONSTRAINT CK_Purchases_Status CHECK (Status IN ('Received','Cancelled'))
    );
    CREATE UNIQUE INDEX UX_Purchases_SupplierInvoice_Active ON dbo.Purchases(SupplierId, SupplierInvoiceNumber) WHERE IsDeleted=0;
    CREATE INDEX IX_Purchases_Date ON dbo.Purchases(InvoiceDate DESC, Id DESC) INCLUDE (SupplierId, GrandTotal, PaymentStatus) WHERE IsDeleted=0;
END;

IF OBJECT_ID('dbo.PurchaseItems', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.PurchaseItems (
        Id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_PurchaseItems PRIMARY KEY,
        PurchaseId BIGINT NOT NULL,
        MedicineId BIGINT NOT NULL,
        MedicineName NVARCHAR(160) NOT NULL,
        BatchNumber NVARCHAR(80) NOT NULL,
        ExpiryDate DATE NOT NULL,
        Quantity INT NOT NULL,
        Rate DECIMAL(18,2) NOT NULL,
        GstRate DECIMAL(5,2) NOT NULL,
        DiscountAmount DECIMAL(18,2) NOT NULL CONSTRAINT DF_PurchaseItems_Discount DEFAULT (0),
        TaxAmount DECIMAL(18,2) NOT NULL,
        LineTotal DECIMAL(18,2) NOT NULL,
        IsDeleted BIT NOT NULL CONSTRAINT DF_PurchaseItems_IsDeleted DEFAULT (0),
        CONSTRAINT FK_PurchaseItems_Purchases FOREIGN KEY (PurchaseId) REFERENCES dbo.Purchases(Id),
        CONSTRAINT FK_PurchaseItems_Medicines FOREIGN KEY (MedicineId) REFERENCES dbo.Medicines(Id),
        CONSTRAINT CK_PurchaseItems_Values CHECK (Quantity > 0 AND Rate >= 0 AND GstRate >= 0 AND GstRate <= 100 AND DiscountAmount >= 0 AND TaxAmount >= 0 AND LineTotal >= 0)
    );
    CREATE UNIQUE INDEX UX_PurchaseItems_PurchaseMedicine_Active ON dbo.PurchaseItems(PurchaseId, MedicineId) WHERE IsDeleted=0;
    CREATE INDEX IX_PurchaseItems_Medicine ON dbo.PurchaseItems(MedicineId, PurchaseId) WHERE IsDeleted=0;
END;

IF OBJECT_ID('dbo.Sales', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Sales (
        Id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Sales PRIMARY KEY,
        CustomerName NVARCHAR(160) NULL,
        CustomerPhone NVARCHAR(18) NULL,
        GrossAmount DECIMAL(18,2) NOT NULL,
        DiscountTotal DECIMAL(18,2) NOT NULL,
        TaxableAmount DECIMAL(18,2) NOT NULL,
        TaxTotal DECIMAL(18,2) NOT NULL,
        GrandTotal DECIMAL(18,2) NOT NULL,
        AmountReceived DECIMAL(18,2) NOT NULL,
        AmountDue DECIMAL(18,2) NOT NULL,
        ChangeAmount DECIMAL(18,2) NOT NULL,
        PaymentMethod NVARCHAR(20) NOT NULL,
        PaymentStatus NVARCHAR(20) NOT NULL,
        Status NVARCHAR(20) NOT NULL CONSTRAINT DF_Sales_Status DEFAULT ('Completed'),
        Notes NVARCHAR(500) NULL,
        IsDeleted BIT NOT NULL CONSTRAINT DF_Sales_IsDeleted DEFAULT (0),
        CreatedByUserId BIGINT NOT NULL,
        CreatedAtUtc DATETIME2 NOT NULL CONSTRAINT DF_Sales_Created DEFAULT (SYSUTCDATETIME()),
        UpdatedByUserId BIGINT NULL,
        UpdatedAtUtc DATETIME2 NULL,
        CancelledByUserId BIGINT NULL,
        CancelledAtUtc DATETIME2 NULL,
        RowVersion ROWVERSION NOT NULL,
        CONSTRAINT FK_Sales_CreatedBy FOREIGN KEY (CreatedByUserId) REFERENCES dbo.Users(Id),
        CONSTRAINT FK_Sales_UpdatedBy FOREIGN KEY (UpdatedByUserId) REFERENCES dbo.Users(Id),
        CONSTRAINT FK_Sales_CancelledBy FOREIGN KEY (CancelledByUserId) REFERENCES dbo.Users(Id),
        CONSTRAINT CK_Sales_Amounts CHECK (GrossAmount >= 0 AND DiscountTotal >= 0 AND TaxableAmount >= 0 AND TaxTotal >= 0 AND GrandTotal >= 0 AND AmountReceived >= 0 AND AmountDue >= 0 AND ChangeAmount >= 0 AND GrossAmount - DiscountTotal = GrandTotal AND TaxableAmount + TaxTotal = GrandTotal),
        CONSTRAINT CK_Sales_Settlement CHECK ((PaymentStatus='Credit' AND AmountReceived=0 AND AmountDue=GrandTotal AND ChangeAmount=0) OR (PaymentStatus='Paid' AND AmountDue=0 AND AmountReceived=GrandTotal+ChangeAmount)),
        CONSTRAINT CK_Sales_PaymentMethod CHECK (PaymentMethod IN ('Cash','UPI','Card','Credit')),
        CONSTRAINT CK_Sales_PaymentStatus CHECK (PaymentStatus IN ('Paid','Credit')),
        CONSTRAINT CK_Sales_Status CHECK (Status IN ('Completed','Cancelled'))
    );
    CREATE INDEX IX_Sales_Date ON dbo.Sales(CreatedAtUtc DESC, Id DESC) INCLUDE (CustomerName, GrandTotal, PaymentMethod) WHERE IsDeleted=0;
    CREATE INDEX IX_Sales_CustomerPhone ON dbo.Sales(CustomerPhone, CreatedAtUtc DESC) WHERE CustomerPhone IS NOT NULL AND IsDeleted=0;
END;

IF OBJECT_ID('dbo.SaleItems', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.SaleItems (
        Id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_SaleItems PRIMARY KEY,
        SaleId BIGINT NOT NULL,
        MedicineId BIGINT NOT NULL,
        MedicineName NVARCHAR(160) NOT NULL,
        GenericName NVARCHAR(160) NOT NULL,
        BatchNumber NVARCHAR(80) NOT NULL,
        ExpiryDate DATE NOT NULL,
        Quantity INT NOT NULL,
        UnitPrice DECIMAL(18,2) NOT NULL,
        GstRate DECIMAL(5,2) NOT NULL,
        DiscountAmount DECIMAL(18,2) NOT NULL CONSTRAINT DF_SaleItems_Discount DEFAULT (0),
        TaxableAmount DECIMAL(18,2) NOT NULL,
        TaxAmount DECIMAL(18,2) NOT NULL,
        LineTotal DECIMAL(18,2) NOT NULL,
        IsDeleted BIT NOT NULL CONSTRAINT DF_SaleItems_IsDeleted DEFAULT (0),
        CONSTRAINT FK_SaleItems_Sales FOREIGN KEY (SaleId) REFERENCES dbo.Sales(Id),
        CONSTRAINT FK_SaleItems_Medicines FOREIGN KEY (MedicineId) REFERENCES dbo.Medicines(Id),
        CONSTRAINT CK_SaleItems_Values CHECK (Quantity > 0 AND UnitPrice >= 0 AND GstRate >= 0 AND GstRate <= 100 AND DiscountAmount >= 0 AND TaxableAmount >= 0 AND TaxAmount >= 0 AND LineTotal >= 0)
    );
    CREATE UNIQUE INDEX UX_SaleItems_SaleMedicine_Active ON dbo.SaleItems(SaleId, MedicineId) WHERE IsDeleted=0;
    CREATE INDEX IX_SaleItems_Medicine ON dbo.SaleItems(MedicineId, SaleId) WHERE IsDeleted=0;
END;

MERGE dbo.Roles AS target
USING (VALUES
    ('Administrator', 1), ('Billing Operator', 1),
    ('Inventory Manager', 1), ('Accountant', 1)
) AS source(Name, IsSystem)
ON target.Name = source.Name
WHEN NOT MATCHED THEN INSERT (Name, IsSystem) VALUES (source.Name, source.IsSystem);

MERGE dbo.Modules AS target
USING (VALUES
    ('dashboard','Dashboard','dashboard','Overview',10),
    ('medicines','Medicines','pill','Catalog',20),
    ('inventory','Inventory','box','Catalog',30),
    ('masters','Masters','layers','Catalog',40),
    ('purchases','Purchases','cart','Operations',50),
    ('sales','Sales & Billing','receipt','Operations',60),
    ('returns','Returns','return','Operations',70),
    ('suppliers','Suppliers','truck','Partners',80),
    ('customers','Customers','users','Partners',90),
    ('accounts','Accounts','chart','Finance',100),
    ('schemes','Schemes','receipt','Finance',110),
    ('reports','Reports','chart','Finance',120),
    ('compliance','GST & Compliance','check','Finance',130),
    ('stores','Stores','store','Administration',140),
    ('users','Users & Roles','users','Administration',150),
    ('data-tools','Data & Backup','download','Administration',160),
    ('settings','Settings','settings','Administration',170)
) AS source([Key], Label, Icon, GroupName, SortOrder)
ON target.[Key] = source.[Key]
WHEN MATCHED THEN UPDATE SET Label=source.Label, Icon=source.Icon, GroupName=source.GroupName, SortOrder=source.SortOrder
WHEN NOT MATCHED THEN INSERT ([Key],Label,Icon,GroupName,SortOrder) VALUES (source.[Key],source.Label,source.Icon,source.GroupName,source.SortOrder);

INSERT INTO dbo.Permissions (ModuleId, Permission)
SELECT m.Id, p.Permission
FROM dbo.Modules m
CROSS JOIN (VALUES ('View'),('Add'),('Edit'),('Delete')) p(Permission)
WHERE NOT EXISTS (SELECT 1 FROM dbo.Permissions currentPermission WHERE currentPermission.ModuleId=m.Id AND currentPermission.Permission=p.Permission);

INSERT INTO dbo.RolePermissions (RoleId, PermissionId)
SELECT r.Id, p.Id FROM dbo.Roles r CROSS JOIN dbo.Permissions p
WHERE r.Name='Administrator' AND NOT EXISTS (
    SELECT 1 FROM dbo.RolePermissions rp WHERE rp.RoleId=r.Id AND rp.PermissionId=p.Id);

INSERT INTO dbo.RolePermissions (RoleId, PermissionId)
SELECT r.Id, p.Id
FROM dbo.Roles r JOIN dbo.Modules m ON 1=1 JOIN dbo.Permissions p ON p.ModuleId=m.Id
WHERE (
       (r.Name='Billing Operator' AND m.[Key] IN ('dashboard','sales','returns','customers','settings'))
    OR (r.Name='Inventory Manager' AND m.[Key] IN ('dashboard','medicines','inventory','masters','purchases','returns','suppliers','settings'))
    OR (r.Name='Accountant' AND m.[Key] IN ('dashboard','accounts','reports','compliance','settings'))
)
AND NOT EXISTS (SELECT 1 FROM dbo.RolePermissions rp WHERE rp.RoleId=r.Id AND rp.PermissionId=p.Id);

COMMIT TRANSACTION;
