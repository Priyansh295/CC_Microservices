FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
RUN mkdir -p keys && chmod 777 keys
EXPOSE 3004
ENV PYTHONUNBUFFERED=1
ENV FLASK_APP=data_encrypt.py
ENV FLASK_ENV=production
CMD ["gunicorn", "--bind", "0.0.0.0:3004", "--log-level", "debug", "data_encrypt:app"]
