namespace EvTap.Application.Services
{
    using EvTap.Contracts.Services;
    using EvTap.Domain.Entities;
    using Microsoft.AspNetCore.Authentication;
    using Microsoft.AspNetCore.Authentication.Google;
    using Microsoft.AspNetCore.Http;
    using Microsoft.AspNetCore.Identity;
    using Microsoft.Extensions.Logging;


    public class GoogleAuthService : IGoogleAuthService
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ITokenHandler _jwtService;
        private readonly ILogger<GoogleAuthService> _logger;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public GoogleAuthService(UserManager<ApplicationUser> userManager,
                                 ITokenHandler jwtService,
                                 ILogger<GoogleAuthService> logger,
                                 IHttpContextAccessor httpContextAccessor)
        {
            _userManager = userManager;
            _jwtService = jwtService;
            _logger = logger;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<string> HandleGoogleLoginAsync()
        {
            var httpContext = _httpContextAccessor.HttpContext;

            var result = await httpContext.AuthenticateAsync(GoogleDefaults.AuthenticationScheme);

            if (!result.Succeeded || result.Principal == null)
                throw new Exception("Google authentication failed.");

            var claims = result.Principal.Identities.FirstOrDefault()?.Claims;
            var email = claims?.FirstOrDefault(c => c.Type.Contains("email"))?.Value;
            var name = claims?.FirstOrDefault(c => c.Type.Contains("name"))?.Value ?? "GoogleUser";

            if (string.IsNullOrEmpty(email))
                throw new Exception("Google email tapılmadı.");


            return await GoogleSignInAsync(email, name);
        }

        private async Task<string> GoogleSignInAsync(string email, string fullName)
        {
            var user = await _userManager.FindByEmailAsync(email);

            if (user == null)
            {
                user = new ApplicationUser
                {
                    UserName = email.Split("@")[0],
                    Email = email,
                    EmailConfirmed = true,

                };

                var result = await _userManager.CreateAsync(user);
                if (!result.Succeeded)
                    throw new Exception("Google ilə qeydiyyat uğursuz oldu: " +
                                        string.Join(", ", result.Errors.Select(e => e.Description)));

                await _userManager.AddToRoleAsync(user, "User");
                _logger.LogInformation($"Yeni Google istifadəçisi yaradıldı: {user.Email}");
            }
            else
            {
                _logger.LogInformation($"Google ilə login oldu: {user.Email}");
            }

            return await _jwtService.CreateAccessTokenAsync(user);
        }
    }

}