using System.Globalization;
using System.Text;
using deskgeek.Domain;

namespace deskgeek.Application.Services;

public interface IMediaProgressionService
{
    int CalcularCapituloEsperadoAtual(MediaDex media);
    MediaCalendarioProjection CalcularProjecaoCalendario(MediaDex media);
}

public sealed class MediaCalendarioProjection
{
    public required int CapituloEsperadoAtual { get; init; }
    public required bool DeveIncluirEvento { get; init; }
    public string? DataInicioRecorrencia { get; init; }
    public string? DataFimRecorrenciaExclusiva { get; init; }
}

public sealed class MediaProgressionService : IMediaProgressionService
{
    private static readonly CultureInfo PtBrCulture = CultureInfo.GetCultureInfo("pt-BR");
    private static readonly TimeZoneInfo SaoPauloTimeZone = ResolveSaoPauloTimeZone();
    private readonly TimeProvider _timeProvider;

    public MediaProgressionService(TimeProvider timeProvider)
    {
        _timeProvider = timeProvider;
    }

    public int CalcularCapituloEsperadoAtual(MediaDex media)
    {
        var calculo = CalcularInterno(media);
        return calculo.CapituloEsperadoAtual;
    }

    public MediaCalendarioProjection CalcularProjecaoCalendario(MediaDex media)
    {
        var calculo = CalcularInterno(media);

        if (!calculo.IncrementoSemanalAtivo)
        {
            return new MediaCalendarioProjection
            {
                CapituloEsperadoAtual = calculo.CapituloEsperadoAtual,
                DeveIncluirEvento = false
            };
        }

        var dataInicio = calculo.HojeLocal.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);

        if (!calculo.TotalCapitulos.HasValue)
        {
            return new MediaCalendarioProjection
            {
                CapituloEsperadoAtual = calculo.CapituloEsperadoAtual,
                DeveIncluirEvento = true,
                DataInicioRecorrencia = dataInicio
            };
        }

        if (calculo.CapituloEsperadoAtual >= calculo.TotalCapitulos.Value)
        {
            return new MediaCalendarioProjection
            {
                CapituloEsperadoAtual = calculo.CapituloEsperadoAtual,
                DeveIncluirEvento = false
            };
        }

        var restantes = calculo.TotalCapitulos.Value - calculo.CapituloEsperadoAtual;
        if (restantes <= 0)
        {
            return new MediaCalendarioProjection
            {
                CapituloEsperadoAtual = calculo.CapituloEsperadoAtual,
                DeveIncluirEvento = false
            };
        }

