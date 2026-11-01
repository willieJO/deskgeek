using System.Globalization;
using System.Text;
using deskgeek.Application.Services;
using deskgeek.Domain;

namespace deskgeek.Application.Email;

public static class ReleaseReminderRules
{
    public static readonly TimeZoneInfo SaoPaulo = ResolveTimeZone();

    public static DateOnly LocalDate(DateTimeOffset utc) => DateOnly.FromDateTime(TimeZoneInfo.ConvertTime(utc, SaoPaulo).DateTime);

    public static bool IsScheduledFor(MediaDex media, DateOnly date, IMediaProgressionService progression)
    {
        if (!media.NotificarLancamentos || !string.Equals(media.Status?.Trim(), "Em andamento", StringComparison.OrdinalIgnoreCase)) return false;
        if (ParseWeekday(media.DiaNovoCapitulo) != date.DayOfWeek) return false;
        if (int.TryParse(media.TotalCapitulos, out var total) && total >= 0)
        {
            if (int.TryParse(media.CapituloAtual, out var current) && current >= total) return false;
            // Include the final scheduled episode, but stop subsequent weekly reminders.
            if (progression.CalcularCapituloEsperadoNaData(media, date.AddDays(-1)) >= total) return false;
        }
        return true;
    }

    public static string IdempotencyKey(Guid userId, Guid mediaId, DateOnly date) => $"release:{userId:N}:{mediaId:N}:{date:yyyy-MM-dd}";

    public static DayOfWeek? ParseWeekday(string? value)
    {
        var normalized = new string((value ?? "").Normalize(NormalizationForm.FormD)
            .Where(c => CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark && char.IsLetter(c)).ToArray()).ToLowerInvariant();
        return normalized switch
        {
            "domingo" => DayOfWeek.Sunday,
            "segunda" or "segundafeira" => DayOfWeek.Monday,
            "terca" or "tercafeira" => DayOfWeek.Tuesday,
            "quarta" or "quartafeira" => DayOfWeek.Wednesday,
            "quinta" or "quintafeira" => DayOfWeek.Thursday,
            "sexta" or "sextafeira" => DayOfWeek.Friday,
            "sabado" => DayOfWeek.Saturday,
            _ => null
        };
    }

    private static TimeZoneInfo ResolveTimeZone()
    {
        foreach (var id in new[] { "America/Sao_Paulo", "E. South America Standard Time" })
        {
            try { return TimeZoneInfo.FindSystemTimeZoneById(id); }
            catch (TimeZoneNotFoundException) { }
        }
        throw new InvalidOperationException("Fuso horário de São Paulo indisponível.");
    }
}
