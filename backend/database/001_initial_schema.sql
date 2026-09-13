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
