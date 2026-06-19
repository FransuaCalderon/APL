using System.Security.Claims;

namespace AppAPL.Portal.Helpers
{
    public static class ClaimsTransform
    {
        // Here you can map SAML claims to app-specific claims.
        public static ClaimsPrincipal Transform(ClaimsPrincipal principal)
        {
            // Ensure a display name claim exists
            var identity = principal.Identities.FirstOrDefault(i => i.IsAuthenticated);
            if (identity is null) return principal;

            if (!identity.HasClaim(c => c.Type == ClaimTypes.Name))
            {
                var name = identity.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name")?.Value
                           ?? identity.Name
                           ?? identity.FindFirst("name")?.Value
                           ?? "Usuario";
                identity.AddClaim(new Claim(ClaimTypes.Name, name));
            }

            return principal;
        }
    }
}
