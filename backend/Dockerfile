<<<<<<< HEAD
FROM python:3.14-slim-bookworm
=======
FROM python:3.12-slim
>>>>>>> origin/main

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PIP_NO_CACHE_DIR=1

WORKDIR /app

# System deps
RUN apt-get update && apt-get install -y \
    build-essential libpq-dev curl libffi-dev \
    libcairo2-dev libpango1.0-dev \
    && rm -rf /var/lib/apt/lists/*

# Python deps
COPY requirements.txt .
<<<<<<< HEAD
RUN pip install --upgrade pip && pip install --no-cache-dir -r requirements.txt

COPY . . 

RUN python manage.py collectstatic --noinput
=======
RUN pip install --upgrade pip && pip install -r requirements.txt

COPY . .
>>>>>>> origin/main

EXPOSE 8000
