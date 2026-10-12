import { LockKeyhole, MapPin, ShieldCheck } from "lucide-react";

/** Só fatos que o sistema garante hoje (API + RLS, região sa-east-1, bloqueio da spec 001). */
const facts = [
  {
    icon: ShieldCheck,
    title: "Só você vê seus dados.",
    text: "O servidor confere quem você é em cada pedido, e o próprio banco de dados barra o acesso aos dados de outra pessoa.",
  },
  {
    icon: MapPin,
    title: "Guardados no Brasil.",
    text: "Seus dados ficam em servidores em São Paulo.",
  },
  {
    icon: LockKeyhole,
    title: "Proteção contra tentativas.",
    text: "Depois de 5 senhas erradas, o acesso à conta fica bloqueado por 10 minutos.",
  },
];

/** Faixa em tema invertido (verde profundo na página clara): muda o ritmo de cor da página. */
export function PrivacyBand() {
  return (
    <section aria-labelledby="privacy-title" className="theme-inverse bg-background text-foreground">
      <div className="mx-auto grid max-w-[90rem] gap-12 px-4 py-20 sm:px-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-20 lg:px-20 lg:py-28">
        <div>
          <h2
            id="privacy-title"
            className="text-[clamp(2.25rem,4.2vw,3.75rem)] leading-[1.02] font-semibold tracking-[-0.035em] text-balance"
          >
            Privado por padrão.
          </h2>
          <p className="mt-5 max-w-[28rem] text-lg text-pretty text-muted-foreground">
            Seu dinheiro é assunto seu. O Velos foi feito para que só você veja o que registra.
          </p>
        </div>

        <ul className="divide-y divide-border border-y border-border">
          {facts.map((fact) => (
            <li key={fact.title} className="flex gap-5 py-6">
              <fact.icon className="mt-0.5 size-6 shrink-0" aria-hidden="true" />
              <div>
                <p className="text-lg font-semibold">{fact.title}</p>
                <p className="mt-1 text-pretty text-muted-foreground">{fact.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
