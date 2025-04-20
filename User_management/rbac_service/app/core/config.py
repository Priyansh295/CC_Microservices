# app/core/config.py
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # Define the settings your application needs
    DATABASE_URL: str

    # Configure Pydantic settings to load from a .env file
    model_config = SettingsConfigDict(env_file=".env")

# Create an instance of the settings
settings = Settings()

# You can now import 'settings' from app.core.config elsewhere in your app
# and access settings.DATABASE_URL