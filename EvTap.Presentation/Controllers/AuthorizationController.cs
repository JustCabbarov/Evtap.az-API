using EvTap.Application.Exceptions;
using EvTap.Contracts.DTOs;
using EvTap.Contracts.Services;
using EvTap.Domain.Entities;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace EvTap.Presentation.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthorizationController : ControllerBase
    {
        private readonly Contracts.Services.IAuthorizationService _authorizationService;
        private readonly IGoogleAuthService _googleAuthService;
        

        public AuthorizationController(Contracts.Services.IAuthorizationService authorizationService, IGoogleAuthService googleAuthService)
        {
            _authorizationService = authorizationService;
            _googleAuthService = googleAuthService;
            
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDTO registerDTO)
        {
            var result = await _authorizationService.RegisterAsync(registerDTO);
            if (result.Succeeded)
            {
                return Ok(new { Message = "User registered successfully" });
            }
            else
            {
                throw new UnauthorizedException("Register UnSuccessfuly");
            }
        }
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDTO loginDTO)
        {
            if (loginDTO == null)
            {
                throw new NotNullExceptions("Login data cannot be null");
            }
            var result = await _authorizationService.LoginAsync(loginDTO);
            if (result == null)
            {
                throw new UnauthorizedException("Invalid credentials or email not confirmed");
            }
            return Ok(new { Token = result });

        }

        [HttpPost("LogOut")]
        public async Task<IActionResult> LogOut()
        {
            await _authorizationService.LogoutAsync();
            return Ok(new { Message = "User logged out successfully" });
        }

        [HttpGet("confirm-email")]
        public async Task<IActionResult> ConfirmEmail([FromQuery] string userId, [FromQuery] string token)
        {
            var result = await _authorizationService.ConfirmEmailAsync(userId, token);

            if (result.Succeeded)
            {

                return Redirect("http://127.0.0.1:5501/Login.htm");
            }


            return Redirect("https://localhost:7027/error?message=Email confirmation failed");
        }


        [HttpGet("login-google")]
        public IActionResult LoginGoogle()
        {
            var redirectUrl = Url.Action(nameof(GoogleResponse), "Authorization");
            var properties = new AuthenticationProperties
            {
                RedirectUri = redirectUrl
            };
            return Challenge(properties, "Google");
        }

        [HttpGet("google-response")]
        public async Task<IActionResult> GoogleResponse()
        {
            var jwt = await _googleAuthService.HandleGoogleLoginAsync();

            
            var script = $@"
                <script>
                    window.opener.postMessage({{ token: '{jwt}' }}, 'https://localhost:7027');
                    window.close();
                </script>";
            return Content(script, "text/html");
        }
    }
}
