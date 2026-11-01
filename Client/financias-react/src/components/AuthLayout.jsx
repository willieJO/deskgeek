import { BookOpen, CalendarDays, Check, Play, Sparkles } from "lucide-react";
import Brand from "./Brand";

export default function AuthLayout({ children }) {
  return (
    <main className="auth-layout">
      <section className="auth-story">
        <Brand />
        <div className="auth-story-content">
          <span className="section-tag">
            <Sparkles size={14} /> Todas as suas histórias, juntas
          </span>
          <h2>
            Um universo inteiro.
            <br />
            <span>No seu ritmo.</span>
          </h2>
          <p>
            Dos primeiros episódios ao último capítulo. Guarde suas descobertas
            e continue de onde parou.
          </p>
          <div className="auth-art" aria-hidden="true">
            <div className="story-tile story-tile-one">
              <Play size={38} />
              <span>
                MAIS UM
                <br />
                <strong>EPISÓDIO.</strong>
              </span>
            </div>
            <div className="story-tile story-tile-two">
              <BookOpen size={38} />
              <span>
                SÓ MAIS UM
                <br />
                <strong>CAPÍTULO.</strong>
              </span>
            </div>
            <div className="story-tile story-tile-three">
              <CalendarDays size={36} />
              <span>
                A PRÓXIMA
                <br />
                <strong>HISTÓRIA.</strong>
              </span>
            </div>
            <div className="auth-art-badge">
              <Check size={14} /> Tudo no seu lugar
            </div>
          </div>
        </div>
        <p className="auth-story-footer">
          Sua coleção. Suas descobertas. Seu MediaDex.
        </p>
      </section>
      <section className="auth-form-section">
        <div className="auth-mobile-brand">
          <Brand />
        </div>
        <div className="auth-card fade-slide-in">{children}</div>
        <p className="auth-form-footer">
          Feito para quem sempre tem uma próxima história.
        </p>
      </section>
    </main>
  );
}
