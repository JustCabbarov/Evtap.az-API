using System.Reflection;
using System.Text;
using System.Text.Json.Serialization;
using EvTap.Application.Exceptions;
using EvTap.Application.Profiles;
using EvTap.Application.Services;
using EvTap.Contracts.Options;
using EvTap.Contracts.Services;
using EvTap.Domain.Entities;
using EvTap.Domain.Repositories;
using EvTap.Infrastructure.Configurations;
using EvTap.Infrastructure.Services;
using EvTap.Persistence.Data;
using EvTap.Persistence.Repositories;
using EvTap.Presentation.ExceptionHandler;

using EvTap.Presentation.Notifier;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Serilog;
using Serilog.Events;
using Stripe;

var builder = WebApplication.CreateBuilder(args);


//builder.Host.UseSerilog((context, services, configuration) => configuration
//    .ReadFrom.Configuration(context.Configuration)
//    .ReadFrom.Services(services)
//    .Enrich.FromLogContext()
//    .MinimumLevel.Information()
//    .WriteTo.Console()
//    .WriteTo.MongoDB(
//        "mongodb://admin:password@127.0.0.1:27018/LoggingDB?authSource=admin",
//        collectionName: "NewLogs"
//    ));


Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .CreateLogger();


// builder-də Serilog istifadə et
builder.Host.UseSerilog();


// 2. Host-u Serilog ilə əvəz et
builder.Host.UseSerilog();

// DbContexts
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddDbContext<ScrapingDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("ScrapingDb")));

// Quartz jobs
builder.Services.AddHttpClient();
builder.Services.AddQuartzJobs();

// DI container-ə servislərini əlavə et
builder.Services.AddScoped<IScrapingRepository, ScrapingRepository>();
builder.Services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));
builder.Services.AddScoped(typeof(IGenericService<,>), typeof(GenericService<,>));
builder.Services.AddScoped<IUnityOfWork, UnityOfWork>();
builder.Services.AddScoped<IAuthorizationService, AuthorizationService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddExceptionHandler<NotFoundExceptionHandler>();
builder.Services.AddExceptionHandler<NullExceptionHandler>();
builder.Services.AddExceptionHandler<UnauthorizedExceptionHandler>();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddScoped<ITokenHandler, EvTap.Application.Services.TokenHandler>();
builder.Services.AddScoped<IMessageService, MessageService>();
builder.Services.AddScoped<IMessageRepository, MessageRepository>();
builder.Services.AddScoped<IRoleService, RoleService>();
builder.Services.AddScoped<IListingService, ListingService>();
builder.Services.AddScoped<IMessageNotifier, SignalRMessageNotifier>();
builder.Services.AddScoped<IGoogleAuthService, GoogleAuthService>();
builder.Services.AddScoped<IFilterRepository, FilterRepository>();
builder.Services.AddScoped<IPlacesService, PlacesService>();
builder.Services.AddScoped<IFilterService, FilterService>();
builder.Services.AddScoped<IListingRepository, ListingRepository>();
builder.Services.AddScoped<IPaymentService, PaymentService>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
StripeConfiguration.ApiKey = builder.Configuration["Stripe:SecretKey"];



builder.Services.AddHttpContextAccessor();
builder.Services.AddSignalR(); // Bu tekrar değil, SignalR servis kaydıdır.

builder.Services.AddAutoMapper(m =>
{
    m.AddProfile(new CustomProfiles());
});



builder.Services.AddProblemDetails();

// DI
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options =>
{
    options.Password.RequireDigit = true;
    options.Password.RequireUppercase = true;
    options.Password.RequireLowercase = true;
    options.Password.RequireNonAlphanumeric = true;
    options.Password.RequiredLength = 6;
    options.User.RequireUniqueEmail = true;
    options.SignIn.RequireConfirmedEmail = false;
})
.AddEntityFrameworkStores<AppDbContext>()
.AddDefaultTokenProviders();

builder.Services
    .AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
   .AddJwtBearer(options =>
   {
       options.TokenValidationParameters = new TokenValidationParameters
       {
           ValidateIssuer = true,
           ValidateAudience = true,
           ValidateLifetime = true,
           ValidateIssuerSigningKey = true,
           ValidAudience = builder.Configuration["JwtOption:Audience"],
           ValidIssuer = builder.Configuration["JwtOption:Issuer"],
           IssuerSigningKey = new SymmetricSecurityKey(
               Encoding.UTF8.GetBytes(builder.Configuration["JwtOption:Key"]))
       };

       // SignalR için gerekli olan JWT'yi Query String'den alma ayarı
       options.Events = new JwtBearerEvents
       {
           OnMessageReceived = context =>
           {
               var accessToken = context.Request.Query["access_token"];
               var path = context.HttpContext.Request.Path;
               if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/chathub"))
               {
                   context.Token = accessToken;
               }
               return Task.CompletedTask;
           }
       };
   })
    .AddCookie(options =>
    {
        options.Cookie.SameSite = SameSiteMode.Lax;
        options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
    })
   .AddGoogle(GoogleDefaults.AuthenticationScheme, options =>
   {
       options.ClientId = "694161090996-d2ubm0g97o1g9po9a46lf9f7v5bp7otg.apps.googleusercontent.com";
       options.ClientSecret = "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";
       options.CallbackPath = "/api/Authorization/google-response";

       options.SaveTokens = true;
   });
builder.Services.Configure<JwtOption>(builder.Configuration.GetSection("JwtOption"));

builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "EvTap API", Version = "v1" });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "JWT Token (Bearer {token})"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            new string[]{}
        }
    });
});

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowLocalhost",
        policy =>
        {
            {
                
                policy.WithOrigins("http://127.0.0.1:5500", "http://localhost:5500",
                                    "http://127.0.0.1:5505", "http://localhost:5505",
                                    "http://127.0.0.1:5501", "http://localhost:5501",
                                    "https://localhost:7109", "http://localhost:3000")
                     .AllowAnyHeader()
                     .AllowAnyMethod()
                     .AllowCredentials(); 
            }
        });
});

builder.Services.AddSignalR(options =>
{
    options.EnableDetailedErrors = true;
    options.ClientTimeoutInterval = TimeSpan.FromSeconds(30);
    options.KeepAliveInterval = TimeSpan.FromSeconds(15);
});

builder.Services.AddControllers()
    .AddJsonOptions(x =>
        x.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles);


var app = builder.Build();

app.UseCors("AllowLocalhost");

app.UseStaticFiles(); 





app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(
        Path.Combine(Directory.GetCurrentDirectory(), "wwwroot/uploads/listings")),
    RequestPath = "/listing-images"
});

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
else
{
}
    app.UseExceptionHandler();

app.UseHttpsRedirection();

app.UseRouting();

app.UseAuthentication();
app.UseAuthorization();


app.UseEndpoints(endpoints =>
{
    endpoints.MapHub<ChatHub>("/chathub");
    endpoints.MapControllers();
});

app.Run();

Log.CloseAndFlush();