using System.Globalization;

namespace deskgeek.Domain;

public static class MediaCompletionRules
{
    public static bool Apply(MediaDex media)
    {
        if (!int.TryParse(media.TotalCapitulos?.Trim(), NumberStyles.Integer, CultureInfo.InvariantCulture, out var total) || total <= 0
            || !int.TryParse(media.CapituloAtual?.Trim(), NumberStyles.Integer, CultureInfo.InvariantCulture, out var current) || current < total)
            return false;
        if (media.Status == "Finalizado") return false;
        media.Status = "Finalizado";
        return true;
    }
}
