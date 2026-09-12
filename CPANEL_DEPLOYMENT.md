# cPanel Python 3.13.5 deployment

In **Setup Python App**, select Python **3.13.5**, set the application root to
this project, and install the base dependencies from `pyproject.toml`/`uv.lock`
(or export a requirements file with `uv pip compile`). The default SQLite
deployment does not install `mysqlclient`, which requires native MySQL build
tools unavailable on many cPanel hosts.

For the simplest cPanel installation, use the included
`requirements-cpanel.txt` file:

```bash
pip install --only-binary=:all: -r requirements-cpanel.txt
```

Configure the WSGI entry point as:

```python
from portfolio.wsgi import application
```

Required environment variables:

```text
DEBUG=0
SECRET_KEY=<long-random-secret>
ALLOWED_HOSTS=api.example.com
CORS_ALLOWED_ORIGINS=https://example.com
DB_ENGINE=mysql
ADMIN_URL=<non-guessable-admin-path>/
SECURE_SSL_REDIRECT=1
```

SQLite is supported for small/low-write deployments. Set `DB_ENGINE=sqlite`
and choose a writable path with `SQLITE_NAME`. For concurrent workloads, use
MySQL/MariaDB instead.

For MySQL/MariaDB only, install the optional extra (if your host provides the
required compiler and development headers):

```bash
pip install ".[mysql]"
```

After migration, collect static files and import the portfolio data:

```bash
python manage.py migrate
python manage.py collectstatic --noinput
python manage.py import_portfolio_data --file /home/USER/path/to/data.json
```

Create/update the admin without an interactive prompt:

```bash
DJANGO_SUPERUSER_USERNAME=admin DJANGO_SUPERUSER_EMAIL=admin@example.com \
DJANGO_SUPERUSER_PASSWORD='change-this-long-password' \
python manage.py create_admin
```

The command also accepts `--username`, `--email`, and `--password`.

WhiteNoise serves `staticfiles/` through the WSGI application. Configure
`MEDIA_ROOT` on writable storage and ensure the cPanel app user can write to
the media directory.
