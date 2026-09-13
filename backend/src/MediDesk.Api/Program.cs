using System.Text;
using System.Threading.RateLimiting;
using MediDesk.Api.Services;
using MediDesk.Api.Authorization;
using MediDesk.Business.Interfaces;
using MediDesk.Business.Services;
using MediDesk.Common.Models;
using MediDesk.Common.Options;
using MediDesk.Data;
using MediDesk.Data.Repositories;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddProblemDetails();
builder.Services.AddHttpContextAccessor();
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo { Title = "MediDesk API", Version = "v1" });
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header
    });
    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        [new OpenApiSecurityScheme { Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" } }] = Array.Empty<string>()
    });
});

builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection(JwtOptions.SectionName));
builder.Services.Configure<BootstrapAdminOptions>(builder.Configuration.GetSection(BootstrapAdminOptions.SectionName));
var jwt = builder.Configuration.GetSection(JwtOptions.SectionName).Get<JwtOptions>()
          ?? throw new InvalidOperationException("JWT configuration is missing.");
if (Encoding.UTF8.GetByteCount(jwt.SigningKey) < 32)
    throw new InvalidOperationException("JWT signing key must contain at least 32 bytes.");
if (string.IsNullOrWhiteSpace(jwt.Issuer) || string.IsNullOrWhiteSpace(jwt.Audience))
    throw new InvalidOperationException("JWT issuer and audience are required.");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.MapInboundClaims = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwt.Issuer,
            ValidAudience = jwt.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.SigningKey)),
            ClockSkew = TimeSpan.FromSeconds(30)
        };
    });
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy(PermissionPolicies.MedicinesView, policy => policy.AddRequirements(new PermissionRequirement("medicines", "View")));
    options.AddPolicy(PermissionPolicies.MedicinesAdd, policy => policy.AddRequirements(new PermissionRequirement("medicines", "Add")));
    options.AddPolicy(PermissionPolicies.MedicinesEdit, policy => policy.AddRequirements(new PermissionRequirement("medicines", "Edit")));
    options.AddPolicy(PermissionPolicies.MedicinesDelete, policy => policy.AddRequirements(new PermissionRequirement("medicines", "Delete")));
    options.AddPolicy(PermissionPolicies.InventoryView, policy => policy.AddRequirements(new PermissionRequirement("inventory", "View")));
    options.AddPolicy(PermissionPolicies.InventoryEdit, policy => policy.AddRequirements(new PermissionRequirement("inventory", "Edit")));
    options.AddPolicy(PermissionPolicies.MastersView, policy => policy.AddRequirements(new PermissionRequirement("masters", "View")));
    options.AddPolicy(PermissionPolicies.MastersAdd, policy => policy.AddRequirements(new PermissionRequirement("masters", "Add")));
    options.AddPolicy(PermissionPolicies.MastersEdit, policy => policy.AddRequirements(new PermissionRequirement("masters", "Edit")));
    options.AddPolicy(PermissionPolicies.MastersDelete, policy => policy.AddRequirements(new PermissionRequirement("masters", "Delete")));
    options.AddPolicy(PermissionPolicies.SuppliersView, policy => policy.AddRequirements(new PermissionRequirement("suppliers", "View")));
    options.AddPolicy(PermissionPolicies.SuppliersAdd, policy => policy.AddRequirements(new PermissionRequirement("suppliers", "Add")));
    options.AddPolicy(PermissionPolicies.SuppliersEdit, policy => policy.AddRequirements(new PermissionRequirement("suppliers", "Edit")));
    options.AddPolicy(PermissionPolicies.SuppliersDelete, policy => policy.AddRequirements(new PermissionRequirement("suppliers", "Delete")));
    options.AddPolicy(PermissionPolicies.PurchasesView, policy => policy.AddRequirements(new PermissionRequirement("purchases", "View")));
    options.AddPolicy(PermissionPolicies.PurchasesAdd, policy => policy.AddRequirements(new PermissionRequirement("purchases", "Add")));
    options.AddPolicy(PermissionPolicies.PurchasesDelete, policy => policy.AddRequirements(new PermissionRequirement("purchases", "Delete")));
    options.AddPolicy(PermissionPolicies.SalesView, policy => policy.AddRequirements(new PermissionRequirement("sales", "View")));
    options.AddPolicy(PermissionPolicies.SalesAdd, policy => policy.AddRequirements(new PermissionRequirement("sales", "Add")));
    options.AddPolicy(PermissionPolicies.SalesDelete, policy => policy.AddRequirements(new PermissionRequirement("sales", "Delete")));
    options.AddPolicy(PermissionPolicies.CustomersView, policy => policy.AddRequirements(new PermissionRequirement("customers", "View")));
    options.AddPolicy(PermissionPolicies.CustomersAdd, policy => policy.AddRequirements(new PermissionRequirement("customers", "Add")));
    options.AddPolicy(PermissionPolicies.CustomersEdit, policy => policy.AddRequirements(new PermissionRequirement("customers", "Edit")));
    options.AddPolicy(PermissionPolicies.CustomersDelete, policy => policy.AddRequirements(new PermissionRequirement("customers", "Delete")));
    options.AddPolicy(PermissionPolicies.ReturnsView, policy => policy.AddRequirements(new PermissionRequirement("returns", "View")));
    options.AddPolicy(PermissionPolicies.ReturnsAdd, policy => policy.AddRequirements(new PermissionRequirement("returns", "Add")));
    options.AddPolicy(PermissionPolicies.SchemesView, policy => policy.AddRequirements(new PermissionRequirement("schemes", "View"))); options.AddPolicy(PermissionPolicies.SchemesAdd, policy => policy.AddRequirements(new PermissionRequirement("schemes", "Add"))); options.AddPolicy(PermissionPolicies.SchemesEdit, policy => policy.AddRequirements(new PermissionRequirement("schemes", "Edit"))); options.AddPolicy(PermissionPolicies.SchemesDelete, policy => policy.AddRequirements(new PermissionRequirement("schemes", "Delete")));
});

