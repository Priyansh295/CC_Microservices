# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set the working directory in the container
WORKDIR /app

# Install system dependencies if needed (e.g., for compiling psycopg2 - not needed for psycopg2-binary)
# RUN apt-get update && apt-get install -y --no-install-recommends gcc libpq-dev && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
# Copy only requirements first to leverage Docker cache
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code into the container
COPY . /app

# Expose the port the app runs on
EXPOSE 3001

# Define the command to run the application
# Use Uvicorn to run the FastAPI app located in app/main.py (the 'app' instance)
# --host 0.0.0.0 makes it accessible from outside the container
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "3001", "--reload"]