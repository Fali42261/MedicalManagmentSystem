using System.ComponentModel.DataAnnotations;

namespace MediDesk.Common.Contracts.Auth;

public sealed record LoginRequest(
    [Required, EmailAddress] string Email,
    [Required, MinLength(8)] string Password);
