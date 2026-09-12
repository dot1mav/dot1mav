## Django portfolio API

```bash
python manage.py migrate
python manage.py collectstatic --noinput
python manage.py import_portfolio_data --file "C:\path\to\dot1mav\public\data.json"
python manage.py test
# Non-interactive admin setup:
python manage.py create_admin --username admin --email admin@example.com --password 'change-this-long-password'
```

For cPanel, run `collectstatic` during deployment and configure the WSGI
application to use `portfolio.wsgi:application`. WhiteNoise serves the
generated `staticfiles/` directory without requiring a separate web server.
Set a long random `SECRET_KEY`, `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`,
`ADMIN_URL`, and enable `SECURE_SSL_REDIRECT=1` in production.

Public API endpoints are available under `/v0/`; the Django admin path is
configurable with `ADMIN_URL` (default: `/4Dm!N/`).
