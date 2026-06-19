
using System.Diagnostics;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using ITfoxtec.Identity.Saml2;
using ITfoxtec.Identity.Saml2.MvcCore;
//using ITfoxtec.Identity.Saml2.Schemas.Metadata;
using ITfoxtec.Identity.Saml2.Util;
using System.IO;
//using ITfoxtec.Identity.Saml2.Schemas.Protocol;

namespace AppAPL.Portal.Controllers
{
    [ApiController]
    public class AuthController : ControllerBase
    {
        private const string RelayStateReturnUrl = "returnUrl";
        private readonly Saml2Configuration _config;

        public AuthController(IOptionsMonitor<Saml2Configuration> configAccessor)
        {
            _config = configAccessor.CurrentValue;
        }

        // SP-initiated login
        // Browser is redirected to Entra ID, then Entra posts the SAMLResponse to /auth/acs
        [HttpGet("/auth/login")]
        public IActionResult Login([FromQuery] string? returnUrl = null)
        {
            var binding = new Saml2RedirectBinding();
            binding.SetRelayStateQuery(new Dictionary<string, string?>
        {
            { RelayStateReturnUrl, string.IsNullOrWhiteSpace(returnUrl) ? "https://localhost:5443/" : returnUrl }
        });

            var request = new Saml2AuthnRequest(_config);
            return binding.Bind(request).ToActionResult();
        }

        // Assertion Consumer Service (ACS) - receives SAML Response (HTTP POST)
        [HttpPost("/auth/acs")]
        public async Task<IActionResult> AssertionConsumerService()
        {
            var httpRequest = Request.ToGenericHttpRequest(validate: true);
            var saml2AuthnResponse = new Saml2AuthnResponse(_config);

            httpRequest.Binding.Unbind(httpRequest, saml2AuthnResponse);

            //await saml2AuthnResponse.CreateSession(HttpContext,
            //    ClaimsTransform: (claimsPrincipal) => ClaimsTransform.Transform(claimsPrincipal));

            await saml2AuthnResponse.CreateSession(HttpContext);

            var returnUrl = httpRequest.Binding.GetRelayStateQuery()[RelayStateReturnUrl];
            return Redirect(string.IsNullOrWhiteSpace(returnUrl) ? "https://localhost:5173/" : returnUrl);
        }

        [HttpGet("/auth/logout")]
        public async Task<IActionResult> Logout()
        {
            if (!User.Identity.IsAuthenticated)
            {
                return Redirect("https://localhost:5173/");
            }

            var binding = new Saml2PostBinding();

            var logoutRequest = await new Saml2LogoutRequest(_config, User)
                .DeleteSession(HttpContext);

            return binding.Bind(logoutRequest).ToActionResult();
        }



        [HttpGet("/auth/loggedout")]
        [HttpPost("/auth/loggedout")]
        public IActionResult LoggedOut()
        {
            return Redirect("https://localhost:5173/");
        }

    }
}