var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
builder.Services.AddCors(options => options.AddPolicy("frontend", policy =>
    policy.WithOrigins(allowedOrigins).AllowAnyHeader().AllowAnyMethod()));
builder.Services.AddRateLimiter(options => options.AddFixedWindowLimiter("auth", limiter =>
{
    limiter.PermitLimit = 10;
    limiter.Window = TimeSpan.FromMinutes(1);
    limiter.QueueLimit = 0;
    limiter.AutoReplenishment = true;
}));

var connectionString = builder.Configuration.GetConnectionString("MediDesk");
if (string.IsNullOrWhiteSpace(connectionString))
    throw new InvalidOperationException("Database connection string is missing.");
builder.Services.AddSingleton(new SqlConnectionFactory(connectionString));
builder.Services.AddScoped<IAuthRepository, AuthRepository>();
builder.Services.AddScoped<IPermissionRepository, PermissionRepository>();
builder.Services.AddScoped<IMedicineRepository, MedicineRepository>();
builder.Services.AddScoped<IInventoryRepository, InventoryRepository>();
builder.Services.AddScoped<IMedicineMasterRepository, MedicineMasterRepository>();
builder.Services.AddScoped<ISupplierRepository, SupplierRepository>();
builder.Services.AddScoped<IPurchaseRepository, PurchaseRepository>();
builder.Services.AddScoped<ISaleRepository, SaleRepository>();
builder.Services.AddScoped<ICustomerRepository, CustomerRepository>();
builder.Services.AddScoped<IReturnRepository, ReturnRepository>();
builder.Services.AddScoped<ISchemeRepository, SchemeRepository>();
builder.Services.AddScoped<INavigationService, NavigationService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IMedicineService, MedicineService>();
builder.Services.AddScoped<IInventoryService, InventoryService>();
builder.Services.AddScoped<IMedicineMasterService, MedicineMasterService>();
builder.Services.AddScoped<ISupplierService, SupplierService>();
builder.Services.AddScoped<IPurchaseService, PurchaseService>();
builder.Services.AddScoped<ISaleService, SaleService>();
builder.Services.AddScoped<ICustomerService, CustomerService>();
builder.Services.AddScoped<IReturnService, ReturnService>();
builder.Services.AddScoped<ISchemeService, SchemeService>();
builder.Services.AddScoped<IPasswordHasher<UserRecord>, PasswordHasher<UserRecord>>();
builder.Services.AddScoped<IAuthorizationHandler, PermissionAuthorizationHandler>();
builder.Services.AddHostedService<BootstrapAdminService>();

var app = builder.Build();
app.UseExceptionHandler();
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
app.UseHttpsRedirection();
app.UseCors("frontend");
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();

public partial class Program { }

