using System.Net;
using deskgeek.Domain;

namespace deskgeek.Application.Email;

public static class ReleaseEmailTemplate
{
    public static (string Subject, string Html) Build(User user, MediaDex media, ReleaseReminderOptions options)
    {
        var root = options.FrontendUrl.TrimEnd('/');
        var title = WebUtility.HtmlEncode(media.Nome);
        var name = WebUtility.HtmlEncode(user.Usuario);
        var library = WebUtility.HtmlEncode(root + "/tabeladex");
        var settings = WebUtility.HtmlEncode(root + "/configuracoes");
        var personalLink = Uri.TryCreate(media.UrlMidia, UriKind.Absolute, out var uri) && (uri.Scheme == "https" || uri.Scheme == "http")
            ? $"<p><a style=\"color:#c4b5fd\" href=\"{WebUtility.HtmlEncode(uri.AbsoluteUri)}\">Abrir link da obra</a></p>" : string.Empty;
        var html = $$"""
            <!doctype html><html lang="pt-BR"><body style="margin:0;background:#101014;color:#f4f3f7;font-family:Arial,sans-serif;padding:24px">
            <table role="presentation" style="max-width:600px;width:100%;margin:auto;background:#1c1b23;border-radius:16px"><tr><td style="padding:32px">
            <p style="font-size:22px;font-weight:bold;color:#c4b5fd">MediaDex</p><p style="color:#c4b5fd">LEMBRETE DE HOJE</p>
            <h1 style="font-size:26px">Hoje é dia de {{title}}!</h1><p>Olá, {{name}}!</p>
            <p style="line-height:1.8;color:#d0ccd9">Hoje é o dia de lançamento que você cadastrou para <strong>{{title}}</strong>. Confira a disponibilidade na sua plataforma e continue de onde parou.</p>
            <p style="margin:30px 0"><a style="background:#a78bfa;color:#171123;padding:14px 20px;border-radius:8px;text-decoration:none;font-weight:bold" href="{{library}}">Abrir minha biblioteca</a></p>
            {{personalLink}}
            <p style="font-size:12px;line-height:1.8;color:#aaa6b8">Este lembrete segue o dia da semana informado na sua coleção; não é uma confirmação de disponibilidade do provedor.</p>
            <hr style="border:0;border-top:1px solid #403948;margin:28px 0">
            <p style="font-size:12px;line-height:1.8;color:#aaa6b8">Para pausar todos os e-mails, acesse <a style="color:#c4b5fd" href="{{settings}}">Configurações</a>. Para silenciar apenas esta obra, desative o lembrete no card da <a style="color:#c4b5fd" href="{{library}}">biblioteca</a>.</p>
            </td></tr></table></body></html>
            """;
        return ($"Hoje é dia de {media.Nome.Replace('\r', ' ').Replace('\n', ' ')}! | MediaDex", html);
    }
}
