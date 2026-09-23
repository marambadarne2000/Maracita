# Security policy

## Never commit secrets

Do not commit `.dev.vars`, `.env` files, Supabase secret keys, payment-provider keys, SMTP credentials, customer exports or database state.

The repository includes `.env.example` only as a safe configuration template.

## Data boundaries

Maracita is designed so that a business can access only its own workspace records. Any production release must validate authorization at every server route and enforce database row-level access policies.

## Reporting an issue

If you discover a security problem, do not open a public issue containing sensitive details. Contact the repository owner privately with the steps to reproduce and the potential impact.
