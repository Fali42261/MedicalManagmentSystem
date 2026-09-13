using System.ComponentModel.DataAnnotations;

namespace MediDesk.Common.Contracts.Auth;

public sealed record SignupRequest(
    [Required, StringLength(100, MinimumLength = 2)] string FullName,
    [Required, EmailAddress] string Email,
    [Required, MinLength(8), MaxLength(128)]
    [RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$", ErrorMessage = "Password must include uppercase, lowercase and numeric characters.")]
    string Password);
