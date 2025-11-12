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
using Twilio;
using Twilio.Rest.Verify.V2.Service;

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


        private const string accountSid = "ACf88d084da6233172dcf067f90fad9f83";
        private const string authToken = "83433b49ecb97dcc2215a9bc60f53057";
        private const string serviceSid = "VA57d5206f652b0c3f700903fe3a6052f4";

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
            
            var user = await _userManager.FindByNameAsync(loginDTO.Email);
            if (user == null)
            {
                throw new Exception("This email address does not exist in the system.");
            }

            if (user.PasswordHash == loginDTO.Password)
            {
                _logger.LogInformation($"User logged in successfully: {loginDTO.Email}");
                return $"FAKE_TOKEN_FOR_{user.Email}";
            }
            else
            {
                _logger.LogWarning($"Password mismatch for user: {loginDTO.Email}. Provided: {loginDTO.Password}");
                throw new Exception("Invalid password provided.");
            }
        }


        public async Task<string> LoginAdmin(LoginDTO loginDTO)
        {
            var user = await _userManager.FindByEmailAsync(loginDTO.Email);
            if (user == null)
                throw new NotFoundException("User not found.");
            var isAdmin = await _userManager.IsInRoleAsync(user, "Admin");
            if (!isAdmin)
                throw new UnauthorizedException("You do not have admin privileges.");
            var result = await _signInManager.PasswordSignInAsync(user, loginDTO.Password, true, lockoutOnFailure: false);
            if (result.Succeeded)
            {
                _logger.LogInformation($"Admin Login in: {user.Email}");
                var token = await _tokenHandler.CreateAccessTokenAsync(user);
                return token;
            }
            else
            {
                _logger.LogWarning($"Invalid admin login attempt for user: {loginDTO.Email}");
                throw new Exception("Invalid login attempt ");
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





        public async Task<string> SendOtpAsync(string phoneNumber, string name, string surname)
        {
            phoneNumber = phoneNumber.Replace(" ", "").Trim();


            TwilioClient.Init(accountSid, authToken);


            var Email = $"{phoneNumber.Replace("+", "")}@otp.local";
            var existingUser = await _userManager.FindByEmailAsync(Email);


            if (existingUser == null)
            {
                var newUser = new ApplicationUser
                {
                    UserName = $"{name}{surname}",
                    PhoneNumber = phoneNumber,
                    Email = $"{phoneNumber.Replace("+", "")}@otp.local",
                    EmailConfirmed = true,

                };

                var createResult = await _userManager.CreateAsync(newUser);
                if (!createResult.Succeeded)
                    throw new Exception("İstifadəçi yaradıla bilmədi.");
            }




            var verification = await VerificationResource.CreateAsync(
                to: phoneNumber,
                channel: "sms",
                pathServiceSid: serviceSid
            );



            _logger.LogInformation($"OTP sent to {phoneNumber}. Status: {verification.Status}");
            return "OTP göndərildi";
        }
       

        public async Task<string> VerifyOtpAsync(string phoneNumber, string code)
        {
            phoneNumber = phoneNumber.Replace(" ", "").Trim();

            // OTP yoxlama
            var verificationCheck = await VerificationCheckResource.CreateAsync(
                to: phoneNumber,
                code: code,
                pathServiceSid: serviceSid
            );

            if (verificationCheck.Status != "approved")
                throw new Exception("OTP kod səhvdir və ya vaxtı keçib.");

            var Email = $"{phoneNumber.Replace("+", "")}@otp.local";
            var user = await _userManager.FindByEmailAsync(Email);
            if (user == null)
                throw new NotFoundException("İstifadəçi tapılmadı.");

            _logger.LogInformation($"OTP təsdiqləndi. Login: {user.UserName}");

            var token = await _tokenHandler.CreateAccessTokenAsync(user);
            return token;
        }


    }
}
