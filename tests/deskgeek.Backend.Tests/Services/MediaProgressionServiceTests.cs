using deskgeek.Application.Services;
using deskgeek.Domain;
using Xunit;

namespace deskgeek.Backend.Tests.Services;

public class MediaProgressionServiceTests
{
    [Fact]
    public void CalcularCapituloEsperadoAtual_DeveIncrementarSemanalmente()
    {
        var service = BuildService(new DateTimeOffset(2026, 3, 12, 15, 0, 0, TimeSpan.Zero));
        var media = new MediaDex
        {
            Status = "Em andamento",
            DiaNovoCapitulo = "Quarta-feira",
            CapituloAtual = "10",
            CapituloEsperadoBase = 10,
            CapituloEsperadoReferenciaUtc = new DateTimeOffset(2026, 3, 4, 12, 0, 0, TimeSpan.Zero)
        };

        var esperado = service.CalcularCapituloEsperadoAtual(media);

        Assert.Equal(11, esperado);
    }

    [Fact]
    public void CalcularCapituloEsperadoAtual_NaoDeveIncrementarForaDeEmAndamento()
    {
        var service = BuildService(new DateTimeOffset(2026, 3, 12, 15, 0, 0, TimeSpan.Zero));
        var media = new MediaDex
        {
            Status = "Finalizado",
            DiaNovoCapitulo = "Quarta-feira",
            CapituloAtual = "10",
            CapituloEsperadoBase = 10,
            CapituloEsperadoReferenciaUtc = new DateTimeOffset(2026, 3, 4, 12, 0, 0, TimeSpan.Zero)
        };

        var esperado = service.CalcularCapituloEsperadoAtual(media);

        Assert.Equal(10, esperado);
    }

    [Fact]
    public void CalcularCapituloEsperadoAtual_DeveRespeitarTotalCapitulos()
    {
        var service = BuildService(new DateTimeOffset(2026, 4, 30, 15, 0, 0, TimeSpan.Zero));
        var media = new MediaDex
        {
            Status = "Em andamento",
            DiaNovoCapitulo = "Quarta-feira",
            CapituloAtual = "10",
            TotalCapitulos = "12",
            CapituloEsperadoBase = 10,
            CapituloEsperadoReferenciaUtc = new DateTimeOffset(2026, 3, 4, 12, 0, 0, TimeSpan.Zero)
        };

        var esperado = service.CalcularCapituloEsperadoAtual(media);

        Assert.Equal(12, esperado);
    }

    [Fact]
    public void CalcularProjecaoCalendario_DeveFinalizarEventoQuandoAtingirTotal()
    {
        var service = BuildService(new DateTimeOffset(2026, 4, 30, 15, 0, 0, TimeSpan.Zero));
        var media = new MediaDex
        {
            Status = "Em andamento",
            DiaNovoCapitulo = "Quarta-feira",
            CapituloAtual = "10",
            TotalCapitulos = "12",
            CapituloEsperadoBase = 10,
            CapituloEsperadoReferenciaUtc = new DateTimeOffset(2026, 3, 4, 12, 0, 0, TimeSpan.Zero)
        };

        var projecao = service.CalcularProjecaoCalendario(media);

        Assert.False(projecao.DeveIncluirEvento);
        Assert.Null(projecao.DataInicioRecorrencia);
        Assert.Null(projecao.DataFimRecorrenciaExclusiva);
        Assert.Equal(12, projecao.CapituloEsperadoAtual);
    }

    [Fact]
    public void CalcularProjecaoCalendario_DeveGerarDataFimExclusivaComTotalPendente()
    {
        var service = BuildService(new DateTimeOffset(2026, 3, 12, 15, 0, 0, TimeSpan.Zero));
        var media = new MediaDex
        {
            Status = "Em andamento",
            DiaNovoCapitulo = "Quarta-feira",
            CapituloAtual = "10",
            TotalCapitulos = "13",
            CapituloEsperadoBase = 10,
            CapituloEsperadoReferenciaUtc = new DateTimeOffset(2026, 3, 4, 12, 0, 0, TimeSpan.Zero)
        };

        var projecao = service.CalcularProjecaoCalendario(media);

        Assert.True(projecao.DeveIncluirEvento);
        Assert.Equal(11, projecao.CapituloEsperadoAtual);
        Assert.Equal("2026-03-12", projecao.DataInicioRecorrencia);
        Assert.Equal("2026-03-26", projecao.DataFimRecorrenciaExclusiva);
    }

    [Fact]
    public void CalcularCapituloEsperadoAtual_DeveUsarFallbackQuintaParaDiaInvalido()
    {
        var service = BuildService(new DateTimeOffset(2026, 3, 12, 15, 0, 0, TimeSpan.Zero));
        var media = new MediaDex
        {
            Status = "Em andamento",
            DiaNovoCapitulo = "Dia invalido",
            CapituloAtual = "10",
            CapituloEsperadoBase = 10,
            CapituloEsperadoReferenciaUtc = new DateTimeOffset(2026, 3, 5, 12, 0, 0, TimeSpan.Zero)
        };

        var esperado = service.CalcularCapituloEsperadoAtual(media);

        Assert.Equal(11, esperado);
    }

    private static MediaProgressionService BuildService(DateTimeOffset utcNow)
    {
        return new MediaProgressionService(new FixedTimeProvider(utcNow));
    }

    private sealed class FixedTimeProvider : TimeProvider
    {
        private readonly DateTimeOffset _utcNow;

        public FixedTimeProvider(DateTimeOffset utcNow)
        {
            _utcNow = utcNow;
        }

        public override DateTimeOffset GetUtcNow()
        {
            return _utcNow;
        }
    }
}
