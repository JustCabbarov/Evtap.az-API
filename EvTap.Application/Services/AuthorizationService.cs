using System;
using System.Text;
using System.Threading.Tasks;
using EvTap.Application.Exceptions;
using EvTap.Contracts.DTOs;
using EvTap.Contracts.Services;
using EvTap.Domain.Entities;
using EvTap.Domain.Repositories;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Logging;

namespace EvTap.Application.Services
{
    public class AuthorizationService : IAuthorizationService
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly IEmailService _emailService;
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly ILogger<AuthorizationService> _logger;
        private readonly ITokenHandler _tokenHandler;
        private readonly IUserRepository _userRepository;



        public AuthorizationService(
            UserManager<ApplicationUser> userManager,
            SignInManager<ApplicationUser> signInManager,
            IEmailService emailService,
            RoleManager<IdentityRole> roleManager,
            ILogger<AuthorizationService> logger,
            ITokenHandler tokenHandler,
            IUserRepository userRepository)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _emailService = emailService;
            _roleManager = roleManager;
            _logger = logger;
            _tokenHandler = tokenHandler;
            _userRepository = userRepository;
        }

        public async Task<IdentityResult> RegisterAsync(RegisterDTO registerDTO)
        {
            if (registerDTO is null)
                throw new NotNullExceptions("Can not be Null");

            ApplicationUser user = new ApplicationUser
            {
                UserName = registerDTO.Email.Split("@")[0],
                Email = registerDTO.Email,
                PhoneNumber = registerDTO.PhoneNumber
            };


            var result = await _userManager.CreateAsync(user, registerDTO.Password);
            if (!result.Succeeded)
                return result;
            await _userManager.AddToRoleAsync(user, "User");
           
           _logger.LogInformation($"New user registered: {user.Email}");




            var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);
            var encodedToken = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(token));

            var confirmationLink = $"https://localhost:7027/api/Authorization/confirm-email?userId={user.Id}&token={encodedToken}";


            var emailBody = $@"
    <h3>Salam {user.UserName},</h3>
    <p>Zəhmət olmasa emailinizi təsdiqləyin:</p>
    <p>
        <a href='{confirmationLink}' style='display:inline-block;
                                            padding:10px 20px;
                                            font-size:16px;
                                            color:white;
                                            background-color:#007bff;
                                            text-decoration:none;
                                            border-radius:5px;'>
            Emaili Təsdiqlə
        </a>
    </p>
   
";

            await _emailService.SendEmailAsync(user.Email, "Email təsdiqi", emailBody);
            return result;
        }


        public async Task<IdentityResult> ConfirmEmailAsync(string userId, string token)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                throw new NotFoundException("User not found.");

            var decodedToken = Encoding.UTF8.GetString(WebEncoders.Base64UrlDecode(token));
            var result = await _userManager.ConfirmEmailAsync(user, decodedToken);



            if (result.Succeeded)
            {

             _logger.LogInformation($"Email confirmed for user: {user.Email}");
              return IdentityResult.Success;
            }

           _logger.LogWarning($"Email confirmation failed for user: {user.Email}");
            return IdentityResult.Failed(result.Errors.ToArray());
        }



        public async Task<string> LoginAsync(LoginDTO loginDTO)
        {
            var user = await _userManager.FindByEmailAsync(loginDTO.Email);
            if (user == null)
                throw new NotFoundException("User not found.");

            
            if (!user.EmailConfirmed)
                throw new UnauthorizedException("Email təsdiqlənməyib! Zəhmət olmasa emailinizi təsdiqləyin.");

            var result = await _signInManager.PasswordSignInAsync(user, loginDTO.Password, true, lockoutOnFailure: false);
            if (result.Succeeded)
            {
               _logger.LogInformation($"User Login in: {user.Email}");
              var token=  await _tokenHandler.CreateAccessTokenAsync(user);
                return token;

            }
            else
            {
                _logger.LogWarning($"Invalid login attempt for user: {loginDTO.Email}");
                throw new  Exception("Invalid login attempt ");

            }
        }

        public async Task LogoutAsync()
        {
           
            await _signInManager.SignOutAsync();
        }
    
        public async Task <List<ApplicationUser>>GetAllUsersAsync()
        {
            var users = await _userRepository.GetAllUsersAsync();
            return users;
        }

    }
}
