import { profile } from "../data/content";

export default function Footer() {
  return (
    <footer className="border-t border-line bg-bg-subtle">
      <div className="mx-auto flex max-w-[1180px] flex-col items-center justify-between gap-3 px-5 py-8 text-[13px] text-fg-subtle sm:flex-row sm:px-8">
        <p>
          © {new Date().getFullYear()} {profile.name}
        </p>
        <p>
          {profile.location}
          <span className="mx-2 text-line-strong">/</span>
          <a href={`mailto:${profile.email}`} className="transition-colors hover:text-accent">
            {profile.email}
          </a>
        </p>
      </div>
    </footer>
  );
}
