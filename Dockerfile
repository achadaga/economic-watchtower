# Use an official Python runtime
FROM python:3.12-slim

# Set the working directory
WORKDIR /app

# Install system dependencies (sometimes needed for pandas/numpy)
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy local code to the container image
COPY . .

# Install Python dependencies
RUN pip install --no-cache-dir fastapi uvicorn yfinance pandas pandas_ta

# Expose the port the app runs on
EXPOSE 8000

# Run the application
CMD ["uvicorn", "api.index:app", "--host", "0.0.0.0", "--port", "8000"]