        var proximaData = ProximaOcorrenciaApos(calculo.HojeLocal, calculo.DiaLancamento!.Value);
        var ultimaData = proximaData.AddDays(7 * (restantes - 1));
        var fimExclusivo = ultimaData.AddDays(1).ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);

        return new MediaCalendarioProjection
        {
            CapituloEsperadoAtual = calculo.CapituloEsperadoAtual,
            DeveIncluirEvento = true,
            DataInicioRecorrencia = dataInicio,
            DataFimRecorrenciaExclusiva = fimExclusivo
        };
    }

    private MediaCalculoInterno CalcularInterno(MediaDex media)
    {
        var nowUtc = _timeProvider.GetUtcNow();
        var hojeLocal = DateOnly.FromDateTime(TimeZoneInfo.ConvertTime(nowUtc, SaoPauloTimeZone).DateTime);

        var capituloAtual = ParseIntNaoNegativo(media.CapituloAtual) ?? 0;
        var totalCapitulos = ParseIntNaoNegativo(media.TotalCapitulos);

        var incrementoSemanalAtivo = string.Equals(media.Status, "Em andamento", StringComparison.OrdinalIgnoreCase)
            && !string.IsNullOrWhiteSpace(media.DiaNovoCapitulo);

        DayOfWeek? diaLancamento = null;
        if (incrementoSemanalAtivo)
        {
            diaLancamento = ParseDiaOuFallbackQuinta(media.DiaNovoCapitulo);
        }

        var capituloEsperadoBase = media.CapituloEsperadoBase ?? capituloAtual;
        var referenciaUtc = media.CapituloEsperadoReferenciaUtc ?? nowUtc;
        var referenciaLocalDate = DateOnly.FromDateTime(TimeZoneInfo.ConvertTime(referenciaUtc, SaoPauloTimeZone).DateTime);

        var incrementos = 0;
        if (incrementoSemanalAtivo && diaLancamento.HasValue)
        {
            incrementos = ContarOcorrenciasSemanais(referenciaLocalDate, hojeLocal, diaLancamento.Value);
        }

        var esperado = capituloEsperadoBase + incrementos;
        if (esperado < capituloAtual)
        {
            esperado = capituloAtual;
        }

        if (totalCapitulos.HasValue)
        {
            esperado = Math.Min(esperado, totalCapitulos.Value);
        }

        return new MediaCalculoInterno
        {
            CapituloEsperadoAtual = esperado,
            CapituloAtual = capituloAtual,
            TotalCapitulos = totalCapitulos,
            IncrementoSemanalAtivo = incrementoSemanalAtivo,
            DiaLancamento = diaLancamento,
            HojeLocal = hojeLocal
        };
    }

    private static int ContarOcorrenciasSemanais(DateOnly inicioExclusivo, DateOnly fimInclusivo, DayOfWeek alvo)
    {
        if (fimInclusivo.DayNumber <= inicioExclusivo.DayNumber)
        {
            return 0;
        }

        var primeiroDiaInclusivo = inicioExclusivo.AddDays(1);
        var deslocamento = ((int)alvo - (int)primeiroDiaInclusivo.DayOfWeek + 7) % 7;
        var primeiraOcorrencia = primeiroDiaInclusivo.AddDays(deslocamento);

        if (primeiraOcorrencia.DayNumber > fimInclusivo.DayNumber)
        {
            return 0;
        }

        return 1 + (fimInclusivo.DayNumber - primeiraOcorrencia.DayNumber) / 7;
    }

    private static DateOnly ProximaOcorrenciaApos(DateOnly dataBase, DayOfWeek alvo)
    {
        var diaSeguinte = dataBase.AddDays(1);
        var deslocamento = ((int)alvo - (int)diaSeguinte.DayOfWeek + 7) % 7;
        return diaSeguinte.AddDays(deslocamento);
    }

    private static int? ParseIntNaoNegativo(string? valor)
    {
        if (string.IsNullOrWhiteSpace(valor))
        {
            return null;
        }

        if (int.TryParse(valor.Trim(), NumberStyles.Integer, CultureInfo.InvariantCulture, out var parsed) && parsed >= 0)
        {
            return parsed;
        }

        return null;
    }

    private static DayOfWeek ParseDiaOuFallbackQuinta(string? dia)
    {
        var normalizado = Normalizar(dia);
        return normalizado switch
        {
            "domingo" => DayOfWeek.Sunday,
            "segundafeira" => DayOfWeek.Monday,
            "tercafeira" => DayOfWeek.Tuesday,
            "quartafeira" => DayOfWeek.Wednesday,
            "quintafeira" => DayOfWeek.Thursday,
            "sextafeira" => DayOfWeek.Friday,
            "sabado" => DayOfWeek.Saturday,
            _ => DayOfWeek.Thursday
        };
    }

    private static string Normalizar(string? input)
    {
        if (string.IsNullOrWhiteSpace(input))
        {
            return string.Empty;
        }

        var semEspacos = input.Trim().ToLower(PtBrCulture);
        var formD = semEspacos.Normalize(NormalizationForm.FormD);
        var sb = new StringBuilder(formD.Length);

        foreach (var c in formD)
        {
            var categoria = CharUnicodeInfo.GetUnicodeCategory(c);
            if (categoria != UnicodeCategory.NonSpacingMark && c != '-' && c != ' ')
            {
                sb.Append(c);
            }
        }

        return sb.ToString().Normalize(NormalizationForm.FormC);
    }

    private static TimeZoneInfo ResolveSaoPauloTimeZone()
    {
        foreach (var timeZoneId in new[] { "America/Sao_Paulo", "E. South America Standard Time" })
        {
            try
            {
                return TimeZoneInfo.FindSystemTimeZoneById(timeZoneId);
            }
            catch (TimeZoneNotFoundException)
            {
            }
            catch (InvalidTimeZoneException)
            {
            }
        }

        return TimeZoneInfo.Utc;
    }

    private sealed class MediaCalculoInterno
    {
        public required int CapituloEsperadoAtual { get; init; }
        public required int CapituloAtual { get; init; }
        public required int? TotalCapitulos { get; init; }
        public required bool IncrementoSemanalAtivo { get; init; }
        public required DayOfWeek? DiaLancamento { get; init; }
        public required DateOnly HojeLocal { get; init; }
    }
}
