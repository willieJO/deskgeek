using System.Security.Cryptography;

namespace APIFinancia.Shared
{
    public static class PasswordExtensions
    {
        public static string HashPassword(this string password)
        {
            byte[] salt = RandomNumberGenerator.GetBytes(16);

            using var pbkdf2 = new Rfc2898DeriveBytes(password, salt, 100_000, HashAlgorithmName.SHA256);
            var hash = pbkdf2.GetBytes(32);

            var saltedHash = new byte[48];
            Array.Copy(salt, 0, saltedHash, 0, 16);
            Array.Copy(hash, 0, saltedHash, 16, 32);

            return Convert.ToBase64String(saltedHash);
        }
        public static bool VerifyPassword(this string password, string hashedPassword)
        {
            var saltedHashBytes = Convert.FromBase64String(hashedPassword);

            var salt = new byte[16];
            Array.Copy(saltedHashBytes, 0, salt, 0, 16);

            var storedHash = new byte[32];
            Array.Copy(saltedHashBytes, 16, storedHash, 0, 32);

            using var pbkdf2 = new Rfc2898DeriveBytes(password, salt, 100_000, HashAlgorithmName.SHA256);
            var computedHash = pbkdf2.GetBytes(32);

            return CryptographicOperations.FixedTimeEquals(storedHash, computedHash);
        }
    }
    }
