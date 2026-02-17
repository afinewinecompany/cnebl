import Link from "next/link";

const footerLinks = {
  league: [
    { name: "About", href: "/about" },
    { name: "Schedule", href: "/schedule" },
    { name: "Standings", href: "/standings" },
    { name: "Statistics", href: "/stats" },
  ],
  teams: [
    { name: "All Teams", href: "/teams" },
    { name: "Join a Team", href: "/join" },
    { name: "Create a Team", href: "/create-team" },
  ],
  resources: [
    { name: "Rules", href: "/rules" },
    { name: "Locations", href: "/locations" },
    { name: "Contact", href: "/contact" },
  ],
};

export function Footer() {
  return (
    <footer className="bg-navy-dark">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-1">
            <Link href="/" className="inline-block">
              <span className="font-script text-3xl text-gold">CNEBL</span>
            </Link>
            <p className="mt-4 text-sm text-cream-light">
              Coastal New England Baseball League. Adult men&apos;s baseball at its finest.
            </p>
          </div>

          {/* League Links */}
          <div>
            <h3 className="font-headline text-sm uppercase tracking-wider text-gold mb-4">
              League
            </h3>
            <ul className="space-y-2">
              {footerLinks.league.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-cream-light hover:text-chalk transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Teams Links */}
          <div>
            <h3 className="font-headline text-sm uppercase tracking-wider text-gold mb-4">
              Teams
            </h3>
            <ul className="space-y-2">
              {footerLinks.teams.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-cream-light hover:text-chalk transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h3 className="font-headline text-sm uppercase tracking-wider text-gold mb-4">
              Resources
            </h3>
            <ul className="space-y-2">
              {footerLinks.resources.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-cream-light hover:text-chalk transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-navy">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-cream-light">
              © {new Date().getFullYear()} Coastal New England Baseball League. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link
                href="/privacy"
                className="text-xs text-cream-light hover:text-chalk transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-xs text-cream-light hover:text-chalk transition-colors"
              >
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
